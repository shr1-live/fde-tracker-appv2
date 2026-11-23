import { useState } from "react";
import { applyBrand, getBrand, type Brand } from "../../lib/theme";
import { RANK, VIEW_LABEL, setViewAs, useViewAs, type ViewRole } from "../../lib/viewAs";
import { topRole, useRealMe } from "../../lib/useRole";

const ROLES: ViewRole[] = ["admin", "coordinator", "member"];

/**
 * View the app as a role at or below your own: Admin -> Admin, Coordinator, Member; Coordinator -> Coordinator, Member;
 * a member has only Member, so the switch is not shown. Screens follow the choice; the API still checks your real role.
 */
export function ViewAsSwitch() {
  const { me } = useRealMe();
  const view = useViewAs();
  if (!me) return null;
  const top = topRole(me);
  const options = ROLES.filter((r) => RANK[r] <= RANK[top]);
  if (options.length < 2) return null;
  const current = RANK[view] <= RANK[top] ? view : top;
  return (
    <div className="seg topsw" role="group" aria-label="View as">
      <span className="topsw-label" aria-hidden="true">View as</span>
      {options.map((r) => (
        <button key={r} type="button" aria-pressed={current === r} onClick={() => setViewAs(r)} title={`See the app as ${VIEW_LABEL[r].toLowerCase()}`}>
          {VIEW_LABEL[r]}
        </button>
      ))}
    </div>
  );
}

/** Switch between this app's own look and the FiftyFive design system. */
export function BrandSwitch() {
  const [b, setB] = useState<Brand>(getBrand());
  const set = (n: Brand) => { applyBrand(n); setB(n); };
  return (
    <div className="seg topsw" role="group" aria-label="Theme">
      <button type="button" aria-pressed={b === "classic"} onClick={() => set("classic")} title="This app's own look">Classic</button>
      <button type="button" aria-pressed={b === "ff"} onClick={() => set("ff")} title="FiftyFive design system">55</button>
    </div>
  );
}
