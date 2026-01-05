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

const { SPACING, LAYOUT, COLORS } = WORD_THEME;

export const registerDefaultHandlers = () => {
  // TOC
  docxRegistry.register(BlockType.TOC, (block, config) => createManualTOC(block.content, config));

  // Headings
  docxRegistry.register(BlockType.HEADING_1, (block) => createHeading(block.content, 1));
  docxRegistry.register(BlockType.HEADING_2, (block) => createHeading(block.content, 2));
  docxRegistry.register(BlockType.HEADING_3, (block) => createHeading(block.content, 3));

  // Paragraph
  docxRegistry.register(BlockType.PARAGRAPH, (block, config) => createParagraph(block.content, config));

  // Code Block
  docxRegistry.register(BlockType.CODE_BLOCK, (block, config) => [
    createCodeBlock(block.content, config, block.metadata),
    new Paragraph({ text: "", spacing: { before: 0, after: 0 } })
  ]);

  // Chat
  const chatHandler = (block: ParsedBlock) => [
    createChatBubble(block),
    new Paragraph({ text: "", spacing: { before: 0, after: 0 } })
  ];
  docxRegistry.register(BlockType.CHAT_CUSTOM, chatHandler);

  // Callouts
  const calloutHandler = (block: any, config: any) => [
    createCallout(block.content, block.type, config),
    new Paragraph({ text: "", spacing: { before: 0, after: 0 } })
  ];
  docxRegistry.register(BlockType.CALLOUT_TIP, calloutHandler);
  docxRegistry.register(BlockType.CALLOUT_NOTE, calloutHandler);
  docxRegistry.register(BlockType.CALLOUT_WARNING, calloutHandler);

  // Lists
  docxRegistry.register(BlockType.BULLET_LIST, (block, config) => 
    new Paragraph({ children: parseInlineStyles(block.content, config), bullet: { level: 0 }, spacing: SPACING.LIST })
  );
  docxRegistry.register(BlockType.NUMBERED_LIST, (block, config) => 
    new Paragraph({ children: parseInlineStyles(block.content, config), numbering: { reference: "default-numbering", level: 0 }, spacing: SPACING.LIST })
  );

  // Table
  docxRegistry.register(BlockType.TABLE, (block, config) => {
    if (!block.tableRows) return [];
    return [
      createTable(block.tableRows, config),
      new Paragraph({ text: "", spacing: { before: SPACING.TABLE_AFTER } })
    ];
  });

  // HR
  docxRegistry.register(BlockType.HORIZONTAL_RULE, () => 
    new Paragraph({ text: "", border: { bottom: { style: "single", size: LAYOUT.BORDER.HR, color: COLORS.BLACK, space: 1 } }, spacing: SPACING.HR })
  );
};
