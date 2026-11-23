import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { API_URL } from "../lib/api";
import { useMe } from "../lib/useRole";
import { feed, type FeedKind, type FeedSort, type Post } from "../lib/v3";
import { errText } from "../lib/useProgram";
import { markFeedSeen } from "../lib/feedSeen";
import { plural } from "../lib/text";
import { Icon, type IconName } from "../components/Icon";
import { Avatar } from "../components/Avatar";
import { Composer } from "../components/feed/Composer";
import { PostCard, PostSkeleton } from "../components/feed/PostCard";
import { EmptyState, ErrorState, Loading } from "../components/States";

const SORTS: [FeedSort, string][] = [["new", "Newest"], ["top", "Most liked"], ["discussed", "Most discussed"]];
type Show = FeedKind | "mine";
const SHOWS: [Show, string, IconName][] = [["all", "All", "grid"], ["video", "Videos", "video"], ["link", "Links", "link"], ["text", "Text", "text"], ["mine", "My posts", "user"]];
const REFRESH_MS = 60000;
const newest = (list: Post[]) => list.reduce<string | undefined>((m, p) => (!p.id.startsWith("tmp-") && (!m || p.created_at > m) ? p.created_at : m), undefined);
const smooth = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth") as ScrollBehavior;

export default function Feed() {
  const { me } = useMe();
  const { pid = "" } = useParams();
  const [sp, setSp] = useSearchParams();
  const sort: FeedSort = SORTS.some(([k]) => k === sp.get("sort")) ? (sp.get("sort") as FeedSort) : "new";
  const mine = sp.get("mine") === "1";
  const kind: FeedKind = !mine && ["video", "link", "text"].includes(sp.get("kind") ?? "") ? (sp.get("kind") as FeedKind) : "all";
  const show: Show = mine ? "mine" : kind;
  const q = sp.get("q") ?? "";
  const [search, setSearch] = useState(q);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [moreErr, setMoreErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [incoming, setIncoming] = useState<{ items: Post[]; cursor: string | null; fresh: Post[] } | null>(null);
  const seq = useRef(0);
  const busyMore = useRef(false);
  const focusNext = useRef<number | null>(null); // set by the button: focus this post index once the page arrives
  const postsRef = useRef<Post[] | null>(null);
  postsRef.current = posts;
  const composer = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const moreBtn = useRef<HTMLButtonElement>(null);
  const top = useRef<HTMLDivElement>(null);

  const setParam = useCallback((patch: Record<string, string | null>) => {
    setSp((cur) => {
      const n = new URLSearchParams(cur);
      for (const [k, v] of Object.entries(patch)) { if (v === null || v === "") n.delete(k); else n.set(k, v); }
      return n;
    }, { replace: true });
  }, [setSp]);

  // Search is debounced: the server is asked 350 ms after typing stops.
  useEffect(() => { setSearch(q); }, [q]);
  useEffect(() => {
    if (search.trim() === q) return;
    const t = window.setTimeout(() => setParam({ q: search.trim() || null }), 350);
    return () => window.clearTimeout(t);
  }, [search, q, setParam]);

  const load = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true); setCursor(null); setIncoming(null); setMoreErr(""); // an old cursor only works with the sort it came from
    try {
      const r = await feed.list({ program_id: pid, sort, kind, mine, q });
      if (my !== seq.current) return;
      setPosts(r.items); setCursor(r.next_cursor); setErr("");
    } catch (e) { if (my === seq.current) { setErr(errText(e, "Could not load the feed.")); setPosts((x) => x ?? []); } }
    finally { if (my === seq.current) setLoading(false); }
  }, [pid, sort, kind, mine, q]);

  // Every minute (while the tab is visible) look for changes without moving anything under the reader:
  // counts and comments update in place, and newer posts wait behind a "New posts" pill.
  const refresh = useCallback(async () => {
    const my = seq.current;
    if (document.visibilityState !== "visible" || !postsRef.current) return;
    try {
      const r = await feed.list({ program_id: pid, sort, kind, mine, q });
      const cur = postsRef.current;
      if (my !== seq.current || !cur) return;
      const byId = new Map(r.items.map((p) => [p.id, p]));
      setPosts((all) => all?.map((p) => { const n = byId.get(p.id); return n ? { ...p, ...n } : p; }) ?? all);
      const have = new Set(cur.map((p) => p.id));
      const since = newest(cur) ?? "";
      const fresh = r.items.filter((p) => !have.has(p.id) && p.created_at > since);
      setIncoming(fresh.length ? { items: r.items, cursor: r.next_cursor, fresh } : null);
    } catch { /* a failed background check changes nothing */ }
  }, [pid, sort, kind, mine, q]);

  useEffect(() => {
    if (!API_URL) return;
    void load();
    const t = window.setInterval(() => void refresh(), REFRESH_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", onVisible); };
  }, [load, refresh]);

  // The newest post on screen counts as seen (clears the Feed badge in the side panel).
  useEffect(() => { if (posts) markFeedSeen(newest(posts)); }, [posts]);

  const more = useCallback(async (fromButton: boolean) => {
    if (fromButton) focusNext.current = postsRef.current?.length ?? 0;
    if (!cursor || busyMore.current) return;
    busyMore.current = true; setLoadingMore(true); setMoreErr("");
    const first = postsRef.current?.length ?? 0;
    const my = seq.current; // a cursor belongs to the sort and filters it came from
    try {
      const r = await feed.list({ program_id: pid, sort, kind, mine, q, cursor });
      if (my !== seq.current) return;
      setPosts((all) => [...(all ?? []), ...r.items.filter((x) => !(all ?? []).some((y) => y.id === x.id))]);
      setCursor(r.next_cursor);
      // Keyboard users who pressed the button continue from the first new post (even if scrolling had already started this load).
      // Scrolling alone never moves focus.
      // Also when focus sits on the button (tabbing to it scrolled it into view and started this load): the button goes away.
      const at = focusNext.current ?? (document.activeElement === moreBtn.current ? first : null); focusNext.current = null;
      if (at !== null) setTimeout(() => listRef.current?.querySelectorAll<HTMLElement>("article.post")[at]?.focus(), 0);
    } catch (e) { focusNext.current = null; if (my === seq.current) setMoreErr(errText(e, "Could not load more posts.")); }
    finally { busyMore.current = false; setLoadingMore(false); }
  }, [cursor, sort, kind, mine, q]);

  // Infinite scroll: load the next page well before the reader reaches the end. Stops after an error (the button retries).
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor || moreErr || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) void more(false); }, { rootMargin: "0px 0px 800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, moreErr, more, posts?.length]);

  if (!API_URL) return <div className="content narrow"><header className="page-head"><h1>Feed</h1></header><ErrorState title="Not connected" message="The feed needs the backend, which is not connected for this site." /></div>;

  const update = (id: string) => (fn: (p: Post) => Post) => setPosts((all) => all?.map((x) => (x.id === id ? fn(x) : x)) ?? null);
  const removed = (id: string) => {
    const all = postsRef.current ?? [];
    const i = all.findIndex((x) => x.id === id);
    const gone = all[i];
    const nextId = all[i + 1]?.id ?? all[i - 1]?.id;
    setPosts((cur) => cur?.filter((x) => x.id !== id) ?? null);
    setTimeout(() => { const el = nextId ? document.querySelector<HTMLElement>(`[data-post="${nextId}"]`) : null; (el ?? composer.current)?.focus({ preventScroll: true }); }, 0);
    return () => { if (gone) setPosts((cur) => { const c = [...(cur ?? [])]; c.splice(Math.min(i, c.length), 0, gone); return c; }); };
  };
  const pendingPost = (p: Post) => setPosts((all) => [p, ...(all ?? [])]);
  const posted = (p: Post, tempId: string) => {
    setPosts((all) => (all ?? []).map((x) => (x.id === tempId ? p : x)));
    setTimeout(() => document.querySelector<HTMLElement>(`[data-post="${p.id}"]`)?.focus({ preventScroll: true }), 0);
  };
  const failed = (tempId: string) => setPosts((all) => (all ?? []).filter((x) => x.id !== tempId));
  const showIncoming = () => {
    if (!incoming) return;
    seq.current++; // any page still loading belongs to the old list
    setPosts(incoming.items); setCursor(incoming.cursor); setIncoming(null); setMoreErr("");
    top.current?.scrollIntoView({ behavior: smooth(), block: "start" });
    setTimeout(() => listRef.current?.querySelector<HTMLElement>("article.post")?.focus({ preventScroll: true }), 0);
  };
  const name = me?.display_name || me?.email?.split("@")[0] || "You";
  const pname = me?.programs?.find((x) => x.id === pid)?.name;
  const filtered = show !== "all" || q !== "";
  const clear = () => { setSearch(""); setParam({ kind: null, mine: null, q: null }); };

  let list;
  if (posts === null) list = <Loading label="Loading posts"><div className="stack"><PostSkeleton /><PostSkeleton media={false} /></div></Loading>;
  else if (err && posts.length === 0) list = <ErrorState title="Could not load the feed" message={err} onRetry={() => void load()} />;
  else if (posts.length === 0) {
    list = filtered
      ? <EmptyState icon="search" title="No posts match" action={<button type="button" className="btn secondary" onClick={clear}>Clear filters</button>}>Try another word, or show all posts.</EmptyState>
      : <EmptyState icon="rss" title="No posts yet" action={<button type="button" className="btn" onClick={() => composer.current?.focus()}>Write the first post</button>}>Share a useful video, an article, or something you built. Only people in this program see it.</EmptyState>;
  } else {
    list = (
      <div ref={listRef} className={"stack posts" + (loading ? " is-loading" : "")} aria-busy={loading}>
        {posts.map((p) => <PostCard key={p.id} post={p} meId={me?.id} meName={name} isAdmin={me?.role === "admin"} onChange={update(p.id)} onRemoved={removed} />)}
      </div>
    );
  }
  const fresh = incoming?.fresh ?? [];

  return (
    <div className="content narrow">
      <header className="page-head feed-head">
        {pname && <span className="pg-eyebrow">{pname}</span>}
        <h1>{pname ? `${pname} feed` : "Feed"}</h1>
        <p className="page-sub">{pname ? `Only people in ${pname} (and the admin) see this feed.` : "Only people in this program see this feed."} Share a useful video or article, or something you built.</p>
      </header>
      <Composer ref={composer} programId={pid} name={name} meId={me?.id} onPending={pendingPost} onPosted={posted} onFailed={failed} />
      <section className="feed-tools" aria-label="Sort and filter posts">
        <div className="feed-tools-row">
          <div className="search">
            <Icon name="search" size={16} />
            <label htmlFor="feed-q" className="sr">Search posts</label>
            <input id="feed-q" type="search" placeholder="Search posts" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} enterKeyHint="search" />
          </div>
          <div className="select-wrap sortsel">
            <Icon name="sort" size={16} />
            <label htmlFor="feed-sort" className="sr">Sort posts</label>
            <select id="feed-sort" value={sort} onChange={(e) => setParam({ sort: e.target.value === "new" ? null : e.target.value })}>
              {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="fchips" role="group" aria-label="Show">
          {SHOWS.map(([k, l, ic]) => (
            <button key={k} type="button" className="fchip" aria-pressed={show === k}
              onClick={() => setParam(k === "mine" ? { mine: "1", kind: null } : { mine: null, kind: k === "all" ? null : k })}>
              <Icon name={ic} size={14} />{l}
            </button>
          ))}
        </div>
      </section>
      <div ref={top} className="feed-top" />
      <div className="new-pill-wrap">
        {fresh.length > 0 && (
          <button type="button" className="new-pill" onClick={showIncoming}>
            <Icon name="up" size={16} />
            <span className="pill-faces" aria-hidden="true">{[...new Map(fresh.map((p) => [p.author.id, p.author.name])).values()].slice(0, 3).map((n) => <Avatar key={n} name={n} size="sm" />)}</span>
            {fresh.length > 9 ? "9+ new posts" : plural(fresh.length, "new post")}
          </button>
        )}
      </div>
      <p className="sr" aria-live="polite">{fresh.length > 0 ? `${plural(fresh.length, "new post")} available. Use the New posts button at the top of the feed to show them.` : ""}</p>
      {err && posts && posts.length > 0 && <p className="banner error" role="alert">{err}</p>}
      {list}
      {posts && posts.length > 0 && (
        cursor
          ? (
            <div className="more">
              {loadingMore && <div className="more-skel"><PostSkeleton media={false} /></div>}
              <div ref={sentinel} className="sentinel" aria-hidden="true" />
              {moreErr && <p className="field-error" role="alert">{moreErr}</p>}
              <button ref={moreBtn} type="button" className="btn secondary" onClick={() => void more(true)} disabled={loadingMore}>{loadingMore ? "Loading" : moreErr ? "Try again" : "Show more posts"}</button>
            </div>
          )
          : <p className="end-note"><Icon name="check" size={16} />You are all caught up.</p>
      )}
    </div>
  );
}
