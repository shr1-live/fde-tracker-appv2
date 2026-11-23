import { useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Me } from "../../lib/useRole";
import { ROLE_LABEL } from "../../lib/v3";
import { usePopover } from "../../lib/usePopover";
import { Icon } from "../Icon";

export type Prog = NonNullable<Me["programs"]>[number];
const SEARCH_FROM = 6; // a search box appears once the list is long enough to need one

/** The current program and the person's role in it; opens a list (searchable when long) to switch program. */
export function ProgramSwitcher({ programs, current, isAdmin, onPick }: { programs: Prog[]; current: Prog; isAdmin: boolean; onPick?: () => void }) {
  const pop = usePopover();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? programs.filter((p) => p.name.toLowerCase().includes(t)) : programs;
  }, [programs, q]);
  useEffect(() => {
    if (!pop.open) { setQ(""); return; }
    pop.box.current?.querySelector<HTMLElement>(".switch-pop input, .switch-pop a")?.focus();
  }, [pop.open]); // eslint-disable-line react-hooks/exhaustive-deps

  const face = (
    <>
      <span className="ps-tile" aria-hidden="true">{current.name.charAt(0)}</span>
      <span className="ps-text"><span className="ps-name">{current.name}</span><span className="ps-role">{ROLE_LABEL[current.role]}</span></span>
    </>
  );
  if (programs.length < 2 && !isAdmin) return <div className="switcher single" data-tip={current.name}>{face}</div>;
  // Close the list first and only then go. Closing removes the list's extra history entry with history.back(); if the
  // link navigated at the same moment, that Back would undo the switch and the person would land on the old program again.
  const go = (to: string) => async (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // a new-tab click keeps its normal behaviour
    e.preventDefault();
    await pop.hide(false);
    onPick?.();
    navigate(to, { replace: true });
  };
  // Arrow keys move between the programs in the list.
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const els = [...(pop.box.current?.querySelectorAll<HTMLElement>(".switch-pop input, .switch-pop a") ?? [])];
    const i = els.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    els[(i + (e.key === "ArrowDown" ? 1 : -1) + els.length) % els.length]?.focus();
  };
  return (
    <div className="switcher-wrap" ref={pop.box}>
      <button ref={pop.btn} type="button" className="switcher" aria-expanded={pop.open} aria-controls="program-pop" onClick={pop.toggle} data-tip={current.name}>
        <span className="sr">Switch program. Current: </span>{face}<Icon name="updown" size={16} />
      </button>
      {pop.open && (
        <div id="program-pop" className="switch-pop pop" onKeyDown={onKey}>
          {programs.length >= SEARCH_FROM && (
            <div className="search pop-search">
              <Icon name="search" size={16} />
              <label htmlFor="program-q" className="sr">Find a program</label>
              <input id="program-q" type="search" placeholder="Find a program" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
            </div>
          )}
          <p className="overline" id="program-list-label">Your programs</p>
          <div id="program-list" className="switch-list" role="group" aria-labelledby="program-list-label">
            {list.map((p) => (
              <Link key={p.id} to={`/p/${p.id}`} replace aria-current={p.id === current.id ? "true" : undefined} onClick={go(`/p/${p.id}`)}>
                <span className="ps-tile sm" aria-hidden="true">{p.name.charAt(0)}</span>
                <span className="grow ellipsis">{p.name}</span>
                <span className="ps-role">{ROLE_LABEL[p.role]}</span>
                {p.id === current.id && <span className="ps-check"><Icon name="check" size={16} /><span className="sr"> (current)</span></span>}
              </Link>
            ))}
            {list.length === 0 && <p className="meta pop-empty">No program matches.</p>}
          </div>
          {isAdmin && (
            <div className="pop-foot">
              <Link to="/programs" replace onClick={go("/programs")} className="pop-link"><Icon name="grid" size={16} />All programs</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
