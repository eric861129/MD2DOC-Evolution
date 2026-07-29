import { describe, expect, it } from 'vitest';
import {
  isSafeGuideHref,
  parseGuideInline,
  parseUserGuideMarkdown,
  searchGuideSections,
  USER_GUIDE_DOCUMENT,
  USER_GUIDE_MARKDOWN,
} from '../services/userGuide';

describe('USER_GUIDE Markdown AST', () => {
  it('解析完整教學的標題、章節、表格與 Word 後製內容', () => {
    expect(USER_GUIDE_DOCUMENT.title).toBe('MD2DOC-Evolution 完整使用教學');
    expect(USER_GUIDE_DOCUMENT.sections).toHaveLength(10);
    expect(USER_GUIDE_DOCUMENT.sections.some(
      ({ title }) => title === '8. Word 後製與換頁專章',
    )).toBe(true);
    expect(USER_GUIDE_DOCUMENT.sections.flatMap(({ blocks }) => blocks)
      .some(({ type }) => type === 'table')).toBe(true);
    expect(USER_GUIDE_MARKDOWN).toContain('Ctrl + A');
    expect(USER_GUIDE_MARKDOWN).toContain('Ctrl + Shift + 8');
  });

  it('依多個關鍵字搜尋章節', () => {
    const results = searchGuideSections(USER_GUIDE_DOCUMENT, 'Word 換頁');

    expect(results.map(({ title }) => title)).toContain('8. Word 後製與換頁專章');
    expect(searchGuideSections(USER_GUIDE_DOCUMENT, '不存在關鍵字')).toEqual([]);
  });

  it('不把原始 HTML 或不安全連結轉成可執行 HTML', () => {
    const document = parseUserGuideMarkdown(
      '# 測試\n\n## 安全\n\n<img src=x onerror=alert(1)>\n',
    );
    const inline = parseGuideInline('[危險](javascript:alert(1)) <script>alert(1)</script>');

    expect(document.sections[0].blocks[0]).toEqual({
      type: 'paragraph',
      content: '<img src=x onerror=alert(1)>',
    });
    expect(inline).toEqual([
      { type: 'link', text: '危險', href: 'javascript:alert(1' },
      { type: 'text', text: ') <script>alert(1)</script>' },
    ]);
    expect(isSafeGuideHref('javascript:alert(1)')).toBe(false);
    expect(isSafeGuideHref('https://support.microsoft.com/')).toBe(true);
  });
});
