export type Theme = "system" | "light" | "dark";
const KEY = "fde:theme";
export function getTheme(): Theme {
  try { const v = localStorage.getItem(KEY); return v === "light" || v === "dark" ? v : "system"; } catch { return "system"; }
}
export function applyTheme(t: Theme) {
  const r = document.documentElement;
  if (t === "system") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", t);
  try { localStorage.setItem(KEY, t); } catch { /* storage unavailable */ }
}

/** The look: "classic" (this app's own) or "ff" (the FiftyFive design system: navy, square corners, Plus Jakarta Sans). */
export type Brand = "classic" | "ff";
const BRAND = "fde:brand";
export function getBrand(): Brand {
  try { return localStorage.getItem(BRAND) === "ff" ? "ff" : "classic"; } catch { return "classic"; }
}
export function applyBrand(b: Brand) {
  const r = document.documentElement;
  if (b === "ff") r.setAttribute("data-brand", "ff"); else r.removeAttribute("data-brand");
  try { localStorage.setItem(BRAND, b); } catch { /* storage unavailable */ }
}
