import { useEffect, useRef, useState } from "react";
import { errText } from "../lib/useProgram";
import { refreshMe } from "../lib/useRole";
import { demo, type DemoStatus } from "../lib/v3";
import { Icon } from "./Icon";
import { useConfirm } from "./Confirm";
import { useToast } from "./Toast";

/**
 * Admin only: load sample data for demos, or remove it. The two training sheets can be uploaded to fill the demo FDE
 * program with real names, plan and status. Demo programs are marked "(Demo)"; demo people cannot sign in or get email.
 */
export function DemoPanel({ onChange }: { onChange: () => void }) {
  const [st, setSt] = useState<DemoStatus | null>(null);
  const [busy, setBusy] = useState<"" | "load" | "remove">("");
  const report = useRef<HTMLInputElement>(null);
  const daily = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const confirm = useConfirm();
  useEffect(() => { demo.status().then(setSt).catch(() => setSt(null)); }, []);
  const done = (s: DemoStatus, msg: string) => { setSt(s); toast.success(msg); refreshMe(); onChange(); };
  const load = async () => {
    setBusy("load");
    try {
      const s = await demo.load(report.current?.files?.[0], daily.current?.files?.[0]);
      done(s, `Demo data loaded: ${s.programs} programs, ${s.people} people. Open a "(Demo)" program to show it.`);
    } catch (e) { toast.error(errText(e)); } finally { setBusy(""); }
  };
  const remove = async () => {
    if (!(await confirm({ title: "Remove all demo data?", body: "The (Demo) programs and the demo people go, with their posts and status. Real programs and people are not touched.", confirm: "Remove demo data", danger: true }))) return;
    setBusy("remove");
    try { done(await demo.remove(), "Demo data removed."); } catch (e) { toast.error(errText(e)); } finally { setBusy(""); }
  };
  return (
    <section className="panel-accent demo-panel" aria-labelledby="demo-h">
      <h2 id="demo-h" className="pg-h2">Demo data</h2>
      <p className="meta">Fill the app with realistic sample programs, people, daily logs, feed posts and reminders to show it. It is kept apart from real data: programs are marked (Demo), demo people cannot sign in or get email.</p>
      {st?.loaded ? (
        <>
          <p className="demo-state"><Icon name="check" size={16} />Loaded: {st.programs} programs, {st.people} people.</p>
          <button type="button" className="btn danger" disabled={!!busy} onClick={() => void remove()}><Icon name="trash" size={16} />{busy === "remove" ? "Removing" : "Remove demo data"}</button>
          <p className="meta">To refresh it from updated sheets, remove it, then load it again with the new files.</p>
        </>
      ) : (
        <>
          <div className="field"><label htmlFor="demo-report">Program status sheet <span className="hint">optional .xlsx</span></label><input id="demo-report" ref={report} type="file" accept=".xlsx" /></div>
          <div className="field"><label htmlFor="demo-daily">30-day status sheet <span className="hint">optional .xlsx</span></label><input id="demo-daily" ref={daily} type="file" accept=".xlsx" /></div>
          <button type="button" className="btn secondary" disabled={!!busy} onClick={() => void load()}><Icon name="spark" size={16} />{busy === "load" ? "Loading" : "Load demo data"}</button>
          <p className="meta">With the sheets, the demo FDE program gets everyone's real names, plan, day status and daily status from them.</p>
        </>
      )}
    </section>
  );
}
