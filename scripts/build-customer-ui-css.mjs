import fs from "fs";
import path from "path";

const root = process.cwd();
const app = path.join(root, "app");

const sources = path.join(root, "scripts", "css-sources");
const parts = [
  "/* FUSE Customer UI — single design system. Do not split tokens across files. */\n",
  singleRoot(),
  "\n/* ── App canvas & shell ── */\n",
  dedupeRoot(fs.readFileSync(path.join(sources, "fuse-customer-shell.css"), "utf8")),
  "\n/* ── Components, pages, auth, satellites ── */\n",
  fs.readFileSync(path.join(sources, "fuse-design-system.css"), "utf8"),
  "\n/* ── Theme surfaces & page accents ── */\n",
  fs.readFileSync(path.join(sources, "fuse-reference-theme.css"), "utf8")
    .replace(/^:root \{[\s\S]*?\}\n\n/m, "")
    .replace(/^html,\nbody \{[\s\S]*?\}\n\n/m, ""),
  "\n/* ── Bottom navigation ── */\n",
  `
.fuse-customer-nav {
  position: fixed;
  z-index: 10000;
  left: 50%;
  bottom: max(var(--fuse-nav-gap), env(safe-area-inset-bottom));
  width: min(414px, calc(100% - 20px));
  height: var(--fuse-nav-height);
  padding: 6px 8px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: space-between;
  gap: 2px;
  border: 1px solid rgba(255, 255, 255, 0.92);
  border-radius: var(--fuse-radius-shell, 28px);
  background: var(--fuse-glass-strong, rgba(255, 252, 247, 0.82));
  box-shadow: var(--fuse-shadow-soft, 0 16px 42px rgba(65, 55, 38, 0.12));
  backdrop-filter: var(--fuse-blur, blur(22px) saturate(145%));
  isolation: isolate;
}

.fuse-customer-nav > a {
  flex: 1 1 0;
  min-width: 0;
  height: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--fuse-muted, #6f7175);
  border-radius: var(--fuse-radius-md, 18px);
  -webkit-tap-highlight-color: transparent;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.fuse-customer-nav > a.is-active {
  color: var(--fuse-green);
  background: var(--fuse-green-soft, rgba(31, 122, 79, 0.12));
}

.fuse-customer-nav > a.is-active .fuse-nav-icon {
  background: rgba(255, 255, 255, 0.72);
  border-radius: 14px;
}

.fuse-customer-nav > a:active {
  transform: scale(0.96);
}

.fuse-customer-nav > a b {
  max-width: 100%;
  overflow: hidden;
  color: inherit;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fuse-nav-icon {
  width: 32px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 12px;
}

.fuse-customer-nav svg {
  width: var(--fuse-icon-lg, 24px);
  height: var(--fuse-icon-lg, 24px);
  overflow: visible;
}

@media (max-width: 520px) {
  .fuse-customer-nav {
    left: 10px;
    right: 10px;
    width: auto;
    height: 68px;
  }
}

@media (max-width: 360px) {
  .fuse-customer-nav {
    left: 8px;
    right: 8px;
    padding-inline: 4px;
  }
  .fuse-customer-nav > a b {
    font-size: 9px;
  }
}

@media (min-width: 1440px) {
  .fuse-customer-nav {
    max-width: 430px;
  }
}
`,
  `
.customer-page,
main.app,
main.page.fuse-satellite,
.profile-shell {
  /* unified shell aliases */
}

.customer-header,
.top.customer-header,
.profile-shell .profile-header,
.home-page .topbar,
.restaurants-page .customer-header,
.restaurant-detail-page .customer-header,
.page > .phone > .top {
  display: grid;
  grid-template-columns: var(--fuse-touch) 1fr var(--fuse-touch);
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding: 8px 10px;
  background: var(--fuse-glass-strong, rgba(255, 252, 247, 0.82));
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: var(--fuse-radius-shell, 28px);
  box-shadow: var(--fuse-shadow-soft, 0 10px 28px rgba(21, 23, 26, 0.08));
  backdrop-filter: var(--fuse-blur, blur(22px) saturate(145%));
}

.customer-header__title,
.customer-header .title,
.top .heading {
  text-align: center;
  min-width: 0;
}

.customer-header__title h1,
.customer-header .title h1,
.top .heading h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 950;
  font-family: var(--fuse-title-font);
  line-height: 1.2;
}

.customer-header__title p,
.customer-header .title p,
.top .heading span {
  margin: 4px 0 0;
  color: var(--fuse-muted, var(--ref-muted));
  font-size: 12px;
  font-weight: 800;
}

.customer-header__space,
.customer-header .space {
  width: var(--fuse-touch);
  height: var(--fuse-touch);
}

.customer-page,
.customer-page.customer-page--phone > .phone,
.page.home-page,
.page.restaurants-page,
.page.restaurant-detail-page,
.page,
main.page,
main.page.fuse-satellite,
.profile-shell,
main.app,
.fuse-auth-page {
  width: min(100%, 430px);
  margin-inline: auto;
  min-height: 100dvh;
  padding-top: var(--fuse-page-top);
  padding-left: var(--fuse-page-gutter);
  padding-right: var(--fuse-page-gutter);
  padding-bottom: var(--fuse-page-bottom);
  font-family: var(--fuse-body-font);
  color: var(--fuse-ink, var(--ref-ink, #15171a));
  background: transparent;
}

.fuse-card,
.form-card,
.feature-list,
.notice.form-card {
  background: var(--fuse-glass-strong, rgba(255, 252, 247, 0.82));
  border: 1px solid rgba(255, 255, 255, 0.92);
  border-radius: var(--fuse-radius-card, 22px);
  box-shadow: var(--fuse-shadow-soft, 0 10px 28px rgba(21, 23, 26, 0.08));
  backdrop-filter: var(--fuse-blur, blur(22px) saturate(145%));
}

.fuse-primary-btn,
.btn-primary {
  display: inline-grid;
  place-items: center;
  min-height: var(--fuse-touch);
  padding: 0 18px;
  border: 0;
  border-radius: var(--fuse-radius-btn, 16px);
  background: linear-gradient(135deg, var(--fuse-green, #1f7a4f), var(--fuse-green-2, #2f915f));
  color: #fff;
  font: inherit;
  font-weight: 900;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(31, 122, 79, 0.22);
}

.fuse-secondary-btn,
.btn-secondary {
  display: inline-grid;
  place-items: center;
  min-height: var(--fuse-touch);
  padding: 0 18px;
  border: 1px solid var(--fuse-line, rgba(21, 23, 26, 0.08));
  border-radius: var(--fuse-radius-btn, 16px);
  background: rgba(255, 252, 247, 0.88);
  color: var(--fuse-ink, #15171a);
  font: inherit;
  font-weight: 900;
  text-decoration: none;
}

.fuse-state-card,
.fuse-state-card--loading,
.fuse-state-card--empty,
.fuse-state-card--error {
  padding: 24px 16px;
  text-align: center;
  border-radius: var(--fuse-radius-card, 22px);
  background: var(--fuse-glass-strong, rgba(255, 252, 247, 0.82));
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow: var(--fuse-shadow-soft, 0 10px 28px rgba(21, 23, 26, 0.08));
}

.fuse-state-card--error {
  background: rgba(254, 226, 226, 0.72);
  color: #991b1b;
}

.fuse-legal-page .legal-card {
  padding: 22px;
  display: grid;
  gap: 12px;
  line-height: 1.8;
}

.fuse-legal-page h1 {
  margin: 8px 0 0;
  font-size: 28px;
}

.fuse-legal-page h2 {
  margin: 16px 0 0;
  font-size: 18px;
}

.explore-page .explore-search input {
  width: 100%;
  border: 1px solid var(--fuse-line);
  border-radius: var(--fuse-radius-btn);
  padding: 14px;
  background: rgba(255, 255, 255, 0.72);
  font: inherit;
}

.explore-page .explore-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 14px;
  scrollbar-width: none;
}

.explore-page .explore-filters button {
  flex: 0 0 auto;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid var(--fuse-line);
  border-radius: 999px;
  background: rgba(255, 252, 247, 0.88);
  font: inherit;
  font-weight: 900;
  color: var(--fuse-muted);
}

.explore-page .explore-filters button.is-active {
  background: linear-gradient(135deg, var(--fuse-green), var(--fuse-green-2));
  color: #fff;
  border-color: transparent;
}

.explore-page .explore-list {
  display: grid;
  gap: 14px;
}

.explore-page .explore-card {
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: var(--fuse-radius-card);
  background: var(--fuse-glass-strong);
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow: var(--fuse-shadow-soft);
  color: inherit;
}

.explore-page .explore-card__image {
  position: relative;
  height: 160px;
  border-radius: 18px;
  overflow: hidden;
}

.explore-page .explore-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.explore-page .explore-card__badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  font-size: 11px;
  font-weight: 900;
}

.explore-page .explore-card__body h3 {
  margin: 0 0 4px;
  font-size: 18px;
}

.explore-page .explore-card__body p {
  margin: 0;
  color: var(--fuse-muted);
  font-size: 12px;
  line-height: 1.7;
}

.explore-page .explore-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  font-size: 11px;
  font-weight: 800;
  color: var(--fuse-muted);
}

.explore-page .explore-card__meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.reels-page .verified-badge {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #54b9ff;
  color: #fff;
  font-style: normal;
}
`,
];

const extractedDir = path.join(app, "styles", "extracted");
if (fs.existsSync(extractedDir)) {
  parts.push("\n/* ── Page-specific extracted styles ── */\n");
  for (const file of fs.readdirSync(extractedDir).sort()) {
    if (!file.endsWith(".css")) continue;
    let css = fs.readFileSync(path.join(extractedDir, file), "utf8");
    css = css
      .replace(/:global\(\*\)\s*\{[^}]*\}/g, "")
      .replace(/:global\(html\),\s*:global\(body\)\s*\{[^}]*\}/g, "")
      .replace(/:global\(([^)]+)\)/g, "$1");
    parts.push(`/* from ${file} */\n${css}\n`);
  }
}

const mobile = fs.readFileSync(path.join(app, "mobile-responsive.css"), "utf8");
// mobile-responsive.css is imported separately from layout.tsx
void mobile;

const output = parts.join("\n")
  .replace(/\n{3,}/g, "\n\n")
  .replace(/var\(--ref-/g, "var(--fuse-")
  .replace(/--ref-/g, "--fuse-");

fs.writeFileSync(path.join(app, "fuse-customer-ui.css"), output);
console.log("Wrote app/fuse-customer-ui.css", output.length, "bytes");

function dedupeRoot(css) {
  return css.replace(/:root \{[\s\S]*?\}\n\n/, "");
}

function singleRoot() {
  return `:root {
  --fuse-orange: #ff6a0a;
  --fuse-orange-2: #ff8a24;
  --fuse-green: #1f7a4f;
  --fuse-green-2: #2f915f;
  --fuse-green-soft: rgba(31, 122, 79, 0.12);
  --fuse-cream: #fdf6ec;
  --fuse-cream-2: #f4efe6;
  --fuse-ink: #15171a;
  --fuse-muted: #6f7175;
  --fuse-navy: #1a2235;
  --fuse-line: rgba(21, 23, 26, 0.08);
  --fuse-glass-strong: rgba(255, 252, 247, 0.82);
  --fuse-blur: blur(22px) saturate(145%);
  --fuse-shadow-soft: 0 10px 28px rgba(21, 23, 26, 0.08);
  --fuse-shadow: 0 16px 42px rgba(65, 55, 38, 0.12);
  --fuse-nav-height: 72px;
  --fuse-nav-gap: 8px;
  --fuse-page-gutter: 14px;
  --fuse-page-top: calc(14px + env(safe-area-inset-top, 0px));
  --fuse-page-bottom: calc(var(--fuse-nav-height) + var(--fuse-nav-gap) + env(safe-area-inset-bottom, 0px) + 10px);
  --fuse-toast-bottom: calc(var(--fuse-nav-height) + var(--fuse-nav-gap) + env(safe-area-inset-bottom, 0px) + 14px);
  --fuse-title-font: "Noto Kufi Arabic Variable", "IBM Plex Sans Arabic", system-ui, sans-serif;
  --fuse-body-font: "Tajawal", "IBM Plex Sans Arabic", system-ui, sans-serif;
  --fuse-icon-sm: 20px;
  --fuse-icon-md: 22px;
  --fuse-icon-lg: 24px;
  --fuse-touch: 46px;
  --fuse-radius-btn: 16px;
  --fuse-radius-card: 22px;
  --fuse-radius-shell: 28px;
  --fuse-radius-md: 18px;
  --fuse-radius-lg: 22px;
}\n\nhtml,
body {
  background:
    radial-gradient(circle at 8% 4%, rgba(255, 224, 117, 0.35), transparent 28%),
    radial-gradient(circle at 92% 8%, rgba(84, 185, 255, 0.18), transparent 32%),
    radial-gradient(circle at 14% 72%, rgba(31, 122, 79, 0.1), transparent 34%),
    linear-gradient(155deg, var(--fuse-cream) 0%, var(--fuse-cream-2) 52%, #faf4ee 100%);
  color: var(--fuse-ink);
}\n`;
}
