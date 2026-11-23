// "View as": one sign-in, several roles. The admin can look at the app as the admin, as a coordinator or as a member;
// a coordinator as a coordinator or a member; a member only as a member. You can only step DOWN from your real role,
// never up, and the API still checks your real role on every request: this only changes what the screens show.
import { useEffect, useState } from "react";

export type ViewRole = "admin" | "coordinator" | "member";
export const RANK: Record<ViewRole, number> = { member: 0, coordinator: 1, admin: 2 };
export const VIEW_LABEL: Record<ViewRole, string> = { admin: "Admin", coordinator: "Coordinator", member: "Member" };

const KEY = "fde:view-as";
const EVENT = "fde:view-as";

export function getViewAs(): ViewRole {
  try { const v = localStorage.getItem(KEY); return v === "coordinator" || v === "member" ? v : "admin"; } catch { return "admin"; }
}

export function setViewAs(v: ViewRole) {
  try { localStorage.setItem(KEY, v); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(EVENT));
}

/** The role a screen should use: the lower of your real role and the role you chose to view as. */
export function lower<R extends ViewRole>(real: R, view: ViewRole): R {
  return (RANK[view] < RANK[real] ? view : real) as R;
}

export function useViewAs(): ViewRole {
  const [v, setV] = useState(getViewAs());
  useEffect(() => {
    const on = () => setV(getViewAs());
    window.addEventListener(EVENT, on);
    window.addEventListener("storage", on);
    return () => { window.removeEventListener(EVENT, on); window.removeEventListener("storage", on); };
  }, []);
  return v;
}
