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
const CATEGORY_COLOR = { keyboard: "orange", mouse: "blue", charger: "green", monitor: "orange", stand: "green", mic: "blue", light: "orange", footrest: "green", wristrest: "blue", monitorarm: "orange", cpu: "blue", gpu: "orange", cable: "green", tablet: "blue", reader: "green", case: "blue", macropad: "orange", motherboard: "green", psu: "orange", thermalpaste: "green", ram: "blue", storage: "orange", cooler: "blue" };
// Product-card badges show this label, not the raw `category` key — the key
// is an internal English slug (also used to look up CATEGORY_COLOR/ICONS)
// and was previously printed as-is, which read as stray English jargon on
// an otherwise all-Japanese page.
const CATEGORY_LABEL_JA = { keyboard: "キーボード", mouse: "マウス", charger: "充電器", monitor: "モニター", stand: "スタンド", mic: "マイク", light: "ライト", footrest: "フットレスト", wristrest: "リストレスト", monitorarm: "モニターアーム", cpu: "CPU", gpu: "GPU", cable: "ケーブル", tablet: "タブレット", reader: "カードリーダー", case: "ケース", macropad: "マクロパッド", motherboard: "マザーボード", psu: "電源ユニット", thermalpaste: "グリス", ram: "メモリ", storage: "SSD", cooler: "CPUクーラー" };

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
  diagnosis: `<circle cx="12" cy="12" r="9.5"/><polyline points="7.5 12.5 10.5 15.5 16.5 8.5"/>`,
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
  <div class="card-top">${iconBadge(product.category, badgeColor)}<span class="badge ${badgeColor}">${escapeHtml(badgeLabel)}</span></div>
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
  cpuApuAmd: "B092L9GF5N", // Ryzen 5 5600G — AM4, no dGPU needed
  cpuMidAmd: "B0BS8PRCYV", // Ryzen 5 7600 — AM5
  cpuHighAmd: "B0D6NN87T8", // Ryzen 9 9900X — AM5, no bundled cooler
  cpuIntel: "B0CQ3WP67C", // Core i5-14400 — LGA1700, only Intel SKU in catalog
  moboAm4: "B08G1Y95SZ",
  moboAm5: "B0F3DG1NVW",
  moboIntel: "B0CMPZMGVT",
  gpuMid: "B0C8BPW1SP", // RTX 4060
  gpuHigh: "B0CS67885B", // RTX 4070 SUPER
  ramDdr4: "B08C53LL9J", // 16GB(8GBx2)
  ramDdr5: "B0C2B7W1W4", // 32GB(16GBx2)
  storage: "B0DGKMQPYC",
  case: "B0DQPMJ6MJ",
  psu: "B0DKT9JRF1",
  paste: "B0795DP124",
  cooler: "B09NZB9Z9Z", // only needed with cpuHighAmd (no bundled cooler)
};

// Rules-based PC diagnosis engine. Unlike a simple answer-combination lookup
// table, this asks several questions (some multi-select, since use cases
// like "gaming" and "video editing" genuinely overlap — someone who streams
// their gameplay and then edits the recording needs both) and computes a
// full parts list — CPU *and* motherboard, RAM, storage, case, PSU, thermal
// paste, cooler where needed — from real requirement rules, not a fixed
// answer→result map. All scoring happens client-side in the visitor's own
// browser; nothing is sent anywhere.
function renderDiagnosis(diag, productsMap) {
  const uid = diag.id || "diagnosis";
  const catalogAsins = Object.values(DIAGNOSIS_CATALOG);
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

  const stepsHtml = diag.questions
    .map((q, i) => {
      const options = q.options
        .map(
          (opt) => `<button type="button" class="quiz-option" data-value="${escapeHtml(opt.value)}">
        <span class="quiz-option-label">${escapeHtml(opt.label)}</span>
        <span class="quiz-option-desc">${escapeHtml(opt.desc)}</span>
      </button>`
        )
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
  var GUIDE_ROOT = "../../guides/";
  var stepKeys = ${JSON.stringify(diag.questions.map((q) => q.key))};
  var stepTypes = ${JSON.stringify(diag.questions.map((q) => q.type))};
  var answers = {};
  var stepEls = root.querySelectorAll(".quiz-step");
  var dotEls = root.querySelectorAll(".quiz-dot");
  var resultsBox = root.querySelector(".quiz-results");

  function yen(n) { return "\\u00a5" + n.toLocaleString("ja-JP"); }

  function showStep(index) {
    stepEls.forEach(function (el) { el.hidden = Number(el.dataset.stepIndex) !== index; });
    dotEls.forEach(function (el, i) { el.classList.toggle("is-active", i === index); });
    resultsBox.hidden = true;
    root.querySelector(".quiz-steps").hidden = false;
  }

  // --- scoring: turn the 6 answers into a concrete parts list + copy ---
  function compute() {
    var usecases = answers.usecases || [];
    if (!usecases.length) usecases = ["office"];
    var hasOffice = usecases.indexOf("office") !== -1;
    var hasIllustration = usecases.indexOf("illustration") !== -1;
    var hasGaming = usecases.indexOf("gaming") !== -1;
    var hasStreaming = usecases.indexOf("streaming") !== -1;
    var hasVideo = usecases.indexOf("video") !== -1;
    var heavyCount = (hasGaming ? 1 : 0) + (hasStreaming ? 1 : 0) + (hasVideo ? 1 : 0);

    var gpuTier = 0; // 0 none, 1 mid(RTX4060), 2 high(RTX4070 SUPER)
    var ramGB = 16;
    var coreTier = "low"; // low(6-10 core) or high(12 core, Ryzen 9 9900X tier)
    if (hasIllustration) gpuTier = Math.max(gpuTier, 1);
    if (hasGaming) gpuTier = Math.max(gpuTier, 1);
    if (hasStreaming) { coreTier = "high"; ramGB = Math.max(ramGB, 32); }
    if (hasVideo) { gpuTier = Math.max(gpuTier, 2); coreTier = "high"; ramGB = Math.max(ramGB, 32); }
    if (heavyCount >= 2) { ramGB = Math.max(ramGB, 32); coreTier = "high"; }
    if (heavyCount >= 3) ramGB = 64;

    var usecaseLabels = { office: "オフィス・AIチャット", illustration: "イラスト・AI画像生成", gaming: "ゲーミング", streaming: "ゲーム配信", video: "動画編集" };
    var usecaseText = usecases.map(function (u) { return usecaseLabels[u]; }).join("・");

    var software = answers.software;
    var ecosystem = answers.ecosystem;
    var effort = answers.effort;
    var platformPref = answers.platform;

    var macEligible = software !== "windows_only" && ecosystem === "yes" && !hasGaming;
    var platform = macEligible ? "mac" : "windows";
    var hybridNote = null;
    if (!macEligible && software !== "windows_only" && ecosystem === "yes" && hasGaming) {
      hybridNote = "普段Apple製品をよく使われるなら、ゲーム以外の作業は普段のMacに任せて、ゲーム専用機としてこのWindows構成を別に組む「2台持ち」も現実的な落としどころです。";
    }

    var title, paragraphs = [], asins = [], notes = [], guideLink = null, shareText;

    if (platform === "mac") {
      title = "自作PCより、Macという選択肢";
      var reasons = [];
      reasons.push("普段からiPhone・iPadなどApple製品をよく使っていて連携を活かしたいとのことなので、AirDropや写真・ファイルのやり取りの一貫性を考えるとMacが合理的です。");
      if (hasVideo) reasons.push("動画編集も選んでいるので、Apple SiliconのハードウェアエンコードはPremiere Pro・DaVinci Resolveでも強力に効きます。統合メモリでVRAM不足にも悩みにくい構成です。");
      if (hasIllustration) reasons.push("iPadとの連携で、イラスト制作の素材受け渡しもスムーズになります。");
      if (hasOffice && !hasVideo && !hasIllustration) reasons.push("オフィス・AIチャット中心の使い方なら、組み立ての手間がない分MacBook Airで十分快適です。");
      if (software === "mac_ok") reasons.push("使う予定のソフトもMac対応で完結するとのことなので、無理にWindowsを選ぶ理由もありません。");
      paragraphs = reasons;
      notes.push("Apple公式サイトまたはAmazonで最新のMacBook Air/Pro構成を確認してみてください。");
      shareText = "\\u3010AI Desk Labo\\u8a3a\\u65ad\\u3011\\u79c1\\u306b\\u5411\\u3044\\u3066\\u308b\\u306e\\u306f\\u300cMac\\u300d\\u3067\\u3057\\u305f\\ud83c\\udf4e #AIDeskLabo\\u8a3a\\u65ad #Mac";
    } else {
      var windowsPlatform = platformPref === "intel" ? "intel" : "amd";
      var cpuAsin, moboAsin, ramAsin, needsCooler = false;
      if (windowsPlatform === "intel") {
        cpuAsin = CATALOG.cpuIntel;
        moboAsin = CATALOG.moboIntel;
        ramAsin = CATALOG.ramDdr4;
      } else {
        ramAsin = CATALOG.ramDdr5;
        if (coreTier === "high") { cpuAsin = CATALOG.cpuHighAmd; moboAsin = CATALOG.moboAm5; needsCooler = true; }
        else if (gpuTier >= 1) { cpuAsin = CATALOG.cpuMidAmd; moboAsin = CATALOG.moboAm5; }
        else { cpuAsin = CATALOG.cpuApuAmd; moboAsin = CATALOG.moboAm4; ramAsin = CATALOG.ramDdr4; }
      }
      var gpuAsin = gpuTier === 2 ? CATALOG.gpuHigh : gpuTier === 1 ? CATALOG.gpuMid : null;
      var platformLabel = windowsPlatform === "intel" ? "Intel" : "AMD";

      title = platformLabel + "構成で組む、" + usecaseText + "PC";
      paragraphs.push("選んだ用途(" + usecaseText + ")をもとに、CPUのコア数・GPUの有無・メモリ容量を決めています。");
      if (gpuTier === 0) paragraphs.push("グラフィックボードなしのAPU/内蔵GPU構成で十分なので、最もコストを抑えたパターンにしました。");
      else if (gpuTier === 1) paragraphs.push("フルHD高設定・60fps以上を狙えるミドルクラスのGPUを組み合わせています。");
      else paragraphs.push("動画編集・高負荷な配信も見据えて、VRAM 12GB以上のGPUを選定しました。");
      if (coreTier === "high") paragraphs.push(heavyCount >= 2 ? "複数の用途を同時にこなす想定なので、コア数の多いCPUとメモリ" + ramGB + "GBを確保しています。" : "動画編集のエンコード・書き出しを考慮して、コア数の多いCPUにしています。");
      if (windowsPlatform === "intel" && (coreTier === "high" || gpuTier === 2)) notes.push("正直に言うと、10コアクラスのCore i5-14400は本格的な4K編集・重い配信にはやや力不足です。予算が許せばCore i7以上のクラスを検討してください。");
      if (hasVideo) notes.push("動画編集は素材量が多くなりがちです。1TB SSDで不足する場合は2TBモデルや外付けSSDの追加も検討してください。");
      if (hybridNote) notes.push(hybridNote);

      if (effort === "prebuilt") {
        notes.unshift("組み立てには興味がないとのことなので、無理に自作はすすめません。下記のCPU・GPUクラスを目安のスペックとして、完成品・BTOパソコンを探すと今回の診断に近い性能で失敗しにくいです。");
        asins = gpuAsin ? [cpuAsin, gpuAsin] : [cpuAsin];
        guideLink = null;
      } else {
        asins.push(cpuAsin);
        if (gpuAsin) asins.push(gpuAsin);
        asins.push(moboAsin);
        asins.push(ramAsin);
        var ramKitGB = ramAsin === CATALOG.ramDdr5 ? 32 : 16;
        if (ramGB > ramKitGB) notes.push("メモリは" + ramGB + "GB以上を推奨。掲載の" + ramKitGB + "GBキットを2セット使うと" + (ramKitGB * 2) + "GBになります。");
        asins.push(CATALOG.storage);
        asins.push(CATALOG.case);
        asins.push(CATALOG.psu);
        asins.push(CATALOG.paste);
        if (needsCooler) asins.push(CATALOG.cooler);

        var total = asins.reduce(function (sum, a) { return sum + (PRICES[a] || 0); }, 0);
        var budgetMap = { "10": 100000, "15": 150000, "20": 200000, "99": Infinity };
        var budgetLabelMap = { "10": "\\uff5e10\\u4e07\\u5186", "15": "10\\u4e07\\uff5e15\\u4e07\\u5186", "20": "15\\u4e07\\uff5e20\\u4e07\\u5186", "99": "20\\u4e07\\u5186\\u4ee5\\u4e0a" };
        var ceil = budgetMap[answers.budget];
        var budgetLabel = budgetLabelMap[answers.budget];
        if (ceil !== undefined) {
          if (ceil !== Infinity && total > ceil * 1.1) {
            notes.push("この構成の目安は約" + yen(total) + "。予算(" + budgetLabel + ")に対して約" + yen(total - ceil) + "オーバーしています。GPUのランクを下げる、またはメモリ容量を抑えると予算内に収まりやすくなります。");
          } else if (ceil !== Infinity && total < ceil * 0.7) {
            notes.push("この構成の目安は約" + yen(total) + "。予算(" + budgetLabel + ")にはまだ余裕があるので、GPUやメモリを一段階上げる余地があります。");
          } else {
            notes.push("この構成の目安は約" + yen(total) + "。予算(" + budgetLabel + ")の範囲に収まっています。");
          }
        }
        var guideSlug = hasVideo && heavyCount >= 2 ? "pc-build-video-editing" : hasVideo ? "pc-build-video-editing" : hasGaming || hasStreaming ? "pc-build-gaming" : "pc-build-office";
        guideLink = { href: GUIDE_ROOT + guideSlug + "/", label: "詳しい解説をガイド記事で読む" };
      }
      shareText = "\\u3010AI Desk Labo\\u8a3a\\u65ad\\u3011\\u79c1\\u306b\\u5411\\u3044\\u3066\\u308b\\u306e\\u306f\\u300c" + platformLabel + "\\u69cb\\u6210\\u306e" + usecaseText + "PC\\u300d\\u3067\\u3057\\u305f\\ud83d\\udda5\\ufe0f #AIDeskLabo\\u8a3a\\u65ad #\\u81ea\\u4f5cPC";
    }

    return { title: title, paragraphs: paragraphs, notes: notes, asins: asins, guideLink: guideLink, shareText: shareText };
  }

  function escapeText(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function showResult() {
    root.querySelector(".quiz-steps").hidden = true;
    var r = compute();
    var html = "";
    html += '<p class="quiz-result-kicker">\\u8a3a\\u65ad\\u7d50\\u679c</p>';
    html += '<h3 class="quiz-result-title">' + escapeText(r.title) + "</h3>";
    r.paragraphs.forEach(function (p) { html += '<p class="quiz-result-body">' + escapeText(p) + "</p>"; });
    if (r.asins.length) {
      html += '<div class="card-grid">';
      r.asins.forEach(function (a) { html += CARDS[a] || ""; });
      html += "</div>";
    }
    r.notes.forEach(function (n) { html += '<p class="quiz-result-note">' + escapeText(n) + "</p>"; });
    if (r.guideLink) html += '<p class="section-link"><a href="' + r.guideLink.href + '">' + escapeText(r.guideLink.label) + " \\u2192</a></p>";
    html += '<div class="quiz-result-actions">';
    html += '<button type="button" class="btn-share" data-share-text="' + escapeText(r.shareText) + '">' + ${JSON.stringify(icon("review"))} + "\\u8a3a\\u65ad\\u7d50\\u679c\\u3092X\\u3067\\u30b7\\u30a7\\u30a2</button>";
    html += '<button type="button" class="quiz-retry">\\u3082\\u3046\\u4e00\\u5ea6\\u8a3a\\u65ad\\u3059\\u308b</button>';
    html += "</div>";
    resultsBox.innerHTML = html;
    resultsBox.hidden = false;
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goToStep(currentIndex) {
    if (currentIndex === stepKeys.length - 1) showResult();
    else showStep(currentIndex + 1);
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
    if (e.target.closest(".quiz-retry")) {
      answers = {};
      root.querySelectorAll(".quiz-option.is-selected").forEach(function (el) { el.classList.remove("is-selected"); });
      root.querySelectorAll(".quiz-next").forEach(function (el) { el.disabled = true; });
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
      const disclosure = `<div class="disclosure-note">本ページはAmazonアソシエイト・プログラムの参加者として、適格販売により収入を得ています。<a href="${root}disclosure.html">詳細</a></div>`;
      bodyHtml = section(
        `${eyebrow}<h1>${escapeHtml(entry.title)}</h1>${updatedHtml}${renderToc(toc)}<article>${bodyBlocksHtml}</article>${disclosure}`
      );
    }

    writeFile(outPath, renderPage(template, { title: entry.title, description: entry.description, canonical, root, bodyHtml }));
    sitemapUrls.push({ loc: canonical, lastmod: isStatic ? null : entry.updated });
  }

  // Per-type index pages (e.g. /reviews/index.html).
  for (const [type, folder] of Object.entries(FOLDER_BY_TYPE)) {
    const entries = content.filter((e) => e.type === type).sort((a, b) => (a.updated < b.updated ? 1 : -1));
    const cards = entries.map((e) => renderEntryCard(e, `${e.slug}/`)).join("\n");
    const bodyHtml = section(
      `<p class="eyebrow">${SITE_TITLE}</p><h2>${TYPE_LABEL_JA[type]}一覧</h2><div class="card-grid">${cards}</div>`
    );
    writeFile(`${folder}/index.html`, renderPage(template, {
      title: `${TYPE_LABEL_JA[type]}一覧`,
      description: `${SITE_TITLE}の${TYPE_LABEL_JA[type]}一覧`,
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
    bodyHtml: heroHtml + marqueeHtml + budgetHtml + showcaseHtml + pillarsHtml + latestHtml,
    intro: HOME_INTRO,
  }));
  sitemapUrls.unshift({ loc: `${SITE_ORIGIN}/` });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls
    .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`)
    .join("\n")}\n</urlset>\n`;
  writeFile("sitemap.xml", sitemapXml);

  console.log(`Build OK — ${content.length} content entries, ${sitemapUrls.length} URLs in sitemap.`);
}

main();
