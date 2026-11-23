import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../Icon";
import { usePopover } from "../../lib/usePopover";
import { ago, notifications, type Notification } from "../../lib/v3";

const POLL_MS = 5 * 60 * 1000;
const SEEN = "fde:alerted";
const seen = (): Set<string> => { try { return new Set(JSON.parse(localStorage.getItem(SEEN) ?? "[]") as string[]); } catch { return new Set(); } };
const markSeen = (id: string) => { const s = seen(); s.add(id); try { localStorage.setItem(SEEN, JSON.stringify([...s].slice(-200))); } catch { /* ignore */ } };

/** The bell in the top bar: daily status reminders (sent at 10:00 for every program you missed the day before). */
export function NotificationBell() {
  const { open, toggle, hide, box, btn } = usePopover();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [alert, setAlert] = useState<Notification | null>(null);
  const [desktop, setDesktop] = useState(() => ("Notification" in window ? Notification.permission : "denied"));
  const load = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const r = await notifications.list(); setItems(r.items); setUnread(r.unread);
      // A reminder you have not seen yet: show it on screen (once per reminder), and as a desktop alert if you allowed them.
      const fresh = r.items.find((n) => !n.read && n.kind === "daily_missed" && !seen().has(n.id)); // the on-screen alert is for your own missed days
      if (fresh) {
        markSeen(fresh.id); setAlert(fresh);
        if ("Notification" in window && Notification.permission === "granted") {
          const sys = new Notification(fresh.title, { body: fresh.body, tag: fresh.id });
          sys.onclick = () => { window.focus(); if (fresh.link?.startsWith("/")) navigate(fresh.link); sys.close(); };
        }
      }
    } catch { /* the bell is a nicety; a failed check changes nothing */ }
  }, [navigate]);
  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), POLL_MS);
    const vis = () => void load();
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("fde:daily-saved", vis); // saving a missed day settles its reminder
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", vis); window.removeEventListener("fde:daily-saved", vis); };
  }, [load]);
  const go = async (n: Notification) => {
    await hide(false);
    if (!n.read) { setUnread((u) => Math.max(0, u - 1)); setItems((all) => all.map((x) => (x.id === n.id ? { ...x, read: true } : x))); void notifications.read(n.id).catch(() => undefined); }
    if (n.link?.startsWith("/")) navigate(n.link);
  };
  const readAll = async () => {
    setUnread(0); setItems((all) => all.map((x) => ({ ...x, read: true })));
    try { await notifications.readAll(); } catch { void load(); }
  };
  const allowDesktop = async () => { if ("Notification" in window) setDesktop(await Notification.requestPermission()); };
  return (
    <div className="menu bell" ref={box}>
      {alert && !alert.read && (
        <div className="reminder-alert" role="alert">
          <span className="reminder-icon" aria-hidden="true"><Icon name="daily" size={20} /></span>
          <div className="grow"><b>{alert.title}</b><p className="meta">{alert.body}</p></div>
          <div className="reminder-actions">
            <button type="button" className="btn sm" onClick={() => { const a = alert; setAlert(null); void go(a); }}>Fill it in</button>
            <button type="button" className="iconbtn sm" aria-label="Dismiss" onClick={() => setAlert(null)}><Icon name="x" size={16} /></button>
          </div>
        </div>
      )}
      <button ref={btn} type="button" className="iconbtn" aria-haspopup="true" aria-expanded={open} onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} title="Notifications">
        <Icon name="bell" />
        {unread > 0 && <span className="bell-count" aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="menu-list bell-list" role="region" aria-label="Notifications">
          <div className="bell-head">
            <b>Notifications</b>
            {unread > 0 && <button type="button" className="btn ghost sm" onClick={() => void readAll()}>Mark all read</button>}
          </div>
          {desktop === "default" && <button type="button" className="bell-desktop" onClick={() => void allowDesktop()}><Icon name="bell" size={14} />Also show reminders as desktop alerts</button>}
          {items.length === 0 ? (
            <p className="meta bell-empty">Nothing yet. If you miss a daily status, a reminder shows up here at 10:00 the next working day.</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" className={"menu-item bell-item" + (n.read ? "" : " unread")} onClick={() => void go(n)}>
                    <Icon name={n.kind === "week_submitted" ? "check" : "daily"} size={16} />
                    <span className="grow"><span className="bell-title">{n.title}</span><span className="meta">{n.body}</span><span className="meta">{ago(n.created_at)}</span></span>
                    {!n.read && <span className="dot" aria-label="Unread" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
