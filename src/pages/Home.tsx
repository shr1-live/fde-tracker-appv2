import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { errText } from "../lib/useProgram";
import { canManage, fmtDay, programs, type ProgramSummary } from "../lib/v3";
import { lower, useViewAs, VIEW_LABEL } from "../lib/viewAs";
import { EmptyState, ErrorState, PageSkeleton } from "../components/States";
import { Icon } from "../components/Icon";

/** The first screen after signing in: choose a program. Its feed, plan, daily status and reports then open together. */
export default function Home() {
  const view = useViewAs();
  const [list, setList] = useState<ProgramSummary[] | null>(null);
  const [err, setErr] = useState("");
  const load = () => { setErr(""); programs.list().then(setList).catch((e) => setErr(errText(e))); };
  useEffect(load, []);
  if (err) return <div className="content"><ErrorState title="Could not load your programs" message={err} onRetry={load} /></div>;
  if (!list) return <div className="content"><PageSkeleton /></div>;
  const shown = list.map((p) => ({ ...p, my_role: lower(p.my_role, view) }));
  const people = shown.reduce((a, p) => a + p.member_count, 0);
  const today = new Date().toISOString().slice(0, 10);
  const next = shown.map((p) => p.starts_on).filter((d): d is string => !!d && d >= today).sort()[0];
  return (
    <div className="content">
      <header className="pg-hero">
        <span className="pg-eyebrow">Your programs</span>
        <h1 className="pg-h1">Choose a program</h1>
        <p className="pg-lead">Everything happens inside a program: its feed, plan, daily status and reports. Pick one to start; switch any time from the side panel.</p>
      </header>
      {shown.length === 0 ? (
        <EmptyState icon="grid" title="You are not in a program yet">The admin or a coordinator adds you. You get an email when they do.</EmptyState>
      ) : (
        <>
          <section className="stats" aria-label="Summary">
            <div className="stat"><span className="pg-eyebrow muted">Programs</span><b>{shown.length}</b></div>
            <div className="stat"><span className="pg-eyebrow muted">People</span><b>{people}</b></div>
            <div className="stat"><span className="pg-eyebrow muted">Next start</span><b className="stat-text">{next ? fmtDay(next) : "Started"}</b></div>
          </section>
          <ul className="pcards">
            {shown.map((p) => {
              const base = `/p/${p.id}`;
              return (
                <li key={p.id} className="pcard">
                  <div className="pcard-top">
                    <span className="tag">{VIEW_LABEL[p.my_role]}</span>
                    <span className="meta">{p.starts_on ? (p.starts_on > today ? `Starts ${fmtDay(p.starts_on)}` : `Started ${fmtDay(p.starts_on)}`) : "No start date"}</span>
                  </div>
                  <h2 className="pcard-title"><Link to={`${base}/feed`} className="pcard-link">{p.name}</Link></h2>
                  {p.description && <p className="pcard-desc">{p.description}</p>}
                  <p className="meta pcard-people"><Icon name="users" size={14} />{p.member_count} {p.member_count === 1 ? "person" : "people"}</p>
                  <div className="pcard-foot">
                    <Link to={`${base}/feed`} className="btn">Open program<Icon name="right" size={16} /></Link>
                    <Link to={base} className="pcard-quick">Plan</Link>
                    {p.my_role !== "admin" && <Link to={`${base}/daily`} className="pcard-quick">Daily status</Link>}
                    {canManage(p.my_role) && <Link to={`${base}/reports`} className="pcard-quick">Reports</Link>}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
