import { apiBlob, apiForm, apiJson } from "./api";

// Programs V3: types and calls. The contract is docs/PROGRAMS-V3.md in the backend repo.

export type ProgramRole = "admin" | "coordinator" | "member";
export type FieldType = "text" | "longtext" | "number" | "rating" | "url";
export type Field = { key: string; label: string; description: string | null; type: FieldType; required: boolean };
export type FormKind = "daily" | "day";
export type Values = Record<string, string | number>;

export type ProgramSummary = { id: string; name: string; description: string | null; starts_on: string | null; my_role: ProgramRole; member_count: number };
export type Day = { id: string; week: number; day: number; topic: string; topics_to_cover: string; practical_task: string | null; resources: string | null };
export type Program = { id: string; name: string; description: string | null; starts_on: string | null; my_role: ProgramRole; days: Day[]; forms: { daily: Field[]; day: Field[] } };
export type DayInput = Omit<Day, "id">;

export type Member = { user_id: string; email: string; name: string; role: "coordinator" | "member" };
export type Invite = { id: string; email: string; role: "coordinator" | "member"; created_at: string };

export type DailyEntry = { user_id: string; on_date: string; values: Values; updated_at: string };
export type DayStatus = { user_id: string; day_id: string; values: Values; completed: boolean; updated_at: string };

export type Person = { user_id: string; name: string; email: string };
export type DailyReport = { fields: Field[]; people: Person[]; dates: string[]; cells: { user_id: string; on_date: string; values: Values }[] };
export type ProgramReport = { days: Day[]; fields: Field[]; people: (Person & { rows: { day_id: string; values: Values; completed: boolean }[] })[] };

export type Author = { id: string; name: string };
export type Comment = { id: string; author: Author; body: string; created_at: string };
export type Post = { id: string; author: Author; body: string | null; url: string | null; created_at: string; edited_at: string | null; like_count: number; liked_by_me: boolean; comment_count: number; comments: Comment[] };
export type FeedSort = "new" | "top" | "discussed";
export type FeedKind = "all" | "video" | "link" | "text";
export type FeedQuery = { program_id?: string; sort?: FeedSort; kind?: FeedKind; mine?: boolean; q?: string; cursor?: string; limit?: number };
export type FeedPage = { items: Post[]; next_cursor: string | null };

const P = (id: string) => `/api/programs/${encodeURIComponent(id)}`;
const q = (o: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(o).filter((e): e is [string, string] => !!e[1])).toString();
  return s ? `?${s}` : "";
};

export const programs = {
  list: () => apiJson<ProgramSummary[]>("GET", "/api/programs"),
  create: (b: { name: string; description?: string; starts_on?: string }) => apiJson<ProgramSummary>("POST", "/api/programs", b),
  update: (id: string, b: { name?: string; description?: string | null; starts_on?: string | null }) => apiJson<ProgramSummary>("PATCH", P(id), b),
  get: (id: string) => apiJson<Program>("GET", P(id)),
  addDay: (id: string, b: DayInput) => apiJson<Day>("POST", `${P(id)}/days`, b),
  updateDay: (id: string, dayId: string, b: Partial<DayInput>) => apiJson<Day>("PATCH", `${P(id)}/days/${dayId}`, b),
  deleteDay: (id: string, dayId: string) => apiJson<void>("DELETE", `${P(id)}/days/${dayId}`),
  saveForm: (id: string, form: FormKind, fields: Field[]) => apiJson<Field[]>("PUT", `${P(id)}/forms/${form}`, { fields }),
  members: (id: string) => apiJson<{ members: Member[]; invites: Invite[] }>("GET", `${P(id)}/members`),
  invite: (id: string, email: string, role: Member["role"]) => apiJson<{ status: "added" | "invited" }>("POST", `${P(id)}/invites`, { email, role }),
  cancelInvite: (id: string, inviteId: string) => apiJson<void>("DELETE", `${P(id)}/invites/${inviteId}`),
  setRole: (id: string, userId: string, role: Member["role"]) => apiJson<Member>("PATCH", `${P(id)}/members/${userId}`, { role }),
  removeMember: (id: string, userId: string) => apiJson<void>("DELETE", `${P(id)}/members/${userId}`),
};

export const status = {
  daily: (id: string, o: { user_id?: string; from?: string; to?: string } = {}) => apiJson<DailyEntry[]>("GET", `${P(id)}/daily${q(o)}`),
  saveDaily: (id: string, date: string, values: Values) => apiJson<DailyEntry>("PUT", `${P(id)}/daily/${date}`, { values }),
  days: (id: string, userId?: string) => apiJson<DayStatus[]>("GET", `${P(id)}/day-status${q({ user_id: userId })}`),
  saveDay: (id: string, dayId: string, values: Values, completed: boolean) => apiJson<DayStatus>("PUT", `${P(id)}/day-status/${dayId}`, { values, completed }),
};

export const reports = {
  daily: (id: string, from?: string, to?: string) => apiJson<DailyReport>("GET", `${P(id)}/reports/daily${q({ from, to })}`),
  program: (id: string) => apiJson<ProgramReport>("GET", `${P(id)}/reports/program`),
  dailyXlsx: (id: string, from?: string, to?: string) => apiBlob(`${P(id)}/reports/daily.xlsx${q({ from, to })}`),
  programXlsx: (id: string) => apiBlob(`${P(id)}/reports/program.xlsx`),
};

export const feed = {
  list: (o: FeedQuery = {}) => apiJson<FeedPage>("GET", `/api/feed${q({ program_id: o.program_id, sort: o.sort ?? "new", kind: o.kind ?? "all", mine: o.mine ? "true" : undefined, q: o.q?.trim() || undefined, cursor: o.cursor, limit: String(o.limit ?? 20) })}`),
  get: (id: string) => apiJson<Post>("GET", `/api/feed/${encodeURIComponent(id)}`),
  edit: (id: string, b: { body: string | null; url: string | null }) => apiJson<Post>("PATCH", `/api/feed/${encodeURIComponent(id)}`, b),
  post: (b: { body?: string; url?: string; program_id?: string }) => apiJson<Post>("POST", "/api/feed", b),
  remove: (id: string) => apiJson<void>("DELETE", `/api/feed/${id}`),
  like: (id: string) => apiJson<{ like_count: number; liked_by_me: boolean }>("POST", `/api/feed/${id}/like`),
  comment: (id: string, body: string) => apiJson<Comment>("POST", `/api/feed/${id}/comments`, { body }),
  removeComment: (commentId: string) => apiJson<void>("DELETE", `/api/feed/comments/${commentId}`),
};

export type TimeCell = { date: string; minutes: number; note: string | null };
export type TimeTask = { id?: string; title: string; cells: TimeCell[] };
export type Timesheet = { user_id: string; week: string; submitted_at: string | null; updated_at: string | null; tasks: TimeTask[] };

export const timesheet = {
  get: (id: string, week: string, userId?: string) => apiJson<Timesheet>("GET", `${P(id)}/timesheet/${week}${q({ user_id: userId })}`),
  save: (id: string, week: string, tasks: TimeTask[], submit: boolean) => apiJson<Timesheet>("PUT", `${P(id)}/timesheet/${week}`, { tasks, submit }),
};

export type Notification = { id: string; kind: "daily_missed" | "week_submitted"; program_id: string | null; on_date: string | null; title: string; body: string; link: string | null; created_at: string; read: boolean };

export const notifications = {
  list: () => apiJson<{ items: Notification[]; unread: number }>("GET", "/api/notifications"),
  read: (id: string) => apiJson<void>("POST", `/api/notifications/${encodeURIComponent(id)}/read`),
  readAll: () => apiJson<void>("POST", "/api/notifications/read-all"),
};

export type DemoStatus = { loaded: boolean; programs: number; people: number };
/** Admin only: sample data for demos, kept apart from real data and removable in one go. */
export const demo = {
  status: () => apiJson<DemoStatus>("GET", "/api/admin/demo-data"),
  load: (report?: File, daily?: File) => {
    const f = new FormData();
    if (report) f.append("report", report);
    if (daily) f.append("daily", daily);
    return apiForm<DemoStatus>("/api/admin/demo-data", f);
  },
  remove: () => apiJson<DemoStatus>("DELETE", "/api/admin/demo-data"),
};

/** Saves a downloaded file in the browser. */
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const canManage = (role: ProgramRole | undefined) => role === "admin" || role === "coordinator";
export const ROLE_LABEL: Record<ProgramRole, string> = { admin: "Admin", coordinator: "Coordinator", member: "Member" };

/** yyyy-mm-dd in local time. */
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fmtDay = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

/** "3 h ago" style time. */
export function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Checks values in the browser with the same rules as the server, so people see problems before saving. */
export function checkValues(fields: Field[], values: Values, enforceRequired: boolean): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of fields) {
    const v = values[f.key];
    const empty = v === undefined || v === null || (typeof v === "string" && v.trim() === "");
    if (empty) { if (enforceRequired && f.required) errs[f.key] = "Required"; continue; }
    const s = String(v);
    if (f.type === "text" && s.length > 500) errs[f.key] = "At most 500 characters";
    if (f.type === "longtext" && s.length > 4000) errs[f.key] = "At most 4000 characters";
    if (f.type === "number" && !(Number(v) >= 0 && Number(v) <= 1000)) errs[f.key] = "A number from 0 to 1000";
    if (f.type === "rating" && !(Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 5)) errs[f.key] = "Choose 1 to 5";
    if (f.type === "url" && !/^https:\/\/\S{3,490}$/.test(s)) errs[f.key] = "A link starting with https://";
  }
  return errs;
}

/** Drops empty values and turns number/rating strings into numbers before sending. */
export function cleanValues(fields: Field[], values: Values): Values {
  const out: Values = {};
  for (const f of fields) {
    const v = values[f.key];
    if (v === undefined || (typeof v === "string" && v.trim() === "")) continue;
    out[f.key] = f.type === "number" || f.type === "rating" ? Number(v) : String(v).trim();
  }
  return out;
}
