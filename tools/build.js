#!/usr/bin/env node
// Static site generator for AI Desk Labo review/comparison site.
// No dependencies beyond Node built-ins — must run unattended in a cloud routine
// with nothing but `node tools/build.js`.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://REPLACE-WITH-YOUR-DOMAIN.example"; // update once the domain is registered
const AMAZON_TAG = "aidesklabo-22";
const SITE_TITLE = "AI Desk Labo";

const FOLDER_BY_TYPE = { review: "reviews", ranking: "rankings", compare: "compare", guide: "guides" };
const TYPE_LABEL_JA = { review: "レビュー", ranking: "ランキング", compare: "比較", guide: "ガイド" };
const TYPE_COLOR = { review: "blue", ranking: "orange", compare: "green", guide: "blue" };
const CATEGORY_COLOR = { keyboard: "orange", mouse: "blue", charger: "green", monitor: "orange", stand: "green", mic: "blue" };

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
};

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

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function section(innerHtml, { tint = false, reveal = true } = {}) {
  return `<section class="section${tint ? " tint" : ""}"${reveal ? ' data-reveal=""' : ""}><div class="wrap">${innerHtml}</div></section>`;
}

// Block bodies are allowed a small set of inline tags (e.g. <a href>) written
// directly by whoever authored the content entry, so blocks are NOT escaped —
// only plain strings coming from data (like table cells, product fields) are escaped.
function renderProductCard(product) {
  const badgeColor = CATEGORY_COLOR[product.category] || "blue";
  return `<div class="card">
  <div class="card-top">${iconBadge(product.category, badgeColor)}<span class="badge ${badgeColor}">${escapeHtml(product.category)}</span></div>
  <h3>${escapeHtml(product.name)}</h3>
  <p class="price">¥${product.price.toLocaleString("ja-JP")}<br><small>${escapeHtml(product.priceNote || "")}</small></p>
  <p>${escapeHtml(product.summary || "")}</p>
  <ul>${(product.pros || []).map((x) => `<li>◎ ${escapeHtml(x)}</li>`).join("")}${(product.cons || []).map((x) => `<li>△ ${escapeHtml(x)}</li>`).join("")}</ul>
  <a class="btn-amazon" href="${amazonLink(product)}" rel="nofollow sponsored noopener" target="_blank">${icon("cart")}Amazonで見る</a>
</div>`;
}

function renderTable(table) {
  const head = `<tr>${table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`;
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
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

function renderPage(template, { title, description, canonical, root, bodyHtml }) {
  return template
    .replaceAll("{{TITLE}}", escapeHtml(title))
    .replaceAll("{{DESCRIPTION}}", escapeHtml(description))
    .replaceAll("{{CANONICAL}}", canonical)
    .replaceAll("{{ROOT}}", root)
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
    <span class="rank">No.${i + 1}</span>
    ${iconBadge(product.category, badgeColor)}
    <h3>${escapeHtml(product.name)}</h3>
    <p class="price">¥${product.price.toLocaleString("ja-JP")}</p>
    <p>${escapeHtml(product.summary || "")}</p>
    <a class="btn-amazon" href="${amazonLink(product)}" rel="nofollow sponsored noopener" target="_blank">${icon("cart")}Amazonで見る</a>
  </div>`;
    })
    .join("\n");
  return section(
    `<div class="section-head"><p class="eyebrow">Ranking</p><h2>今、注目のアイテム</h2></div>
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
      const eyebrow = `<p class="eyebrow">${TYPE_LABEL_JA[entry.type]}</p>`;
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

  const heroHtml = `<section class="hero" data-reveal="">
  <span class="hero-blob b1"></span><span class="hero-blob b2"></span><span class="hero-blob b3"></span>
  <div class="wrap">
    <p class="eyebrow">AI × ガジェット比較メディア</p>
    <h1>AIと過ごす毎日を、<br>もっと快適にするモノを選ぶ。</h1>
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
</section>`;

  const latestHtml = section(
    `<div class="section-head"><p class="eyebrow">Latest</p><h2>最新の記事</h2></div><div class="card-grid">${latest
      .map((e) => renderEntryCard(e, `${FOLDER_BY_TYPE[e.type]}/${e.slug}/`))
      .join("\n")}</div>`,
    { tint: true }
  );

  // Showcase pulls its ranked order from the first "ranking" entry found;
  // falls back to product declaration order if no ranking entry exists yet.
  const rankingEntry = content.find((e) => e.type === "ranking");
  const rankedAsins = rankingEntry ? rankingEntry.products : products.map((p) => p.asin);
  const showcaseHtml = renderShowcase(rankedAsins.map((asin) => productsMap[asin]));

  writeFile("index.html", renderPage(template, {
    title: "AI・ガジェットの比較とレビュー",
    description: "AIツールとガジェットの実体験レビュー・比較・ランキングを発信するAI Desk Labo公式サイト。",
    canonical: `${SITE_ORIGIN}/`,
    root: "",
    bodyHtml: heroHtml + showcaseHtml + latestHtml,
  }));
  sitemapUrls.unshift({ loc: `${SITE_ORIGIN}/` });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls
    .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`)
    .join("\n")}\n</urlset>\n`;
  writeFile("sitemap.xml", sitemapXml);

  console.log(`Build OK — ${content.length} content entries, ${sitemapUrls.length} URLs in sitemap.`);
}

main();
