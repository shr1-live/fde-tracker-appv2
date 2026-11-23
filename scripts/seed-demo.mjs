// LOCAL DEMO DATA ONLY. Fills a LOCAL API (http://localhost) with sample data for every scenario.
//
// Sign-ins: shivanshu1 = admin, shivanshu2 = coordinator, shivanshu3 = member (+ everyone from the sheets).
// With SEED_JSON (made by scripts/xlsx-to-seed.py from the training sheets) the FDE plan, each person's day status and
// their daily status come from the real sheets; without it a small made-up set is used.
//
// Scenarios: three programs (running, just started, starting next month); a coordinator who is a member elsewhere;
// a member in two programs who filled DevOps but not FDE yesterday (gets the FDE reminder only); people with gaps;
// late starters; a pending invite; old-form daily status next to timesheets; per-program feed with likes and comments.
//
// Never part of a deployment: nothing in the build, CI or Render runs it, and it refuses any API that is not localhost.
// The local API must run with ADMIN_EMAIL=shivanshu1@fiftyfivetech.io and its dev secret passed here:
//
//   DEV_JWT_SECRET=<local SUPABASE_JWT_SECRET> SEED_JSON=scripts/.seed-data.json node scripts/seed-demo.mjs
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

const API = process.env.API ?? "http://localhost:5080";
const WEB = process.env.WEB ?? "http://localhost:5189";
const SECRET = process.env.DEV_JWT_SECRET;
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(API)) throw new Error("Refusing: demo data goes to a local API only.");
if (!SECRET) throw new Error("Set DEV_JWT_SECRET to the local API's SUPABASE_JWT_SECRET.");
const SHEET = process.env.SEED_JSON ? JSON.parse(readFileSync(process.env.SEED_JSON, "utf8")) : null;

// ---- people
const D = "fiftyfivetech.io";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const P = {};
let n = 0;
function person(key, name, email) {
  const id = `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
  const h = b64({ alg: "HS256", typ: "JWT" });
  const p = b64({ sub: id, email, aud: "authenticated", iss: "https://test.supabase.co/auth/v1", email_verified: true, exp: Math.floor(Date.now() / 1000) + 24 * 3600 });
  P[key] = { name, email, tok: `${h}.${p}.${crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url")}` };
}
person("s1", "Shivanshu 1 (Admin)", `shivanshu1@${D}`);
person("s2", "Shivanshu 2 (Coordinator)", `shivanshu2@${D}`);
person("s3", "Shivanshu 3 (Member)", `shivanshu3@${D}`);
const sheetPeople = SHEET ? Object.keys(SHEET.people).filter((x) => x.toLowerCase() !== "shivanshu") : ["Asha Verma", "Karan Singh", "Neha Gupta", "Hemant Jain", "Ayush Jain"];
const keyOf = (name) => name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
for (const name of sheetPeople) person(keyOf(name), name, `${keyOf(name)}@${D}`);
const has = (k) => !!P[k];

async function call(who, method, path, body) {
  const r = await fetch(API + path, { method, headers: { authorization: `Bearer ${P[who].tok}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) { console.warn(`  ${who} ${method} ${path} -> ${r.status} ${t.slice(0, 160)}`); return null; }
  return t ? JSON.parse(t) : null;
}

// ---- dates: Day 1 of FDE is this week's Monday (as in the sheet); "Day N" counts working days
const iso = (d) => d.toISOString().slice(0, 10);
const add = (s, k) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + k); return iso(d); };
const today = iso(new Date());
const monday = add(today, -((new Date(today + "T00:00:00Z").getUTCDay() + 6) % 7));
const workday = (start, nth) => { let d = start, c = 1; while (c < nth) { d = add(d, 1); const g = new Date(d + "T00:00:00Z").getUTCDay(); if (g && g !== 6) c++; } return d; };
const yesterday = (() => { let d = add(today, -1); while ([0, 6].includes(new Date(d + "T00:00:00Z").getUTCDay())) d = add(d, -1); return d; })();
const weekOf = (d) => add(d, -((new Date(d + "T00:00:00Z").getUTCDay() + 6) % 7));

console.log(`1. ${Object.keys(P).length} people sign in; programs`);
for (const k of Object.keys(P)) await call(k, "GET", "/api/me");
let all = (await call("s1", "GET", "/api/programs")) ?? [];
const ensure = async (name, description, starts_on) => all.find((p) => p.name === name) ?? await call("s1", "POST", "/api/programs", { name, description, starts_on });
const fde = await ensure("FDE Training Program", "Forward Deployed Engineer training: LLM applications from fundamentals to a delivered assistant.", monday);
await call("s1", "PATCH", `/api/programs/${fde.id}`, { starts_on: monday });
const devops = await ensure("DevOps Training Program", "CI/CD, containers, Kubernetes and cloud basics for the platform team.", add(monday, 2));
const data = await ensure("Data Engineering Bootcamp", "Pipelines, warehousing and dbt. Starts next month.", add(monday, 21));

const inv = (pid, k, role) => call("s1", "POST", `/api/programs/${pid}/invites`, { email: P[k].email, role });
const devLead = has("hemant.jain") ? "hemant.jain" : sheetPeople.map(keyOf).at(-1);
const devMember = has("ayush.jain") ? "ayush.jain" : sheetPeople.map(keyOf).at(-2);
await inv(fde.id, "s2", "coordinator");
await inv(fde.id, "s3", "member");
for (const name of sheetPeople) await inv(fde.id, keyOf(name), "member");
await inv(devops.id, devLead, "coordinator");          // a member in FDE who coordinates DevOps
for (const k of ["s2", "s3", devMember]) await inv(devops.id, k, "member"); // s2 coordinates FDE and is a member of DevOps
await inv(data.id, "s2", "coordinator");
await call("s1", "POST", `/api/programs/${data.id}/invites`, { email: `new.joiner@${D}`, role: "member" }); // never signed in: pending invite

for (const [k, p] of Object.entries(P)) await call(k, "PATCH", "/api/me", { display_name: p.name }); // after the invites: approved now

console.log("2. Plans");
const DEFAULT_PLAN = [["LLM Fundamentals & Model Selection", "Tokens, context windows, sampling, cost and latency.", "Build a minimal LLM-backed endpoint."], ["Advanced Prompt Engineering", "Zero-, one- and few-shot prompting, role prompting.", "Build a recruitment candidate-analysis assistant."], ["Structured Outputs & Tool Calling", "JSON schemas, function calling, validation.", "Build an AI task-management assistant."], ["LLM Evaluation, Reliability & Guardrails", "Quality criteria, eval sets, guardrails.", "Create a 30-case evaluation set."], ["End-to-End LLM Application", "Architecture of an LLM-powered app.", "Deliver an AI-powered recruitment assistant."]].map(([topic, cover, task], i) => ({ week: 1, topic, cover, task }));
const FDE_PLAN = SHEET?.plan?.length ? SHEET.plan : DEFAULT_PLAN;
const DEVOPS_PLAN = [["Linux & Shell Essentials", "Processes, permissions, systemd, bash.", "Script a log-rotation job."], ["Git Workflows", "Branching, PRs, protected branches.", "Branch protection and a PR template."], ["CI with GitHub Actions", "Workflows, caching, secrets.", "CI pipeline with tests and lint."], ["Docker Deep Dive", "Images, layers, multi-stage builds.", "Slim a 1 GB image below 200 MB."], ["Kubernetes Basics", "Pods, deployments, services.", "Deploy the app to kind."]].map(([topic, cover, task]) => ({ week: 1, topic, cover, task }));
async function plan(pid, items) {
  const prog = await call("s1", "GET", `/api/programs/${pid}`);
  const perWeek = {};
  for (let i = prog.days.length; i < items.length; i++) {
    const it = items[i];
    perWeek[it.week] = (perWeek[it.week] ?? items.slice(0, i).filter((x) => x.week === it.week).length) + 1;
    await call("s1", "POST", `/api/programs/${pid}/days`, { week: it.week, day: perWeek[it.week], topic: it.topic.slice(0, 120), topics_to_cover: it.cover.slice(0, 4000), practical_task: it.task.slice(0, 4000) || null, resources: null });
  }
  return call("s1", "GET", `/api/programs/${pid}`);
}
const fdeP = await plan(fde.id, FDE_PLAN);
const devP = await plan(devops.id, DEVOPS_PLAN);
await plan(data.id, [{ week: 1, topic: "Data Modelling", cover: "Star schemas, slowly changing dimensions.", task: "Model the sales domain." }]);

console.log("3. Day status (What you learn, Proof, Rate)");
const days = [...fdeP.days].sort((a, b) => a.week - b.week || a.day - b.day);
const proofOf = (s) => (/^https:\/\//.test(s) ? s : s ? `${s}` : "");
async function dayStatus(k, rows) {
  for (let i = 0; i < rows.length && i < days.length; i++) {
    const r = rows[i];
    if (!r.learned && !r.proof) continue;
    const rate = Number.parseInt(r.rate, 10);
    await call(k, "PUT", `/api/programs/${fde.id}/day-status/${days[i].id}`, {
      completed: !!r.learned && rate >= 1 && rate <= 5, // the form needs a rating to complete a day; without one it stays in progress
      values: { learned: (r.learned || "In progress").slice(0, 4000), ...(r.proof ? { proof: proofOf(r.proof).slice(0, 4000) } : {}), ...(rate >= 1 && rate <= 5 ? { rating: rate } : {}) },
    });
  }
}
if (SHEET) {
  for (const [name, d] of Object.entries(SHEET.people)) await dayStatus(name.toLowerCase() === "shivanshu" ? "s3" : keyOf(name), d.days ?? []);
} else {
  await dayStatus("s3", [{ learned: "Built an API endpoint that sends a prompt to a model.", proof: "https://github.com/fiftyfive-demo/day1", rate: "4" }, { learned: "Compared prompt versions.", rate: "4" }]);
}
const devDays = [...devP.days].sort((a, b) => a.day - b.day);
for (const k of ["s3", devMember]) await call(k, "PUT", `/api/programs/${devops.id}/day-status/${devDays[0].id}`, { completed: true, values: { learned: "Processes, permissions and a log-rotation script.", rating: 4 } });

console.log("4. Daily status (from the 30-day sheet) as timesheets + the old form");
// "Project Worked: Vector7 - 2 hours\nTraining Theory: Day 1 topics...\nPractical: ..." -> three timesheet rows and the old form's fields.
function parse(textIn) {
  const out = { project: "", theory: "", practical: "" };
  let cur = "project";
  for (const line of textIn.split(/\n+/)) {
    const m = /^\s*(project(?:\s*worked)?|training\s*theory|theory|practical)\s*:?\s*(.*)$/i.exec(line);
    if (m) { cur = /project/i.test(m[1]) ? "project" : /theory/i.test(m[1]) ? "theory" : "practical"; out[cur] = m[2].trim(); }
    else out[cur] = `${out[cur]} ${line.trim()}`.trim();
  }
  return out;
}
const hoursIn = (s) => { const m = /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i.exec(s); return m ? Number(m[1]) : 0; };
const minutes = (h) => Math.round(Math.min(h, 10) * 60);
const weeks = new Map(); // key|pid|week -> tasks
function addCell(k, pid, date, title, mins, note) {
  if (date > today) return;
  const key = `${k}|${pid}|${weekOf(date)}`;
  const tasks = weeks.get(key) ?? [];
  let t = tasks.find((x) => x.title === title);
  if (!t) { t = { title, cells: [] }; tasks.push(t); }
  t.cells.push({ date, minutes: mins, note: note ? note.slice(0, 500) : null });
  weeks.set(key, tasks);
}
async function daily(k, entries, skip = []) {
  for (const [nth, txt] of Object.entries(entries)) {
    const date = workday(monday, Number(nth));
    if (date > today || skip.includes(date)) continue;
    const v = parse(txt);
    const projH = hoursIn(v.project);
    const project = v.project && !/^(none|not\b|leave|half-day leave)/i.test(v.project) ? v.project : "";
    if (project) addCell(k, fde.id, date, "Project work", minutes(projH || 2), project);
    if (v.theory) addCell(k, fde.id, date, "Training theory", minutes(hoursIn(v.theory) || 3), v.theory);
    if (v.practical) addCell(k, fde.id, date, "Practical task", minutes(hoursIn(v.practical) || 2), v.practical);
    // The same day in the old daily form, so Reports shows it too.
    await call(k, "PUT", `/api/programs/${fde.id}/daily/${date}`, { values: { project: (v.project || "None").slice(0, 500), theory: (v.theory || "Not given").slice(0, 4000), practical: (v.practical || "Not given").slice(0, 4000) } });
  }
}
if (SHEET) {
  for (const [name, d] of Object.entries(SHEET.people)) {
    const k = name.toLowerCase() === "shivanshu" ? "s3" : keyOf(name);
    await daily(k, d.daily ?? {}, k === "s3" ? [yesterday] : []); // shivanshu3 skips FDE yesterday: the reminder scenario
  }
} else {
  for (const k of sheetPeople.map(keyOf)) await daily(k, { 1: "Project Worked: Acme - 2 hours\nTraining Theory: Day 1 topics, 3 h\nPractical: Endpoint built", 2: "Project Worked: None\nTraining Theory: Day 2 topics\nPractical: In progress" });
  await daily("s3", { 1: "Project Worked: None\nTraining Theory: Day 1 topics\nPractical: Endpoint built" }, [yesterday]);
}
// DevOps started on Wednesday: shivanshu3 and the DevOps member filled every day; shivanshu2 missed yesterday.
for (let d = add(monday, 2); d <= today; d = add(d, 1)) {
  if ([0, 6].includes(new Date(d + "T00:00:00Z").getUTCDay())) continue;
  for (const k of ["s3", devMember]) addCell(k, devops.id, d, "DevOps labs", 120, "Linux and Git exercises");
  if (d !== yesterday) addCell("s2", devops.id, d, "DevOps labs", 90, "Shell scripting");
}
for (const [key, tasks] of weeks) {
  const [k, pid, week] = key.split("|");
  await call(k, "PUT", `/api/programs/${pid}/timesheet/${week}`, { tasks, submit: false });
}

console.log("5. Feed per program");
const post = (k, pid, body, url) => call(k, "POST", "/api/feed", { body, url, program_id: pid });
const links = SHEET ? Object.entries(SHEET.people).flatMap(([name, d]) => (d.days ?? []).map((x) => /https:\/\/github\.com\/\S+/.exec(x.proof)?.[0]).filter(Boolean).map((u) => [name, u])).slice(0, 4) : [];
const fdePosts = [await post("s2", fde.id, "Welcome to the FDE program! Fill in your daily status every evening; reminders go out at 10:00 for missed days.")];
for (const [name, url] of links) fdePosts.push(await post(name.toLowerCase() === "shivanshu" ? "s3" : keyOf(name), fde.id, "My practical for this week, notes and code here.", url.slice(0, 500)));
fdePosts.push(await post("s3", fde.id, "Good talk on building effective agents; it made tool calling click for me.", "https://www.youtube.com/watch?v=D7_ipDqhtwk"));
const devPosts = [await post(devLead, devops.id, "DevOps kicks off this week. Start with the Linux module.", "https://linuxjourney.com/"), await post(devMember, devops.id, "Got our image from 1.1 GB to 180 MB with a multi-stage build.", "https://docs.docker.com/build/building/multi-stage/")];
const others = Object.keys(P).filter((k) => k !== "s1");
for (const [i, p] of fdePosts.entries()) if (p) for (const k of others.slice(i, i + 4 + i)) await call(k, "POST", `/api/feed/${p.id}/like`);
if (fdePosts[1]) { await call("s2", "POST", `/api/feed/${fdePosts[1].id}/comments`, { body: "Nice work. Can you demo this on Friday?" }); }
if (fdePosts[0]) await call("s3", "POST", `/api/feed/${fdePosts[0].id}/comments`, { body: "Thanks! Is the plan for week 2 final?" });
if (devPosts[1]) { await call(devLead, "POST", `/api/feed/${devPosts[1].id}/like`); await call("s3", "POST", `/api/feed/${devPosts[1].id}/comments`, { body: "Adding this to my notes." }); }

console.log("6. Reminders (the catch-up runs when each person opens the app)");
for (const k of Object.keys(P)) await call(k, "GET", "/api/notifications");

const shown = ["s1", "s2", "s3", devLead, devMember, ...sheetPeople.map(keyOf).filter((k) => ![devLead, devMember].includes(k)).slice(0, 5)];
console.log(`\nDone: ${Object.keys(P).length} people, programs FDE / DevOps / Data Engineering.`);
console.log(`Sign in (dev build only): ${WEB}/#personas=${encodeURIComponent(shown.map((k) => `${P[k].name.replace(/[(),:]/g, "")}:${P[k].tok}`).join(","))}`);
