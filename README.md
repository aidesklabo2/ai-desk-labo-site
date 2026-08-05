# AI Desk Labo — 比較・レビューサイト

X(@yu_aidesklabo)/Note(note.com/yu_aidesklabo)と同ブランドの、SNS運用に依存しない静的サイト。収益源はAmazonアソシエイト(`tag=aidesklabo-22`)とGoogle AdSense。

## 仕組み

- `data/products.json` … 商品マスタ(ASIN・価格・長所短所)
- `data/content.json` … ページ本体(レビュー/ランキング/比較/ガイド/固定ページ)。ブロック単位(`h2`/`p`/`list`/`table`/`products`)の構造化データで、`tools/build.js` がHTMLに変換する
- `tools/build.js` … 上記2つのJSONと `tools/template.html` から `index.html` 他すべての静的ページと `sitemap.xml` を生成する。依存パッケージなし、`node tools/build.js` だけで動く

新しいレビュー/ランキング/比較/ガイドを追加するときは、直接HTMLを書かず **`data/content.json` にエントリを追記して `node tools/build.js` を実行する** こと。テンプレートの一貫性が壊れないのはこのため。

## ローカルでのビルド確認

```
node tools/build.js
```

`Build OK — N content entries, M URLs in sitemap.` と出れば成功。`data/products.json` にない ASIN を参照すると失敗して該当箇所を教えてくれる。

## 公開までに必要な手動セットアップ(このリポジトリの外側の作業)

1. 独自ドメインを取得し、GitHub PagesへDNSを向ける
2. GitHubでこのリポジトリを作成・push、Settings → Pages で "Deploy from a branch"(`main` / root)を有効化
3. `CNAME.example` を実際のドメイン名にリネームして `CNAME` にする
4. `tools/build.js` の `SITE_ORIGIN` と `robots.txt` のドメイン部分を実際のドメインに置き換えて再ビルド
5. Settings → Pages で "Enforce HTTPS" が有効になるのを待つ
6. `/web-setup` などでこのリポジトリへのGitHubアクセスをClaude Code Routineに許可
7. claude.ai/code/routines で週次ルーチンを作成(対象リポジトリ・週次スケジュール。「無制限ブランチpush」はオフのまま推奨 — 本リポジトリは `claude/*` ブランチ→PR→`.github/workflows/auto-merge.yml` による自動マージ前提で動く)
8. 数週間分のコンテンツが揃ってからGoogle AdSenseに申請。承認後、発行されたコードで `ads.txt` を追加

## 週次ルーチンの作業内容

1. `data/products.json` と `data/content.json` を読む
2. WebSearchで話題のAI/ガジェット新商品とAmazon.co.jpの現在価格を調査(出典URL付き)
3. `data/products.json` / `data/content.json` を更新(既存のブロック形式に従う)
4. `node tools/build.js` を実行し、失敗したら原因(ASIN不整合など)を直してから再実行
5. `claude/<日付>-update` ブランチにコミット・push → PRを作成
