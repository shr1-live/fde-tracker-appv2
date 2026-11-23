import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { useMe } from "../../lib/useRole";

/**
 * The in-app guide: a few numbered tips on each page that point at the part of the screen they talk about.
 * The steps depend on the page and on the role you are viewing as. "Guide" in the top bar turns it on or off;
 * each page's tips show once (Restart from the switch shows them again). Steps whose target is not on screen are skipped.
 */
type Step = { target?: string; title: string; body: string };
type Who = { admin: boolean; manager: boolean; member: boolean };

const ON_KEY = "fde:guide";
const DONE_KEY = "fde:guide-done";
const EVENT = "fde:guide";

export const guideOn = () => { try { return localStorage.getItem(ON_KEY) !== "off"; } catch { return true; } };
function setGuideOn(on: boolean) { try { localStorage.setItem(ON_KEY, on ? "on" : "off"); } catch { /* ignore */ } window.dispatchEvent(new Event(EVENT)); }
const doneSet = (): Set<string> => { try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) ?? "[]") as string[]); } catch { return new Set(); } };
function markDone(id: string) { const s = doneSet(); s.add(id); try { localStorage.setItem(DONE_KEY, JSON.stringify([...s])); } catch { /* ignore */ } }
function resetDone() { try { localStorage.removeItem(DONE_KEY); } catch { /* ignore */ } window.dispatchEvent(new Event(EVENT)); }

function pageOf(path: string): string {
  if (path === "/") return "home";
  if (path === "/programs") return "programs";
  if (path.startsWith("/post/")) return "post";
  const m = matchPath("/p/:pid/*", path);
  if (!m) return "other";
  return ({ "": "plan", feed: "feed", daily: "daily", status: "status", reports: "reports", manage: "manage" } as Record<string, string>)[(m.params["*"] ?? "").split("/")[0]] ?? "other";
}

function stepsFor(page: string, w: Who): Step[] {
  const s: (Step | false)[] = (() => {
    switch (page) {
      case "home": return [
        { target: ".pg-hero", title: "Start here: choose a program", body: "Everything lives inside a program: its feed, plan, daily status and reports. Pick the one you want to work in." },
        { target: ".pcard .btn", title: "Open a program", body: "Opens the program's feed. The side panel then shows that program's pages; switch programs any time from the top of the side panel." },
        w.manager && { target: ".topsw", title: "View as", body: w.admin ? "See the app exactly as a coordinator or a member sees it. You can only step down from your own role; your real rights never change." : "See the app as a member sees it. Switch back to Coordinator any time." },
        { target: ".topsw + .topsw, .topsw:only-of-type", title: "Classic or 55", body: "Switch between this app's look and the FiftyFive design system." },
        { target: ".bell", title: "Reminders", body: "If you miss a day's status in a program, a reminder for that program arrives here at 10:00 the next working day." },
      ];
      case "feed": return [
        { target: ".composer-main", title: "Share with your program", body: "Post a video, an article or something you built. Only people in this program see it." },
        { target: ".feed-tools", title: "Find posts", body: "Search, sort by newest, most liked or most discussed, or show only videos, links or your own posts." },
        { title: "Like and comment", body: "Double-tap a post to like it. Open a post to see every comment." },
      ];
      case "plan": return [
        w.member && { target: ".progress-card", title: "Your progress", body: "How many days of the plan you have completed. Tick a day when you finish it." },
        { target: "details.week", title: "Weeks fold away", body: "Only the week you are on starts open. Click a week to open or close it." },
        w.manager && { target: ".page-actions, .page-head .btn", title: "Edit the plan", body: "Add days, change topics, practical tasks and resources. Members see the changes at once." },
      ];
      case "daily": return w.member || w.manager ? [
        { target: ".ts-nav", title: "Your week", body: "Move between weeks, or pick a date. Missing working days are flagged in orange." },
        { target: ".ts-add-row .btn, .ts-day-view > .btn", title: "Add your tasks", body: "One row per thing you work on: a topic, a practical task or a project." },
        { target: ".ts-grid tbody td, .ts-day-fields", title: "Hours and a note", body: "Type hours as 2, 2.5 or 2:30 and add a short note on what you did. Totals add up per day and per week." },
        { target: ".ts-views", title: "Week or day", body: "Week shows the whole sheet; Day is quicker for filling in just today." },
        w.manager && { target: ".ts-person", title: "See someone's daily log", body: "Open any member's daily log, read-only. When someone submits a week, you get a notification." },
        { target: ".ts-foot", title: "Save and submit", body: "Save as you go. Submit the week when it is complete: your coordinator gets a notification. Changing it later makes it a draft again." },
      ] : [];
      case "status": return [{ title: "Program status", body: "Per day of the plan: what you covered, your rating and whether it is completed." }];
      case "reports": return [
        { target: ".seg", title: "Two reports", body: "Daily status and program status for everyone in the program." },
        { target: ".toolbar", title: "Pick and download", body: "Choose a person or a date range, then download Excel in the same layout as the sheets." },
      ];
      case "manage": return [
        { target: ".card", title: "Program details", body: "Name, start date and description everyone sees. Day 1 of reports counts from the start date." },
        { target: ".invite", title: "Invite people", body: "Add members or coordinators by office email. People who already signed in are added at once." },
      ];
      case "programs": return [
        { target: ".stats", title: "All programs at a glance", body: "How many programs, how many people, and the next start date." },
        { target: ".pg-table-wrap", title: "Every program", body: "Open its reports, or Manage to invite its coordinator." },
        { target: ".panel-accent", title: "Create a program", body: "Name it, optionally add a description and start date, then invite a coordinator from Manage." },
      ];
      default: return [];
    }
  })();
  return s.filter((x): x is Step => !!x);
}

/** The "Guide" switch in the top bar (with a way to see every tip again). */
export function GuideSwitch() {
  const [on, setOn] = useState(guideOn());
  useEffect(() => { const f = () => setOn(guideOn()); window.addEventListener(EVENT, f); return () => window.removeEventListener(EVENT, f); }, []);
  return (
    <div className="guide-sw">
      <button type="button" role="switch" aria-checked={on} className="switch" onClick={() => { if (!on) resetDone(); setGuideOn(!on); }}>
        <span className="switch-track" aria-hidden="true"><span className="switch-thumb" /></span>
        <span className="switch-label">Guide</span>
      </button>
    </div>
  );
}

/** The tips themselves: shown over the page, next to what they point at. */
export function GuideTips() {
  const loc = useLocation();
  const { me } = useMe();
  const [on, setOn] = useState(guideOn());
  const [tick, setTick] = useState(0);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const f = () => { setOn(guideOn()); setTick((t) => t + 1); }; window.addEventListener(EVENT, f); return () => window.removeEventListener(EVENT, f); }, []);

  const page = pageOf(loc.pathname);
  const pid = matchPath("/p/:pid/*", loc.pathname)?.params.pid;
  const progRole = me?.programs?.find((p) => p.id === pid)?.role;
  const who: Who = useMemo(() => {
    const admin = me?.role === "admin";
    const anyCoord = !!me?.programs?.some((p) => p.role === "coordinator");
    return { admin, manager: admin || (pid ? progRole === "coordinator" : anyCoord), member: pid ? progRole === "member" || progRole === "coordinator" : !admin };
  }, [me, pid, progRole]);
  const id = `${page}:${who.admin ? "a" : who.manager ? "c" : "m"}`;
  const [steps, setSteps] = useState<Step[]>([]);

  // Wait for the page to render, then keep only the steps whose target is on screen.
  useEffect(() => {
    setSteps([]); setI(0);
    if (!on || !me || doneSet().has(id)) return;
    const t = window.setTimeout(() => setSteps(stepsFor(page, who).filter((s) => !s.target || document.querySelector(s.target))), 900);
    return () => window.clearTimeout(t);
  }, [on, me, id, page, who, tick]);

  const step = steps[i];
  const target = step?.target ? document.querySelector<HTMLElement>(step.target) : null;
  const measure = useCallback(() => setRect(target ? target.getBoundingClientRect() : null), [target]);
  useLayoutEffect(() => {
    if (!step) return;
    target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    target?.classList.add("guide-target");
    const t = window.setTimeout(measure, 250);
    window.addEventListener("resize", measure); window.addEventListener("scroll", measure, true);
    return () => { window.clearTimeout(t); target?.classList.remove("guide-target"); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [step, target, measure]);
  useEffect(() => { if (step) box.current?.querySelector<HTMLButtonElement>(".guide-next")?.focus({ preventScroll: true }); }, [step]);

  if (!step) return null;
  const finish = () => { markDone(id); setSteps([]); };
  const off = () => { finish(); setGuideOn(false); };
  const last = i === steps.length - 1;
  // Below the target when there is room, otherwise above; on phones the card sits at the bottom of the screen.
  const phone = window.innerWidth < 640;
  const style: React.CSSProperties = {};
  if (!phone && rect) {
    const w = 340, below = rect.bottom + 12, fits = below + 200 < window.innerHeight;
    style.left = Math.min(Math.max(12, rect.left), window.innerWidth - w - 12);
    if (fits) style.top = below; else style.bottom = window.innerHeight - rect.top + 12;
  }
  return (
    <div ref={box} className={"guide-card" + (phone || !rect ? " docked" : "")} style={style} role="dialog" aria-modal="false" aria-labelledby="guide-t"
      onKeyDown={(e) => { if (e.key === "Escape") finish(); }}>
      <p className="guide-count">{i + 1} of {steps.length}</p>
      <h2 id="guide-t" className="guide-title">{step.title}</h2>
      <p className="guide-body">{step.body}</p>
      <div className="guide-actions">
        <button type="button" className="btn ghost sm" onClick={off}>Turn guide off</button>
        <span className="grow" />
        {i > 0 && <button type="button" className="btn secondary sm" onClick={() => setI(i - 1)}>Back</button>}
        <button type="button" className="btn sm guide-next" onClick={() => (last ? finish() : setI(i + 1))}>{last ? "Done" : "Next"}</button>
      </div>
      <div className="guide-dots" aria-hidden="true">{steps.map((_, k) => <span key={k} className={k === i ? "on" : ""} />)}</div>
    </div>
  );
}
