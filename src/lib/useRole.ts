import { useEffect, useMemo, useState } from "react";
import { API_URL, apiJson } from "./api";
import { useStore } from "./store";
import { useDevPersona } from "./devPersona";
import { lower, useViewAs, type ViewRole } from "./viewAs";

export type Me = {
  id: string; email: string; role: "member" | "reviewer" | "admin"; access: string; display_name?: string | null;
  /** Programs V3: the programs this person is in, with their role there (the admin sees every program as "admin"). */
  programs?: { id: string; name: string; role: "admin" | "coordinator" | "member" }[];
  can_manage?: boolean;
};

/** Forget the cached /api/me answer (after an admin changes programs or roles, so the menu updates). */
export function refreshMe() { inflight.clear(); fetchedAt.clear(); window.dispatchEvent(new Event("fde:me")); }

// One request per person, shared by every component that asks (the menu and the review page).
const inflight = new Map<string, Promise<Me | null>>();
const fetchedAt = new Map<string, number>();
const STALE_MS = 60000; // a role or batch the admin changed shows up within a minute of coming back to the tab
function load(who: string, fresh = false): Promise<Me | null> {
  let p = inflight.get(who);
  if (fresh && Date.now() - (fetchedAt.get(who) ?? 0) > STALE_MS) p = undefined;
  if (!p) {
    fetchedAt.set(who, Date.now());
    p = apiJson<Me>("GET", "/api/me").catch(() => { inflight.delete(who); return null; }); // a failure is not remembered
    inflight.set(who, p);
  }
  return p;
}

/**
 * The signed-in person's role as the API sees it. The menu uses it to show the review page; the API enforces it anyway,
 * so hiding a link is a convenience, never the protection. Pass something that changes when the person changes.
 */
export function useRole(who: string): { me: Me | null; ready: boolean } {
  const [state, setState] = useState<{ who: string; me: Me | null } | null>(null);
  useEffect(() => {
    if (!API_URL) return;
    let alive = true;
    load(who).then((m) => { if (alive) setState({ who, me: m }); });
    const onVisible = () => { if (document.visibilityState === "visible") load(who, true).then((m) => { if (alive) setState((cur) => (cur?.who === who && JSON.stringify(cur.me) === JSON.stringify(m) ? cur : { who, me: m })); }); };
    const onRefresh = () => load(who).then((m) => { if (alive) setState({ who, me: m }); });
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("fde:me", onRefresh);
    return () => { alive = false; document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("fde:me", onRefresh); };
  }, [who]);
  // A role fetched for someone else is never used: until this person's answer arrives, there is no role.
  const mine = state?.who === who ? state.me : null;
  return { me: mine, ready: !API_URL || state?.who === who };
}


/** The role of whoever is signed in right now (or whichever test account is active in a development build). */
export function useMe(): { me: Me | null; ready: boolean } {
  const real = useRealMe();
  const view = useViewAs();
  const me = useMemo(() => (real.me ? asViewed(real.me, view) : null), [real.me, view]);
  return { me, ready: real.ready };
}

/** Your real roles, ignoring "view as" (only the view switch itself needs this). */
export function useRealMe(): { me: Me | null; ready: boolean } {
  const { user } = useStore();
  const persona = useDevPersona();
  return useRole(persona + "|" + (user?.email ?? ""));
}

/** The highest role this person really has anywhere: what the "view as" switch can offer. */
export function topRole(me: Me): ViewRole {
  if (me.role === "admin") return "admin";
  return me.programs?.some((p) => p.role === "coordinator") ? "coordinator" : "member";
}

/** Me as the chosen view shows it: every role lowered to the view (never raised). */
function asViewed(me: Me, view: ViewRole): Me {
  if (view === "admin") return me;
  return {
    ...me,
    role: me.role === "admin" ? "member" : me.role,
    can_manage: view === "coordinator" ? me.programs?.some((p) => p.role !== "member") ?? false : false,
    programs: me.programs?.map((p) => ({ ...p, role: lower(p.role, view) })),
  };
}
