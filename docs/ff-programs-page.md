# FiftyFive Programs Page: VS Code Guide

> In this app the FiftyFive look is the **"55" theme** (top bar: Classic | 55). Its tokens live in `src/styles.css` under `:root[data-brand="ff"]`, mapped onto the app's own tokens, so every page switches with one attribute. The Programs page (`src/pages/Programs.tsx`) follows layout B below; the "Choose a program" page (`src/pages/Home.tsx`) follows layout A.

Paste this whole file into Claude in VS Code (or save it in your repo as docs/ff-programs-page.md and tell Claude to read it). It has everything needed: the design tokens, the component styles, the page layout and a ready prompt. Nothing depends on access to anyone's canvas.

## 0. Ready-to-paste prompt

Read docs/ff-programs-page.md fully. Build the Programs admin page in this project's existing stack (detect it: React, Next, Vue, Angular, plain HTML, and so on). Follow section 3 (tokens), section 4 (components) and section 5 (layout B) exactly. Use CSS variables only, with no hard-coded colors, and square corners everywhere. Reuse the project's router, form handling and API client. Don't invent new fields. Show me the file plan before editing, then implement, run the linter, and list what you changed.

## 1. Setup steps

1. Open the project folder in VS Code and make sure the Claude Code extension is signed in to the company account.
2. Create src/styles/ff/ (or the equivalent for your stack).
3. Create tokens.css there and paste the CSS from section 3.
4. Create components.css there and paste the CSS from section 4.
5. Import both once, at the app entry (main.tsx, _app.tsx, app.component.ts styles, or index.html).
6. Add the Google Fonts link from section 2.
7. Paste the section 0 prompt into Claude and let it build the page.
8. Run the app and compare against section 5.

## 2. Fonts (no font files needed)

Plus Jakarta Sans (headings and body) and Manrope (buttons, labels, tags) are both on Google Fonts. Put this in `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

## 3. tokens.css (FiftyFive design tokens)

```css
:root{
  /* Brand */
  --ff-navy:#000090;
  --ff-navy-button:#000099;
  --ff-blue-08:rgba(35,86,246,0.08);
  --ff-blue-20:rgba(35,86,246,0.20);
  --ff-white:#FFFFFF;
  --ff-snow:#F8F9FE;
  --ff-black:#000000;
  --ff-ink:#0C0D14;
  --ff-black-70:rgba(0,0,0,0.70);
  --ff-black-50:rgba(0,0,0,0.50);
  --ff-black-20:rgba(0,0,0,0.20);
  --ff-black-10:rgba(0,0,0,0.10);
  --ff-scrim:rgba(0,0,0,0.35);

  /* Semantic */
  --text-primary:var(--ff-black);
  --text-display:var(--ff-navy);
  --text-muted:var(--ff-black-70);
  --text-link:var(--ff-navy);
  --surface-page:var(--ff-white);
  --surface-panel:var(--ff-snow);
  --border-card:var(--ff-black-20);
  --border-subtle:var(--ff-black-10);
  --border-panel:var(--ff-blue-08);
  --border-input:var(--ff-blue-20);
  --action-primary:var(--ff-navy-button);
  --action-primary-hover:var(--ff-navy);
  --action-primary-text:var(--ff-snow);

  /* Type */
  --font-sans:"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --font-ui:"Manrope",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;

  /* Spacing and shape */
  --content-width:1240px;
  --radius-none:0;           /* the system is SQUARE: no border-radius */
  --hairline:1px;
  --accent-rule:5px;
  --ease-standard:cubic-bezier(.2,.7,.2,1);
  --duration-fast:150ms;
}

body{margin:0;font-family:var(--font-sans);color:var(--text-primary);background:var(--surface-page);-webkit-font-smoothing:antialiased}
*,*::before,*::after{box-sizing:border-box}
a{color:var(--text-link);text-underline-offset:3px}
a:hover{text-underline-offset:6px}
button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid var(--ff-navy);outline-offset:2px}
```

## 4. components.css (building blocks used by the page)

```css
/* Layout */
.ff-container{max-width:var(--content-width);margin:0 auto;padding:64px 40px 80px;display:flex;flex-direction:column;gap:40px}

/* Type */
.ff-eyebrow{font-family:var(--font-ui);font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ff-navy)}
.ff-h1{margin:0;font-size:56px;line-height:1.1;font-weight:500;letter-spacing:-.01em;color:var(--ff-navy)}
.ff-h2{margin:0;font-size:24px;line-height:35px;font-weight:500;letter-spacing:.01em}
.ff-lead{margin:0;max-width:680px;font-size:16px;line-height:28px;letter-spacing:.01em;color:var(--text-muted)}
.ff-muted{font-family:var(--font-ui);font-size:14px;color:var(--text-muted)}

/* Buttons */
.ff-btn{display:inline-flex;align-items:center;justify-content:center;gap:12px;height:52px;padding:0 28px;border:0;border-radius:0;
  font-family:var(--font-ui);font-size:16px;font-weight:600;cursor:pointer;transition:background var(--duration-fast) var(--ease-standard)}
.ff-btn--primary{background:var(--action-primary);color:var(--action-primary-text)}
.ff-btn--primary:hover{background:var(--action-primary-hover)}
.ff-btn--outline{height:44px;padding:0 22px;font-size:14px;background:var(--ff-white);color:var(--text-primary);border:1px solid var(--border-card)}
.ff-btn--outline:hover{background:var(--ff-snow)}
.ff-link{display:inline-flex;align-items:center;gap:6px;min-height:44px;font-family:var(--font-ui);font-size:14px;font-weight:600}

/* Tag */
.ff-tag{font-family:var(--font-ui);font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ff-navy);background:var(--ff-snow);border:1px solid var(--border-input);padding:4px 10px}

/* Form fields */
.ff-field{display:flex;flex-direction:column;gap:8px}
.ff-label{display:flex;align-items:baseline;justify-content:space-between;font-family:var(--font-ui);font-size:14px;font-weight:600}
.ff-label small{font-size:12px;font-weight:500;color:var(--text-muted)}
.ff-input{height:52px;padding:0 16px;border:1px solid var(--border-input);border-radius:0;background:var(--ff-white);
  color:var(--text-primary);font-family:var(--font-sans);font-size:16px}
textarea.ff-input{height:auto;padding:14px 16px;resize:vertical}
.ff-input::placeholder{color:rgba(0,0,0,.62);opacity:1}
.ff-input:focus{border-color:var(--ff-navy)}

/* Panels */
.ff-panel{background:var(--ff-snow);border:1px solid var(--border-panel);padding:32px}
.ff-panel--accent{border-top:var(--accent-rule) solid var(--ff-navy)}

/* Stats strip */
.ff-stats{display:flex;flex-wrap:wrap;background:var(--ff-snow);border:1px solid var(--border-panel)}
.ff-stat{flex:1 1 200px;padding:24px 32px;display:flex;flex-direction:column;gap:6px;border-right:1px solid var(--border-panel)}
.ff-stat:last-child{border-right:0}
.ff-stat b{font-size:40px;line-height:46px;font-weight:500;color:var(--ff-navy)}

/* Table */
.ff-table-wrap{overflow-x:auto;border:1px solid var(--border-card)}
.ff-table{width:100%;min-width:560px;border-collapse:collapse;text-align:left}
.ff-table th{padding:14px 24px;background:var(--ff-snow);border-bottom:1px solid var(--border-card);
  font-family:var(--font-ui);font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted)}
.ff-table td{padding:22px 24px}

/* Page layout */
.ff-split{display:flex;flex-wrap:wrap;gap:32px;align-items:flex-start}
.ff-split__main{flex:999 1 560px;min-width:0;display:flex;flex-direction:column;gap:16px}
.ff-split__side{flex:1 1 360px;max-width:440px;min-width:0;display:flex;flex-direction:column;gap:24px}
.ff-visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
```

## 5. Page spec: Programs, Layout B (table + side form)

Structure, top to bottom:

1. Eyebrow ADMIN, an H1 Programs, and this lead text: "As the admin you see every program. Create one, then invite its coordinator from its Manage page; the coordinator can run it from there."
2. A stats strip with three cells computed from real data: number of programs, total people, and the next start date. Don't hard-code these.
3. A two-column split.
   - Left: All programs and a table with the columns Program, Your role (an Admin tag), People, Starts, and actions (Reports link plus a Manage outline button).
   - Right: a New program panel with the accent top rule and these fields: Name (required, placeholder "e.g. DevOps Training Program"), Description (optional, textarea), Start date (optional, date input), and a primary Create program button.
   - Helper text under the button: "After creating, open Manage to invite the program's coordinator."

Reference markup (adapt to the framework: classes become className, and so on):

```html
<main class="ff-container">
  <header style="display:flex;flex-direction:column;gap:16px">
    <span class="ff-eyebrow">Admin</span>
    <h1 class="ff-h1">Programs</h1>
    <p class="ff-lead">As the admin you see every program. Create one, then invite its coordinator from its Manage page; the coordinator can run it from there.</p>
  </header>

  <section class="ff-stats" aria-label="Summary">
    <div class="ff-stat"><span class="ff-eyebrow" style="color:var(--text-muted)">Programs</span><b>1</b></div>
    <div class="ff-stat"><span class="ff-eyebrow" style="color:var(--text-muted)">People</span><b>0</b></div>
    <div class="ff-stat"><span class="ff-eyebrow" style="color:var(--text-muted)">Next start</span><b>2026-11-16</b></div>
  </section>

  <div class="ff-split">
    <section class="ff-split__main">
      <h2 class="ff-h2">All programs</h2>
      <div class="ff-table-wrap">
        <table class="ff-table">
          <thead><tr>
            <th scope="col">Program</th><th scope="col">Your role</th><th scope="col">People</th><th scope="col">Starts</th>
            <th scope="col"><span class="ff-visually-hidden">Actions</span></th>
          </tr></thead>
          <tbody><tr>
            <td style="font-size:18px;font-weight:500;color:var(--ff-navy)">FDE Training Program</td>
            <td><span class="ff-tag">Admin</span></td>
            <td class="ff-muted">0</td>
            <td class="ff-muted">2026-11-16</td>
            <td style="text-align:right">
              <a class="ff-link" href="#">Reports</a>
              <button type="button" class="ff-btn ff-btn--outline">Manage</button>
            </td>
          </tr></tbody>
        </table>
      </div>
    </section>

    <form class="ff-split__side ff-panel ff-panel--accent">
      <h2 class="ff-h2">New program</h2>
      <div class="ff-field"><label class="ff-label" for="name">Name</label>
        <input id="name" class="ff-input" type="text" placeholder="e.g. DevOps Training Program" required></div>
      <div class="ff-field"><label class="ff-label" for="desc">Description <small>Optional</small></label>
        <textarea id="desc" class="ff-input" rows="3"></textarea></div>
      <div class="ff-field"><label class="ff-label" for="start">Start date <small>Optional</small></label>
        <input id="start" class="ff-input" type="date"></div>
      <button type="submit" class="ff-btn ff-btn--primary">Create program</button>
      <p class="ff-muted" style="margin:0;line-height:22px">After creating, open Manage to invite the program's coordinator.</p>
    </form>
  </div>
</main>
```

Rules for the build:

- Corners are square, so never add border-radius. There are no shadows.
- Use only the CSS variables from tokens.css: no hex colors in components.
- Keep the table inside .ff-table-wrap so it scrolls on phones, and let the split stack under about 900px.
- Keep real `<label>`, `<button>` and `<a>` elements, with visible focus rings and 44px minimum touch targets.
- Table rows, stats and the Admin tag come from real data and roles, not hard-coded values.

## 6. Other layouts, if you prefer them

- **A, Card grid:** programs as white hairline cards (Admin tag, title, people and start date, then Manage and Reports in the footer), with a snow "New program" card beside them and a three-step strip below (Create a program, Invite a coordinator, Hand it over).
- **C, List + drawer:** programs as rows (the active one has a 5px navy left rule), and "New program" opens a 480px right drawer over a 35% black scrim. The drawer has a header with a close button, the same three fields, and a footer with Cancel and Create program.

Tell Claude: "Use layout A (or C) instead", and it can reuse the same tokens and components.

## 7. Checklist before you commit

- [ ] Fonts load (Plus Jakarta Sans body, Manrope on buttons and labels)
- [ ] Primary button is navy and darkens on hover
- [ ] No rounded corners anywhere
- [ ] Form submits to the real create-program endpoint
- [ ] Page works at 390px width (table scrolls, form stacks)
- [ ] Keyboard Tab order and focus rings work

## 8. Reference links (company-internal)

- FiftyFive Design System: https://claude.ai/artifact/GHkSNdi817UEmfy7za9fhE (shared in the organization)
- Design canvas with the three layouts: https://claude.ai/artifact/5uwCdYQk3VegzHfiVWum3Y (private until its owner shares it)
