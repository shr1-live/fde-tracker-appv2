import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { byWeek, errText, useProgram } from "../lib/useProgram";
import { canManage, checkValues, cleanValues, fmtDay, programs, status, type Day, type DayInput, type DayStatus, type Program, type Values } from "../lib/v3";
import { sameValues, useUnsaved } from "../lib/unsaved";
import { FormFields } from "../components/FormFields";
import { Chip } from "../components/Chip";
import { ProgramHeader } from "../components/ProgramHeader";
import { Linkified } from "../components/Linkified";
import { Icon } from "../components/Icon";
import { EmptyState, ErrorState, PageSkeleton } from "../components/States";
import { useConfirm } from "../components/Confirm";
import { useToast } from "../components/Toast";

const EMPTY: DayInput = { week: 1, day: 1, topic: "", topics_to_cover: "", practical_task: "", resources: "" };

/** Add or edit one day of the plan (coordinators and the admin). */
function DayEditor({ program, day, onDone }: { program: Program; day?: Day; onDone: (saved: boolean) => void }) {
  const next = (() => { const last = [...program.days].sort((a, b) => a.week - b.week || a.day - b.day).pop(); return last ? (last.day >= 5 ? { week: last.week + 1, day: 1 } : { week: last.week, day: last.day + 1 }) : { week: 1, day: 1 }; })();
  const start: DayInput = day ? { ...day, practical_task: day.practical_task ?? "", resources: day.resources ?? "" } : { ...EMPTY, ...next };
  const [v, setV] = useState<DayInput>(start);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toast = useToast();
  const id = day?.id ?? "new";
  useUnsaved(`day-edit-${id}`, JSON.stringify(v) !== JSON.stringify(start));
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => { first.current?.focus(); }, []);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!v.topic.trim()) { setErr("Give the day a topic."); return; }
    setBusy(true); setErr("");
    const body = { ...v, topic: v.topic.trim(), practical_task: v.practical_task?.trim() || null, resources: v.resources?.trim() || null };
    try { if (day) await programs.updateDay(program.id, day.id, body); else await programs.addDay(program.id, body); toast.success(day ? "Day updated." : `Week ${v.week}, Day ${v.day} added.`); setV(start); onDone(true); }
    catch (e2) { setErr(errText(e2)); } finally { setBusy(false); }
  };
  return (
    <form className="card day-editor" onSubmit={save} aria-label={day ? `Edit week ${day.week} day ${day.day}` : "Add a day"}>
      <h3>{day ? `Edit Week ${day.week}, Day ${day.day}` : "Add a day"}</h3>
      <div className="grid-2">
        <div className="field"><label htmlFor={`w-${id}`}>Week</label><input ref={first} id={`w-${id}`} type="number" min={1} max={52} value={v.week} onChange={(e) => setV({ ...v, week: Number(e.target.value) })} /></div>
        <div className="field"><label htmlFor={`d-${id}`}>Day</label><input id={`d-${id}`} type="number" min={1} max={7} value={v.day} onChange={(e) => setV({ ...v, day: Number(e.target.value) })} /></div>
      </div>
      <div className="field"><label htmlFor={`t-${id}`}>Topic</label><input id={`t-${id}`} maxLength={140} value={v.topic} onChange={(e) => setV({ ...v, topic: e.target.value })} /></div>
      <div className="field"><label htmlFor={`c-${id}`}>Topics to cover <span className="hint">one per line</span></label><textarea id={`c-${id}`} rows={6} maxLength={4000} value={v.topics_to_cover} onChange={(e) => setV({ ...v, topics_to_cover: e.target.value })} /></div>
      <div className="field"><label htmlFor={`p-${id}`}>Practical task <span className="hint">optional</span></label><textarea id={`p-${id}`} rows={4} maxLength={4000} value={v.practical_task ?? ""} onChange={(e) => setV({ ...v, practical_task: e.target.value })} /></div>
      <div className="field"><label htmlFor={`r-${id}`}>Resources <span className="hint">optional, links or notes</span></label><textarea id={`r-${id}`} rows={2} maxLength={2000} value={v.resources ?? ""} onChange={(e) => setV({ ...v, resources: e.target.value })} /></div>
      {err && <p className="field-error" role="alert">{err}</p>}
      <div className="row end"><button type="button" className="btn ghost" onClick={() => onDone(false)}>Cancel</button><button className="btn" disabled={busy}>{busy ? "Saving" : "Save day"}</button></div>
    </form>
  );
}

function DayCard({ program, day, mine, member, editing, onSaved, onEdit, onDelete }: {
  program: Program; day: Day; mine?: DayStatus; member: boolean; editing: boolean; onSaved: (s: DayStatus) => void; onEdit: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(() => location.hash === `#day-${day.id}`);
  const [values, setValues] = useState<Values>(mine?.values ?? {});
  const [completed, setCompleted] = useState(mine?.completed ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const toast = useToast();
  useEffect(() => { setValues(mine?.values ?? {}); setCompleted(mine?.completed ?? false); }, [mine]);
  useUnsaved(`day-${day.id}`, member && !sameValues(values, mine?.values ?? {}));
  const fields = program.forms.day;
  const save = async (done: boolean) => {
    const errs = checkValues(fields, values, done);
    setErrors(errs);
    if (Object.keys(errs).length) { setOpen(true); setMsg(done ? "Fill in the marked fields to mark this day completed." : "Fix the marked fields."); return; }
    setBusy(true); setMsg("");
    try { const s = await status.saveDay(program.id, day.id, cleanValues(fields, values), done); onSaved(s); setCompleted(done); toast.success(done ? `Day ${day.day} saved and marked completed.` : `Day ${day.day} saved.`); }
    catch (e) { toast.error(errText(e)); } finally { setBusy(false); }
  };
  const lines = day.topics_to_cover.split("\n").map((l) => l.replace(/^[\s•\-*]+/, "").trim()).filter(Boolean);
  const state = mine?.completed ? "done" : mine ? "inprogress" : "todo"; // not "progress": that is the progress bar's class
  return (
    <section id={`day-${day.id}`} className={"card daycard " + state} aria-labelledby={`dh-${day.id}`}>
      <div className="daycard-top">
        {member ? (
          <label className="daycheck" title={mine?.completed ? "Completed" : "Mark this day completed"}>
            <input type="checkbox" checked={!!mine?.completed} disabled={busy} onChange={(e) => (e.target.checked ? save(true) : save(false))} />
            <span className="daycheck-box" aria-hidden="true"><Icon name="check" size={14} /></span>
            <span className="sr">Day {day.day} completed</span>
          </label>
        ) : <span className="daynum" aria-hidden="true">{day.day}</span>}
        <div className="grow">
          <p className="overline">Week {day.week} · Day {day.day}</p>
          <h3 id={`dh-${day.id}`}>{day.topic}</h3>
        </div>
        {member && (mine?.completed ? <Chip tone="ok">Completed</Chip> : mine ? <Chip tone="info">In progress</Chip> : <Chip>Not started</Chip>)}
      </div>
      <details open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary><Icon name="down" size={16} />{open ? "Hide details" : "Topics, practical task" + (member ? " and my status" : "")}</summary>
        <div className="daycard-body">
          <div className="day-section">
            <h4>Topics to cover</h4>
            <ul className="topics">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
          </div>
          {day.practical_task && <div className="day-section"><h4>Practical task</h4><p className="prewrap">{day.practical_task}</p></div>}
          {day.resources && <div className="day-section"><h4>Resources</h4><p className="prewrap"><Linkified text={day.resources} /></p></div>}
          {member && (
            <div className="mystatus">
              <h4>My status for this day</h4>
              <FormFields fields={fields} values={values} onChange={(v) => { setValues(v); if (Object.keys(errors).length) { setErrors({}); setMsg(""); } }} errors={errors} idPrefix={`ds-${day.id}`} disabled={busy} />
              {msg && <p className="field-error" role="alert">{msg}</p>}
              <div className="row">
                <button type="button" className="btn" disabled={busy} onClick={() => save(true)}>{busy ? "Saving" : completed ? "Save" : "Save and mark completed"}</button>
                {!completed && <button type="button" className="btn secondary" disabled={busy} onClick={() => save(false)}>Save as in progress</button>}
                {completed && <button type="button" className="btn secondary" disabled={busy} onClick={() => save(false)}>Mark not completed</button>}
              </div>
            </div>
          )}
        </div>
      </details>
      {editing && (
        <div className="daycard-edit">
          <button type="button" className="btn ghost sm" onClick={onEdit}><Icon name="edit" size={14} />Edit day<span className="sr"> {day.day} of week {day.week}</span></button>
          <button type="button" className="btn ghost sm danger-text" onClick={onDelete}><Icon name="trash" size={14} />Delete day<span className="sr"> {day.day} of week {day.week}</span></button>
        </div>
      )}
    </section>
  );
}

export default function Plan() {
  const { pid } = useParams();
  const { program, error, reload } = useProgram(pid);
  const [mine, setMine] = useState<Map<string, DayStatus>>(new Map());
  const [editing, setEditing] = useState(false);
  const [openWeeks, setOpenWeeks] = useState<Map<number, boolean>>(new Map());
  const [edit, setEdit] = useState<Day | "new" | null>(null);
  const [err, setErr] = useState("");
  const confirm = useConfirm();
  const toast = useToast();
  const member = program?.my_role === "member" || program?.my_role === "coordinator";
  useEffect(() => {
    if (!pid || !member) return;
    status.days(pid).then((rows) => setMine(new Map(rows.map((r) => [r.day_id, r])))).catch((e) => setErr(errText(e)));
  }, [pid, member]);
  useEffect(() => { if (program && location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView(); }, [program]);
  if (error) return <div className="content"><ErrorState title="Could not open this program" message={error} onRetry={reload} /></div>;
  if (!program) return <div className="content"><PageSkeleton /></div>;
  const manage = canManage(program.my_role);
  const weeks = byWeek(program.days);
  const linked = program.days.find((x) => location.hash === `#day-${x.id}`)?.week; // a link to one day opens its week
  const focusWeek = linked ?? (member ? weeks.find(([, ds]) => ds.some((x) => !mine.get(x.id)?.completed))?.[0] : undefined) ?? weeks[0]?.[0];
  const remove = async (d: Day) => {
    if (!(await confirm({ title: `Delete Week ${d.week}, Day ${d.day}?`, body: `"${d.topic}" and everyone's status for this day are deleted. This cannot be undone.`, confirm: "Delete day", danger: true }))) return;
    try { await programs.deleteDay(program.id, d.id); toast.success("Day deleted."); await reload(); } catch (e) { toast.error(errText(e)); }
  };
  const doneCount = [...mine.values()].filter((s) => s.completed).length;
  const pct = program.days.length ? Math.round((doneCount / program.days.length) * 100) : 0;
  const actions = manage && (
    <>
      {editing && <button type="button" className="btn secondary" onClick={() => setEdit("new")}><Icon name="plus" size={16} />Add a day</button>}
      <button type="button" className={"btn" + (editing ? "" : " secondary")} aria-pressed={editing} onClick={() => { setEditing((x) => !x); setEdit(null); }}>{editing ? "Done editing" : <><Icon name="edit" size={16} />Edit plan</>}</button>
    </>
  );
  const done = (saved: boolean) => { setEdit(null); if (saved) void reload(); };
  return (
    <div className="content">
      <ProgramHeader program={program} page="Plan" actions={actions || undefined} />
      {member && program.days.length > 0 && (
        <div className="card progress-card">
          <div className="progress-text">
            <span className="progress-num">{pct}%</span>
            <span><b>{doneCount} of {program.days.length} days completed</b><span className="meta">{program.starts_on ? `Started ${fmtDay(program.starts_on)}` : "Tick a day when you finish it."}</span></span>
          </div>
          <div className="progress" role="progressbar" aria-label="Days completed" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={program.days.length}><span style={{ width: `${pct}%` }} /></div>
        </div>
      )}
      {err && <p className="banner error" role="alert">{err}</p>}
      {edit === "new" && <DayEditor program={program} onDone={done} />}
      {weeks.length === 0 && (
        <EmptyState icon="book" title="No days in this plan yet"
          action={manage && !editing ? <button type="button" className="btn" onClick={() => { setEditing(true); setEdit("new"); }}><Icon name="plus" size={16} />Add the first day</button> : undefined}>
          {manage ? "Add the first day: a topic, what to cover and a practical task." : "Your coordinator will add the days. Meanwhile, the feed has what others are sharing."}
          {!manage && <> <Link to={`/p/${program.id}/feed`}>Open the feed</Link>.</>}
        </EmptyState>
      )}
      {weeks.map(([w, days]) => {
        const d = days.filter((x) => mine.get(x.id)?.completed).length;
        // Many weeks: only the week you are on starts open (the first unfinished one); editing opens them all.
        const isOpen = editing || (openWeeks.get(w) ?? w === focusWeek);
        return (
          <details key={w} className="week" open={isOpen} onToggle={(e) => { const o = (e.currentTarget as HTMLDetailsElement).open; if (o !== isOpen) setOpenWeeks((m) => new Map(m).set(w, o)); }}>
            <summary className="week-head">
              <span className="week-caret" aria-hidden="true"><Icon name="down" size={18} /></span>
              <h2 id={`wk-${w}`} className="grow">Week {w}<span className="meta week-count"> · {days.length} {days.length === 1 ? "day" : "days"}</span></h2>
              {member && <Chip tone={d === days.length ? "ok" : d ? "info" : "none"}>{d === days.length ? "Week completed" : `${d} of ${days.length} days done`}</Chip>}
            </summary>
            <div className="stack">
              {days.map((x) => (edit !== "new" && edit?.id === x.id
                ? <DayEditor key={x.id} program={program} day={x} onDone={done} />
                : <DayCard key={x.id} program={program} day={x} mine={mine.get(x.id)} member={member} editing={editing} onEdit={() => setEdit(x)} onDelete={() => remove(x)}
                    onSaved={(s) => setMine((m) => new Map(m).set(s.day_id, s))} />))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
