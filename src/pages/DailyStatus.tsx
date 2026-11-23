import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { errText, useProgram } from "../lib/useProgram";
import { canManage, isoDay, programs, status, timesheet, type Member, type TimeTask } from "../lib/v3";
import { useUnsaved } from "../lib/unsaved";
import { ProgramHeader } from "../components/ProgramHeader";
import { Chip } from "../components/Chip";
import { Icon } from "../components/Icon";
import { EmptyState, ErrorState, PageSkeleton } from "../components/States";
import { useConfirm } from "../components/Confirm";
import { useToast } from "../components/Toast";
import { useMe } from "../lib/useRole";

// ---- dates (local time, yyyy-mm-dd)
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const parse = (iso: string) => new Date(iso + "T00:00:00");
const addDays = (iso: string, n: number) => { const d = parse(iso); d.setDate(d.getDate() + n); return isoDay(d); };
const mondayOf = (iso: string) => addDays(iso, -((parse(iso).getDay() + 6) % 7));
const weekend = (iso: string) => { const g = parse(iso).getDay(); return g === 0 || g === 6; };
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => parse(iso).toLocaleDateString(undefined, o);
const range = (mon: string) => `${fmt(mon, { day: "numeric", month: "short" })} - ${fmt(addDays(mon, 6), { day: "numeric", month: "short", year: "numeric" })}`;

// ---- hours: typed as 2, 2.5, 2:30 or 230; shown as h:mm
const hm = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;
function toMinutes(text: string): number | null {
  const t = text.trim();
  if (!t) return 0;
  let m: RegExpExecArray | null;
  if ((m = /^(\d{1,2}):([0-5]\d)$/.exec(t))) return Number(m[1]) * 60 + Number(m[2]);
  if ((m = /^(\d{1,2})(?:[.,](\d{1,2}))?$/.exec(t))) return Math.round((Number(m[1]) + (m[2] ? Number(`0.${m[2]}`) : 0)) * 60);
  if ((m = /^(\d{1,2})([0-5]\d)$/.exec(t))) return Number(m[1]) * 60 + Number(m[2]);
  return null;
}

const TARGET_PER_DAY = 8 * 60; // the weekly target in the totals bar: 8 h per working day
type Cell = { hours: string; note: string };
type Row = { key: string; title: string; cells: Record<string, Cell> };
let seq = 0;
const newKey = () => `t${++seq}`;
const fromApi = (tasks: TimeTask[]): Row[] => tasks.map((t) => ({
  key: newKey(), title: t.title,
  cells: Object.fromEntries(t.cells.map((c) => [c.date, { hours: c.minutes ? hm(c.minutes) : "", note: c.note ?? "" }])),
}));
const snapshot = (rows: Row[]) => JSON.stringify(rows.map((r) => [r.title.trim(), Object.entries(r.cells).filter(([, c]) => c.hours.trim() || c.note.trim()).map(([d, c]) => [d, toMinutes(c.hours), c.note.trim()]).sort()]));

/**
 * Daily status as a daily log (a weekly sheet). Your own tasks are the rows (add them as you go), the days of the week are the columns,
 * and every cell takes hours and a short note. Week view to see and fill the whole week; Day view for one day.
 * A reminder link (?date=YYYY-MM-DD) opens the Day view on the missed day.
 */
export default function DailyStatus() {
  const { pid = "" } = useParams();
  const [sp, setSp] = useSearchParams();
  const { program, error, reload } = useProgram(pid);
  const { me } = useMe();
  const confirm = useConfirm();
  const toast = useToast();
  const today = isoDay(new Date());
  const maxDay = addDays(today, 1);
  const asked = sp.get("date");
  const linked = asked && ISO.test(asked) && asked <= maxDay ? asked : null;
  const [view, setView] = useState<"week" | "day">(linked && !sp.get("person") ? "day" : "week");
  const [day, setDay] = useState(linked ?? today);
  const [week, setWeek] = useState(mondayOf(linked ?? today));
  const [rows, setRows] = useState<Row[] | null>(null);
  const [saved, setSaved] = useState("");
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [legacy, setLegacy] = useState<Set<string>>(new Set()); // days filled with the old daily form
  const [busy, setBusy] = useState<"" | "save" | "submit">("");
  const [people, setPeople] = useState<Member[]>([]);
  const [person, setPerson] = useState(() => sp.get("person") ?? ""); // "" = me; a "week submitted" notification opens that person's week
  const [loadErr, setLoadErr] = useState("");

  const role = program?.my_role;
  const manager = canManage(role);
  const fills = role === "member" || role === "coordinator"; // the admin has no daily status of their own
  const viewing = person || (fills ? "" : people[0]?.user_id ?? "");
  const readOnly = !!viewing;
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);

  useEffect(() => { if (manager && pid) programs.members(pid).then((r) => setPeople(r.members.filter((m) => m.user_id !== me?.id))).catch(() => setPeople([])); }, [manager, pid, me?.id]);
  useEffect(() => { // a reminder link while the page is open
    if (linked && linked !== day) { setDay(linked); setWeek(mondayOf(linked)); setView(sp.get("person") ? "week" : "day"); }
    if (sp.get("person") && sp.get("person") !== person) setPerson(sp.get("person") ?? "");
  }, [linked, sp.get("person")]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!pid || !role || (!fills && !viewing)) return;
    setRows(null); setLoadErr("");
    try {
      const [ts, old] = await Promise.all([
        timesheet.get(pid, week, viewing || undefined),
        status.daily(pid, { user_id: viewing || undefined, from: week, to: addDays(week, 6) }).catch(() => []),
      ]);
      const r = fromApi(ts.tasks);
      setRows(r); setSaved(snapshot(r)); setSubmittedAt(ts.submitted_at);
      setLegacy(new Set(old.map((o) => o.on_date)));
    } catch (e) { setLoadErr(errText(e, "Could not load the daily log.")); }
  }, [pid, role, fills, viewing, week]);
  useEffect(() => { void load(); }, [load]);

  const dirty = !!rows && !readOnly && snapshot(rows) !== saved;
  useUnsaved("timesheet", dirty);

  if (error) return <div className="content"><ErrorState title="Could not open this program" message={error} onRetry={reload} /></div>;
  if (!program) return <div className="content"><PageSkeleton /></div>;

  // ---- totals
  const minutesOf = (r: Row, d: string) => toMinutes(r.cells[d]?.hours ?? "") ?? 0;
  const dayTotal = (d: string) => (rows ?? []).reduce((a, r) => a + minutesOf(r, d), 0);
  const rowTotal = (r: Row) => days.reduce((a, d) => a + minutesOf(r, d), 0);
  const weekTotal = days.reduce((a, d) => a + dayTotal(d), 0);
  const startsOn = program.starts_on ?? "2020-01-01";
  const workdays = days.filter((d) => !weekend(d) && d >= startsOn);
  const target = workdays.length * TARGET_PER_DAY;
  const filledDay = (d: string) => dayTotal(d) > 0 || legacy.has(d);
  const missing = (d: string) => !weekend(d) && d < today && d >= startsOn && !filledDay(d);
  const missingCount = days.filter(missing).length;
  const bad = (rows ?? []).some((r) => Object.values(r.cells).some((c) => toMinutes(c.hours) === null));

  // ---- editing
  const edit = (key: string, f: (r: Row) => Row) => setRows((all) => (all ?? []).map((r) => (r.key === key ? f(r) : r)));
  const setCell = (key: string, d: string, patch: Partial<Cell>) => edit(key, (r) => ({ ...r, cells: { ...r.cells, [d]: { ...(r.cells[d] ?? { hours: "", note: "" }), ...patch } } }));
  const addTask = () => {
    const key = newKey();
    setRows((all) => [...(all ?? []), { key, title: "", cells: {} }]);
    setTimeout(() => document.getElementById(`task-${key}`)?.focus(), 0);
  };
  const removeTask = async (r: Row) => {
    if ((rowTotal(r) > 0 || r.title.trim()) && !(await confirm({ title: `Remove "${r.title.trim() || "this task"}"?`, body: "Its hours and notes for this week go too, once you save.", confirm: "Remove task", danger: true }))) return;
    setRows((all) => (all ?? []).filter((x) => x.key !== r.key));
  };
  const leaveOk = async () => !dirty || await confirm({ title: "Leave this week without saving?", body: "Your changes to this week are not saved yet.", confirm: "Leave week", cancel: "Stay", danger: true });
  const goWeek = async (mon: string) => {
    if (mon > maxDay || !(await leaveOk())) return;
    setWeek(mon);
    setDay(mon === mondayOf(today) ? today : mon);
    if (sp.has("date")) setSp((p) => { p.delete("date"); return p; }, { replace: true });
  };
  const goDay = async (d: string) => {
    if (d > maxDay) return;
    if (mondayOf(d) !== week) { if (!(await leaveOk())) return; setWeek(mondayOf(d)); }
    setDay(d);
  };
  const copyLastWeek = async () => {
    try {
      const prev = await timesheet.get(pid, addDays(week, -7));
      if (!prev.tasks.length) { toast.info("Last week has no tasks to copy."); return; }
      const shifted = fromApi(prev.tasks.map((t) => ({ ...t, cells: t.cells.map((c) => ({ ...c, date: addDays(c.date, 7) })).filter((c) => c.date <= maxDay) })));
      const keep = (rows ?? []).filter((r) => r.title.trim());
      setRows([...keep, ...shifted.filter((s) => !keep.some((k) => k.title.trim().toLowerCase() === s.title.trim().toLowerCase()))]);
      toast.success("Copied last week's tasks and hours. Check them, then save.");
    } catch (e) { toast.error(errText(e)); }
  };
  const save = async (submit: boolean) => {
    if (!rows) return;
    const named = rows.filter((r) => r.title.trim() || rowTotal(r) > 0 || Object.values(r.cells).some((c) => c.note.trim()));
    const unnamed = named.find((r) => !r.title.trim());
    if (unnamed) { toast.error("Give every task a name."); document.getElementById(`task-${unnamed.key}`)?.focus(); return; }
    if (bad) { toast.error("Write hours like 2, 2.5 or 2:30."); return; }
    const over = days.find((d) => dayTotal(d) > 1440);
    if (over) { toast.error(`More than 24 hours on ${fmt(over, { weekday: "short", day: "numeric", month: "short" })}.`); return; }
    if (submit && workdays.some((d) => d <= today && !filledDay(d)) && !(await confirm({ title: "Submit with days missing?", body: "Some working days of this week have no hours yet.", confirm: "Submit anyway" }))) return;
    setBusy(submit ? "submit" : "save");
    try {
      const ts = await timesheet.save(pid, week, named.map((r) => ({
        title: r.title.trim(),
        cells: Object.entries(r.cells).filter(([d, c]) => days.includes(d) && ((toMinutes(c.hours) ?? 0) > 0 || c.note.trim())).map(([d, c]) => ({ date: d, minutes: toMinutes(c.hours) ?? 0, note: c.note.trim() || null })),
      })), submit);
      const r = fromApi(ts.tasks);
      setRows(r); setSaved(snapshot(r)); setSubmittedAt(ts.submitted_at);
      window.dispatchEvent(new Event("fde:daily-saved")); // the bell drops reminders for days that now have hours
      toast.success(submit ? `Submitted your week (${range(week)}). Your coordinator has been told.` : "Saved.");
    } catch (e) { toast.error(errText(e)); } finally { setBusy(""); }
  };

  const who = viewing ? people.find((p) => p.user_id === viewing)?.name ?? "This person" : "You";
  const header = (
    <ProgramHeader program={program} page="Daily status"
      intro={readOnly ? `${who}'s daily log. Only they can change it.` : "Add the tasks you work on, then log hours and a short note for each day. Save as you go; submit the week when it is complete."}
      actions={
        <div className="seg ts-views" role="group" aria-label="View">
          <button type="button" aria-pressed={view === "week"} onClick={() => setView("week")}><Icon name="grid" size={16} />Week</button>
          <button type="button" aria-pressed={view === "day"} onClick={() => setView("day")}><Icon name="list" size={16} />Day</button>
        </div>
      } />
  );
  if (!fills && people.length === 0) {
    return <div className="content">{header}<EmptyState icon="users" title="Nobody to show yet">Invite people on Manage; their daily logs show up here.</EmptyState></div>;
  }

  const dayHead = (d: string) => (
    <span className="ts-dayhead">
      <span className="ts-date">{fmt(d, { day: "numeric", month: "short" }).toUpperCase()}</span>
      <span className="ts-dow">{fmt(d, { weekday: "short" }).toUpperCase()}</span>
      {missing(d) && <span className="ts-flag" title="No hours yet">Missing</span>}
    </span>
  );
  const hoursInput = (r: Row, d: string, label: string) => {
    const c = r.cells[d] ?? { hours: "", note: "" };
    const invalid = toMinutes(c.hours) === null;
    return (
      <input className={"ts-hours" + (invalid ? " invalid" : "")} inputMode="decimal" placeholder="0:00" value={c.hours} aria-label={`Hours, ${label}`} aria-invalid={invalid || undefined}
        disabled={readOnly || d > maxDay} onChange={(e) => setCell(r.key, d, { hours: e.target.value })}
        onBlur={(e) => { const m = toMinutes(e.target.value); if (m !== null) setCell(r.key, d, { hours: m ? hm(m) : "" }); }} />
    );
  };
  const noteInput = (r: Row, d: string, label: string, big = false) => {
    const c = r.cells[d] ?? { hours: "", note: "" };
    return big
      ? <textarea className="ts-note big" rows={2} maxLength={500} placeholder="What you did" value={c.note} aria-label={`Note, ${label}`} disabled={readOnly || d > maxDay} onChange={(e) => setCell(r.key, d, { note: e.target.value })} />
      : <input className="ts-note" maxLength={500} placeholder="Note" value={c.note} title={c.note || undefined} aria-label={`Note, ${label}`} disabled={readOnly || d > maxDay} onChange={(e) => setCell(r.key, d, { note: e.target.value })} />;
  };
  const taskName = (r: Row) => (
    <div className="ts-task">
      <input id={`task-${r.key}`} className="ts-title" maxLength={120} placeholder="Task name, e.g. Day 5 theory" value={r.title} aria-label="Task name" disabled={readOnly}
        onChange={(e) => edit(r.key, (x) => ({ ...x, title: e.target.value }))} />
      {!readOnly && <button type="button" className="iconbtn sm" aria-label={`Remove ${r.title || "task"}`} onClick={() => void removeTask(r)}><Icon name="trash" size={15} /></button>}
    </div>
  );

  return (
    <div className="content wide-page">
      {header}
      <section className="card ts-card" aria-label="Daily log">
        <div className="ts-toolbar">
          <div className="ts-nav">
            {view === "week" ? (
              <>
                <button type="button" className="iconbtn bordered" aria-label="Previous week" onClick={() => void goWeek(addDays(week, -7))}><Icon name="left" size={16} /></button>
                <span className="ts-range">{range(week)}</span>
                <button type="button" className="iconbtn bordered" aria-label="Next week" disabled={addDays(week, 7) > maxDay} onClick={() => void goWeek(addDays(week, 7))}><Icon name="right" size={16} /></button>
              </>
            ) : (
              <>
                <button type="button" className="iconbtn bordered" aria-label="Previous day" onClick={() => void goDay(addDays(day, -1))}><Icon name="left" size={16} /></button>
                <span className="ts-range">{fmt(day, { weekday: "long", day: "numeric", month: "short", year: "numeric" })}</span>
                <button type="button" className="iconbtn bordered" aria-label="Next day" disabled={addDays(day, 1) > maxDay} onClick={() => void goDay(addDays(day, 1))}><Icon name="right" size={16} /></button>
              </>
            )}
            <label className="ts-pick" title="Pick a date">
              <span className="sr">Pick a date</span><Icon name="calendar" size={18} />
              <input type="date" min="2020-01-06" max={maxDay} value={view === "week" ? week : day} onChange={(e) => e.target.value && void (view === "week" ? goWeek(mondayOf(e.target.value)) : goDay(e.target.value))} />
            </label>
            {mondayOf(today) !== week && <button type="button" className="btn ghost sm" onClick={() => void goWeek(mondayOf(today))}>Today</button>}
          </div>
          <div className="ts-tools">
            {manager && (
              <label className="ts-person">
                <span className="sr">Whose daily log</span>
                <select value={viewing} onChange={async (e) => { if (await leaveOk()) setPerson(e.target.value); }}>
                  {fills && <option value="">My daily log</option>}
                  {people.map((p) => <option key={p.user_id} value={p.user_id}>{p.name}</option>)}
                </select>
              </label>
            )}
            {!readOnly && <button type="button" className="btn secondary" onClick={() => void copyLastWeek()} disabled={!rows}><Icon name="copy" size={16} />Copy last week</button>}
          </div>
        </div>

        <div className="ts-totals">
          <div className="ts-total-main">
            <span className="meta">Total</span>
            <b>{hm(weekTotal)} / {hm(target)}</b>
            <div className="progress" role="progressbar" aria-label="Hours logged this week" aria-valuenow={weekTotal} aria-valuemin={0} aria-valuemax={target || 1}>
              <span style={{ width: `${target ? Math.min(100, Math.round((weekTotal / target) * 100)) : 0}%` }} />
            </div>
          </div>
          <div className="ts-total-stat"><span className="meta">Days filled</span><b>{workdays.filter((d) => d <= today && filledDay(d)).length} / {workdays.filter((d) => d <= today).length}</b></div>
          <div className="ts-total-stat"><span className="meta">Tasks</span><b>{rows?.filter((r) => r.title.trim()).length ?? 0}</b></div>
          <div className="ts-total-stat"><span className="meta">Week</span>{submittedAt && !dirty ? <Chip tone="ok">Submitted</Chip> : missingCount ? <Chip tone="warn">{missingCount} {missingCount === 1 ? "day" : "days"} missing</Chip> : <Chip tone="none">Draft</Chip>}</div>
        </div>

        {loadErr ? <ErrorState title="Could not load the daily log" message={loadErr} onRetry={() => void load()} />
          : !rows ? <div className="ts-loading" role="status">Loading the daily log</div>
          : view === "week" ? (
          <div className="ts-scroll" role="region" aria-label={`Week of ${range(week)}`} tabIndex={0}>
            <table className="ts-grid">
              <thead>
                <tr>
                  <th scope="col" className="ts-col-task">Tasks</th>
                  {days.map((d) => <th key={d} scope="col" className={"ts-col-day" + (weekend(d) ? " weekend" : "") + (d === today ? " today" : "")}>{dayHead(d)}</th>)}
                  <th scope="col" className="ts-col-total">Total<br />hrs/week</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <th scope="row" className="ts-col-task">{taskName(r)}</th>
                    {days.map((d) => {
                      const label = `${r.title || "task"}, ${fmt(d, { weekday: "long", day: "numeric", month: "short" })}`;
                      return <td key={d} className={(weekend(d) ? "weekend" : "") + (d === today ? " today" : "")}>{hoursInput(r, d, label)}{noteInput(r, d, label)}</td>;
                    })}
                    <td className="ts-col-total"><b>{hm(rowTotal(r))}</b></td>
                  </tr>
                ))}
                {!readOnly && (
                  <tr className="ts-add-row"><td colSpan={9}><button type="button" className="btn ghost sm" onClick={addTask}><Icon name="plus" size={16} />Add task</button>{rows.length === 0 && <span className="meta"> Add what you work on: a topic, a practical task or a project.</span>}</td></tr>
                )}
                {readOnly && rows.length === 0 && <tr><td colSpan={9} className="meta ts-none">No tasks logged this week.</td></tr>}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" className="ts-col-task ts-foot-label">Total hours/day</th>
                  {days.map((d) => <td key={d} className={missing(d) ? "missing" : ""}><b>{hm(dayTotal(d))}</b></td>)}
                  <td className="ts-col-total"><b>{hm(weekTotal)}</b></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="ts-day-view">
            <div className="ts-day-strip" role="group" aria-label="Days of this week">
              {days.map((d) => (
                <button key={d} type="button" className={"ts-day-chip" + (missing(d) ? " missing" : filledDay(d) ? " filled" : "")} aria-pressed={d === day} disabled={d > maxDay} onClick={() => void goDay(d)}>
                  <span className="ts-dow">{fmt(d, { weekday: "short" })}</span><span className="ts-date">{fmt(d, { day: "numeric" })}</span><span className="ts-chip-h">{hm(dayTotal(d))}</span>
                </button>
              ))}
            </div>
            {rows.length === 0 && readOnly && <p className="meta ts-none">No tasks logged this week.</p>}
            <ul className="ts-day-list">
              {rows.map((r) => {
                const label = `${r.title || "task"}, ${fmt(day, { weekday: "long", day: "numeric", month: "short" })}`;
                return (
                  <li key={r.key} className="ts-day-item">
                    {taskName(r)}
                    <div className="ts-day-fields">{hoursInput(r, day, label)}{noteInput(r, day, label, true)}</div>
                  </li>
                );
              })}
            </ul>
            {!readOnly && <button type="button" className="btn ghost sm" onClick={addTask}><Icon name="plus" size={16} />Add task</button>}
            <p className="ts-day-total">Total for {fmt(day, { weekday: "long" })}: <b>{hm(dayTotal(day))}</b></p>
          </div>
        )}

        {!readOnly && rows && (
          <div className="ts-foot">
            {dirty ? <span className="meta unsaved"><span className="dot" aria-hidden="true" />Unsaved changes</span> : <span className="meta">{submittedAt ? "Submitted. Changing the week makes it a draft again." : "Tip: type hours as 2, 2.5 or 2:30."}</span>}
            <span className="grow" />
            <button type="button" className="btn secondary" disabled={!!busy || !dirty} onClick={() => void save(false)}>{busy === "save" ? "Saving" : "Save"}</button>
            <button type="button" className="btn" disabled={!!busy} onClick={() => void save(true)}><Icon name="send" size={16} />{busy === "submit" ? "Submitting" : "Submit week"}</button>
          </div>
        )}
      </section>
    </div>
  );
}
