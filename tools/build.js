#!/usr/bin/env node
// Static site generator for AI Desk Labo review/comparison site.
// No dependencies beyond Node built-ins — must run unattended in a cloud routine
// with nothing but `node tools/build.js`.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://aidesklabo.com"; // update once the domain is registered
const AMAZON_TAG = "aidesklabo-22";
const SITE_TITLE = "AI Desk Labo";

const FOLDER_BY_TYPE = { review: "reviews", ranking: "rankings", compare: "compare", guide: "guides", diagnosis: "diagnosis" };
const TYPE_LABEL_JA = { review: "レビュー", ranking: "ランキング", compare: "比較", guide: "ガイド", diagnosis: "診断" };
// Small decorative English kicker printed next to the Japanese eyebrow label
// (see eyebrowHtml()) — purely typographic texture, not meant to add meaning
// on top of the Japanese it sits beside.
const TYPE_LABEL_EN = { review: "Review", ranking: "Ranking", compare: "Compare", guide: "Guide", diagnosis: "Diagnosis" };
const TYPE_COLOR = { review: "blue", ranking: "orange", compare: "green", guide: "blue", diagnosis: "orange" };
const TYPE_INDEX_INTRO = {
  review: "実際に使ってみたAIツール・ガジェットの使用感を、良かった点も気になった点も正直にまとめています。",
  ranking: "用途・予算別に、実際に使って良かったものだけを順位付けしています。",
  compare: "似た選択肢で迷いがちなツール・ガジェットを、実体験ベースで比較しています。",
  guide: "何から揃えるべきか迷う人向けに、優先順位付きで選び方を解説しています。",
  diagnosis: "質問に答えるだけで、あなたの用途・予算に合ったPC構成や買い方を診断します。",
};
const CATEGORY_COLOR = { keyboard: "orange", mouse: "blue", charger: "green", monitor: "orange", stand: "green", mic: "blue", light: "orange", footrest: "green", wristrest: "blue", monitorarm: "orange", cpu: "blue", gpu: "orange", cable: "green", tablet: "blue", reader: "green", case: "blue", macropad: "orange", motherboard: "green", psu: "orange", thermalpaste: "green", ram: "blue", storage: "orange", cooler: "blue", wifi: "green" };
// Product-card badges show this label, not the raw `category` key — the key
// is an internal English slug (also used to look up CATEGORY_COLOR/ICONS)
// and was previously printed as-is, which read as stray English jargon on
// an otherwise all-Japanese page.
const CATEGORY_LABEL_JA = { keyboard: "キーボード", mouse: "マウス", charger: "充電器", monitor: "モニター", stand: "スタンド", mic: "マイク", light: "ライト", footrest: "フットレスト", wristrest: "リストレスト", monitorarm: "モニターアーム", cpu: "CPU", gpu: "GPU", cable: "ケーブル", tablet: "タブレット", reader: "カードリーダー", case: "ケース", macropad: "マクロパッド", motherboard: "マザーボード", psu: "電源ユニット", thermalpaste: "グリス", ram: "メモリ", storage: "SSD", cooler: "CPUクーラー", wifi: "Wi-Fi子機" };

// Small hand-authored line-icon set (24x24, stroke-based, no external icon font/CDN).
const ICONS = {
  keyboard: `<rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10"/><line x1="10" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="14" y2="10"/><line x1="18" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="14" y2="14"/>`,
  mouse: `<rect x="7" y="2" width="10" height="19" rx="5"/><line x1="12" y1="2" x2="12" y2="9"/>`,
  charger: `<rect x="2" y="7" width="17" height="11" rx="2"/><line x1="21" y1="10" x2="21" y2="15"/><polyline points="12 10 9.5 13.5 12.5 13.5 10 17"/>`,
  monitor: `<rect x="3" y="4" width="18" height="13" rx="2"/><line x1="8" y1="20.5" x2="16" y2="20.5"/><line x1="12" y1="17" x2="12" y2="20.5"/>`,
  review: `<polygon points="12 2.5 14.7 8.8 21.5 9.4 16.3 13.9 17.9 20.6 12 17 6.1 20.6 7.7 13.9 2.5 9.4 9.3 8.8"/>`,
  ranking: `<line x1="4" y1="21" x2="4" y2="13"/><line x1="10" y1="21" x2="10" y2="6"/><line x1="16" y1="21" x2="16" y2="16"/><line x1="21" y1="21" x2="21" y2="10"/>`,
  compare: `<rect x="3" y="4" width="7" height="17" rx="1.5"/><rect x="14" y="4" width="7" height="17" rx="1.5"/>`,
  guide: `<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8.5" y1="7" x2="15.5" y2="7"/><line x1="8.5" y1="11" x2="15.5" y2="11"/>`,
  cart: `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
  stand: `<path d="M4 18h16"/><path d="M7.5 18 9.5 8h5l2 10"/><line x1="9" y1="13" x2="15" y2="13"/>`,
  mic: `<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/>`,
  light: `<rect x="4" y="4" width="16" height="4" rx="2"/><line x1="8" y1="12" x2="8" y2="15"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="16" y1="12" x2="16" y2="15"/>`,
  footrest: `<path d="M3 19h18"/><path d="M5 19v-3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><line x1="9" y1="14" x2="15" y2="14"/>`,
  wristrest: `<rect x="2" y="9" width="20" height="7" rx="3.5"/><line x1="7" y1="12.5" x2="17" y2="12.5"/>`,
  monitorarm: `<rect x="8" y="3" width="11" height="8" rx="1.5"/><path d="M13 11v3"/><path d="M13 14H6"/><path d="M6 14v-5"/>`,
  cpu: `<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="0.5"/><line x1="9" y1="2" x2="9" y2="6"/><line x1="15" y1="2" x2="15" y2="6"/><line x1="9" y1="18" x2="9" y2="22"/><line x1="15" y1="18" x2="15" y2="22"/><line x1="2" y1="9" x2="6" y2="9"/><line x1="2" y1="15" x2="6" y2="15"/><line x1="18" y1="9" x2="22" y2="9"/><line x1="18" y1="15" x2="22" y2="15"/>`,
  gpu: `<rect x="2" y="7" width="20" height="10" rx="2"/><circle cx="8" cy="12" r="2.1"/><circle cx="14" cy="12" r="2.1"/><line x1="19" y1="7" x2="19" y2="4"/><line x1="4.5" y1="17" x2="4.5" y2="20"/>`,
  cable: `<path d="M4 4v6a4 4 0 0 0 4 4h8a4 4 0 0 1 4 4v6"/><circle cx="4" cy="4" r="2"/><circle cx="20" cy="20" r="2"/>`,
  tablet: `<rect x="3" y="3" width="18" height="15" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><path d="M14 9l3 3-5 5-3 1 1-3z"/>`,
  reader: `<path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><line x1="8.5" y1="10" x2="8.5" y2="15"/><line x1="12" y1="10" x2="12" y2="15"/><line x1="15.5" y1="10" x2="15.5" y2="15"/>`,
  case: `<path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"/>`,
  macropad: `<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="6" y="6" width="4.5" height="4.5" rx="1"/><rect x="13.5" y="6" width="4.5" height="4.5" rx="1"/><rect x="6" y="13.5" width="4.5" height="4.5" rx="1"/><rect x="13.5" y="13.5" width="4.5" height="4.5" rx="1"/>`,
  motherboard: `<rect x="3" y="3" width="18" height="18" rx="1.5"/><rect x="7" y="7" width="6" height="6" rx="0.5"/><line x1="3" y1="9.5" x2="1" y2="9.5"/><line x1="3" y1="13.5" x2="1" y2="13.5"/><line x1="21" y1="9.5" x2="23" y2="9.5"/><line x1="21" y1="13.5" x2="23" y2="13.5"/><line x1="16" y1="16" x2="19" y2="16"/><line x1="16" y1="18.5" x2="19" y2="18.5"/>`,
  psu: `<rect x="2" y="6" width="20" height="12" rx="1.5"/><circle cx="9" cy="12" r="3.2"/><line x1="15.5" y1="9" x2="18.5" y2="9"/><line x1="15.5" y1="15" x2="18.5" y2="15"/>`,
  thermalpaste: `<rect x="10" y="2" width="4" height="8" rx="1"/><path d="M9 10h6l-0.8 9.2a2 2 0 0 1-4.4 0z"/>`,
  ram: `<rect x="6" y="2" width="12" height="20" rx="1"/><line x1="9" y1="5" x2="9" y2="8.5"/><line x1="12" y1="5" x2="12" y2="8.5"/><line x1="15" y1="5" x2="15" y2="8.5"/><line x1="9" y1="12" x2="9" y2="15.5"/><line x1="12" y1="12" x2="12" y2="15.5"/><line x1="15" y1="12" x2="15" y2="15.5"/>`,
  storage: `<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><line x1="14" y1="10" x2="18" y2="10"/><line x1="14" y1="14" x2="18" y2="14"/>`,
  cooler: `<circle cx="12" cy="12" r="9.5"/><path d="M12 12 15.8 6.6"/><path d="M12 12 6.3 9.3"/><path d="M12 12 13.1 18.8"/><circle cx="12" cy="12" r="1.6"/>`,
  wifi: `<path d="M2 8.5c5.5-5.3 14.5-5.3 20 0"/><path d="M5.5 12.5c3.6-3.4 9.4-3.4 13 0"/><path d="M9 16.5c1.8-1.7 4.2-1.7 6 0"/><circle cx="12" cy="20" r="1.2"/>`,
  code: `<polyline points="8.5 7 3 12 8.5 17"/><polyline points="15.5 7 21 12 15.5 17"/><line x1="13.5" y1="4" x2="10.5" y2="20"/>`,
  sparkle: `<path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/><path d="M19 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>`,
  diagnosis: `<circle cx="12" cy="12" r="9.5"/><polyline points="7.5 12.5 10.5 15.5 16.5 8.5"/>`,
  heart: `<path d="M12 21s-7.5-4.6-10-9.1C.5 8.6 2 5 5.5 5c2 0 3.3 1 4.5 2.5C11.2 6 12.5 5 14.5 5 18 5 19.5 8.6 22 11.9 19.5 16.4 12 21 12 21z"/>`,
  search: `<circle cx="10.5" cy="10.5" r="7"/><line x1="21" y1="21" x2="15.5" y2="15.5"/>`,
  clock: `<circle cx="12" cy="12" r="9.5"/><polyline points="12 6.5 12 12 16.5 14.5"/>`,
  briefcase: `<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="2" y1="12.5" x2="22" y2="12.5"/>`,
  gamepad: `<rect x="3" y="7" width="18" height="11" rx="5.5"/><line x1="7" y1="11" x2="7" y2="14.5"/><line x1="5.25" y1="12.75" x2="8.75" y2="12.75"/><circle cx="16" cy="10.5" r="1"/><circle cx="18" cy="13" r="1"/>`,
  video: `<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3.5v11L16 14z"/>`,
  broadcast: `<circle cx="12" cy="12" r="2.5"/><path d="M7.5 8.5a6.5 6.5 0 0 0 0 7"/><path d="M16.5 8.5a6.5 6.5 0 0 1 0 7"/><path d="M4.5 5.5a10.5 10.5 0 0 0 0 13"/><path d="M19.5 5.5a10.5 10.5 0 0 1 0 13"/>`,
};

// Hand-authored "network" illustration for the homepage hero — replaces a
// stock photo with an SVG scene in the same line-icon language as ICONS
// above (currentColor strokes, no external asset). site.js/style.css drive
// the entrance draw and idle float; this is purely the static markup.
const HERO_NETWORK_SVG = `<svg class="net" viewBox="0 0 440 400" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g class="net-edges" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
    <line x1="55" y1="115" x2="130" y2="55"/>
    <line x1="130" y1="55" x2="225" y2="35"/>
    <line x1="225" y1="35" x2="325" y2="60"/>
    <line x1="325" y1="60" x2="395" y2="140"/>
    <line x1="395" y1="140" x2="385" y2="245"/>
    <line x1="385" y1="245" x2="310" y2="325"/>
    <line x1="310" y1="325" x2="205" y2="355"/>
    <line x1="205" y1="355" x2="100" y2="300"/>
    <line x1="100" y1="300" x2="35" y2="195"/>
    <line x1="35" y1="195" x2="55" y2="115"/>
    <line x1="225" y1="35" x2="220" y2="166"/>
    <line x1="395" y1="140" x2="244" y2="190"/>
    <line x1="205" y1="355" x2="220" y2="214"/>
    <line x1="35" y1="195" x2="196" y2="190"/>
  </g>
  <rect class="net-hub" x="196" y="166" width="48" height="48" rx="12" stroke-width="2"/>
  <text class="net-hub-mark" x="220" y="191" text-anchor="middle" dominant-baseline="central">AI</text>
  <g class="net-nodes">
    <circle cx="55" cy="115" r="5"/>
    <circle cx="130" cy="55" r="4"/>
    <circle cx="225" cy="35" r="5.5"/>
    <circle cx="325" cy="60" r="4"/>
    <circle class="accent" cx="395" cy="140" r="6.5"/>
    <circle cx="385" cy="245" r="4"/>
    <circle cx="310" cy="325" r="5"/>
    <circle class="accent" cx="205" cy="355" r="6"/>
    <circle cx="100" cy="300" r="4.5"/>
    <circle cx="35" cy="195" r="5"/>
  </g>
</svg>`;

function icon(name, extraAttrs = "") {
  const body = ICONS[name];
  if (!body) throw new Error(`Unknown icon "${name}"`);
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extraAttrs}>${body}</svg>`;
}

function iconBadge(name, color) {
  return `<span class="icon-badge ${color}">${icon(name)}</span>`;
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT_DIR, relPath), "utf8"));
}

function amazonLink(product) {
  const url = new URL(product.url);
  url.searchParams.set("tag", AMAZON_TAG);
  return url.toString();
}

// A product may carry an Amazon link (`url`), a Rakuten ROOM link
// (`roomUrl`), or both — whichever the article author found easier to
// write up / expects to convert better for that item. At least one should
// be present, but neither is hard-required so a ROOM-only product works.
function renderCtaButtons(product) {
  const buttons = [];
  if (product.url) {
    buttons.push(
      `<a class="btn-amazon" href="${amazonLink(product)}" rel="nofollow sponsored noopener" target="_blank">${icon("cart")}Amazonで見る</a>`
    );
  }
  if (product.roomUrl) {
    buttons.push(
      `<a class="btn-room" href="${escapeHtml(product.roomUrl)}" rel="nofollow sponsored noopener" target="_blank">${icon("cart")}楽天ROOMで見る</a>`
    );
  }
  return `<div class="cta-row">${buttons.join("")}</div>`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function section(innerHtml, { tint = false, invert = false, reveal = true } = {}) {
  const variant = invert ? " invert" : tint ? " tint" : "";
  return `<section class="section${variant}"${reveal ? ' data-reveal=""' : ""}><div class="wrap">${innerHtml}</div></section>`;
}

// Japanese eyebrow label + a small English kicker beside it — decorative
// typographic texture (see .eyebrow-en in style.css), not a translation the
// visitor is expected to read.
function eyebrowHtml(jaText, enText) {
  return `<p class="eyebrow">${escapeHtml(jaText)}<span class="eyebrow-en">${escapeHtml(enText)}</span></p>`;
}

// Block bodies are allowed a small set of inline tags (e.g. <a href>) written
// directly by whoever authored the content entry, so blocks are NOT escaped —
// only plain strings coming from data (like table cells, product fields) are escaped.
function renderProductCard(product) {
  const badgeColor = CATEGORY_COLOR[product.category] || "blue";
  const badgeLabel = CATEGORY_LABEL_JA[product.category] || product.category;
  return `<div class="card">
  <div class="card-top">${iconBadge(product.category, badgeColor)}<span class="badge ${badgeColor}">${escapeHtml(badgeLabel)}</span><button type="button" class="fav-btn" data-fav-asin="${escapeHtml(product.asin)}" aria-label="気になるリストに追加">${icon("heart")}</button></div>
  <h3>${escapeHtml(product.name)}</h3>
  <p class="price"><span class="num-mono">¥${product.price.toLocaleString("ja-JP")}</span>${escapeHtml(product.priceNote || "")}</p>
  <p>${escapeHtml(product.summary || "")}</p>
  <ul>${(product.pros || []).map((x) => `<li>◎ ${escapeHtml(x)}</li>`).join("")}${(product.cons || []).map((x) => `<li>△ ${escapeHtml(x)}</li>`).join("")}</ul>
  ${renderCtaButtons(product)}
</div>`;
}

function renderTable(table) {
  const head = `<tr>${table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`;
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
}

// Real Amazon ASINs used by the PC diagnosis rules engine (see
// renderDiagnosis below). Kept as one table so every ASIN referenced by the
// client-side scoring logic is guaranteed to exist in productsMap — the
// build fails loudly (see the validation loop just below the table's use)
// rather than shipping a diagnosis result that links to nothing.
const DIAGNOSIS_CATALOG = {
  cpuApuAmd: "B092L9GF5N", // Ryzen 5 5600G — AM4, no dGPU needed, real iGPU
  cpuAm4Amd: "B09VCHR1VH", // Ryzen 5 5600 — AM4/DDR4, budget mid-tier for discrete-GPU builds
  cpuMidAmd: "B0BS8PRCYV", // Ryzen 5 7600 — AM5/DDR5
  cpuHighAmd: "B0D6NN87T8", // Ryzen 9 9900X — AM5, 12C/24T, no bundled cooler
  cpuX3D: "B0DKFMSMYK", // Ryzen 7 9800X3D — AM5, no bundled cooler, best-in-class competitive-gaming cache
  cpuIntel: "B0DT2WX4X8", // Core Ultra 5 225F — LGA1851, no iGPU (F), 2026-current Intel value pick
  moboAm4: "B08G1Y95SZ",
  moboAm5: "B0F3DG1NVW", // has WiFi built in
  moboIntel: "B0DRTV8HQY", // B860 LGA1851, has WiFi built in
  gpuMid: "B0972BP9YR", // RTX 5060 8GB
  gpuVram: "B0F4XC69KL", // RTX 5060 Ti 16GB — VRAM-priority tier (AI image gen / heavy modern titles)
  gpuVramAmd: "B0FY2G9YGH", // RX 9060 XT 16GB — cheaper VRAM alt, CUDA-incompatible, mentioned only as a note
  gpuHigh: "B0DX7JJ87N", // RTX 5070 12GB
  ramDdr4: "B08C53LL9J", // 16GB(8GBx2)
  ramDdr5_16: "B0F1FW31Y8", // 16GB(8GBx2) — for light Intel builds where 32GB is overkill
  ramDdr5: "B0C2B7W1W4", // 32GB(16GBx2)
  ramDdr5_64: "B0BD4SRW3H", // 64GB(32GBx2) — real 2-stick 64GB kit, AMD/Intel both
  storage: "B0DGKMQPYC", // 1TB
  storage2tb: "B0DGKTMN6L", // 2TB — swappable with `storage` for heavy footage/asset use
  case: "B0DQPMJ6MJ", // airflow-focused
  caseQuiet: "B0B55YL7TP", // acoustic-dampened — swappable with `case`
  psu: "B0DKT9JRF1",
  paste: "B0795DP124",
  cooler: "B09NZB9Z9Z", // needed with cpuHighAmd / cpuX3D (neither ships with a cooler)
  wifiAdapter: "B0D1K9NX2T", // USB Wi-Fi 6 adapter — added when the picked board has no WiFi and the visitor is Wi-Fi-only
};
// Categories the result UI lets a visitor swap in place, without
// recomputing the whole diagnosis — e.g. "keep everything, just give me the
// quiet case instead". Each entry is the pair of catalog keys that are
// interchangeable; swapping never changes any other part or requires a
// compatibility recheck. GPU tier is deliberately NOT swappable here since
// an AI-image-gen build requires CUDA and a naive swap could silently hand
// someone a GPU their workflow can't use — that's handled with a plain-text
// note instead (see gpuVramAmd in compute()).
const DIAGNOSIS_SWAPS = [
  { category: "case", options: ["case", "caseQuiet"], labels: { case: "通気重視", caseQuiet: "静音重視" } },
  { category: "storage", options: ["storage", "storage2tb"], labels: { storage: "1TB", storage2tb: "2TB" } },
];
// Real-world reference costs used by the budget math (see compute()).
// Windows 11 Home パッケージ版の実勢最安値(2026年9月時点、価格.com調べ)。
const OS_LICENSE_COST = 16500;
// 組み立て代行の実勢レンジ(2026年9月調査、他店購入パーツ持ち込み時)。
// ドスパラ簡易プラン+持ち込み¥22,000〜ドスパラ通常プラン+持ち込み¥33,000。
// 中央値として表示に使う代表額と、実際にはレンジがあることを notes で明記する。
const ASSEMBLY_SERVICE_FEE = 25000;
const ASSEMBLY_SERVICE_FEE_RANGE = "1.1万円〜3.3万円(店舗・プランにより変動)";

// Non-PC-part products from the main catalog worth suggesting alongside a
// diagnosis result — the site's existing desk-gadget content is otherwise
// invisible from the diagnosis flow even though a new PC is exactly when
// someone shops for a keyboard/monitor/mic too. Picked per use-case in
// compute() below (see ACCESSORY_RULES); never swappable, never affects
// the budget math — purely an upsell shelf.
const ACCESSORY_CATALOG = {
  keyboard: "B0DH88QC5B", // REALFORCE RC1
  mouse: "B0B1Q6VB16", // Logicool MX Master 3S
  monitor: "B0F23FWBJL", // Dell S2725QC-A 27インチ4K
  mic: "ROOM-SOLOCAST2", // HyperX SoloCast 2
  macropad: "ROOM-STREAMDECKNEO", // Elgato Stream Deck Neo
  tablet: "ROOM-XPPEN12", // XPPen Artist 12 3rd
};

// Rules-based PC diagnosis engine. Unlike a simple answer-combination lookup
// table, this asks several questions (some multi-select, since use cases
// like "gaming" and "video editing" genuinely overlap — someone who streams
// their gameplay and then edits the recording needs both) and computes a
// full parts list — CPU *and* motherboard, RAM, storage, case, PSU, thermal
// paste, cooler where needed — from real requirement rules, not a fixed
// answer→result map. All scoring happens client-side in the visitor's own
// browser; nothing is sent anywhere.
// Icons for the diagnosis's most visually prominent question (use cases)
// and the one where the icon directly echoes a real product category
// (noise → case/cooler). Every other question stays text-only rather than
// forcing an icon onto options where one wouldn't add real meaning.
const DIAGNOSIS_OPTION_ICONS = {
  "usecases:office": ["briefcase", "blue"],
  "usecases:programming": ["code", "green"],
  "usecases:illustration": ["tablet", "green"],
  "usecases:ai_image": ["sparkle", "orange"],
  "usecases:local_llm": ["sparkle", "blue"],
  "usecases:gaming": ["gamepad", "orange"],
  "usecases:streaming": ["broadcast", "blue"],
  "usecases:video": ["video", "orange"],
  "noise:airflow": ["cooler", "blue"],
  "noise:quiet": ["case", "green"],
};

function renderDiagnosis(diag, productsMap) {
  const uid = diag.id || "diagnosis";
  const catalogAsins = [...new Set([...Object.values(DIAGNOSIS_CATALOG), ...Object.values(ACCESSORY_CATALOG)])];
  for (const asin of catalogAsins) {
    if (!productsMap[asin]) throw new Error(`Diagnosis catalog references unknown product asin "${asin}"`);
  }
  // Every card the engine could ever show is pre-rendered server-side once;
  // the client just picks which ASINs to reveal and injects the matching
  // markup, instead of re-implementing card rendering in JS.
  const cardsByAsin = {};
  for (const asin of catalogAsins) cardsByAsin[asin] = renderProductCard(productsMap[asin]);
  const pricesByAsin = {};
  for (const asin of catalogAsins) pricesByAsin[asin] = productsMap[asin].price;
  const categoryLabelByAsin = {};
  for (const asin of catalogAsins) categoryLabelByAsin[asin] = CATEGORY_LABEL_JA[productsMap[asin].category] || productsMap[asin].category;
  const nameByAsin = {};
  for (const asin of catalogAsins) nameByAsin[asin] = productsMap[asin].name;

  const stepsHtml = diag.questions
    .map((q, i) => {
      const options = q.options
        .map((opt) => {
          const iconDef = DIAGNOSIS_OPTION_ICONS[`${q.key}:${opt.value}`];
          const iconHtml = iconDef ? iconBadge(iconDef[0], iconDef[1]) : "";
          return `<button type="button" class="quiz-option${iconDef ? " has-icon" : ""}" data-value="${escapeHtml(opt.value)}">
        ${iconHtml}
        <span class="quiz-option-text"><span class="quiz-option-label">${escapeHtml(opt.label)}</span>
        <span class="quiz-option-desc">${escapeHtml(opt.desc)}</span></span>
      </button>`;
        })
        .join("\n");
      const nextBtn = q.type === "multi" ? `<button type="button" class="quiz-next" disabled>次へ →</button>` : "";
      return `<div class="quiz-step" data-step-index="${i}" data-key="${escapeHtml(q.key)}" data-type="${q.type}"${i === 0 ? "" : " hidden"}>
      <p class="quiz-step-count">STEP ${i + 1} / ${diag.questions.length}</p>
      <h3 class="quiz-question">${escapeHtml(q.question)}</h3>
      <div class="quiz-options" data-multi="${q.type === "multi"}">${options}</div>
      ${nextBtn}
    </div>`;
    })
    .join("\n");

  const dots = diag.questions.map((_, i) => `<span class="quiz-dot" data-dot-index="${i}"></span>`).join("");

  return `<div class="quiz" id="${uid}" data-quiz>
  <div class="quiz-progress">${dots}</div>
  <div class="quiz-steps">${stepsHtml}</div>
  <div class="quiz-results"></div>
</div>
<script>
(function () {
  var root = document.getElementById(${JSON.stringify(uid)});
  if (!root) return;
  var CATALOG = ${JSON.stringify(DIAGNOSIS_CATALOG)};
  var CARDS = ${JSON.stringify(cardsByAsin)};
  var PRICES = ${JSON.stringify(pricesByAsin)};
  var CATEGORY_LABELS = ${JSON.stringify(categoryLabelByAsin)};
  var NAMES = ${JSON.stringify(nameByAsin)};
  var SWAPS = ${JSON.stringify(DIAGNOSIS_SWAPS)};
  var GUIDE_ROOT = "../../guides/";
  var OS_LICENSE_COST = ${JSON.stringify(OS_LICENSE_COST)};
  var ASSEMBLY_SERVICE_FEE = ${JSON.stringify(ASSEMBLY_SERVICE_FEE)};
  var ASSEMBLY_SERVICE_FEE_RANGE = ${JSON.stringify(ASSEMBLY_SERVICE_FEE_RANGE)};
  var ACCESSORIES = ${JSON.stringify(ACCESSORY_CATALOG)};
  var stepKeys = ${JSON.stringify(diag.questions.map((q) => q.key))};
  var stepTypes = ${JSON.stringify(diag.questions.map((q) => q.type))};
  var stepDependsOn = ${JSON.stringify(diag.questions.map((q) => q.dependsOn || null))};
  var answers = {};
  var resultState = null; // set by showResult(); mutated by swap clicks
  var stepEls = root.querySelectorAll(".quiz-step");
  var dotEls = root.querySelectorAll(".quiz-dot");
  var resultsBox = root.querySelector(".quiz-results");

  function yen(n) { return "\\u00a5" + n.toLocaleString("ja-JP"); }

  // Encodes the current answers into the URL's query string (one param per
  // question, multi-select joined by commas) so a shared link reproduces
  // the exact same result instead of dropping the visitor back at step 1 —
  // the whole point of the "Xでシェア" button. Uses replaceState, not
  // pushState, so retrying doesn't pollute browser history with every step.
  function syncAnswersToUrl() {
    if (typeof URLSearchParams === "undefined" || !window.history || !window.history.replaceState) return;
    var params = new URLSearchParams();
    stepKeys.forEach(function (k) {
      var v = answers[k];
      if (v === undefined || v === null) return;
      var s = Array.isArray(v) ? v.join(",") : String(v);
      if (s) params.set(k, s);
    });
    var q = params.toString();
    var next = q ? "?" + q : window.location.pathname;
    window.history.replaceState(null, "", next);
  }

  // Reverse of syncAnswersToUrl(), run once on load. Returns true if any
  // answers were restored, so the caller can jump straight to the result
  // instead of showing step 1.
  function restoreAnswersFromUrl() {
    if (typeof URLSearchParams === "undefined" || !window.location.search) return false;
    var params = new URLSearchParams(window.location.search);
    var restored = {};
    var found = false;
    stepKeys.forEach(function (k, i) {
      if (!params.has(k)) return;
      var raw = params.get(k);
      restored[k] = stepTypes[i] === "multi" ? raw.split(",").filter(Boolean) : raw;
      found = true;
    });
    if (!found) return false;
    answers = restored;
    return true;
  }

  function shouldSkip(index) {
    var dep = stepDependsOn[index];
    if (!dep) return false;
    var given = answers[dep.key];
    if (given === undefined) return true;
    var givenArr = Array.isArray(given) ? given : [given];
    return !dep.anyOf.some(function (v) { return givenArr.indexOf(v) !== -1; });
  }

  function showStep(index) {
    stepEls.forEach(function (el) { el.hidden = Number(el.dataset.stepIndex) !== index; });
    dotEls.forEach(function (el, i) { el.classList.toggle("is-active", i === index); });
    resultsBox.hidden = true;
    root.querySelector(".quiz-steps").hidden = false;
  }

  // --- scoring: turn the answers into a concrete parts list + copy ---
  var BUDGET_MAP = { "10": 100000, "15": 150000, "20": 200000, "30": 300000, "40": 400000, "99": Infinity };
  var BUDGET_LABEL_MAP = { "10": "\\uff5e10\\u4e07\\u5186", "15": "10\\u4e07\\uff5e15\\u4e07\\u5186", "20": "15\\u4e07\\uff5e20\\u4e07\\u5186", "30": "20\\u4e07\\uff5e30\\u4e07\\u5186", "40": "30\\u4e07\\uff5e40\\u4e07\\u5186", "99": "40\\u4e07\\u5186\\u4ee5\\u4e0a" };
  var USECASE_LABELS = { office: "\\u30aa\\u30d5\\u30a3\\u30b9\\u30fb AI\\u30c1\\u30e3\\u30c3\\u30c8", programming: "\\u30d7\\u30ed\\u30b0\\u30e9\\u30df\\u30f3\\u30b0", illustration: "\\u30a4\\u30e9\\u30b9\\u30c8", ai_image: "AI\\u753b\\u50cf\\u751f\\u6210", local_llm: "\\u30ed\\u30fc\\u30ab\\u30ebLLM", gaming: "\\u30b2\\u30fc\\u30df\\u30f3\\u30b0", streaming: "\\u30b2\\u30fc\\u30e0\\u914d\\u4fe1", video: "\\u52d5\\u753b\\u7de8\\u96c6" };

  // Builds the concrete parts list (CPU/mobo/RAM/GPU + accessories) for a
  // given set of requirement tiers on the Windows side. Kept separate from
  // compute() so the same logic can run twice: once for the initial pick,
  // once more if that pick needs a budget-driven GPU step-down. Returns
  // both the ASIN list and enough metadata (per-part reasoning) to build
  // the result text without recomputing anything.
  function buildWindowsParts(req) {
    var windowsPlatform = req.platformPref === "intel" ? "intel" : "amd";
    var cpuAsin, moboAsin, ramAsin, needsCooler = false, cpuNote = null;
    if (windowsPlatform === "intel") {
      cpuAsin = CATALOG.cpuIntel;
      moboAsin = CATALOG.moboIntel;
      ramAsin = req.ramGB >= 64 ? CATALOG.ramDdr5_64 : req.ramGB <= 16 ? CATALOG.ramDdr5_16 : CATALOG.ramDdr5;
      // Core Ultra 5 225F has no iGPU (F suffix) — a monitor needs *some*
      // GPU, so a pure-office Intel pick can't be GPU-less the way the AMD
      // APU path can.
      if (req.gpuTier === 0) { req.gpuTier = 1; cpuNote = "Core Ultra 5 225F\\u306f\\u5185\\u8535GPU\\u975e\\u642d\\u8f09(F\\u4ed8\\u304d)\\u306e\\u305f\\u3081\\u3001\\u30e2\\u30cb\\u30bf\\u30fc\\u51fa\\u529b\\u7528\\u306b\\u6700\\u4f4e\\u9650\\u306e\\u30b0\\u30e9\\u30dc\\u3092\\u4ed8\\u3051\\u3066\\u3044\\u307e\\u3059\\u3002"; }
    } else if (req.wantsHighCore) {
      cpuAsin = CATALOG.cpuHighAmd; moboAsin = CATALOG.moboAm5; needsCooler = true;
      ramAsin = req.ramGB >= 64 ? CATALOG.ramDdr5_64 : CATALOG.ramDdr5;
    } else if (req.wantsX3D) {
      cpuAsin = CATALOG.cpuX3D; moboAsin = CATALOG.moboAm5; needsCooler = true;
      ramAsin = req.ramGB >= 64 ? CATALOG.ramDdr5_64 : CATALOG.ramDdr5;
    } else if (req.wantsMidCore || req.gpuTier >= 1) {
      // 2026's DDR5 price surge makes the AM4/DDR4 platform a genuine
      // budget move at this performance tier, not just an old leftover —
      // so low-budget mid-tier builds default to it instead of AM5/DDR5.
      if ((req.budgetNum <= 15) && req.gpuTier <= 1) {
        cpuAsin = CATALOG.cpuAm4Amd; moboAsin = CATALOG.moboAm4; ramAsin = CATALOG.ramDdr4;
      } else {
        cpuAsin = CATALOG.cpuMidAmd; moboAsin = CATALOG.moboAm5;
        ramAsin = req.ramGB >= 64 ? CATALOG.ramDdr5_64 : CATALOG.ramDdr5;
      }
    } else {
      cpuAsin = CATALOG.cpuApuAmd; moboAsin = CATALOG.moboAm4; ramAsin = CATALOG.ramDdr4;
    }
    var gpuAsin = req.gpuTier >= 3 ? CATALOG.gpuHigh : req.gpuTier === 2 ? CATALOG.gpuVram : req.gpuTier === 1 ? CATALOG.gpuMid : null;
    var storageAsin = req.storage === "2tb" ? CATALOG.storage2tb : CATALOG.storage;
    var caseAsin = req.noise === "quiet" ? CATALOG.caseQuiet : CATALOG.case;

    var asins = [cpuAsin];
    if (gpuAsin) asins.push(gpuAsin);
    asins.push(moboAsin, ramAsin, storageAsin, caseAsin, CATALOG.psu, CATALOG.paste);
    if (needsCooler) asins.push(CATALOG.cooler);
    var needsWifiAdapter = req.network === "wifi_only" && moboAsin === CATALOG.moboAm4;
    if (needsWifiAdapter) asins.push(CATALOG.wifiAdapter);

    var partsTotal = asins.reduce(function (sum, a) { return sum + (PRICES[a] || 0); }, 0);
    return { windowsPlatform: windowsPlatform, cpuAsin: cpuAsin, moboAsin: moboAsin, ramAsin: ramAsin, gpuAsin: gpuAsin, storageAsin: storageAsin, caseAsin: caseAsin, needsCooler: needsCooler, needsWifiAdapter: needsWifiAdapter, cpuNote: cpuNote, asins: asins, partsTotal: partsTotal };
  }

  // Suggests up to 3 existing site products (keyboard/mouse/monitor/mic/
  // macropad/tablet) that pair naturally with the selected use cases — a
  // new-PC diagnosis is exactly when someone also shops for these, and
  // otherwise the site's existing desk-gadget content is invisible from
  // this flow. Never affects the budget math; purely a suggestion shelf.
  function pickAccessories(usecases, wantsMonitor) {
    var has = function (v) { return usecases.indexOf(v) !== -1; };
    var keys = [];
    if (has("streaming")) { keys.push("mic"); keys.push("macropad"); }
    if (has("illustration")) keys.push("tablet");
    if (wantsMonitor) keys.push("monitor");
    if (has("office") || has("programming") || has("gaming")) { keys.push("keyboard"); keys.push("mouse"); }
    var seen = {}, out = [];
    keys.forEach(function (k) {
      var asin = ACCESSORIES[k];
      if (asin && !seen[asin]) { seen[asin] = true; out.push(asin); }
    });
    return out.slice(0, 3);
  }

  function compute() {
    var usecases = answers.usecases || [];
    if (!usecases.length) usecases = ["office"];
    var has = function (v) { return usecases.indexOf(v) !== -1; };
    var hasProgramming = has("programming"), hasIllustration = has("illustration"),
      hasAiImage = has("ai_image"), hasLocalLlm = has("local_llm"),
      hasGaming = has("gaming"), hasStreaming = has("streaming"), hasVideo = has("video");
    var heavyCount = [hasGaming, hasStreaming, hasVideo, hasAiImage, hasLocalLlm].filter(Boolean).length;

    var videoHeavy = hasVideo && answers.videoIntensity === "heavy";
    var aiHeavy = (hasAiImage || hasLocalLlm) && answers.aiScale === "heavy";
    var competitive = (hasGaming || hasStreaming) && answers.gameGenre === "competitive";
    var heavyAaa = (hasGaming || hasStreaming) && answers.gameGenre === "heavy_aaa";

    var gpuTier = 0; // 0 none, 1 entry(RTX5060 8GB), 2 vram(RTX5060 Ti 16GB), 3 high(RTX5070 12GB)
    var ramGB = 16;
    var wantsX3D = false, wantsHighCore = false, wantsMidCore = false;
    var needsCuda = hasAiImage || hasLocalLlm;

    if (hasProgramming) { ramGB = Math.max(ramGB, 32); wantsMidCore = true; }
    if (hasIllustration) gpuTier = Math.max(gpuTier, 1);
    if (hasAiImage || hasLocalLlm) {
      gpuTier = Math.max(gpuTier, aiHeavy ? 3 : 2);
      ramGB = Math.max(ramGB, 32);
    }
    if (hasGaming) gpuTier = Math.max(gpuTier, 1);
    if (hasStreaming) { wantsMidCore = true; ramGB = Math.max(ramGB, 32); gpuTier = Math.max(gpuTier, 1); }
    if (hasVideo) {
      ramGB = Math.max(ramGB, 32);
      if (videoHeavy) { gpuTier = Math.max(gpuTier, 3); wantsHighCore = true; ramGB = Math.max(ramGB, 64); }
      else gpuTier = Math.max(gpuTier, 1);
    }
    if ((hasGaming || hasStreaming) && answers.resolution === "wqhd_uhd") gpuTier = Math.max(gpuTier, 3);
    if ((hasGaming || hasStreaming) && answers.resolution === "fhd144" && !competitive) gpuTier = Math.max(gpuTier, 2);
    if (heavyAaa) gpuTier = Math.max(gpuTier, 2);
    if (competitive) wantsX3D = true;
    if (heavyCount >= 2) { ramGB = Math.max(ramGB, 32); wantsMidCore = true; }
    if (heavyCount >= 3) { ramGB = Math.max(ramGB, 64); wantsHighCore = true; }

    var usecaseText = usecases.map(function (u) { return USECASE_LABELS[u] || u; }).join("\\u30fb");

    var software = answers.software;
    var appleWorkflow = answers.appleWorkflow || [];
    var effort = answers.effort;
    var platformPref = answers.platform;
    var budgetNum = Number(answers.budget) || 99;

    // Owning an iPhone is not a reason to recommend a Mac — most of Japan
    // owns one. Only concrete workflow needs (moving photos in for editing,
    // Handoff/Continuity, iPad file handoff) count as real signal; "own it
    // but PC work doesn't need it" and "don't use Apple stuff" are both
    // explicitly non-signals so the diagnosis can't default to Mac just
    // because someone picked *something* in that question.
    var integrationReasons = appleWorkflow.filter(function (v) { return ["photo_transfer", "ipad_handoff", "continuity"].indexOf(v) !== -1; });
    var hasAppleIntegrationNeed = integrationReasons.length > 0;
    var needsJpWindowsSoftware = appleWorkflow.indexOf("jp_software") !== -1;
    // A competitive-FPS diet or a local-AI/CUDA workflow both rule Mac out
    // on their own, independent of Apple integration signals.
    var windowsRequired = software === "windows_only" || needsJpWindowsSoftware || competitive || needsCuda;

    var macEligible = !windowsRequired && hasAppleIntegrationNeed && !hasGaming;
    var platform = macEligible ? "mac" : "windows";
    var hybridNote = null;
    if (!macEligible && !windowsRequired && hasAppleIntegrationNeed && hasGaming) {
      hybridNote = "Apple\\u88fd\\u54c1\\u3068\\u306e\\u9023\\u643a\\u304c\\u5fc5\\u8981\\u3068\\u306e\\u3053\\u3068\\u306a\\u306e\\u3067\\u3001\\u30b2\\u30fc\\u30e0\\u4ee5\\u5916\\u306e\\u4f5c\\u696d\\u306f\\u666e\\u6bb5\\u306eMac\\u306b\\u4efb\\u305b\\u3066\\u3001\\u30b2\\u30fc\\u30e0\\u5c02\\u7528\\u6a5f\\u3068\\u3057\\u3066\\u3053\\u306eWindows\\u69cb\\u6210\\u3092\\u5225\\u306b\\u7d44\\u3080\\u300c2\\u53f0\\u6301\\u3061\\u300d\\u3082\\u73fe\\u5b9f\\u7684\\u306a\\u843d\\u3068\\u3057\\u3069\\u3053\\u308d\\u3067\\u3059\\u3002";
    }

    var title, paragraphs = [], asins = [], notes = [], guideLink = null, shareText, budgetInfo = null, buyCompare = null;
    var wantsMonitorAccessory = (hasVideo || hasGaming || hasStreaming) && (answers.resolution === "wqhd_uhd" || videoHeavy);
    var accessories = pickAccessories(usecases, wantsMonitorAccessory);

    if (platform === "mac") {
      title = "\\u81ea\\u4f5cPC\\u3088\\u308a\\u3001Mac\\u3068\\u3044\\u3046\\u9078\\u629e\\u80a2";
      var reasons = [];
      var reasonLabels = {
        photo_transfer: "iPhone\\u3067\\u64ae\\u3063\\u305f\\u5199\\u771f\\u30fb\\u52d5\\u753b\\u3092\\u3059\\u3050\\u4f5c\\u696d\\u306b\\u4f7f\\u3044\\u305f\\u3044\\u3068\\u306e\\u3053\\u3068\\u306a\\u306e\\u3067\\u3001AirDrop\\u3067\\u306e\\u53d7\\u3051\\u6e21\\u3057\\u304c\\u540c\\u3058OS\\u540c\\u58eb\\u3067\\u30b9\\u30e0\\u30fc\\u30ba\\u306aMac\\u304c\\u5408\\u7406\\u7684\\u3067\\u3059\\u3002",
        ipad_handoff: "iPad\\u3067\\u63cf\\u3044\\u305f\\u30fb\\u66f8\\u3044\\u305f\\u3082\\u306e\\u3092\\u305d\\u306e\\u307e\\u307e\\u53d6\\u308a\\u8fbc\\u307f\\u305f\\u3044\\u3068\\u306e\\u3053\\u3068\\u306a\\u306e\\u3067\\u3001Mac\\u306a\\u3089\\u30d5\\u30a1\\u30a4\\u30eb\\u5f62\\u5f0f\\u3084\\u540c\\u671f\\u3092\\u6c17\\u306b\\u305b\\u305a\\u4f5c\\u696d\\u3067\\u304d\\u307e\\u3059\\u3002",
        continuity: "\\u901a\\u77e5\\u30fb\\u30b3\\u30d4\\u30da\\u30fb\\u96fb\\u8a71\\u3092PC\\u3067\\u3082\\u4f7f\\u3044\\u305f\\u3044\\u3068\\u306e\\u3053\\u3068\\u306a\\u306e\\u3067\\u3001Handoff\\u30fbiMessage\\u304c\\u4f7f\\u3048\\u308bMac\\u306e\\u65b9\\u304c\\u4f53\\u9a13\\u3068\\u3057\\u3066\\u4e00\\u6bb5\\u4e0a\\u3067\\u3059\\u3002",
      };
      integrationReasons.forEach(function (r) { if (reasonLabels[r]) reasons.push(reasonLabels[r]); });
      if (videoHeavy) reasons.push("4K\\u7de8\\u96c6\\u30fb\\u30ab\\u30e9\\u30fc\\u30b0\\u30ec\\u30fc\\u30c7\\u30a3\\u30f3\\u30b0\\u3082\\u9078\\u3093\\u3067\\u3044\\u308b\\u306e\\u3067\\u3001Apple Silicon\\u306e\\u30cf\\u30fc\\u30c9\\u30a6\\u30a7\\u30a2\\u30a8\\u30f3\\u30b3\\u30fc\\u30c9\\u306fPremiere Pro\\u30fbDaVinci Resolve\\u3067\\u3082\\u5f37\\u529b\\u306b\\u52b9\\u304d\\u307e\\u3059\\u3002\\u7d71\\u5408\\u30e1\\u30e2\\u30ea\\u3067VRAM\\u4e0d\\u8db3\\u306b\\u3082\\u60a9\\u307f\\u306b\\u304f\\u3044\\u69cb\\u6210\\u3067\\u3059\\u3002");
      else if (hasVideo) reasons.push("\\u52d5\\u753b\\u7de8\\u96c6\\u3082\\u9078\\u3093\\u3067\\u3044\\u308b\\u306e\\u3067\\u3001Apple Silicon\\u306e\\u30cf\\u30fc\\u30c9\\u30a6\\u30a7\\u30a2\\u30a8\\u30f3\\u30b3\\u30fc\\u30c9\\u306f\\u30d5\\u30eb HD\\u4e2d\\u5fc3\\u306e\\u7de8\\u96c6\\u3067\\u3082\\u5feb\\u9069\\u3067\\u3059\\u3002");
      if (software === "mac_ok") reasons.push("\\u4f7f\\u3046\\u4e88\\u5b9a\\u306e\\u30bd\\u30d5\\u30c8\\u3082Mac\\u5bfe\\u5fdc\\u3067\\u5b8c\\u7d50\\u3059\\u308b\\u3068\\u306e\\u3053\\u3068\\u306a\\u306e\\u3067\\u3001\\u7121\\u7406\\u306bWindows\\u3092\\u9078\\u3076\\u7406\\u7531\\u3082\\u3042\\u308a\\u307e\\u305b\\u3093\\u3002");
      paragraphs = reasons;
      notes.push("Apple\\u516c\\u5f0f\\u30b5\\u30a4\\u30c8\\u307e\\u305f\\u306fAmazon\\u3067\\u6700\\u65b0\\u306eMacBook Air/Pro\\u69cb\\u6210\\u3092\\u78ba\\u8a8d\\u3057\\u3066\\u307f\\u3066\\u304f\\u3060\\u3055\\u3044\\u3002\\u30012026\\u5e74\\u306fMac\\u3082\\u5024\\u4e0a\\u304c\\u308a\\u304c\\u7d9a\\u3044\\u3066\\u3044\\u308b\\u306e\\u3067\\u3001\\u8cfc\\u5165\\u76f4\\u524d\\u306b\\u5fc5\\u305a\\u6700\\u65b0\\u4fa1\\u683c\\u3092\\u78ba\\u8a8d\\u3057\\u3066\\u304f\\u3060\\u3055\\u3044\\u3002");
      shareText = "\\u3010AI Desk Labo\\u8a3a\\u65ad\\u3011\\u79c1\\u306b\\u5411\\u3044\\u3066\\u308b\\u306e\\u306f\\u300cMac\\u300d\\u3067\\u3057\\u305f\\ud83c\\udf4e #AIDeskLabo\\u8a3a\\u65ad #Mac";
    } else {
      var gpuTierBeforeIntelForce = gpuTier;
      var req = { platformPref: platformPref, gpuTier: gpuTier, ramGB: ramGB, wantsX3D: wantsX3D, wantsHighCore: wantsHighCore, wantsMidCore: wantsMidCore, budgetNum: budgetNum, storage: answers.storage, noise: answers.noise, network: answers.network };
      var built = buildWindowsParts(req);
      var platformLabel = built.windowsPlatform === "intel" ? "Intel" : "AMD";
      if (built.windowsPlatform === "intel" && gpuTierBeforeIntelForce === 0) {
        notes.push("\\u30b0\\u30e9\\u30dc\\u4e0d\\u8981\\u306a\\u7528\\u9014\\u306a\\u306e\\u3067\\u3001\\u5185\\u8535GPU\\u4ed8\\u304dAMD Ryzen 5 5600G(APU)\\u306b\\u3059\\u308c\\u3070\\u30b0\\u30e9\\u30dc\\u4ee3\\u5206\\u3060\\u3051\\u5b89\\u304f\\u7d44\\u3081\\u307e\\u3059\\u3002");
      }

      // Budget-aware step-down: if the initial pick blows the budget by
      // more than 15%, drop the GPU one tier and recompute once. This never
      // silently removes something the visitor explicitly asked for
      // (a competitive-FPS CPU pick, a 4K-editing RAM floor) — only the GPU
      // tier, which is the least identity-defining lever — and the result
      // always says in plain text whether that happened.
      var ceilCheck = BUDGET_MAP[answers.budget];
      var gpuSteppedDown = false;
      if (ceilCheck !== undefined && ceilCheck !== Infinity) {
        // The budget question asks about parts spend specifically (OS
        // license / assembly fee are shown as separate line items below,
        // since not everyone needs a fresh Windows license) — so the
        // step-down trigger and the budget-vs-actual comparison both use
        // partsTotal alone, not partsTotal+extras.
        if (built.partsTotal > ceilCheck * 1.15 && req.gpuTier > 1) {
          req.gpuTier = req.gpuTier - 1;
          built = buildWindowsParts(req);
          gpuSteppedDown = true;
        }
      }

      title = platformLabel + "\\u69cb\\u6210\\u3067\\u7d44\\u3080\\u3001" + usecaseText + "PC";
      paragraphs.push("\\u9078\\u3093\\u3060\\u7528\\u9014(" + usecaseText + ")\\u3092\\u3082\\u3068\\u306b\\u3001CPU\\u306e\\u30b3\\u30a2\\u6570\\u30fbGPU\\u306e\\u6709\\u7121\\u30fbVRAM\\u30fb\\u30e1\\u30e2\\u30ea\\u5bb9\\u91cf\\u3092\\u6c7a\\u3081\\u3066\\u3044\\u307e\\u3059\\u3002");
      if (gpuTier === 0) paragraphs.push("\\u30b0\\u30e9\\u30d5\\u30a3\\u30c3\\u30af\\u30dc\\u30fc\\u30c9\\u306a\\u3057\\u306eAPU/\\u5185\\u8535GPU\\u69cb\\u6210\\u3067\\u5341\\u5206\\u306a\\u306e\\u3067\\u3001\\u6700\\u3082\\u30b3\\u30b9\\u30c8\\u3092\\u62bc\\u3055\\u3048\\u305f\\u30d1\\u30bf\\u30fc\\u30f3\\u306b\\u3057\\u307e\\u3057\\u305f\\u3002");
      else if (needsCuda) {
        paragraphs.push(aiHeavy
          ? "FLUX\\u3084\\u5927\\u898f\\u6a21\\u306a\\u30ed\\u30fc\\u30ab\\u30ebLLM\\u3092\\u672c\\u683c\\u7684\\u306b\\u4f7f\\u3046\\u60f3\\u5b9a\\u306a\\u306e\\u3067\\u3001VRAM\\u3092\\u512a\\u5148\\u3057\\u305fGPU\\u3092\\u9078\\u3093\\u3067\\u3044\\u307e\\u3059\\u3002AI\\u7528\\u9014\\u306fCUDA\\u5bfe\\u5fdc\\u304c\\u4e8b\\u5b9f\\u4e0a\\u5fc5\\u9808\\u306a\\u306e\\u3067NVIDIA\\u88fd\\u3092\\u9078\\u3093\\u3067\\u3044\\u307e\\u3059\\u3002"
          : "SDXL\\u3084\\u8efd\\u3081\\u306e\\u30ed\\u30fc\\u30ab\\u30ebLLM\\u304b\\u3089\\u8a66\\u3057\\u305f\\u3044\\u60f3\\u5b9a\\u306a\\u306e\\u3067\\u3001VRAM\\u3092\\u4e00\\u5b9a\\u78ba\\u4fdd\\u3057\\u305fNVIDIA\\u88fd GPU\\u3092\\u9078\\u3093\\u3067\\u3044\\u307e\\u3059\\u3002CUDA\\u975e\\u5bfe\\u5fdc\\u306eAMD GPU\\u3067\\u306f\\u3053\\u308c\\u3089\\u306e\\u30c4\\u30fc\\u30eb\\u306f\\u52d5\\u304d\\u307e\\u305b\\u3093\\u3002");
        if (built.gpuAsin === CATALOG.gpuMid) notes.push("VRAM\\u3092\\u3082\\u3046\\u5c11\\u3057\\u78ba\\u4fdd\\u3057\\u305f\\u3044\\u5834\\u5408\\u306f\\u3001VRAM 16GB\\u306eRTX 5060 Ti\\u30b7\\u30ea\\u30fc\\u30ba\\u3078\\u306e\\u30b0\\u30ec\\u30fc\\u30c9\\u30a2\\u30c3\\u30d7\\u3082\\u691c\\u8a0e\\u3057\\u3066\\u304f\\u3060\\u3055\\u3044\\u3002");
      }
      else if (gpuTier === 1) {
        if (hasVideo && !hasGaming && !hasStreaming) paragraphs.push("\\u30d5\\u30eb HD\\u4e2d\\u5fc3\\u306e\\u30ab\\u30c3\\u30c8\\u7de8\\u96c6\\u306a\\u3089\\u3001\\u30df\\u30c9\\u30eb\\u30af\\u30e9\\u30b9\\u306eGPU\\u3067\\u3082\\u66f8\\u304d\\u51fa\\u3057\\u306f\\u5feb\\u9069\\u3067\\u3059\\u3002");
        else if (competitive) paragraphs.push("\\u7af6\\u6280\\u7cfb\\u30bf\\u30a4\\u30c8\\u30eb\\u306fCPU\\u5074\\u304c\\u30dc\\u30c8\\u30eb\\u30cd\\u30c3\\u30af\\u306b\\u306a\\u308a\\u3084\\u3059\\u3044\\u305f\\u3081\\u3001GPU\\u306f\\u30df\\u30c9\\u30eb\\u30af\\u30e9\\u30b9\\u3067\\u5341\\u5206\\u3067\\u3059\\u3002");
        else paragraphs.push("\\u30d5\\u30eb HD\\u9ad8\\u8a2d\\u5b9a\\u30fb60fps\\u4ee5\\u4e0a\\u3092\\u72d9\\u3048\\u308b\\u30df\\u30c9\\u30eb\\u30af\\u30e9\\u30b9\\u306eGPU\\u3092\\u7d44\\u307f\\u5408\\u308f\\u305b\\u3066\\u3044\\u307e\\u3059\\u3002");
      } else if (gpuTier === 2) {
        paragraphs.push(heavyAaa
          ? "\\u30e2\\u30f3\\u30cf\\u30f3\\u30ef\\u30a4\\u30eb\\u30ba\\u306a\\u3069\\u306e\\u91cd\\u91cf\\u7d1a\\u30bf\\u30a4\\u30c8\\u30eb\\u306fVRAM\\u3092\\u591a\\u304f\\u4f7f\\u3046\\u305f\\u3081\\u3001VRAM 16GB\\u30af\\u30e9\\u30b9\\u306eGPU\\u306b\\u3057\\u3066\\u3044\\u307e\\u3059\\u3002"
          : "144fps\\u4ee5\\u4e0a / WQHD\\u4ee5\\u4e0a\\u3092\\u72d9\\u3046\\u8a2d\\u5b9a\\u306a\\u306e\\u3067\\u3001\\u4f59\\u88d5\\u3092\\u6301\\u305f\\u305b\\u305fGPU\\u306b\\u3057\\u3066\\u3044\\u307e\\u3059\\u3002");
      } else {
        if (videoHeavy) paragraphs.push("4K\\u7de8\\u96c6\\u30fb\\u30ab\\u30e9\\u30fc\\u30b0\\u30ec\\u30fc\\u30c7\\u30a3\\u30f3\\u30b0\\u3082\\u898b\\u636e\\u3048\\u3066\\u3001VRAM 12GB\\u4ee5\\u4e0a\\u306eGPU\\u3092\\u9078\\u5b9a\\u3057\\u307e\\u3057\\u305f\\u3002");
        else paragraphs.push("WQHD\\u4ee5\\u4e0a / 4K\\u3092\\u72d9\\u3046\\u8a2d\\u5b9a\\u306a\\u306e\\u3067\\u3001\\u4e0a\\u4f4d\\u30af\\u30e9\\u30b9\\u306eGPU\\u306b\\u3057\\u3066\\u3044\\u307e\\u3059\\u3002");
      }
      // Worded in the past tense on purpose: by the time this note is shown,
      // the step-down has already happened and the totals below already
      // reflect it — saying "予算を超えるため下げています" (present tense,
      // as if still over) reads as contradicting the "予算内に収まってい
      // ます" message that can follow right after once the cheaper GPU
      // brings the total back in range.
      if (gpuSteppedDown) notes.push("最初の候補は予算を大きく超えていたため、GPUを一段階下げて調整しました。下の金額は調整後の構成です。性能を優先する場合は、予算を上げるかGPUを元のクラスに戻すことを検討してください。");

      if (built.windowsPlatform === "amd" && platformPref === "auto") {
        notes.push("\\u300c\\u304a\\u307e\\u304b\\u305b\\u300d\\u306e\\u5834\\u5408\\u306f\\u3001\\u30a2\\u30c3\\u30d7\\u30b0\\u30ec\\u30fc\\u30c9\\u4f59\\u5730\\u3068\\u30b3\\u30b9\\u30d1\\u3092\\u91cd\\u8996\\u3057\\u3066AMD\\u3092\\u57fa\\u672c\\u306b\\u3057\\u3066\\u3044\\u307e\\u3059\\u3002HEVC/10bit\\u7d20\\u6750\\u306e\\u52d5\\u753b\\u7de8\\u96c6\\u3092\\u983b\\u7e41\\u306b\\u3059\\u308b\\u306a\\u3089Intel(Core Ultra 5 225F)\\u306eQuick Sync\\u3082\\u6709\\u529b\\u3067\\u3059\\u3002");
      }
      if (wantsX3D) paragraphs.push("\\u7af6\\u6280\\u7cfb\\u30bf\\u30a4\\u30c8\\u30eb\\u3092\\u9078\\u3093\\u3067\\u3044\\u308b\\u306e\\u3067\\u3001fps\\u306e\\u4f38\\u3073\\u306b\\u76f4\\u7d50\\u3059\\u308b3D V-Cache\\u642d\\u8f09CPU(X3D)\\u306b\\u3057\\u3066\\u3044\\u307e\\u3059\\u3002");
      else if (wantsHighCore) {
        if (heavyCount >= 2) paragraphs.push("\\u8907\\u6570\\u306e\\u7528\\u9014\\u3092\\u540c\\u6642\\u306b\\u3053\\u306a\\u3059\\u60f3\\u5b9a\\u306a\\u306e\\u3067\\u3001\\u30b3\\u30a2\\u6570\\u306e\\u591a\\u3044CPU\\u3068\\u30e1\\u30e2\\u30ea" + ramGB + "GB\\u3092\\u78ba\\u4fdd\\u3057\\u3066\\u3044\\u307e\\u3059\\u3002");
        else paragraphs.push("4K\\u7de8\\u96c6\\u306e\\u30a8\\u30f3\\u30b3\\u30fc\\u30c9\\u30fb\\u66f8\\u304d\\u51fa\\u3057\\u3092\\u8003\\u616e\\u3057\\u3066\\u3001\\u30b3\\u30a2\\u6570\\u306e\\u591a\\u3044CPU\\u306b\\u3057\\u3066\\u3044\\u307e\\u3059\\u3002");
      } else if (wantsMidCore && hasStreaming) paragraphs.push("\\u914d\\u4fe1\\u3057\\u306a\\u304c\\u3089\\u306e\\u30d7\\u30ec\\u30a4\\u3067\\u3082CPU\\u306b\\u4f59\\u88d5\\u3092\\u6301\\u305f\\u305b\\u308b\\u305f\\u3081\\u3001\\u30df\\u30c9\\u30eb\\u30af\\u30e9\\u30b9\\u4ee5\\u4e0a\\u306eCPU\\u306b\\u3057\\u3066\\u3044\\u307e\\u3059\\u3002");

      if (built.cpuAsin === CATALOG.cpuAm4Amd) notes.push("2026\\u5e74\\u306fDDR5\\u30e1\\u30e2\\u30ea\\u304c\\u5927\\u5e45\\u9ad8\\u9a30\\u3057\\u3066\\u3044\\u308b\\u305f\\u3081\\u3001\\u4e88\\u7b97\\u3092\\u62bc\\u3055\\u3048\\u308b\\u76ee\\u7684\\u3067DDR4\\u5bfe\\u5fdc\\u306eAM4\\u30d7\\u30e9\\u30c3\\u30c8\\u30d5\\u30a9\\u30fc\\u30e0\\u3092\\u63d0\\u6848\\u3057\\u3066\\u3044\\u307e\\u3059\\u3002\\u5c06\\u6765\\u306eCPU\\u4e16\\u4ee3\\u30a2\\u30c3\\u30d7\\u30b0\\u30ec\\u30fc\\u30c9\\u306f\\u3067\\u304d\\u307e\\u305b\\u3093\\u3002");
      if (built.cpuNote) notes.push(built.cpuNote);
      if (built.needsWifiAdapter) notes.push("\\u9078\\u3093\\u3060\\u30de\\u30b6\\u30fc\\u30dc\\u30fc\\u30c9\\u306fWi-Fi\\u975e\\u642d\\u8f09\\u306e\\u305f\\u3081\\u3001USB\\u7121\\u7dda LAN\\u5b50\\u6a5f\\u3092\\u8ffd\\u52a0\\u3057\\u3066\\u3044\\u307e\\u3059\\u3002");
      if (hybridNote) notes.push(hybridNote);
      if (videoHeavy && built.storageAsin === CATALOG.storage) notes.push("\\u52d5\\u753b\\u7de8\\u96c6\\u306f\\u7d20\\u6750\\u91cf\\u304c\\u591a\\u304f\\u306a\\u308a\\u304c\\u3061\\u3067\\u3059\\u30021TB SSD\\u3067\\u4e0d\\u8db3\\u3059\\u308b\\u5834\\u5408\\u306f2TB\\u30e2\\u30c7\\u30eb\\u3078\\u306e\\u5165\\u308c\\u66ff\\u3048\\u3001\\u307e\\u305f\\u306f\\u5916\\u4ed8\\u3051SSD\\u306e\\u8ffd\\u52a0\\u3082\\u691c\\u8a0e\\u3057\\u3066\\u304f\\u3060\\u3055\\u3044\\u3002");
      if (effort === "assembly_service") notes.unshift("\\u7d44\\u307f\\u7acb\\u3066\\u306f\\u4efb\\u305b\\u305f\\u3044\\u3068\\u306e\\u3053\\u3068\\u306a\\u306e\\u3067\\u3001\\u4e0b\\u8a18\\u306e\\u30d1\\u30fc\\u30c4\\u3092\\u3054\\u81ea\\u8eab\\u3067\\u8cfc\\u5165\\u3057\\u305f\\u3046\\u3048\\u3001PC\\u30b7\\u30e7\\u30c3\\u30d7\\u306e\\u7d44\\u307f\\u7acb\\u3066\\u4ee3\\u884c\\u30b5\\u30fc\\u30d3\\u30b9(\\u6301\\u3061\\u8fbc\\u307f\\u30d1\\u30fc\\u30c4\\u306e\\u7d44\\u307f\\u7acb\\u3066\\u306e\\u307f\\u3092" + ASSEMBLY_SERVICE_FEE_RANGE + "\\u3067\\u8acb\\u3051\\u8ca0\\u3046\\u30b5\\u30fc\\u30d3\\u30b9)\\u306b\\u4f9d\\u983c\\u3059\\u308b\\u3068\\u30b9\\u30e0\\u30fc\\u30ba\\u3067\\u3059\\u3002");

      asins = built.asins;
      var total = built.partsTotal;
      var extrasNote = "\\u4e0a\\u8a18\\u306f\\u30d1\\u30fc\\u30c4\\u4ee3(\\u8a08" + yen(built.partsTotal) + ")\\u306e\\u307f\\u3067\\u3059\\u3002Windows\\u672a\\u6240\\u6301\\u306a\\u3089\\u30e9\\u30a4\\u30bb\\u30f3\\u30b9\\u4ee3\\u7d04" + yen(OS_LICENSE_COST) + "\\u304c\\u5225\\u9014\\u5fc5\\u8981\\u3067\\u3059\\u3002";
      if (effort === "assembly_service") extrasNote += "\\u7d44\\u307f\\u7acb\\u3066\\u4ee3\\u884c\\u6599(\\u76ee\\u5b89" + yen(ASSEMBLY_SERVICE_FEE) + "\\u3001" + ASSEMBLY_SERVICE_FEE_RANGE + ")\\u3082\\u5225\\u9014\\u304b\\u304b\\u308a\\u307e\\u3059\\u3002";
      notes.push(extrasNote);

      var ceil = BUDGET_MAP[answers.budget];
      var budgetLabel = BUDGET_LABEL_MAP[answers.budget];
      if (ceil !== undefined) budgetInfo = { total: total, ceil: ceil, label: budgetLabel };
      if (ceil !== undefined && ceil !== Infinity && total > ceil * 1.3 && effort !== "compare_all") {
        notes.push("\\u4e88\\u7b97\\u3068\\u306e\\u5dee\\u304c\\u5927\\u304d\\u3044\\u306e\\u3067\\u3001\\u81ea\\u4f5c\\u4ee5\\u5916\\u306e\\u9078\\u629e\\u80a2(\\u5b8c\\u6210\\u54c1\\u30fbMac\\u306a\\u3069)\\u3082\\u6bd4\\u3079\\u3066\\u307f\\u308b\\u4fa1\\u5024\\u304c\\u3042\\u308a\\u307e\\u3059\\u3002\\u300c\\u7d44\\u307f\\u7acb\\u3066\\u306e\\u8208\\u5473\\u300d\\u306e\\u8cea\\u554f\\u3067\\u300c\\u81ea\\u4f5c\\u30fb\\u5b8c\\u6210\\u54c1\\u30fbMac\\u3092\\u6bd4\\u3079\\u3066\\u304b\\u3089\\u6c7a\\u3081\\u305f\\u3044\\u300d\\u3092\\u9078\\u3093\\u3067\\u3082\\u3046\\u4e00\\u5ea6\\u8a3a\\u65ad\\u3059\\u308b\\u3068\\u3001\\u8cb7\\u3044\\u65b9\\u306e\\u6bd4\\u8f03\\u304c\\u898b\\u3089\\u308c\\u307e\\u3059\\u3002");
      }
      var guideSlug = hasVideo ? "pc-build-video-editing" : (hasGaming || hasStreaming) ? "pc-build-gaming" : "pc-build-office";
      guideLink = { href: GUIDE_ROOT + guideSlug + "/", label: "\\u8a73\\u3057\\u3044\\u89e3\\u8aac\\u3092\\u30ac\\u30a4\\u30c9\\u8a18\\u4e8b\\u3067\\u8aad\\u3080" };

      if (effort === "compare_all") {
        var diyTotal = built.partsTotal + OS_LICENSE_COST;
        var assemblyTotal = built.partsTotal + OS_LICENSE_COST + ASSEMBLY_SERVICE_FEE;
        buyCompare = [
          "\\u81ea\\u4f5c(\\u81ea\\u5206\\u3067\\u7d44\\u3080): \\u7d04" + yen(diyTotal) + "\\u3002\\u4e00\\u756a\\u5b89\\u304f\\u3067\\u304d\\u307e\\u3059\\u304c\\u3001\\u7d44\\u307f\\u7acb\\u3066\\u306e\\u624b\\u9593\\u3068\\u77e5\\u8b58\\u304c\\u5fc5\\u8981\\u3067\\u3059\\u3002",
          "\\u7d44\\u307f\\u7acb\\u3066\\u4ee3\\u884c: \\u7d04" + yen(assemblyTotal) + "(\\u4ee3\\u884c\\u6599" + ASSEMBLY_SERVICE_FEE_RANGE + ")\\u3002\\u30d1\\u30fc\\u30c4\\u306f\\u3053\\u306e\\u30da\\u30fc\\u30b8\\u306e\\u30ea\\u30f3\\u30af\\u304b\\u3089\\u8cfc\\u5165\\u3057\\u3001\\u7d44\\u307f\\u7acb\\u3066\\u306e\\u307f\\u3092\\u4f9d\\u983c\\u3067\\u304d\\u307e\\u3059\\u3002",
          "BTO\\u5b8c\\u6210\\u54c1(\\u30c9\\u30b9\\u30d1\\u30e9\\u30fb\\u30de\\u30a6\\u30b9\\u30b3\\u30f3\\u30d4\\u30e5\\u30fc\\u30bf\\u30fc\\u306a\\u3069): \\u3053\\u306e\\u69cb\\u6210\\u3068\\u540c\\u7b49\\u30b9\\u30da\\u30c3\\u30af\\u3060\\u3068\\u3001\\u76f8\\u5834\\u306f\\u81ea\\u4f5c\\u3068\\u540c\\u7b49\\u304b\\u3084\\u3084\\u5b89\\u3044\\u3053\\u3068\\u304c\\u3042\\u308a\\u307e\\u3059(2026\\u5e74\\u306fDDR5\\u9ad8\\u9a30\\u306e\\u5f71\\u97ff\\u3067BTO\\u306e\\u5927\\u91cf\\u4ed5\\u5165\\u308c\\u304c\\u6709\\u5229\\u306b\\u306a\\u308a\\u3084\\u3059\\u3044\\u305f\\u3081)\\u3002\\u697d\\u5929\\u5e02\\u5834\\u5185\\u306e\\u5404\\u30b7\\u30e7\\u30c3\\u30d7\\u516c\\u5f0f\\u5e97\\u3067\\u8fd1\\u3044\\u69cb\\u6210\\u3092\\u63a2\\u3059\\u306e\\u3082\\u624b\\u3067\\u3059\\u3002",
          macEligible === false && hasAppleIntegrationNeed ? "Mac: Apple\\u9023\\u643a\\u306e\\u5fc5\\u8981\\u306f\\u3042\\u308a\\u307e\\u3059\\u304c\\u3001" + (windowsRequired ? "Windows\\u5fc5\\u9808\\u306e\\u30bd\\u30d5\\u30c8/\\u30b2\\u30fc\\u30e0\\u304c\\u3042\\u308b\\u305f\\u3081\\u5bfe\\u8c61\\u5916\\u3067\\u3059\\u3002" : "\\u4eca\\u56de\\u306f\\u5bfe\\u8c61\\u5916\\u3067\\u3059\\u3002") : "Mac: " + (competitive || needsCuda ? "\\u7af6\\u6280\\u7cfb\\u30b2\\u30fc\\u30e0/\\u30ed\\u30fc\\u30ab\\u30ebAI\\u306fWindows+NVIDIA\\u524d\\u63d0\\u306e\\u3082\\u306e\\u304c\\u591a\\u304f\\u3001\\u5bfe\\u8c61\\u5916\\u3067\\u3059\\u3002" : "Apple\\u88fd\\u54c1\\u3068\\u306e\\u5177\\u4f53\\u7684\\u306a\\u9023\\u643a\\u30cb\\u30fc\\u30ba\\u304c\\u306a\\u3044\\u9650\\u308a\\u3001\\u4eca\\u56de\\u306e\\u7528\\u9014\\u3067\\u306fWindows\\u69cb\\u6210\\u306e\\u65b9\\u304c\\u5408\\u7406\\u7684\\u3067\\u3059\\u3002"),
        ];
      }
      shareText = "\\u3010AI Desk Labo\\u8a3a\\u65ad\\u3011\\u79c1\\u306b\\u5411\\u3044\\u3066\\u308b\\u306e\\u306f\\u300c" + platformLabel + "\\u69cb\\u6210\\u306e" + usecaseText + "PC\\u300d\\u3067\\u3057\\u305f\\ud83d\\udda5\\ufe0f #AIDeskLabo\\u8a3a\\u65ad #\\u81ea\\u4f5cPC";
    }

    return { title: title, paragraphs: paragraphs, notes: notes, asins: asins, guideLink: guideLink, shareText: shareText, budgetInfo: budgetInfo, buyCompare: buyCompare, accessories: accessories };
  }

  function budgetNoteText(total, ceil, label) {
    if (ceil !== Infinity && total > ceil * 1.1) {
      return "この構成のパーツ代の目安は約" + yen(total) + "。予算(" + label + ")に対して約" + yen(total - ceil) + "オーバーしています。予算を上げるか、用途の絞り込み(解像度・ゲームジャンルなど)を見直すと予算に近づきます。";
    }
    if (ceil !== Infinity && total < ceil * 0.7) {
      return "この構成のパーツ代の目安は約" + yen(total) + "。予算(" + label + ")にはまだ余裕があるので、GPUやメモリを一段階上げる余地があります。";
    }
    return "この構成のパーツ代の目安は約" + yen(total) + "。予算(" + label + ")の範囲に収まっています。";
  }

  function escapeText(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  // Finds a swap definition covering the given asin, if that ASIN's category
  // is one the result UI lets the visitor change in place (currently case
  // and storage — the categories where a different pick never invalidates
  // any other part). Returns null for everything else.
  function findSwap(asin) {
    for (var i = 0; i < SWAPS.length; i++) {
      var s = SWAPS[i];
      for (var j = 0; j < s.options.length; j++) {
        if (CATALOG[s.options[j]] === asin) return s;
      }
    }
    return null;
  }

  function swapButtonsHtml(swap, currentAsin) {
    var html = '<div class="quiz-swap-row">';
    swap.options.forEach(function (key) {
      var asin = CATALOG[key];
      var isCurrent = asin === currentAsin;
      html += '<button type="button" class="quiz-swap-btn' + (isCurrent ? " is-current" : "") + '" data-swap-asin="' + asin + '"' + (isCurrent ? " disabled" : "") + ">" + escapeText(swap.labels[key]) + "</button>";
    });
    html += "</div>";
    return html;
  }

  function partHtml(asin, index) {
    var swap = findSwap(asin);
    var num = String(index + 1).padStart(2, "0");
    var label = '<p class="quiz-part-index">( ' + num + ' ) ' + escapeText(CATEGORY_LABELS[asin] || "") + '</p>';
    return '<div class="quiz-part" data-asin="' + asin + '" data-index="' + index + '">' + label + (CARDS[asin] || "") + (swap ? swapButtonsHtml(swap, asin) : "") + "</div>";
  }

  function showResult() {
    root.querySelector(".quiz-steps").hidden = true;
    var r = compute();
    resultState = r;
    var html = "";
    html += '<p class="quiz-result-kicker">\\u8a3a\\u65ad\\u7d50\\u679c</p>';
    html += '<h3 class="quiz-result-title">' + escapeText(r.title) + "</h3>";
    r.paragraphs.forEach(function (p) { html += '<p class="quiz-result-body">' + escapeText(p) + "</p>"; });
    if (r.asins.length) {
      // The engine only ever assembles CPU/mobo/RAM combinations it knows
      // are socket- and memory-standard compatible (see buildWindowsParts)
      // — this is a statement of that guarantee, not a live per-part check,
      // and the case/storage swap buttons only ever swap within a
      // form-factor-safe pair, so it stays true after a swap too.
      html += '<p class="quiz-compat-badge">' + ${JSON.stringify(icon("compare"))} + "\\u30bd\\u30b1\\u30c3\\u30c8\\u30fb\\u30e1\\u30e2\\u30ea\\u898f\\u683c\\u306e\\u4e92\\u63db\\u6027\\u78ba\\u8a8d\\u6e08\\u307f\\u306e\\u7d44\\u307f\\u5408\\u308f\\u305b\\u3067\\u3059</p>";
      html += '<div class="card-grid" data-parts>';
      r.asins.forEach(function (a, i) { html += partHtml(a, i); });
      html += "</div>";
    }
    if (r.budgetInfo) html += '<p class="quiz-result-note" data-budget-note>' + escapeText(budgetNoteText(r.budgetInfo.total, r.budgetInfo.ceil, r.budgetInfo.label)) + "</p>";
    r.notes.forEach(function (n) { html += '<p class="quiz-result-note">' + escapeText(n) + "</p>"; });
    if (r.buyCompare) {
      html += '<div class="quiz-buy-compare"><p class="quiz-buy-compare-title">\\u8cb7\\u3044\\u65b9\\u306e\\u6bd4\\u8f03</p><ul>';
      r.buyCompare.forEach(function (line) { html += "<li>" + escapeText(line) + "</li>"; });
      html += "</ul></div>";
    }
    if (r.accessories && r.accessories.length) {
      html += '<p class="quiz-accessory-title">\\u3042\\u308f\\u305b\\u3066\\u63c3\\u3048\\u305f\\u3044\\u5468\\u8fba\\u6a5f\\u5668</p>';
      html += '<div class="card-grid">';
      r.accessories.forEach(function (a) { html += CARDS[a] || ""; });
      html += "</div>";
    }
    if (r.guideLink) html += '<p class="section-link"><a href="' + r.guideLink.href + '">' + escapeText(r.guideLink.label) + " \\u2192</a></p>";
    html += '<div class="quiz-result-actions">';
    html += '<button type="button" class="btn-share" data-share-text="' + escapeText(r.shareText) + '">' + ${JSON.stringify(icon("review"))} + "\\u8a3a\\u65ad\\u7d50\\u679c\\u3092X\\u3067\\u30b7\\u30a7\\u30a2</button>";
    html += '<button type="button" class="quiz-retry">\\u3082\\u3046\\u4e00\\u5ea6\\u8a3a\\u65ad\\u3059\\u308b</button>';
    html += "</div>";
    resultsBox.innerHTML = html;
    resultsBox.hidden = false;
    syncAnswersToUrl();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
    if (typeof window.aidesklaboSyncFavorites === "function") window.aidesklaboSyncFavorites();
  }

  function handleSwap(btn) {
    if (!resultState) return;
    var partEl = btn.closest(".quiz-part");
    var oldAsin = partEl.dataset.asin;
    var newAsin = btn.dataset.swapAsin;
    if (!newAsin || newAsin === oldAsin) return;
    var idx = resultState.asins.indexOf(oldAsin);
    if (idx !== -1) resultState.asins[idx] = newAsin;
    partEl.outerHTML = partHtml(newAsin, Number(partEl.dataset.index));
    if (typeof window.aidesklaboSyncFavorites === "function") window.aidesklaboSyncFavorites();
    if (resultState.budgetInfo) {
      resultState.budgetInfo.total += (PRICES[newAsin] || 0) - (PRICES[oldAsin] || 0);
      var note = resultsBox.querySelector("[data-budget-note]");
      if (note) note.textContent = budgetNoteText(resultState.budgetInfo.total, resultState.budgetInfo.ceil, resultState.budgetInfo.label);
    }
  }

  function goToStep(currentIndex) {
    var next = currentIndex + 1;
    while (next < stepKeys.length && shouldSkip(next)) next++;
    if (next >= stepKeys.length) showResult();
    else showStep(next);
  }

  root.addEventListener("click", function (e) {
    var opt = e.target.closest(".quiz-option");
    if (opt) {
      var stepEl = opt.closest(".quiz-step");
      var key = stepEl.dataset.key;
      var type = stepEl.dataset.type;
      var currentIndex = stepKeys.indexOf(key);
      if (type === "multi") {
        opt.classList.toggle("is-selected");
        var selected = Array.prototype.slice.call(stepEl.querySelectorAll(".quiz-option.is-selected")).map(function (el) { return el.dataset.value; });
        answers[key] = selected;
        var nextBtn = stepEl.querySelector(".quiz-next");
        if (nextBtn) nextBtn.disabled = selected.length === 0;
      } else {
        answers[key] = opt.dataset.value;
        goToStep(currentIndex);
      }
      return;
    }
    var nextBtn2 = e.target.closest(".quiz-next");
    if (nextBtn2) {
      var stepEl2 = nextBtn2.closest(".quiz-step");
      goToStep(stepKeys.indexOf(stepEl2.dataset.key));
      return;
    }
    var swapBtn = e.target.closest(".quiz-swap-btn");
    if (swapBtn) {
      handleSwap(swapBtn);
      return;
    }
    if (e.target.closest(".quiz-retry")) {
      answers = {};
      resultState = null;
      root.querySelectorAll(".quiz-option.is-selected").forEach(function (el) { el.classList.remove("is-selected"); });
      root.querySelectorAll(".quiz-next").forEach(function (el) { el.disabled = true; });
      if (window.history && window.history.replaceState) window.history.replaceState(null, "", window.location.pathname);
      showStep(0);
      return;
    }
    var shareBtn = e.target.closest(".btn-share");
    if (shareBtn) {
      var text = encodeURIComponent(shareBtn.dataset.shareText || "");
      var url = encodeURIComponent(window.location.href);
      window.open("https://twitter.com/intent/tweet?text=" + text + "&url=" + url, "_blank", "noopener");
    }
  });

  // A shared result link (?usecases=gaming,streaming&budget=20&...) lands
  // here — restore it and jump straight to the result instead of making
  // the visitor re-answer 13 questions to see what was shared with them.
  if (restoreAnswersFromUrl()) showResult();
})();
</script>`;
}

// Renders content blocks to HTML. h2 blocks get sequential ids and are
// collected into a table-of-contents list returned alongside the HTML.
function renderBody(blocks, productsMap) {
  const toc = [];
  let headingIndex = 0;
  const html = blocks
    .map((block) => {
      if (block.h2) {
        headingIndex += 1;
        const id = `h-${headingIndex}`;
        toc.push({ id, text: block.h2 });
        return `<h2 id="${id}">${block.h2}</h2>`;
      }
      if (block.p) return `<p>${block.p}</p>`;
      if (block.list) return `<ul>${block.list.map((li) => `<li>${li}</li>`).join("")}</ul>`;
      if (block.table) return renderTable(block.table);
      if (block.products) {
        const cards = block.products.map((asin) => renderProductCard(productsMap[asin])).join("\n");
        return `<div class="card-grid">${cards}</div>`;
      }
      if (block.diagnosis) return renderDiagnosis(block.diagnosis, productsMap);
      throw new Error(`Unknown content block: ${JSON.stringify(block)}`);
    })
    .join("\n");
  return { html, toc };
}

function renderToc(toc) {
  if (toc.length < 2) return "";
  const items = toc.map((t) => `<li><a href="#${t.id}">${t.text}</a></li>`).join("");
  return `<nav class="toc"><p class="toc-title">この記事の目次</p><ol>${items}</ol></nav>`;
}

// Lightweight intro for every interior page: a brief CSS-only fade (see
// .loader in style.css), never JS-dependent.
const SIMPLE_LOADER = `<div class="loader" aria-hidden="true"><span class="loader-mark">AI DESK LABO</span></div>`;

// Homepage-only "first impression" intro: two panels covering the screen
// with the wordmark, then site.js's GSAP timeline slides them apart to
// reveal the hero underneath (chaining straight into the hero's own
// headline reveal). The CSS side (see .intro-panel/.intro-mark) already
// fades and hides everything on its own after a fixed delay, so this is
// still safe if GSAP never loads or errors out.
const HOME_INTRO = `<div class="intro" aria-hidden="true">
  <div class="intro-panel left"></div>
  <div class="intro-panel right"></div>
  <div class="intro-mark">AI DESK LABO</div>
</div>`;

function renderPage(template, { title, description, canonical, root, bodyHtml, intro = SIMPLE_LOADER }) {
  return template
    .replaceAll("{{TITLE}}", escapeHtml(title))
    .replaceAll("{{DESCRIPTION}}", escapeHtml(description))
    .replaceAll("{{CANONICAL}}", canonical)
    .replaceAll("{{ROOT}}", root)
    .replace("{{INTRO}}", intro)
    .replace("{{BODY}}", bodyHtml);
}

const DIAGNOSIS_INDEX_DESCRIPTION =
  "用途・予算・ゲームジャンルなど13の質問に答えるだけで、あなたに合ったPC構成と、自作・組み立て代行・完成品・Macどれが得かを診断します。完全無料・データ送信なし。";

// Landing-page treatment for /diagnosis/ — the nav's "診断" link drops
// visitors here directly, so a bare 1-card list (the generic per-type
// index template every other type gets) would undersell the site's
// flagship tool. Reuses the same .diag-spot visual language as the
// homepage spotlight, then adds persona/FAQ content a plain card list
// can't carry, and still lists every diagnosis entry below in case more
// than one ever exists.
function renderDiagnosisIndexPage(entries) {
  const primary = entries[0];
  const heroHtml = primary
    ? `<div class="diag-spot">
        <div class="diag-spot-copy">
          ${eyebrowHtml("看板コンテンツ", "Flagship Tool")}
          <h1>自作PC診断</h1>
          <p class="lede-small">${escapeHtml(DIAGNOSIS_INDEX_DESCRIPTION)}</p>
          <ul class="diag-spot-points">
            <li>${iconBadge("gamepad", "orange")}<span>用途・予算・ゲームジャンルまで加味した13問</span></li>
            <li>${iconBadge("cart", "blue")}<span>CPUからケース・電源・グリスまでフルパーツで提案</span></li>
            <li>${iconBadge("compare", "green")}<span>自作/組み立て代行/完成品/Macの買い方を比較</span></li>
          </ul>
          <a class="btn-primary" href="${primary.slug}/">今すぐ診断してみる ${icon("diagnosis")}</a>
        </div>
        <div class="diag-spot-visual" aria-hidden="true">
          <div class="diag-spot-card diag-spot-card-1"><span class="diag-spot-tag orange">競技FPS型</span><p>Ryzen 7 9800X3D + RTX 5060</p></div>
          <div class="diag-spot-card diag-spot-card-2"><span class="diag-spot-tag blue">静音クリエイター型</span><p>Core Ultra 5 225F + RTX 5060 Ti</p></div>
          <div class="diag-spot-card diag-spot-card-3"><span class="diag-spot-tag green">ローカルAI型</span><p>VRAM 16GB優先構成</p></div>
        </div>
      </div>`
    : `${eyebrowHtml(SITE_TITLE, "Diagnosis")}<h1>診断一覧</h1><p class="lede-small">${escapeHtml(DIAGNOSIS_INDEX_DESCRIPTION)}</p>`;

  const featureHtml = `<div class="section-head"><p class="eyebrow">この診断でできること</p><span class="section-index">( 01 )</span></div>
    <div class="pillar-grid">
      <div class="pillar">
        <span class="pillar-index">01</span>
        ${iconBadge("gamepad", "orange")}
        <h3>用途の重なりをそのまま診断</h3>
        <p>「ゲームしながら配信、その録画を動画編集」のような複数用途の重なりも、1つに絞らず診断できます。</p>
      </div>
      <div class="pillar">
        <span class="pillar-index">02</span>
        ${iconBadge("motherboard", "blue")}
        <h3>フルパーツで提案</h3>
        <p>CPU・GPUだけでなく、マザーボード・メモリ・SSD・ケース・電源・グリスまで欠けのない構成を毎回提示します。</p>
      </div>
      <div class="pillar">
        <span class="pillar-index">03</span>
        ${iconBadge("compare", "green")}
        <h3>買い方まで比較</h3>
        <p>自作・組み立て代行・完成品(BTO)・Macを同じ条件で比較。予算に対して過不足があれば正直に伝えます。</p>
      </div>
    </div>`;

  const personaHtml = `<div class="section-head"><p class="eyebrow">こんな人におすすめ</p><span class="section-index">( 02 )</span></div>
    <div class="quiz-options" data-multi="false" style="pointer-events:none">
      <div class="quiz-option has-icon">${iconBadge("gamepad", "orange")}<span class="quiz-option-text"><span class="quiz-option-label">競技FPSでfpsを詰めたい</span><span class="quiz-option-desc">VALORANT・Apexなどで高fps環境を組みたい人</span></span></div>
      <div class="quiz-option has-icon">${iconBadge("broadcast", "blue")}<span class="quiz-option-text"><span class="quiz-option-label">ゲームしながら配信もしたい</span><span class="quiz-option-desc">プレイと同時に配信・録画までこなしたい人</span></span></div>
      <div class="quiz-option has-icon">${iconBadge("sparkle", "green")}<span class="quiz-option-text"><span class="quiz-option-label">AI画像生成・ローカルLLMを試したい</span><span class="quiz-option-desc">VRAM容量から逆算した構成を知りたい人</span></span></div>
      <div class="quiz-option has-icon">${iconBadge("briefcase", "blue")}<span class="quiz-option-text"><span class="quiz-option-label">とりあえず何を買えばいいか分からない</span><span class="quiz-option-desc">自作すべきか完成品・Macにすべきか迷っている人</span></span></div>
    </div>`;

  const faqHtml = `<div class="section-head"><p class="eyebrow">よくある質問</p><span class="section-index">( 03 )</span></div>
    <div class="pillar-grid">
      <div class="pillar"><h3>料金はかかりますか？</h3><p>完全無料です。会員登録も不要で、何度でも診断できます。</p></div>
      <div class="pillar"><h3>回答データはどこかに送信されますか？</h3><p>されません。診断の計算はすべてあなたのブラウザ内で完結し、サーバーには何も送られません。</p></div>
      <div class="pillar"><h3>結果は保存できますか？</h3><p>結果画面からXでシェアできます。URL保存機能は現在ありませんが、もう一度診断すれば同じ答えで再現できます。</p></div>
    </div>`;

  const listHtml = entries.length
    ? `<div class="section-head"><p class="eyebrow">診断ツール一覧</p><span class="section-index">( 04 )</span></div><div class="card-grid">${entries.map((e) => renderEntryCard(e, `${e.slug}/`)).join("\n")}</div>`
    : "";

  return section(heroHtml) + section(featureHtml) + section(personaHtml, { tint: true }) + section(faqHtml) + (listHtml ? section(listHtml) : "");
}

function renderEntryCard(entry, href) {
  const color = TYPE_COLOR[entry.type];
  return `<div class="card index-card">
  <div class="card-top">${iconBadge(entry.type, color)}<span class="badge ${color}">${TYPE_LABEL_JA[entry.type]}</span></div>
  <h3><a href="${href}">${escapeHtml(entry.title)}</a></h3>
  <p>${escapeHtml(entry.description)}</p>
  <p class="updated">${escapeHtml(entry.updated)}</p>
</div>`;
}

// Scroll-synced ranking showcase for the homepage. Renders a horizontal
// track that is a plain CSS scroll-snap carousel by default; site.js
// progressively enhances it into a GSAP ScrollTrigger pin+scrub effect
// on wide viewports when the CDN scripts load successfully.
function renderShowcase(rankedProducts) {
  const cards = rankedProducts
    .map((product, i) => {
      const badgeColor = CATEGORY_COLOR[product.category] || "blue";
      return `<div class="showcase-card">
    <span class="rank"><span class="rank-num">${String(i + 1).padStart(2, "0")}</span><span class="rank-suffix">位</span></span>
    ${iconBadge(product.category, badgeColor)}
    <h3>${escapeHtml(product.name)}</h3>
    <p class="price">¥${product.price.toLocaleString("ja-JP")}</p>
    <p>${escapeHtml(product.summary || "")}</p>
    ${renderCtaButtons(product)}
  </div>`;
    })
    .join("\n");
  return section(
    `<div class="section-head"><p class="eyebrow">Ranking</p><span class="section-index">( 02 )</span><h2>今、注目のアイテム</h2></div>
    <p class="showcase-hint">スクロールすると連動して切り替わります(スマホ・タブレットは横にスワイプ)</p>
    <div class="showcase-track-outer"><div class="showcase-track" id="showcaseTrack">${cards}</div></div>`
  );
}

// "気になるリスト" (favorites) page. Every product card on the site is
// pre-rendered once and embedded here keyed by ASIN — the page itself ships
// empty and a small inline script (see the matching IIFE in site.js for the
// heart-button side) fills it in from localStorage on load. No server, no
// account, nothing leaves the visitor's browser.
function renderFavoritesPage(products) {
  const cardsByAsin = {};
  for (const p of products) cardsByAsin[p.asin] = renderProductCard(p);

  const bodyHtml = section(
    `${eyebrowHtml("保存済み", "Favorites")}<h1>気になるリスト</h1>
    <p class="lede-small">ハートマークで保存した商品がここに並びます。保存はこの端末のブラウザだけに残り、どこにも送信されません。</p>
    <div id="favoritesEmpty" class="favorites-empty" hidden>
      <p>まだ何も保存されていません。気になる商品のハートマークをタップすると、ここに一覧できます。</p>
      <p class="section-link"><a href="../rankings/">ランキングを見る →</a></p>
    </div>
    <div id="favoritesList" class="card-grid bento"></div>`
  );

  const script = `<script>
(function () {
  var CARDS = ${JSON.stringify(cardsByAsin)};
  var listEl = document.getElementById("favoritesList");
  var emptyEl = document.getElementById("favoritesEmpty");
  if (!listEl) return;
  function render() {
    var favs = [];
    try {
      var raw = window.localStorage.getItem("aidesklabo_favorites");
      favs = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(favs)) favs = [];
    } catch (err) { favs = []; }
    listEl.innerHTML = favs.map(function (a) { return CARDS[a] || ""; }).join("");
    listEl.hidden = favs.length === 0;
    if (emptyEl) emptyEl.hidden = favs.length !== 0;
  }
  render();
  document.addEventListener("aidesklabo:favorites-changed", render);
})();
</script>`;

  return { bodyHtml: bodyHtml + script };
}

// Auto-generated update history — pulled straight from every content entry's
// `updated` and every product's `lastChecked`, so it never goes stale and
// nobody has to remember to hand-author a changelog entry.
function renderChangelogPage(content, products) {
  const events = [];
  for (const entry of content) {
    if (entry.type === "static") continue;
    const href = `../${FOLDER_BY_TYPE[entry.type]}/${entry.slug}/`;
    events.push({ date: entry.updated, label: `${TYPE_LABEL_JA[entry.type]}を更新: ${entry.title}`, href, type: entry.type });
  }
  const seenProductDates = new Map();
  for (const p of products) {
    if (!p.lastChecked) continue;
    const key = p.lastChecked;
    seenProductDates.set(key, (seenProductDates.get(key) || 0) + 1);
  }
  for (const [date, count] of seenProductDates) {
    events.push({ date, label: `掲載商品の価格・仕様を${count}点確認`, href: null, type: "product" });
  }
  events.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const grouped = [];
  for (const e of events) {
    const last = grouped[grouped.length - 1];
    if (last && last.date === e.date) last.items.push(e);
    else grouped.push({ date: e.date, items: [e] });
  }

  const timelineHtml = grouped
    .slice(0, 60)
    .map(
      (g) => `<div class="changelog-day">
      <p class="changelog-date">${escapeHtml(g.date)}</p>
      <ul class="changelog-items">${g.items
        .map((item) => (item.href ? `<li><a href="${item.href}">${escapeHtml(item.label)}</a></li>` : `<li>${escapeHtml(item.label)}</li>`))
        .join("")}</ul>
    </div>`
    )
    .join("\n");

  return section(
    `${eyebrowHtml("更新の記録", "Updates")}<h1>更新履歴</h1>
    <p class="lede-small">記事の追加・改稿や、掲載商品の価格・仕様の確認履歴を新しい順に並べています。「価格の変動まで追跡」を裏付ける記録です。</p>
    <div class="changelog-timeline">${timelineHtml}</div>`
  );
}

// Site-wide search. Every product and every non-static article is
// pre-rendered once (same pattern as the favorites page) and embedded with
// a small searchable text blob per entry; a plain substring match against
// that blob — no fuzzy scoring, no external index — filters the list as
// the visitor types. Good enough for ~40 products and ~20 articles; would
// need a real index before it'd be worth it at 10x that size.
function renderSearchPage(content, products) {
  const items = [];
  for (const p of products) {
    items.push({
      asin: p.asin,
      html: renderProductCard(p),
      text: [p.name, p.summary, CATEGORY_LABEL_JA[p.category] || p.category].join(" ").toLowerCase(),
    });
  }
  for (const entry of content) {
    if (entry.type === "static") continue;
    items.push({
      asin: `article:${entry.slug}`,
      html: renderEntryCard(entry, `../${FOLDER_BY_TYPE[entry.type]}/${entry.slug}/`),
      text: [entry.title, entry.description].join(" ").toLowerCase(),
    });
  }

  const bodyHtml = section(
    `${eyebrowHtml("商品・記事を探す", "Search")}<h1>サイト内検索</h1>
    <p class="lede-small">商品名・記事タイトルで、掲載中のレビュー・比較・ガイド・商品を横断して検索できます。</p>
    <div class="search-box">${icon("search")}<input type="search" id="searchInput" placeholder="例: キーボード、モニターアーム、ゲーミング" autocomplete="off"></div>
    <p class="search-count" id="searchCount"></p>
    <div id="searchResults" class="card-grid bento"></div>`
  );

  const script = `<script>
(function () {
  var ITEMS = ${JSON.stringify(items)};
  var input = document.getElementById("searchInput");
  var resultsEl = document.getElementById("searchResults");
  var countEl = document.getElementById("searchCount");
  if (!input || !resultsEl) return;
  function render() {
    var q = input.value.trim().toLowerCase();
    if (!q) {
      resultsEl.innerHTML = "";
      countEl.textContent = "\\u5165\\u529b\\u3059\\u308b\\u3068\\u3053\\u3053\\u306b\\u7d50\\u679c\\u304c\\u8868\\u793a\\u3055\\u308c\\u307e\\u3059\\u3002";
      return;
    }
    var matches = ITEMS.filter(function (it) { return it.text.indexOf(q) !== -1; });
    resultsEl.innerHTML = matches.map(function (it) { return it.html; }).join("");
    countEl.textContent = matches.length + "\\u4ef6\\u306e\\u7d50\\u679c";
    if (typeof window.aidesklaboSyncFavorites === "function") window.aidesklaboSyncFavorites();
  }
  input.addEventListener("input", render);
  render();
})();
</script>`;

  return bodyHtml + script;
}

function writeFile(relPath, content) {
  const fullPath = path.join(ROOT_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

function main() {
  const template = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");
  const products = readJson("data/products.json");
  const content = readJson("data/content.json");
  const productsMap = Object.fromEntries(products.map((p) => [p.asin, p]));

  // Validate all referenced ASINs exist before writing anything.
  const errors = [];
  for (const entry of content) {
    for (const asin of entry.products || []) {
      if (!productsMap[asin]) errors.push(`${entry.slug}: unknown product asin "${asin}"`);
    }
    for (const block of entry.body) {
      if (block.products) {
        for (const asin of block.products) {
          if (!productsMap[asin]) errors.push(`${entry.slug}: unknown product asin "${asin}" in body block`);
        }
      }
    }
  }
  if (errors.length) {
    console.error("Build failed — validation errors:\n" + errors.map((e) => "  - " + e).join("\n"));
    process.exit(1);
  }

  const sitemapUrls = [];

  // Detail pages: static boilerplate + the 4 content types.
  for (const entry of content) {
    const isStatic = entry.type === "static";
    const outPath = isStatic ? `${entry.slug}.html` : `${FOLDER_BY_TYPE[entry.type]}/${entry.slug}/index.html`;
    const root = isStatic ? "" : "../../";
    const canonical = `${SITE_ORIGIN}/${isStatic ? entry.slug + ".html" : FOLDER_BY_TYPE[entry.type] + "/" + entry.slug + "/"}`;
    const { html: bodyBlocksHtml, toc } = renderBody(entry.body, productsMap);

    let bodyHtml;
    if (isStatic) {
      bodyHtml = section(`<h1>${escapeHtml(entry.title)}</h1><article>${bodyBlocksHtml}</article>`);
    } else {
      const eyebrow = eyebrowHtml(TYPE_LABEL_JA[entry.type], TYPE_LABEL_EN[entry.type]);
      const updatedHtml = `<p class="updated">最終更新日: ${escapeHtml(entry.updated)}</p>`;
      // Placed twice on purpose. Japan's stealth-marketing rules (景品表示法
      // ステマ規制) require an ad disclosure to be immediately obvious, not
      // just present somewhere on the page — a note only at the bottom,
      // after the reader has already read the whole article, doesn't meet
      // that bar. The compact badge sits right next to the title; the full
      // explanation stays at the bottom for anyone who wants the detail.
      const prBadge = `<a class="pr-badge" href="${root}disclosure.html" title="広告・アフィリエイトリンクを含みます">PR</a>`;
      const disclosure = `<div class="disclosure-note">本ページはAmazonアソシエイト・プログラム、楽天アフィリエイトの参加者として、適格販売により収入を得ています。<a href="${root}disclosure.html">詳細</a></div>`;
      bodyHtml = section(
        `<div class="title-row">${eyebrow}${prBadge}</div><h1>${escapeHtml(entry.title)}</h1>${updatedHtml}${renderToc(toc)}<article>${bodyBlocksHtml}</article>${disclosure}`
      );
    }

    writeFile(outPath, renderPage(template, { title: entry.title, description: entry.description, canonical, root, bodyHtml }));
    sitemapUrls.push({ loc: canonical, lastmod: isStatic ? null : entry.updated });
  }

  // Per-type index pages (e.g. /reviews/index.html). "diagnosis" gets its
  // own landing-page treatment (see renderDiagnosisIndexPage) since it's
  // the site's flagship tool and the nav's "診断" link drops visitors here
  // directly — a bare 1-card list would undersell it. Every other type
  // keeps the plain card-grid listing.
  for (const [type, folder] of Object.entries(FOLDER_BY_TYPE)) {
    const entries = content.filter((e) => e.type === type).sort((a, b) => (a.updated < b.updated ? 1 : -1));
    const bodyHtml =
      type === "diagnosis"
        ? renderDiagnosisIndexPage(entries)
        : section(
            `${eyebrowHtml(SITE_TITLE, TYPE_LABEL_EN[type])}<h1>${TYPE_LABEL_JA[type]}一覧</h1><p class="lede-small">${TYPE_INDEX_INTRO[type] || ""}</p><div class="card-grid">${entries.map((e) => renderEntryCard(e, `${e.slug}/`)).join("\n")}</div>`
          );
    writeFile(`${folder}/index.html`, renderPage(template, {
      title: type === "diagnosis" ? "自作PC診断" : `${TYPE_LABEL_JA[type]}一覧`,
      description: type === "diagnosis" ? DIAGNOSIS_INDEX_DESCRIPTION : `${SITE_TITLE}の${TYPE_LABEL_JA[type]}一覧`,
      canonical: `${SITE_ORIGIN}/${folder}/`,
      root: "../",
      bodyHtml,
    }));
    sitemapUrls.push({ loc: `${SITE_ORIGIN}/${folder}/` });
  }

  // Homepage: hero + latest entries across all non-static types.
  const nonStatic = content.filter((e) => e.type !== "static");
  const latest = [...nonStatic].sort((a, b) => (a.updated < b.updated ? 1 : -1)).slice(0, 12);
  const categoryCount = new Set(products.map((p) => p.category)).size;

  const heroHtml = `<section class="hero">
  <canvas class="hero-canvas" aria-hidden="true"></canvas>
  <div class="hero-spine" aria-hidden="true">AI Desk Labo — Curated Tech Journal</div>
  <div class="wrap">
    <div class="hero-grid">
      <div class="hero-content">
        ${eyebrowHtml("AI × ガジェット比較メディア", "Est. 2026")}
        <h1>
          <span class="split-line"><span>AIと過ごす毎日を、</span></span>
          <span class="split-line"><span>もっと快適にする</span></span>
          <span class="split-line"><span class="grad">モノを選ぶ。</span></span>
        </h1>
        <p class="lede">実際に使い倒したAIツールとガジェットだけを、比較・ランキング・レビュー形式でまとめています。</p>
        <div class="stat-row">
          <div class="stat"><span class="num" data-count-to="${nonStatic.length}">0</span><span class="label">掲載記事</span></div>
          <div class="stat"><span class="num" data-count-to="${products.length}">0</span><span class="label">掲載商品</span></div>
          <div class="stat"><span class="num" data-count-to="${categoryCount}">0</span><span class="label">カテゴリ</span></div>
        </div>
        <div class="chip-row">
          ${Object.entries(FOLDER_BY_TYPE).map(([type, folder]) => `<a class="chip" href="${folder}/">${icon(type)}${TYPE_LABEL_JA[type]}</a>`).join("\n")}
        </div>
      </div>
      <div class="hero-illustration" aria-hidden="true">
        <div class="hero-illustration-float">${HERO_NETWORK_SVG}</div>
      </div>
    </div>
  </div>
  <div class="scroll-cue" aria-hidden="true"><span class="cue-line"></span>SCROLL</div>
</section>`;

  // Dark "pillars" band — the one deliberate inverted-color section on the
  // homepage, giving the otherwise all-white page a contrast beat without
  // needing a photograph.
  const pillarsHtml = section(
    `<div class="section-head"><p class="eyebrow">Our Standard</p><span class="section-index">( 03 )</span><h2>AI Desk Laboが大事にしていること</h2></div>
    <div class="pillar-grid">
      <div class="pillar">
        <span class="pillar-index">01</span>
        ${iconBadge("review", "orange")}
        <h3>実機検証してから書く</h3>
        <p>気になった製品はまず購入・使用し、実際に触ってみた上での良い点・気になる点だけを記事にしています。</p>
      </div>
      <div class="pillar">
        <span class="pillar-index">02</span>
        ${iconBadge("ranking", "blue")}
        <h3>価格の変動まで追跡</h3>
        <p>掲載して終わりにせず、価格や仕様が変わっていないか定期的に見直し、最終更新日を明記しています。</p>
      </div>
      <div class="pillar">
        <span class="pillar-index">03</span>
        ${iconBadge("guide", "green")}
        <h3>初心者目線でわかりやすく</h3>
        <p>専門用語はできるだけ避け、AIやガジェットに詳しくない人でも選び方が分かる説明を心がけています。</p>
      </div>
    </div>`,
    { invert: true }
  );

  // Full-bleed kinetic-type band — decorative only (aria-hidden), real
  // navigation to each section already exists in the header and chip row.
  // Each JP word is paired with its English kicker (reusing TYPE_LABEL_EN)
  // for the same quiet bilingual-editorial texture as the eyebrow tags.
  const marqueeWords = ["ranking", "review", "compare", "guide", "diagnosis"];
  const marqueeHtml = `<div class="marquee-band" aria-hidden="true">
  <div class="marquee-track">
    ${Array(3)
      .fill(
        marqueeWords
          .map(
            (type, i) =>
              `<span class="${i % 2 ? "accent" : ""}">${TYPE_LABEL_JA[type]}<span class="marquee-en">${TYPE_LABEL_EN[type]}</span></span><span class="dot">◆</span>`
          )
          .join("\n")
      )
      .join("\n")}
  </div>
</div>`;

  // The PC diagnosis is the site's flagship tool — it gets its own
  // full-width spotlight right after the hero/marquee instead of blending
  // into the plain product-grid sections below, so a first-time visitor
  // sees it before anything else.
  const diagnosisEntry = content.find((e) => e.type === "diagnosis" && e.slug === "pc-builder");
  const diagnosisSpotlightHtml = diagnosisEntry
    ? section(
        `<div class="diag-spot">
          <div class="diag-spot-copy">
            ${eyebrowHtml("看板コンテンツ", "Flagship Tool")}
            <h2>自作PC診断</h2>
            <p class="lede-small">「結局何を選べばいいの？」に、13の質問で答えます。用途はいくつでも選べるので、ゲームしながら配信、AI画像生成もする、といった重なりもそのまま診断可能。予算内で現実的な構成と、自作・組み立て代行・完成品・Macどれが得かまで一度に分かります。</p>
            <ul class="diag-spot-points">
              <li>${iconBadge("gamepad", "orange")}<span>用途・予算・ゲームジャンルまで加味した13問</span></li>
              <li>${iconBadge("cart", "blue")}<span>CPUからケース・電源・グリスまでフルパーツで提案</span></li>
              <li>${iconBadge("compare", "green")}<span>自作/組み立て代行/完成品/Macの買い方を比較</span></li>
            </ul>
            <a class="btn-primary" href="${FOLDER_BY_TYPE.diagnosis}/${diagnosisEntry.slug}/">今すぐ診断してみる ${icon("diagnosis")}</a>
          </div>
          <div class="diag-spot-visual" aria-hidden="true">
            <div class="diag-spot-card diag-spot-card-1"><span class="diag-spot-tag orange">競技FPS型</span><p>Ryzen 7 9800X3D + RTX 5060</p></div>
            <div class="diag-spot-card diag-spot-card-2"><span class="diag-spot-tag blue">静音クリエイター型</span><p>Core Ultra 5 225F + RTX 5060 Ti</p></div>
            <div class="diag-spot-card diag-spot-card-3"><span class="diag-spot-tag green">ローカルAI型</span><p>VRAM 16GB優先構成</p></div>
          </div>
        </div>`
      )
    : "";

  const latestHtml = section(
    `<div class="section-head"><p class="eyebrow">Latest</p><span class="section-index">( 04 )</span><h2>最新の記事</h2></div><div class="card-grid bento">${latest
      .map((e) => renderEntryCard(e, `${FOLDER_BY_TYPE[e.type]}/${e.slug}/`))
      .join("\n")}</div>`,
    { tint: true }
  );

  // Showcase pulls its ranked order from the first "ranking" entry found;
  // falls back to product declaration order if no ranking entry exists yet.
  const rankingEntry = content.find((e) => e.type === "ranking");
  const rankedAsins = rankingEntry ? rankingEntry.products : products.map((p) => p.asin);
  const showcaseHtml = renderShowcase(rankedAsins.map((asin) => productsMap[asin]));

  // Budget picks get their own plain (non-pinned) price-visible section right
  // under the hero — the scroll-synced showcase above only ever shows the
  // priciest ranking, so cheaper items were invisible without this.
  const budgetEntry = content.find((e) => e.type === "ranking" && e.slug === "budget-ai-desk-gear");
  let budgetHtml = "";
  if (budgetEntry) {
    const budgetCards = budgetEntry.products.map((asin) => renderProductCard(productsMap[asin])).join("\n");
    budgetHtml = section(
      `<div class="section-head">${eyebrowHtml("お手頃価格", "Budget Picks")}<span class="section-index">( 01 )</span><h2>予算重視ならこちら</h2></div>
      <div class="card-grid bento">${budgetCards}</div>
      <p class="section-link"><a href="${FOLDER_BY_TYPE[budgetEntry.type]}/${budgetEntry.slug}/">${escapeHtml(budgetEntry.title)}を見る →</a></p>`
    );
  }

  writeFile("index.html", renderPage(template, {
    title: "AI・ガジェットの比較とレビュー",
    description: "AIツールとガジェットの実体験レビュー・比較・ランキングを発信するAI Desk Labo公式サイト。",
    canonical: `${SITE_ORIGIN}/`,
    root: "",
    bodyHtml: heroHtml + marqueeHtml + diagnosisSpotlightHtml + budgetHtml + showcaseHtml + pillarsHtml + latestHtml,
    intro: HOME_INTRO,
  }));
  sitemapUrls.unshift({ loc: `${SITE_ORIGIN}/` });

  // "気になるリスト" (favorites) — purely client-side, per-visitor (see
  // renderFavoritesPage). Still worth a sitemap entry since the page shell
  // itself (with its empty-state copy) is real indexable content.
  const favoritesPage = renderFavoritesPage(products);
  writeFile("favorites/index.html", renderPage(template, {
    title: "気になるリスト",
    description: "保存した商品を一覧できる、あなただけの気になるリスト。保存はこの端末のブラウザにのみ残ります。",
    canonical: `${SITE_ORIGIN}/favorites/`,
    root: "../",
    bodyHtml: favoritesPage.bodyHtml,
  }));
  sitemapUrls.push({ loc: `${SITE_ORIGIN}/favorites/` });

  writeFile("search/index.html", renderPage(template, {
    title: "サイト内検索",
    description: "AI Desk Labo掲載の商品・記事を横断検索できます。",
    canonical: `${SITE_ORIGIN}/search/`,
    root: "../",
    bodyHtml: renderSearchPage(content, products),
  }));
  sitemapUrls.push({ loc: `${SITE_ORIGIN}/search/` });

  // Auto-generated changelog — see renderChangelogPage; no hand-authored
  // entries to keep in sync, it derives everything from existing dates.
  writeFile("updates/index.html", renderPage(template, {
    title: "更新履歴",
    description: "AI Desk Laboの記事更新・商品の価格改定チェック履歴。",
    canonical: `${SITE_ORIGIN}/updates/`,
    root: "../",
    bodyHtml: renderChangelogPage(content, products),
  }));
  sitemapUrls.push({ loc: `${SITE_ORIGIN}/updates/` });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls
    .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`)
    .join("\n")}\n</urlset>\n`;
  writeFile("sitemap.xml", sitemapXml);

  console.log(`Build OK — ${content.length} content entries, ${sitemapUrls.length} URLs in sitemap.`);
}

main();
