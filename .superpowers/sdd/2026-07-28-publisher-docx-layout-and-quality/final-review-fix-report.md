# Final branch review fix round 1/5

## 範圍

- Base：`3d1f0746fdbf127395965bd14194bcf3c327adbb`
- Branch：`codex/publisher-docx-layout`
- 本輪只處理 whole-branch review 的五項 Important findings，以及驗證過程中直接揭露的同範圍契約缺口。
- 未 amend、未 push。

## 修正結果

### 1. technical-legacy 完整相容

- 恢復 H1 舊版底線、段距與直接 paragraph properties。
- Callout 恢復單一 bordered paragraph、`[ LABEL ]` 與舊版換行、border、shading、indent。
- Dialogue 恢復 ASCII colon、role/content 換行、舊版 border、spacing、indent 與 flow。
- Italic 恢復舊版藍色與字型；inline code 保留 shading，但不強制 publisher 字型、字級或色彩。
- Reviewer 複核另抓到 `styles.xml` 仍覆寫 legacy Heading1–3。本輪改為 legacy 沿用 docx 內建 heading styles，真實 package regression 鎖定：
  - Heading1：`2E74B5`、32 half-points。
  - Heading2：`2E74B5`、26 half-points。
  - Heading3：`1F4D78`、24 half-points。
  - 三者皆不注入 bold、keepNext、keepLines。

### 2. Preview 與 DOCX 語意一致

- Publisher 一般 hyperlink 不再顯示 legacy QR icon。
- Publisher code block 不再顯示 language badge 或 line numbers。
- technical-legacy 保留 QR icon、language badge 與 line numbers。
- DOM tests 同時覆蓋直接 profile 與 applied-settings 路徑。

### 3. Chapter parser 線性化

- Chapter scanner span 攜帶 `endLineOffset`。
- Gap 與 suffix 改用單一 forward-only line cursor，不再執行
  `markdown.slice(0, cursor).match(/\n/g)` prefix rescan。
- `measureMarkdownParseOperations()` 使用完整 `parseMarkdownWithAST` 路徑，
  以 deterministic char/token/line/span transitions 驗證線性操作量。
- 容器、fenced/inline code、YAML blank lines、CRLF 與 recovery 測試均保留。

### 4. Publisher table body 10pt

- 新增 `TableBody` named paragraph style，實際使用
  `profile.table.bodySizeHalfPoints`；publisher cell 以 20 half-points 輸出。
- Inline code 仍保留 19 half-points，不被 cell style 覆蓋。
- technical-legacy cell 不引用 `TableBody`，`styles.xml` 也不註冊該 publisher-only style。

### 5. 關閉 media 與 OOXML false-green

- 普通 IMAGE 與 chapter image 共用 media resolver，驗證 direct data URL、
  registry mapping、Base64、MIME、magic bytes 與結構。
- Registry key 即使外觀為 external URL，仍優先驗證 registry 實際內容。
- Package inspection 現在要求 `_rels/.rels`、正確 Relationships root 與 namespace、
  每個 Relationship 的 `Id`／`Type`／`Target`。
- External relationship 只在必要屬性通過後略過 internal target resolver；
  whitespace-only Target 會 fail-closed。
- Root 必須有 Transitional 或 Strict officeDocument relationship 指向
  `word/document.xml`。
- 支援圖片的副檔名、declared MIME 與 magic bytes 必須一致；截斷或假圖片不再通過。
- 保留 legal external、relative、encoded URI、query、fragment 與 Strict Type 正例。

## TDD 與 review 證據

- 初始 focused RED 重現 legacy OOXML、Preview、parser prefix rescan、
  TableBody 缺口，以及 export/package 四種 false-green。
- Parser 400 chapters／23,675 chars 的舊 prefix newline scan 為
  4,697,060 transitions，超過線性 bound 189,400。
- Media/OOXML 唯讀 probe 再重現 registry URL key、External whitespace Target、
  wrong-namespace child 與重複 officeDocument 診斷；均先加入 RED regression 再修正。
- Focused suite 曾達 7 files／249 tests PASS。
- Reviewer 的 legacy `styles.xml` blocker 先以 2 個 RED tests 重現；
  修正後 typography/styles/table 為 3 files／37 tests PASS。
- Invalid Mermaid 負向測試原先誤把
  `browser-profile/Default/Edge Profile Picture.png` 視為 Mermaid output。
  測試改為精確檢查預期 `mermaid.png` 與 root `publisher-fixture.docx`；
  focused test 連跑 3 次皆為 1 file／2 tests PASS。

## 視覺 QA

### 視覺暫停與核准

- `qa:fixture`：PASS，fixture DOCX 98,549 bytes。
- 初次 `qa:render`：PASS，由 7 頁縮為 6 頁。
- 初次官方 `qa:compare` 因 page set 不同按契約失敗：
  `missing=page-7.png`、`extra=無`。
- 對六個同名頁做唯讀 pixelmatch：

| 頁面 | 初次 mismatch ratio |
| --- | ---: |
| page-1.png | 0.000117040 |
| page-2.png | 0.000000000 |
| page-3.png | 0.000000000 |
| page-4.png | 0.019679119 |
| page-5.png | 0.221451328 |
| page-6.png | 0.214713339 |

- Controller 逐頁檢查 6/6 後核准：差異由 TableBody 10pt 與相關 reflow 造成，
  無裁切、重疊、缺圖、空白異常頁或頁尾碰撞。
- 核准後才執行 `qa:baseline`。Script 不會刪除 stale page，因此另以明確單檔
  `tests/visual/baseline/page-7.png` 安全刪除；未做批量或遞迴刪除。

### 最終重跑

- LibreOffice：26.2.4.2。
- Poppler：26.05.0。
- DPI：110；Noto Sans TC 已由 Windows Fonts registry 偵測。
- 最終 render：
  `artifacts/docx-qa/renders/20260729-090209-044`
- Page count：6。
- 最終 `qa:compare`：page 1–6 mismatch ratio 全為 `0.000000`。
- 修正 legacy styles 後沒有再次更新 baseline。

最終 PNG：

1. `D:\MySelf\MD2DOC-Evolution\.worktrees\publisher-docx-layout\artifacts\docx-qa\renders\20260729-090209-044\pages\page-1.png`
2. `D:\MySelf\MD2DOC-Evolution\.worktrees\publisher-docx-layout\artifacts\docx-qa\renders\20260729-090209-044\pages\page-2.png`
3. `D:\MySelf\MD2DOC-Evolution\.worktrees\publisher-docx-layout\artifacts\docx-qa\renders\20260729-090209-044\pages\page-3.png`
4. `D:\MySelf\MD2DOC-Evolution\.worktrees\publisher-docx-layout\artifacts\docx-qa\renders\20260729-090209-044\pages\page-4.png`
5. `D:\MySelf\MD2DOC-Evolution\.worktrees\publisher-docx-layout\artifacts\docx-qa\renders\20260729-090209-044\pages\page-5.png`
6. `D:\MySelf\MD2DOC-Evolution\.worktrees\publisher-docx-layout\artifacts\docx-qa\renders\20260729-090209-044\pages\page-6.png`

Baseline SHA-256：

| 頁面 | SHA-256 |
| --- | --- |
| page-1.png | `4a62c3e2b33e9a7eda4ee5959bad4a49ac3eabb9dfbf3f926362aa2ec20fd937` |
| page-2.png | `da3c1bba1b1efacb564510c4b0e449af5dd84182e7ca80c058f91fa056da319e` |
| page-3.png | `ca22c78f7854b0ac8808c13db9315364963b445e497cf5865dedc1bd8b6cc35b` |
| page-4.png | `b109204f6096ddd59a2484a78a4db4f4943ea69939612998f18ec0e6069a8b9b` |
| page-5.png | `489549b202bc40054015651b41f7b71fc8bb2613b25e9481d3dd9cf63ed5072c` |
| page-6.png | `9a434de5361d2788d4639b2e15cbd7cdfe33d8515f42e8e85bf8e95a0c6554c1` |

## 最終 gates

- Compare 後 fresh `npm run verify`：PASS。
  - TypeScript typecheck：PASS。
  - 22 test files／379 tests：PASS。
  - Vite production build：PASS，5,550 modules transformed。
- `git diff --check`：PASS。
- Strict UTF-8 fatal decode：20 個 changed text files PASS；
  0 replacement character、0 control/private-use character。
- Added-lines privacy/secret scan：private manuscript terms、private key、AWS、
  OpenAI、GitHub、Slack、JWT、assigned secret、URL credentials 全為 0 命中。
- QA-owned process scan：0 個殘留的 LibreOffice、Poppler、Edge/Chrome 或 Node process。

## Skills

- `superpowers:test-driven-development`
- `systematic-debugging`
- `superpowers:verification-before-completion`
- `receiving-code-review`
- `commit-work`
