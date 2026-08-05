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

const FOLDER_BY_TYPE = {
  review: "reviews",
  ranking: "rankings",
  compare: "compare",
  guide: "guides",
};

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT_DIR, relPath), "utf8"));
}

function amazonLink(product) {
  const url = new URL(product.url);
  url.searchParams.set("tag", AMAZON_TAG);
  return url.toString();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Block bodies are allowed a small set of inline tags (e.g. <a href>) written
// directly by whoever authored the content entry, so blocks are NOT escaped —
// only plain strings coming from data (like table cells) are escaped.
function renderProductCard(product) {
  const badgeClass = { keyboard: "orange", mouse: "blue", charger: "green", monitor: "orange" }[product.category] || "blue";
  return `<div class="card">
  <span class="badge ${badgeClass}">${escapeHtml(product.category)}</span>
  <h3>${escapeHtml(product.name)}</h3>
  <p class="price">¥${product.price.toLocaleString("ja-JP")}<br><small>${escapeHtml(product.priceNote || "")}</small></p>
  <p>${escapeHtml(product.summary || "")}</p>
  <ul>${(product.pros || []).map((x) => `<li>◎ ${escapeHtml(x)}</li>`).join("")}${(product.cons || []).map((x) => `<li>△ ${escapeHtml(x)}</li>`).join("")}</ul>
  <a class="btn-amazon" href="${amazonLink(product)}" rel="nofollow sponsored noopener" target="_blank">Amazonで見る</a>
</div>`;
}

function renderTable(table) {
  const head = `<tr>${table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`;
  const rows = table.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<div class="table-wrap"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
}

function renderBody(blocks, productsMap) {
  return blocks
    .map((block) => {
      if (block.h2) return `<h2>${block.h2}</h2>`;
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
}

function renderPage(template, { title, description, canonical, root, bodyHtml, updated }) {
  const updatedHtml = updated ? `<p class="updated">最終更新日: ${escapeHtml(updated)}</p>` : "";
  const disclosure = `<div class="disclosure-note">本ページはAmazonアソシエイト・プログラムの参加者として、適格販売により収入を得ています。<a href="${root}disclosure.html">詳細</a></div>`;
  return template
    .replaceAll("{{TITLE}}", escapeHtml(title))
    .replaceAll("{{DESCRIPTION}}", escapeHtml(description))
    .replaceAll("{{CANONICAL}}", canonical)
    .replaceAll("{{ROOT}}", root)
    .replace("{{BODY}}", `<h1>${escapeHtml(title)}</h1>${updatedHtml}<article>${bodyHtml}</article>${disclosure}`);
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

  for (const entry of content) {
    const isStatic = entry.type === "static";
    const outPath = isStatic
      ? `${entry.slug}.html`
      : `${FOLDER_BY_TYPE[entry.type]}/${entry.slug}/index.html`;
    const root = isStatic ? "" : "../../";
    const canonical = `${SITE_ORIGIN}/${isStatic ? entry.slug + ".html" : FOLDER_BY_TYPE[entry.type] + "/" + entry.slug + "/"}`;
    const bodyHtml = renderBody(entry.body, productsMap);
    const html = renderPage(template, {
      title: entry.title,
      description: entry.description,
      canonical,
      root,
      bodyHtml,
      updated: isStatic ? null : entry.updated,
    });
    writeFile(outPath, html);
    sitemapUrls.push({ loc: canonical, lastmod: entry.updated });
  }

  // Per-type index pages (e.g. /reviews/index.html)
  for (const [type, folder] of Object.entries(FOLDER_BY_TYPE)) {
    const entries = content.filter((e) => e.type === type).sort((a, b) => (a.updated < b.updated ? 1 : -1));
    const cards = entries
      .map(
        (e) =>
          `<div class="card"><h3><a href="../${folder}/${e.slug}/">${escapeHtml(e.title)}</a></h3><p>${escapeHtml(e.description)}</p><p class="updated">${escapeHtml(e.updated)}</p></div>`
      )
      .join("\n");
    const html = renderPage(template, {
      title: { review: "レビュー一覧", ranking: "ランキング一覧", compare: "比較一覧", guide: "ガイド一覧" }[type],
      description: `${SITE_TITLE}の${folder}一覧`,
      canonical: `${SITE_ORIGIN}/${folder}/`,
      root: "../",
      bodyHtml: `<div class="card-grid">${cards}</div>`,
    });
    writeFile(`${folder}/index.html`, html);
    sitemapUrls.push({ loc: `${SITE_ORIGIN}/${folder}/` });
  }

  // Homepage: latest entries across all non-static types.
  const latest = content
    .filter((e) => e.type !== "static")
    .sort((a, b) => (a.updated < b.updated ? 1 : -1))
    .slice(0, 12);
  const homeCards = latest
    .map(
      (e) =>
        `<div class="card"><span class="badge blue">${escapeHtml(e.type)}</span><h3><a href="${FOLDER_BY_TYPE[e.type]}/${e.slug}/">${escapeHtml(e.title)}</a></h3><p>${escapeHtml(e.description)}</p></div>`
    )
    .join("\n");
  const homeHtml = renderPage(template, {
    title: "AI・ガジェットの比較とレビュー",
    description: "AIツールとガジェットの実体験レビュー・比較・ランキングを発信するAI Desk Labo公式サイト。",
    canonical: `${SITE_ORIGIN}/`,
    root: "",
    bodyHtml: `<p>AIツールとガジェットを実際に使い倒して分かったことを、比較表とランキングでまとめています。</p><div class="card-grid">${homeCards}</div>`,
  });
  writeFile("index.html", homeHtml);
  sitemapUrls.unshift({ loc: `${SITE_ORIGIN}/` });

  // sitemap.xml
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls
    .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`)
    .join("\n")}\n</urlset>\n`;
  writeFile("sitemap.xml", sitemapXml);

  console.log(`Build OK — ${content.length} content entries, ${sitemapUrls.length} URLs in sitemap.`);
}

main();
