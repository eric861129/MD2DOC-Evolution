/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { Paragraph } from "docx";
import { BlockType, ParsedBlock } from "../../types";
import { docxRegistry } from "../registry";
import { WORD_THEME } from "../../../constants/theme";
import { parseInlineStyles } from "./common";

// Builders
import { createManualTOC } from "./toc";
import { createHeading } from "./heading";
import { createParagraph } from "./paragraph";
import { createCodeBlock } from "./codeBlock";
import { createChatBubble } from "./chat";
import { createCallout } from "./callout";
import { createTable } from "./table";
import { createMermaidBlock } from "./mermaid";
import { createImageBlock } from "./image";

const { SPACING, LAYOUT, COLORS } = WORD_THEME;

export const registerDefaultHandlers = () => {
  // TOC
  docxRegistry.register(BlockType.TOC, (block, config) => createManualTOC(block.content, config));

  // Headings
  docxRegistry.register(BlockType.HEADING_1, async (block, config) => await createHeading(block.content, 1, config));
  docxRegistry.register(BlockType.HEADING_2, async (block, config) => await createHeading(block.content, 2, config));
  docxRegistry.register(BlockType.HEADING_3, async (block, config) => await createHeading(block.content, 3, config));

  // Paragraph
  docxRegistry.register(BlockType.PARAGRAPH, async (block, config) => await createParagraph(block.content, config));

  // Code Block
  docxRegistry.register(BlockType.CODE_BLOCK, async (block, config) => [
    await createCodeBlock(block.content, config, block.metadata),
    new Paragraph({ text: "", spacing: { before: 0, after: 0 } })
  ]);

  // Mermaid
  docxRegistry.register(BlockType.MERMAID, async (block, config) => [
    await createMermaidBlock(block.content, config),
    new Paragraph({ text: "", spacing: { before: 0, after: 0 } })
  ]);

  // Image
  docxRegistry.register(BlockType.IMAGE, async (block, config) => 
    await createImageBlock(block.content, block.metadata?.alt || '', config)
  );

  // Chat
  const chatHandler = async (block: ParsedBlock, config: DocxConfig) => [
    await createChatBubble(block, config),
    new Paragraph({ text: "", spacing: { before: 0, after: 0 } })
  ];
  docxRegistry.register(BlockType.CHAT_CUSTOM, chatHandler);

  // Callouts
  const calloutHandler = async (block: any, config: DocxConfig) => [
    await createCallout(block.content, block.type, config),
    new Paragraph({ text: "", spacing: { before: 0, after: 0 } })
  ];
  docxRegistry.register(BlockType.CALLOUT_TIP, calloutHandler);
  docxRegistry.register(BlockType.CALLOUT_NOTE, calloutHandler);
  docxRegistry.register(BlockType.CALLOUT_WARNING, calloutHandler);

  // Lists
  docxRegistry.register(BlockType.BULLET_LIST, async (block, config) => 
    new Paragraph({ children: await parseInlineStyles(block.content, config), bullet: { level: 0 }, spacing: SPACING.LIST })
  );
  docxRegistry.register(BlockType.NUMBERED_LIST, async (block, config) => 
    new Paragraph({ children: await parseInlineStyles(block.content, config), numbering: { reference: "default-numbering", level: 0 }, spacing: SPACING.LIST })
  );

  // Table
  docxRegistry.register(BlockType.TABLE, async (block, config) => {
    if (!block.tableRows) return [];
    return [
      await createTable(block.tableRows, config),
      new Paragraph({ text: "", spacing: { before: SPACING.TABLE_AFTER } })
    ];
  });

  // HR
  docxRegistry.register(BlockType.HORIZONTAL_RULE, () => 
    new Paragraph({ text: "", border: { bottom: { style: "single", size: LAYOUT.BORDER.HR, color: COLORS.BLACK, space: 1 } }, spacing: SPACING.HR })
  );
};
