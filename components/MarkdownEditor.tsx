import React, { useState, useEffect } from 'react';
import { Download, FileText, Sparkles } from 'lucide-react';
import saveAs from 'file-saver';
import { parseMarkdown } from '../services/markdownParser.ts';
import { generateDocx } from '../services/docxGenerator.ts';
import { BlockType, ParsedBlock } from '../types.ts';

const INITIAL_CONTENT = `# 技術書稿排版範例樣式表

## 1. 基礎文字與段落樣式

這是一段標準的正文。我們支援多種行內樣式，例如 **粗體強調** 以吸引讀者注意。當提到程式碼變數時，可以使用 \`inline code\` 樣式。

對於書籍介面的描述，我們設計了特殊的括號樣式：點擊 【確定】 按鈕後即可完成操作。這在 Word 匯出後也會保持加粗與特殊視覺感。

### 1.1 列表測試
- 第一項重點內容
- 第二項重點內容，包含 \`行內程式\`
- 第三項內容，測試自動換行的對齊效果

---

## 2. 角色對話框展示 (左右對齊效果)

User：嘿 Gemini，請幫我示範一下這個 APP 的對話框排版效果。

AI：沒問題！在這個系統中，User 的對話會靠右側顯示，並使用虛線邊框；而 AI 的回覆則會靠左側顯示，搭配點狀邊框與淺灰色背景。這種排版非常適合技術書籍中的「情境模擬」或「問答環節」。

---

## 3. 程式碼區塊樣式

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

## 4. 特殊提醒與警告 (Callouts)

> [!TIP]
> **提示 (Tip)**：通常用於分享小撇步或最佳實踐。在 Word 中會以實線邊框標註。

> [!NOTE]
> **筆記 (Note)**：用於補充背景知識。網頁預覽會呈現斜體效果，Word 中則使用虛線邊框區隔。

> [!WARNING]
> **警告 (Warning)**：非常重要的注意事項。在 Word 中會使用最粗的實線邊框，確保讀者不會遺漏。

---

## 5. 多層級標題測試

### 5.1 三級標題範例
這裡是三級標題下的文字，匯出時會自動加上底部的裝飾線或特定的縮排間距。
`;

const MarkdownEditor: React.FC = () => {
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [parsedBlocks, setParsedBlocks] = useState<ParsedBlock[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    try {
      const blocks = parseMarkdown(content);
      setParsedBlocks(blocks);
    } catch (e) {
      console.error("Markdown 解析出錯:", e);
    }
  }, [content]);

  const handleDownload = async () => {
    if (parsedBlocks.length === 0) return;
    setIsGenerating(true);
    try {
      const blob = await generateDocx(parsedBlocks);
      saveAs(blob, "Technical_Manuscript_Template.docx");
    } catch (error) {
      console.error("Word 轉檔失敗:", error);
      alert("轉檔失敗，請確認內容格式是否正確。");
    } finally {
      setIsGenerating(false);
    }
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
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">核心引擎：Markdown -> Word (v1.0)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
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
          <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Manuscript Editor (Draft)
          </div>
          <textarea
            className="flex-1 w-full p-10 resize-none focus:outline-none text-base leading-[1.8] text-slate-700 selection:bg-indigo-100"
            style={{ fontFamily: '"Consolas", "Microsoft JhengHei", sans-serif' }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
              style={{ fontFamily: '"Consolas", "Microsoft JhengHei", sans-serif' }}
            >
              {parsedBlocks.length > 0 ? (
                parsedBlocks.map((block, idx) => (
                  <PreviewBlock key={idx} block={block} />
                ))
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

const PreviewBlock: React.FC<{ block: ParsedBlock }> = ({ block }) => {
  const renderRichText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`[^`]+`|【.*?】)/g);
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900 border-b-2 border-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-slate-100 px-1.5 py-0.5 rounded text-[0.9em] font-mono text-indigo-700 border border-slate-200">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('【') && part.endsWith('】')) {
        return (
          <span key={i} className="inline-flex items-center px-1.5 py-0.5 mx-1 text-[0.7rem] font-black border-2 border-slate-900 rounded bg-slate-50 shadow-[2px_2px_0_0_#000]">
            {part.slice(1, -1)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  switch (block.type) {
    case BlockType.HEADING_1:
      return <h1 className="text-4xl font-black mb-12 mt-16 pb-4 border-b-4 border-slate-900 tracking-tight leading-tight">{renderRichText(block.content)}</h1>;
    case BlockType.HEADING_2:
      return <h2 className="text-2xl font-black mb-8 mt-12 tracking-tight flex items-center gap-3 before:w-2 before:h-8 before:bg-indigo-600">{renderRichText(block.content)}</h2>;
    case BlockType.HEADING_3:
      return <h3 className="text-xl font-bold mb-6 mt-10 text-slate-800 underline decoration-indigo-200 underline-offset-8 decoration-4">{renderRichText(block.content)}</h3>;
    case BlockType.CODE_BLOCK:
      return (
        <div className="my-10 border border-slate-300 bg-slate-50 p-8 rounded shadow-sm">
          <pre className="text-sm font-mono whitespace-pre text-slate-900 leading-relaxed overflow-x-auto">{block.content}</pre>
        </div>
      );
    case BlockType.CHAT_USER:
      return (
        <div className="flex justify-end my-12 pl-20">
          <div className="w-full border-2 border-dashed border-slate-900 p-6 bg-white relative">
            <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black tracking-widest text-indigo-600">USER</div>
            <div className="whitespace-pre-wrap leading-[1.8]">{renderRichText(block.content)}</div>
          </div>
        </div>
      );
    case BlockType.CHAT_AI:
      return (
        <div className="flex justify-start my-12 pr-20">
          <div className="w-full border-2 border-dotted border-slate-900 p-6 bg-slate-50 relative">
            <div className="absolute -top-3 right-4 bg-slate-50 px-2 text-[10px] font-black tracking-widest text-indigo-600">AI RESPONSE</div>
            <div className="whitespace-pre-wrap leading-[1.8] text-slate-800">{renderRichText(block.content)}</div>
          </div>
        </div>
      );
    case BlockType.CALLOUT_TIP:
      return (
        <div className="my-14 p-8 bg-slate-50 border-l-[12px] border-slate-500 shadow-sm">
          <div className="font-black text-[10px] mb-4 tracking-[0.3em] uppercase opacity-40">Section Tip</div>
          <div className="whitespace-pre-wrap leading-[1.8] text-slate-800">{renderRichText(block.content)}</div>
        </div>
      );
    case BlockType.CALLOUT_WARNING:
      return (
        <div className="my-14 p-8 bg-slate-100 border-l-[12px] border-black shadow-sm">
          <div className="font-black text-[10px] mb-4 tracking-[0.3em] uppercase opacity-40">Attention / Warning</div>
          <div className="whitespace-pre-wrap leading-[1.8] text-slate-800 font-bold">{renderRichText(block.content)}</div>
        </div>
      );
    case BlockType.CALLOUT_NOTE:
      return (
        <div className="my-14 p-8 bg-white border-l-[12px] border-dashed border-slate-300 shadow-sm border-y border-r">
          <div className="font-black text-[10px] mb-4 tracking-[0.3em] uppercase opacity-40">Note</div>
          <div className="whitespace-pre-wrap leading-[1.8] text-slate-800 italic">{renderRichText(block.content)}</div>
        </div>
      );
    case BlockType.BULLET_LIST:
      return <li className="ml-8 list-none relative mb-4 pl-4 leading-[1.8] before:content-[''] before:absolute before:left-0 before:top-[0.7em] before:w-2 before:h-2 before:bg-slate-400 before:rounded-full">{renderRichText(block.content)}</li>;
    case BlockType.HORIZONTAL_RULE:
      return <hr className="my-8 border-t-2 border-slate-200" />;
    default:
      return <p className="mb-8 leading-[2.1] text-justify text-slate-800 tracking-tight">{renderRichText(block.content)}</p>;
  }
};

export default MarkdownEditor;