import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { errText } from "../lib/useProgram";
import { refreshMe, useMe } from "../lib/useRole";
import { fmtDay, programs, ROLE_LABEL, type ProgramSummary } from "../lib/v3";
import { Icon } from "../components/Icon";
import { CardSkeleton, EmptyState, ErrorState, Loading } from "../components/States";
import { useToast } from "../components/Toast";
import { DemoPanel } from "../components/DemoPanel";

/** Admin: every program, and create a new one. */
export default function Programs() {
  const { me, ready } = useMe();
  const [list, setList] = useState<ProgramSummary[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const load = () => programs.list().then((l) => { setList(l); setLoadErr(""); }).catch((e) => { setLoadErr(errText(e)); setList([]); });
  useEffect(() => { void load(); }, []);
  if (ready && me?.role !== "admin") return <Navigate to="/" replace />;
  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { setErr("Give the program a name (at least 2 characters)."); document.getElementById("pc-name")?.focus(); return; }
    setBusy(true); setErr("");
    try { await programs.create({ name: name.trim(), description: description.trim() || undefined, starts_on: startsOn || undefined }); toast.success(`${name.trim()} created. Open it, then Manage to invite a coordinator.`); setName(""); setDescription(""); setStartsOn(""); await load(); refreshMe(); }
    catch (e2) { setErr(errText(e2)); } finally { setBusy(false); }
  };
  const people = (list ?? []).reduce((a, p) => a + p.member_count, 0);
  const today = new Date().toISOString().slice(0, 10);
  const next = (list ?? []).map((p) => p.starts_on).filter((d): d is string => !!d && d >= today).sort()[0];
  return (
    <div className="content">
      <header className="pg-hero">
        <span className="pg-eyebrow">Admin</span>
        <h1 className="pg-h1">Programs</h1>
        <p className="pg-lead">As the admin you see every program. Create one, then invite its coordinator from its Manage page; the coordinator can run it from there.</p>
      </header>
      <section className="stats" aria-label="Summary">
        <div className="stat"><span className="pg-eyebrow muted">Programs</span><b>{list?.length ?? "–"}</b></div>
        <div className="stat"><span className="pg-eyebrow muted">People</span><b>{list ? people : "–"}</b></div>
        <div className="stat"><span className="pg-eyebrow muted">Next start</span><b className="stat-text">{next ? fmtDay(next) : "–"}</b></div>
      </section>
      <div className="pg-split">
        <section className="pg-split-main" aria-labelledby="pl-h">
          <h2 id="pl-h" className="pg-h2">All programs</h2>
          {loadErr ? <ErrorState title="Could not load programs" message={loadErr} onRetry={() => void load()} />
            : list === null ? <Loading><div className="stack"><CardSkeleton lines={2} /><CardSkeleton lines={2} /></div></Loading>
            : list.length === 0 ? <EmptyState icon="layers" title="No programs yet">Create the first one with the form. Then invite its coordinator.</EmptyState>
            : (
              <div className="pg-table-wrap">
                <table className="pg-table">
                  <thead><tr>
                    <th scope="col">Program</th><th scope="col">Your role</th><th scope="col">People</th><th scope="col">Starts</th>
                    <th scope="col"><span className="sr">Actions</span></th>
                  </tr></thead>
                  <tbody>{list.map((p) => (
                    <tr key={p.id}>
                      <td><Link to={`/p/${p.id}/feed`} className="pg-prog">{p.name}</Link>{p.description && <span className="meta pg-desc">{p.description}</span>}</td>
                      <td><span className="tag">{ROLE_LABEL[p.my_role]}</span></td>
                      <td className="meta">{p.member_count}</td>
                      <td className="meta">{p.starts_on ? fmtDay(p.starts_on) : "–"}</td>
                      <td className="pg-actions">
                        <Link className="pg-link" to={`/p/${p.id}/reports`}>Reports<span className="sr"> for {p.name}</span></Link>
                        <Link className="btn secondary" to={`/p/${p.id}/manage`}>Manage<span className="sr"> {p.name}</span></Link>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
        </section>
        <div className="pg-split-side">
        <form className="panel-accent pg-form" onSubmit={create} aria-labelledby="pc-h" noValidate>
          <h2 id="pc-h" className="pg-h2">New program</h2>
          <div className="field"><label htmlFor="pc-name">Name</label><input id="pc-name" maxLength={80} placeholder="e.g. DevOps Training Program" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err || undefined} /></div>
          <div className="field"><label htmlFor="pc-desc">Description <span className="hint">optional</span></label><textarea id="pc-desc" rows={3} maxLength={600} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="field"><label htmlFor="pc-start">Start date <span className="hint">optional</span></label><input id="pc-start" type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} /></div>
          {err && <p className="field-error" role="alert">{err}</p>}
          <button className="btn block lg" disabled={busy}><Icon name="plus" size={16} />{busy ? "Creating" : "Create program"}</button>
          <p className="meta">After creating, open Manage to invite the program's coordinator.</p>
        </form>
        <DemoPanel onChange={() => void load()} />
        </div>
      </div>
    </div>
  );
}
