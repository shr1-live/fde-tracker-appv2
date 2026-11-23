import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Route, Routes, matchPath, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "./lib/store";
import { API_URL } from "./lib/api";
import { useMe, type Me } from "./lib/useRole";
import { clearUnsaved, hasUnsaved } from "./lib/unsaved";
import { closeLayer, openLayer } from "./lib/layers";
import { useUnseenPosts } from "./lib/feedSeen";
import Gate from "./pages/Gate";
import { Icon, type IconName } from "./components/Icon";
import { DevPersonaBar } from "./components/DevPersonaBar";
import { ProgramSwitcher, type Prog } from "./components/shell/ProgramSwitcher";
import { AccountMenu } from "./components/shell/AccountMenu";
import { NotificationBell } from "./components/shell/NotificationBell";
import { BrandSwitch, ViewAsSwitch } from "./components/shell/TopSwitches";
import { GuideSwitch, GuideTips } from "./components/shell/Guide";
import { useConfirm } from "./components/Confirm";
import { PageSkeleton } from "./components/States";
import { BrandMark } from "./components/BrandMark";
import { useDevPersona } from "./lib/devPersona";

// Every page is its own chunk, so the first load only carries the shell.
const Landing = lazy(() => import("./pages/Landing"));
const Home = lazy(() => import("./pages/Home"));
const Feed = lazy(() => import("./pages/Feed"));
const PostPage = lazy(() => import("./pages/Post"));
const Plan = lazy(() => import("./pages/Plan"));
const DailyStatus = lazy(() => import("./pages/DailyStatus"));
const ProgramStatus = lazy(() => import("./pages/ProgramStatus"));
const Reports = lazy(() => import("./pages/Reports"));
const Manage = lazy(() => import("./pages/Manage"));
const Programs = lazy(() => import("./pages/Programs"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LAST = "fde:program";
const LANDED = "fde:landed"; // set once per sign-in, in this tab
const RAIL = "fde:sidebar"; // "rail" or "full"; unset means "decide by screen width"
const PAGES: [string, string][] = [["feed", "Feed"], ["", "Plan"], ["daily", "Daily status"], ["status", "Program status"], ["reports", "Reports"], ["manage", "Manage"]];

function useMedia(q: string) {
  const [on, setOn] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const ch = () => setOn(m.matches);
    m.addEventListener("change", ch);
    return () => m.removeEventListener("change", ch);
  }, [q]);
  return on;
}

function Centered({ children }: { children: ReactNode }) {
  return <main className="center-page" id="main"><div className="center-card card">{children}</div></main>;
}

function crumbs(path: string, programs: Prog[]): string[] {
  if (path === "/") return ["Choose a program"];
  if (path.startsWith("/post/")) return ["Feed", "Post"];
  if (path === "/programs") return ["Programs"];
  const m = matchPath("/p/:pid/*", path);
  if (m) {
    const p = programs.find((x) => x.id === m.params.pid);
    const sub = (m.params["*"] ?? "").split("/")[0] ?? "";
    return [p?.name ?? "Program", PAGES.find(([k]) => k === sub)?.[1] ?? "Page not found"];
  }
  return ["Page not found"];
}

/** A side-panel link: icon, label (a tooltip when the panel is a rail) and an optional count. */
function Item({ to, icon, label, end, count, replace }: { to: string; icon: IconName; label: string; end?: boolean; count?: number; replace?: boolean }) {
  return (
    <NavLink to={to} end={end} replace={replace} className="nav-item">
      <Icon name={icon} strokeWidth={1.9} />
      <span className="nav-label">{label}</span>
      {!!count && <span className="nav-count">{count > 9 ? "9+" : count}<span className="sr"> new posts</span></span>}
    </NavLink>
  );
}

function Shell({ me }: { me: Me }) {
  const { user, signOut } = useStore();
  const persona = useDevPersona();
  const loc = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const phone = useMedia("(max-width: 767px)");
  const wide = useMedia("(min-width: 1200px)");
  const [open, setOpen] = useState(false);
  const [railPref, setRailPref] = useState<string | null>(() => { try { return localStorage.getItem(RAIL); } catch { return null; } });
  const rail = !phone && (railPref ? railPref === "rail" : !wide);
  const mainRef = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const side = useRef<HTMLElement>(null);
  const drawerLayer = useRef<number | null>(null);
  const lastPath = useRef(loc.pathname);
  const progs = me.programs ?? [];
  const isAdmin = me.role === "admin";


  const urlPid = matchPath("/p/:pid/*", loc.pathname)?.params.pid;
  const stored = (() => { try { return localStorage.getItem(LAST); } catch { return null; } })();
  const current = progs.find((p) => p.id === urlPid) ?? progs.find((p) => p.id === stored) ?? progs[0];
  useEffect(() => { if (current) { try { localStorage.setItem(LAST, current.id); } catch { /* ignore */ } } }, [current]);
  const unseen = useUnseenPosts(me.id, /^\/p\/[^/]+\/feed$/.test(loc.pathname), current?.id);
  // The first screen after signing in is always "Choose a program". Links to one exact page (a reminder, a post) still open that page.
  useEffect(() => {
    let landed = false;
    try { landed = sessionStorage.getItem(LANDED) === "1"; sessionStorage.setItem(LANDED, "1"); } catch { /* storage unavailable */ }
    if (!landed && (loc.pathname === "/programs" || /^\/p\/[^/]+(\/feed)?\/?$/.test(loc.pathname))) navigate("/", { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRail = () => {
    const next = rail ? "full" : "rail";
    setRailPref(next);
    try { localStorage.setItem(RAIL, next); } catch { /* ignore */ }
  };

  // The phone drawer. Opening it adds a history entry, so Android Back closes it.
  const openDrawer = (e: { currentTarget: HTMLElement }) => {
    opener.current = e.currentTarget;
    setOpen(true);
    drawerLayer.current = openLayer(() => { drawerLayer.current = null; setOpen(false); opener.current?.focus(); });
  };
  const closeDrawer = (focus = true) => {
    setOpen(false);
    const l = drawerLayer.current; drawerLayer.current = null;
    void closeLayer(l);
    if (focus) opener.current?.focus();
  };

  // A new page: close the drawer, go to the top and move focus to the page so screen readers announce it.
  useEffect(() => {
    if (drawerLayer.current) closeDrawer(false);
    if (lastPath.current === loc.pathname) return;
    lastPath.current = loc.pathname;
    if (!loc.hash) window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [loc.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!phone && drawerLayer.current) closeDrawer(false); }, [phone]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (side.current) side.current.inert = phone && !open; }, [phone, open]);
  // The drawer on phones: focus goes in, Esc closes, the page behind is inert and does not scroll.
  useEffect(() => {
    const col = mainRef.current?.parentElement;
    if (col) col.inert = phone && open;
    document.documentElement.classList.toggle("scroll-lock", phone && open);
    if (!phone || !open) return;
    side.current?.querySelector<HTMLElement>("nav a")?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, phone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unsaved changes: ask before following a link inside the app.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!hasUnsaved() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target || a.origin !== window.location.origin || a.pathname === window.location.pathname) return;
      e.preventDefault(); e.stopPropagation();
      const to = a.pathname + a.search + a.hash;
      void confirm({ title: "Leave without saving?", body: "You have changes on this page that are not saved yet. If you leave now, they are lost.", confirm: "Leave page", cancel: "Stay on this page", danger: true })
        .then((ok) => { if (ok) { clearUnsaved(); navigate(to); } });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [confirm, navigate]);

  const trail = crumbs(loc.pathname, progs);
  const name = me.display_name || user?.email.split("@")[0] || "You";
  const base = current ? `/p/${current.id}` : "";
  const inDrawer = phone && open; // links in the open drawer replace its history entry instead of stacking on it
  const moreActive = open || /^\/p\/[^/]+\/(status|manage)$/.test(loc.pathname) || loc.pathname === "/programs" && !!current;

  return (
    <div className={"app" + (open ? " drawer-open" : "") + (rail ? " rail" : "")}>
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
      <aside ref={side} className="sidebar" aria-label="Sidebar">
        <div className="side-top">
          <Link to="/" className="brand" replace={inDrawer} data-tip="FDE Tracker"><BrandMark /><span className="brand-name">FDE Tracker</span></Link>
          {phone && <button type="button" className="iconbtn" aria-label="Close the menu" onClick={() => closeDrawer()}><Icon name="x" /></button>}
        </div>
        {current && <ProgramSwitcher programs={progs} current={current} isAdmin={isAdmin} />}
        <nav aria-label="Main" className="nav">
          <div className="nav-group">
            <Item to="/" end icon="grid" label="My programs" replace={inDrawer} />
          </div>
          {current && (
            <div className="nav-group" role="group" aria-labelledby="nav-program">
              <p className="nav-section" id="nav-program"><span className="sr">Program: </span>{current.name}</p>
              <Item to={`${base}/feed`} icon="rss" label="Feed" count={unseen} replace={inDrawer} />
              <Item to={`${base}/daily`} icon="daily" label="Daily status" replace={inDrawer} />
              <Item to={base} end icon="book" label="Plan" replace={inDrawer} />
              <Item to={`${base}/status`} icon="status" label="Program status" replace={inDrawer} />
              <Item to={`${base}/reports`} icon="chart" label="Reports" replace={inDrawer} />
              {current.role !== "member" && <Item to={`${base}/manage`} icon="manage" label="Manage and invite" replace={inDrawer} />}
            </div>
          )}
          {isAdmin && (
            <div className="nav-group" role="group" aria-labelledby="nav-admin">
              <p className="nav-section" id="nav-admin">Administration</p>
              <Item to="/programs" icon="layers" label="All programs" replace={inDrawer} />
            </div>
          )}
          {progs.length === 0 && <p className="nav-note">You are not in a program yet. The admin or a coordinator adds you.</p>}
        </nav>
        <div className="side-foot">
          <div className="side-dev"><DevPersonaBar /></div>
          <AccountMenu name={name} email={me.email} isAdmin={isAdmin} onSignOut={() => { try { sessionStorage.removeItem(LANDED); } catch { /* ignore */ } void signOut(); }} />
        </div>
      </aside>
      {phone && open && <div className="scrim" onClick={() => closeDrawer()} aria-hidden="true" />}
      <div className="main-col">
        <header className="topbar">
          {phone
            ? <button type="button" className="iconbtn" aria-label="Open the menu" aria-expanded={open} onClick={openDrawer}><Icon name="menu" /></button>
            : <button type="button" className="iconbtn" aria-label={rail ? "Expand the side panel" : "Collapse the side panel"} title={rail ? "Expand the side panel" : "Collapse the side panel"} onClick={toggleRail}><Icon name={rail ? "panelOpen" : "panelClose"} /></button>}
          <span className="topbar-sep" aria-hidden="true" />
          <nav aria-label="Breadcrumb" className="crumbs">
            <ol>{trail.map((c, i) => <li key={i} aria-current={i === trail.length - 1 ? "page" : undefined}>{c}</li>)}</ol>
          </nav>
          <span className="grow" />
          <ViewAsSwitch />
          <BrandSwitch />
          <GuideSwitch />
          <NotificationBell />
        </header>
        <main ref={mainRef} id="main" className="main" tabIndex={-1}>
          <Suspense fallback={<div className="content"><PageSkeleton /></div>}>
            <div className="page" key={loc.pathname}>
              <Routes key={persona}>
                <Route path="/" element={<Home />} />
                <Route path="/p/:pid/feed" element={<Feed />} />
                <Route path="/post/:id" element={<PostPage />} />
                <Route path="/programs" element={<Programs />} />
                <Route path="/p/:pid" element={<Plan />} />
                <Route path="/p/:pid/daily" element={<DailyStatus />} />
                <Route path="/p/:pid/status" element={<ProgramStatus />} />
                <Route path="/p/:pid/reports" element={<Reports />} />
                <Route path="/p/:pid/manage" element={<Manage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Suspense>
        </main>
        <GuideTips />
        {phone && (
          <nav className="tabbar" aria-label="Shortcuts">
            <NavLink to={current ? `${base}/feed` : "/"} end className="tab"><span className="tab-icon"><Icon name="home" />{!!unseen && <span className="tab-dot" />}</span><span>Feed{!!unseen && <span className="sr">, {unseen} new posts</span>}</span></NavLink>
            {current ? (
              <>
                <NavLink to={base} end className="tab"><span className="tab-icon"><Icon name="book" /></span><span>Plan</span></NavLink>
                <NavLink to={`${base}/daily`} className="tab"><span className="tab-icon"><Icon name="daily" /></span><span>Status</span></NavLink>
                <NavLink to={`${base}/reports`} className="tab"><span className="tab-icon"><Icon name="chart" /></span><span>Reports</span></NavLink>
              </>
            ) : isAdmin && <NavLink to="/programs" className="tab"><span className="tab-icon"><Icon name="grid" /></span><span>Programs</span></NavLink>}
            <button type="button" className={"tab" + (moreActive ? " active" : "")} aria-expanded={open} onClick={openDrawer}>
              <span className="tab-icon"><Icon name="menu" /></span><span>More<span className="sr"> pages and your account</span></span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { ready, user, signOut } = useStore();
  const { me, ready: meReady } = useMe();
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const on = () => setExpired(true);
    window.addEventListener("fde:session-expired", on);
    return () => window.removeEventListener("fde:session-expired", on);
  }, []);
  useEffect(() => { setExpired(false); }, [user?.email]);
  const loading = (t: string) => <Centered><p className="muted" role="status">{t}</p></Centered>;
  if (!ready) return loading("Loading");
  if (!user) return <Suspense fallback={loading("Loading")}><Landing /></Suspense>;
  if (expired) {
    return (
      <Centered>
        <span className="center-icon" aria-hidden="true"><Icon name="clock" size={22} /></span>
        <h1>Your session has expired</h1>
        <p className="muted">You were signed out after a while, to keep your account safe. Sign in again to carry on; everything you saved is kept.</p>
        <div className="row center"><button type="button" className="btn" onClick={() => { setExpired(false); void signOut(); }}>Sign in again</button></div>
      </Centered>
    );
  }
  if (!API_URL) return <Centered><h1>Not connected</h1><p className="muted">This site is not connected to its server yet.</p></Centered>;
  if (!meReady) return loading("Checking your access");
  // Invite-only: the server decides who gets in.
  if (!me) return <Gate reason="error" />;
  if (me.access !== "approved") return <Gate reason={me.access === "rejected" ? "rejected" : "pending"} />;
  return <Shell me={me} />;
}
