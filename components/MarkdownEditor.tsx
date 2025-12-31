/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import React, { useState, useEffect } from 'react';
import { Download, FileText, Sparkles, Settings2 } from 'lucide-react';
import saveAs from 'file-saver';
import { parseMarkdown } from '../services/markdownParser.ts';
import { generateDocx } from '../services/docxGenerator.ts';
import { BlockType, ParsedBlock } from '../types.ts';
import { parseInlineElements, InlineStyleType } from '../utils/styleParser.ts';
import { FONTS } from '../constants/theme.ts';

const INITIAL_CONTENT = `# 技術書稿排版範例樣式表

## 1. 基礎文字與段落樣式

這是一段標準的正文。我們支援多種行內樣式，例如 **粗體強調** 以吸引讀者注意。當提到程式碼變數時，可以使用 \`inline code\` 樣式。

對於書籍介面的描述，我們設計了特殊的括號樣式：點擊 【確定】 按鈕後即可完成操作。這在 Word 匯出後也會保持加粗與特殊視覺感。

---

### 1.1 列表測試

- 第一項重點內容
- 第二項重點內容，包含 \`行內程式\`
- 第三項內容，測試自動換行的對齊效果

## 2. 特殊文字樣式展示

本工具支援多種專業出版需要的文字格式，請參考以下範例：

- **粗體 (Bold)**：用於強調關鍵字，例如 **Vibe Coding**。
- *斜體 (Italic)*：用於 *專有名詞定義* 或 *英文術語*。匯出 Word 時會呈現深藍色斜體。
- <u>底線 (Underline)</u>：用於 <u>超連結文字</u> 或需要特別畫線的地方。
- UI 按鈕：請點擊 【設定】 > 【進階選項】 進行調整。
- 快捷鍵：按下 [Ctrl] + [S] 可以儲存檔案，或使用 [Cmd] + [P] 列印。
- 書籍/專案：參考『Clean Code』一書中的概念，或是『BookPublisher』專案。

---

## 3. 角色對話框展示 (左右對齊效果)

User：嘿 Gemini，請幫我示範一下這個 APP 的對話框排版效果。

AI：沒問題！在這個系統中，User 的對話會靠右側顯示，並使用虛線邊框；而 AI 的回覆則會靠左側顯示，搭配點狀邊框與淺灰色背景。這種排版非常適合技術書籍中的「情境模擬」或「問答環節」。

User：原來阿！

---

## 4. 程式碼區塊樣式

下面展示的是標準的程式碼區塊，匯出至 Word 時會自動加上細邊框、淺灰背景，並使用等寬字體 (Consolas)。

\`\`\`typescript
interface BookConfig {
  title: string;
  author: string;
  publishDate: Date;
}

const myBook: BookConfig = {
  title: "Vibe Coding 實戰指南",
  author: "ChiYu",
  publishDate: new Date()
};
\`\`\`

---

## 5. 特殊提醒與警告 (Callouts)

> [!TIP]
> **提示 (Tip)**：通常用於分享小撇步或最佳實踐。在 Word 中會以實線邊框標註。

> [!NOTE]
> **筆記 (Note)**：用於補充背景知識。網頁預覽會呈現斜體效果，Word 中則使用虛線邊框區隔。

> [!WARNING]
> **警告 (Warning)**：非常重要的注意事項。在 Word 中會使用最粗的實線邊框，確保讀者不會遺漏。

---

## 6. 多層級標題測試

### 5.1 三級標題範例
這裡是三級標題下的文字，匯出時會自動加上底部的裝飾線或特定的縮排間距。

## 7. 表格與圖片支援

### 7.1 表格範例 (自動識別)

| 功能特姓 | 支援狀況 | 備註說明 |
| --- | --- | --- |
| 粗體樣式 | ✅ 支援 | 使用 ** 星號包覆 |
| 表格排版 | ✅ 支援 | 自動生成格線 |
| 轉檔引擎 | 🚀 快速 | 純前端運算 |

### 7.2 圖片插入指引

目前支援標準 Markdown 圖片語法，但僅供寫作參考：

\`![圖片描述](https://example.com/image.jpg)\`

> [!NOTE]
> **圖片匯出注意**：由於瀏覽器安全性限制 (CORS)，直接匯出包含網路圖片的 Word 檔可能會失敗或無法顯示。
> 建議在 Markdown 中僅標示圖片位置，匯出 Word 後再手動置入高畫質圖片以確保最佳印刷品質。
`;

// 定義可選的版面尺寸
const PAGE_SIZES = [
  { name: "技術書籍 (17x23cm)", width: 17, height: 23 },
  { name: "A4 (21x29.7cm)", width: 21, height: 29.7 },
  { name: "A5 (14.8x21cm)", width: 14.8, height: 21 },
  { name: "B5 (17.6x25cm)", width: 17.6, height: 25 },
];

const MarkdownEditor: React.FC = () => {
  // 優先從 localStorage 讀取草稿
  const [content, setContent] = useState(() => {
    return localStorage.getItem('draft_content') || INITIAL_CONTENT;
  });
  const [parsedBlocks, setParsedBlocks] = useState<ParsedBlock[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  // 計算字數 (中文字 + 英文字)
  const getWordCount = (text: string) => {
    // 移除 markdown 符號，只保留文字大致估算
    const cleanText = text.replace(/[*#>`~_\[\]()]/g, ' ');
    // 匹配中日韓文字
    const cjk = (cleanText.match(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
    // 匹配英文單字 (以空格分隔)
    const latin = (cleanText.replace(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, ' ').match(/\b\w+\b/g) || []).length;
    return cjk + latin;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const blocks = parseMarkdown(content);
        setParsedBlocks(blocks);
        setWordCount(getWordCount(content));
        
        // Auto Save
        localStorage.setItem('draft_content', content);
      } catch (e) {
        console.error("Markdown 解析出錯:", e);
      }
    }, 300); // 300ms 防抖延遲

    return () => clearTimeout(timer);
  }, [content]);

  const handleDownload = async () => {
    if (parsedBlocks.length === 0) return;
    setIsGenerating(true);
    try {
      const sizeConfig = PAGE_SIZES[selectedSizeIndex];
      const blob = await generateDocx(parsedBlocks, { 
        widthCm: sizeConfig.width, 
        heightCm: sizeConfig.height 
      });
      saveAs(blob, "Professional_Manuscript.docx");
    } catch (error) {
      console.error("Word 轉檔失敗:", error);
      alert("轉檔失敗，請確認內容格式是否正確。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // 在當前位置插入兩個空格
      const newContent = content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);

      // 重新設定光標位置 (需要在 state 更新後的下一個事件循環中)
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const renderPreviewContent = () => {
    const elements: JSX.Element[] = [];
    let i = 0;
    while (i < parsedBlocks.length) {
      const block = parsedBlocks[i];
      if (block.type === BlockType.BULLET_LIST) {
        const listItems: ParsedBlock[] = [];
        while (i < parsedBlocks.length && parsedBlocks[i].type === BlockType.BULLET_LIST) {
          listItems.push(parsedBlocks[i]);
          i++;
        }
        elements.push(
          <ul key={`bullet-list-${i}`} className="ml-8 mb-8">
            {listItems.map((item, idx) => (
              <li key={idx} className="relative mb-2 pl-4 leading-[1.8] list-none before:content-[''] before:absolute before:left-0 before:top-[0.7em] before:w-2 before:h-2 before:bg-slate-400 before:rounded-full">
                 <RenderRichText text={item.content} />
              </li>
            ))}
          </ul>
        );
      } else if (block.type === BlockType.NUMBERED_LIST) {
        const listItems: ParsedBlock[] = [];
        while (i < parsedBlocks.length && parsedBlocks[i].type === BlockType.NUMBERED_LIST) {
          listItems.push(parsedBlocks[i]);
          i++;
        }
        elements.push(
          <ol key={`numbered-list-${i}`} className="ml-8 mb-8 list-decimal">
            {listItems.map((item, idx) => (
              <li key={idx} className="mb-2 pl-2 leading-[1.8] text-slate-800">
                 <RenderRichText text={item.content} />
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(<PreviewBlock key={i} block={block} />);
        i++;
      }
    }
    return elements;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2.5 rounded-xl">
            <FileText className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">BookPublisher <span className="text-slate-400 font-normal">MD2Docx</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">核心引擎：Markdown -&gt; Word (v2.0)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 版面尺寸選擇器 */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Settings2 className="w-4 h-4 text-slate-500" />
            <select 
              value={selectedSizeIndex}
              onChange={(e) => setSelectedSizeIndex(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {PAGE_SIZES.map((size, index) => (
                <option key={index} value={index}>
                  {size.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownload}
            disabled={isGenerating || parsedBlocks.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:bg-slate-300"
          >
            {isGenerating ? '正在轉換...' : '匯出 Word'}
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="w-1/2 flex flex-col border-r border-slate-200 bg-white">
          <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manuscript Editor (Draft)</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               {wordCount} Words
            </span>
          </div>
          <textarea
            className="flex-1 w-full p-10 resize-none focus:outline-none text-base leading-[1.8] text-slate-700 selection:bg-indigo-100"
            style={{ fontFamily: `"${FONTS.LATIN}", "${FONTS.CJK}", sans-serif` }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder="在此輸入您的 Markdown 稿件..."
          />
        </div>

        <div className="w-1/2 flex flex-col bg-slate-100/50">
          <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Print Layout Preview (WYSIWYG)
          </div>
          <div className="flex-1 overflow-y-auto p-12 lg:p-16 scroll-smooth">
            <div 
              className="max-w-2xl mx-auto bg-white shadow-2xl p-16 lg:p-20 min-h-screen text-slate-900 rounded-sm border border-slate-200"
              style={{ fontFamily: `"${FONTS.LATIN}", "${FONTS.CJK}", sans-serif` }}
            >
              {parsedBlocks.length > 0 ? (
                renderPreviewContent()
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 mt-20 opacity-30">
                  <Sparkles className="w-12 h-12 mb-4" />
                  <p className="font-bold tracking-widest">等待輸入內容...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const RenderRichText: React.FC<{ text: string }> = ({ text }) => {
  const segments = parseInlineElements(text);
  
  return (
    <>
      {segments.map((segment, i) => {
        switch (segment.type) {
          case InlineStyleType.BOLD:
            return <strong key={i} className="font-bold text-slate-900">{segment.content}</strong>;
          case InlineStyleType.ITALIC:
            return <span key={i} className="italic text-blue-800">{segment.content}</span>;
          case InlineStyleType.UNDERLINE:
            return <span key={i} className="underline decoration-blue-500 text-blue-600 decoration-1 underline-offset-2">{segment.content}</span>;
          case InlineStyleType.CODE:
            return <code key={i} className="bg-slate-100 px-1.5 py-0.5 rounded text-[0.9em] font-mono text-slate-700 border border-slate-200">{segment.content}</code>;
          case InlineStyleType.UI_BUTTON:
            return (
              <span key={i} className="inline-block px-1.5 py-0.5 mx-0.5 text-[0.8rem] font-bold bg-slate-200 border border-slate-400 rounded text-slate-800 shadow-[1px_1px_0_0_#94a3b8]">
                {segment.content}
              </span>
            );
          case InlineStyleType.SHORTCUT:
            return (
              <span key={i} className="inline-block px-1 mx-0.5 text-[0.8rem] bg-white border border-slate-300 rounded shadow-sm text-slate-600">
                {segment.content}
              </span>
            );
          case InlineStyleType.BOOK:
            return <span key={i} className="font-bold text-slate-900">{segment.content}</span>;
          case InlineStyleType.TEXT:
          default:
            return <span key={i}>{segment.content}</span>;
        }
      })}
    </>
  );
};

const PreviewBlock: React.FC<{ block: ParsedBlock }> = ({ block }) => {
  switch (block.type) {
    case BlockType.HEADING_1:
      return <h1 className="text-4xl font-black mb-12 mt-16 pb-4 border-b-4 border-slate-900 tracking-tight leading-tight"><RenderRichText text={block.content} /></h1>;
    case BlockType.HEADING_2:
      return <h2 className="text-2xl font-black mb-8 mt-12 tracking-tight flex items-center gap-3 before:w-2 before:h-8 before:bg-indigo-600"><RenderRichText text={block.content} /></h2>;
    case BlockType.HEADING_3:
      return <h3 className="text-xl font-bold mb-6 mt-10 text-slate-800 underline decoration-indigo-200 underline-offset-8 decoration-4"><RenderRichText text={block.content} /></h3>;
    case BlockType.CODE_BLOCK:
      return (
        <div className="my-10 border border-slate-300 bg-slate-50 p-8 rounded shadow-sm">
          <pre className="text-sm font-mono whitespace-pre text-slate-900 leading-relaxed overflow-x-auto">{block.content}</pre>
        </div>
      );
    case BlockType.CHAT_USER:
      return (
        <div className="flex justify-end my-12 pl-20">
          <div className="max-w-[85%] border-2 border-dashed border-slate-900 p-6 bg-white relative text-right">
            <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black tracking-widest text-indigo-600 border border-slate-200">USER</div>
            <div className="whitespace-pre-wrap leading-[1.8]"><RenderRichText text={block.content} /></div>
          </div>
        </div>
      );
    case BlockType.CHAT_AI:
      return (
        <div className="flex justify-start my-12 pr-20">
          <div className="max-w-[85%] border-2 border-dotted border-slate-900 p-6 bg-slate-100 relative text-left">
            <div className="absolute -top-3 right-4 bg-slate-100 px-2 text-[10px] font-black tracking-widest text-indigo-600 border border-slate-200">AI</div>
            <div className="whitespace-pre-wrap leading-[1.8] text-slate-800"><RenderRichText text={block.content} /></div>
          </div>
        </div>
      );
    case BlockType.CALLOUT_TIP:
      return (
        <div className="my-14 p-6 bg-slate-50 border border-slate-400 shadow-sm relative">
           <div className="absolute -top-3 left-4 bg-slate-50 px-2 text-xs font-bold text-slate-600 border border-slate-400">TIP</div>
           <div className="whitespace-pre-wrap leading-[1.8] text-slate-800"><RenderRichText text={block.content} /></div>
        </div>
      );
    case BlockType.CALLOUT_WARNING:
      return (
        <div className="my-14 p-6 bg-slate-50 border-2 border-black shadow-md relative">
           <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-black text-black border-2 border-black">WARNING</div>
           <div className="whitespace-pre-wrap leading-[1.8] text-slate-900 font-bold"><RenderRichText text={block.content} /></div>
        </div>
      );
    case BlockType.CALLOUT_NOTE:
      return (
        <div className="my-14 p-6 bg-white border border-dashed border-slate-400 shadow-sm relative">
           <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-slate-500 border border-dashed border-slate-400">NOTE</div>
           <div className="whitespace-pre-wrap leading-[1.8] text-slate-800 italic"><RenderRichText text={block.content} /></div>
        </div>
      );
    case BlockType.TABLE:
      return (
        <div className="my-10 overflow-x-auto">
          <table className="w-full border-collapse border border-slate-400 text-left shadow-sm">
            <tbody>
              {block.tableRows?.map((row, rIdx) => (
                <tr key={rIdx} className={`border-b border-slate-300 ${rIdx === 0 ? 'bg-slate-100 font-bold' : 'bg-white'}`}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-4 border-r border-slate-300 text-sm text-slate-800 last:border-r-0">
                      <RenderRichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case BlockType.HORIZONTAL_RULE:
      return <hr className="my-8 border-t-2 border-slate-900" />;
    default:
      return <p className="mb-8 leading-[2.1] text-justify text-slate-800 tracking-tight"><RenderRichText text={block.content} /></p>;
  }
};

export default MarkdownEditor;