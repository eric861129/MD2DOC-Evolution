/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { Paragraph } from "docx";
import { BlockType, ParsedBlock } from "../../types";
import { docxRegistry } from "../registry";
import { DocxConfig } from "../types";
import { WORD_THEME } from "../../../constants/theme";
import { DOCUMENT_STYLE_IDS } from "../styles";
import { parseInlineStyles } from "./common";

// Builders
import { createManualTOC } from "./toc";
import { createHeading } from "./heading";
import { createParagraph } from "./paragraph";
import { createCodeBlock } from "./codeBlock";
import { createChatBubble } from "./chat";
import { createCallout } from "./callout";
import { createTable } from "./table";
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
  docxRegistry.register(
    BlockType.CODE_BLOCK,
    (block, config) => createCodeBlock(block.content, config, block.metadata),
  );

  // Mermaid
  docxRegistry.register(
    BlockType.MERMAID,
    (block, config) => import("./mermaid")
      .then(({ createMermaidBlock }) => createMermaidBlock(block.content, config)),
  );

  // Image
  docxRegistry.register(BlockType.IMAGE, async (block, config) => 
    await createImageBlock(block.content, block.metadata?.alt || '', config)
  );

  // Chat
  const chatHandler = (block: ParsedBlock, config: DocxConfig) =>
    createChatBubble(block, config);
  docxRegistry.register(BlockType.CHAT_CUSTOM, chatHandler);

  // Callouts
  const calloutHandler = (block: ParsedBlock, config: DocxConfig) =>
    createCallout(block.content, block.type, config);
  docxRegistry.register(BlockType.CALLOUT_TIP, calloutHandler);
  docxRegistry.register(BlockType.CALLOUT_NOTE, calloutHandler);
  docxRegistry.register(BlockType.CALLOUT_WARNING, calloutHandler);
  docxRegistry.register(BlockType.CALLOUT_IMPORTANT, calloutHandler);
  docxRegistry.register(BlockType.CALLOUT_CAUTION, calloutHandler);

  // Lists
  docxRegistry.register(BlockType.BULLET_LIST, async (block, config) => 
    new Paragraph({ 
      style: DOCUMENT_STYLE_IDS.normal,
      children: await parseInlineStyles(block.content, config),
      numbering: { reference: "default-bullet", level: block.nestingLevel || 0 },
    })
  );
  docxRegistry.register(BlockType.NUMBERED_LIST, async (block, config) => 
    new Paragraph({ 
      style: DOCUMENT_STYLE_IDS.normal,
      children: await parseInlineStyles(block.content, config),
      numbering: { reference: "default-numbering", level: block.nestingLevel || 0 },
    })
  );

  // Table
  docxRegistry.register(BlockType.TABLE, async (block, config) => {
    if (!block.tableRows) return [];
    return createTable(block.tableRows, config);
  });

  // HR
  docxRegistry.register(BlockType.HORIZONTAL_RULE, () => 
    new Paragraph({ text: "", border: { bottom: { style: "single", size: LAYOUT.BORDER.HR, color: COLORS.BLACK, space: 1 } }, spacing: SPACING.HR })
  );
};
