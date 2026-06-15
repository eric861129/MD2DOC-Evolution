import { describe, expect, it } from 'vitest';
import {
  EDITOR_COMMANDS,
  QUICK_ACTION_IDS,
  getQuickActions,
} from '../components/editor/editorCommands';

describe('editorCommands', () => {
  it('keeps slash commands and quick actions backed by the same command model', () => {
    const commandIds = EDITOR_COMMANDS.map((command) => command.id);

    expect(commandIds).toEqual(expect.arrayContaining([
      'h1',
      'frontmatter',
      'code-block',
      'mermaid',
      'callout-tip',
      'table',
      'toc',
    ]));
    expect(new Set(commandIds).size).toBe(commandIds.length);
    expect(getQuickActions().map((command) => command.id)).toEqual(QUICK_ACTION_IDS);
  });

  it('contains MD2DOC-specific insert templates and Traditional Chinese labels', () => {
    const byId = Object.fromEntries(EDITOR_COMMANDS.map((command) => [command.id, command]));

    expect(byId['h1'].description).toBe('建立大型章節標題');
    expect(byId['code-block'].insertText).toContain('```typescript:ln');
    expect(byId['code-block'].insertText).toContain('程式碼貼在這裡');
    expect(byId['callout-tip'].insertText).toContain('> [!TIP]');
    expect(byId['frontmatter'].insertText).toContain('title: 書稿標題');
    expect(byId['chat-left'].insertText).toContain('User "::');
  });

  it('does not contain replacement or private-use mojibake markers', () => {
    expect(JSON.stringify(EDITOR_COMMANDS)).not.toMatch(/\uFFFD|[\uE000-\uF8FF]/);
  });
});
