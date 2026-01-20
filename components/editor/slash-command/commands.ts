/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, CheckSquare, 
  Quote, StickyNote, AlertTriangle, Info,
  Code, FileCode, Table, 
  MessageSquare, User, Bot, MessageCircle,
  Image, Minus, ListTree
} from 'lucide-react';
import { CommandItem } from './SlashCommandMenu';

export const SLASH_COMMANDS: CommandItem[] = [
  // Headings
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Big section heading',
    icon: Heading1,
    insertText: '# ',
    group: 'Basic'
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    insertText: '## ',
    group: 'Basic'
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    insertText: '### ',
    group: 'Basic'
  },
  
  // Lists
  {
    id: 'bullet-list',
    label: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: List,
    insertText: '- ',
    group: 'List'
  },
  {
    id: 'numbered-list',
    label: 'Numbered List',
    description: 'Create a list with numbering',
    icon: ListOrdered,
    insertText: '1. ',
    group: 'List'
  },
  {
    id: 'todo-list',
    label: 'To-do List',
    description: 'Track tasks with a to-do list',
    icon: CheckSquare,
    insertText: '- [ ] ',
    group: 'List'
  },

  // Basic Blocks
  {
    id: 'quote',
    label: 'Quote',
    description: 'Capture a quote',
    icon: Quote,
    insertText: '> ',
    group: 'Basic'
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Visually divide blocks',
    icon: Minus,
    insertText: '---\n',
    group: 'Basic'
  },
  {
    id: 'toc',
    label: 'Table of Contents',
    description: 'Insert an automatic table of contents',
    icon: ListTree,
    insertText: '[TOC]\n',
    group: 'Basic'
  },

  // Callouts
  {
    id: 'callout-note',
    label: 'Note',
    description: 'Add a note box',
    icon: StickyNote,
    insertText: '> [!NOTE]\n> ',
    group: 'Callout'
  },
  {
    id: 'callout-tip',
    label: 'Tip',
    description: 'Add a tip box',
    icon: Info,
    insertText: '> [!TIP]\n> ',
    group: 'Callout'
  },
  {
    id: 'callout-warning',
    label: 'Warning',
    description: 'Add a warning box',
    icon: AlertTriangle,
    insertText: '> [!WARNING]\n> ',
    group: 'Callout'
  },

  // Technical
  {
    id: 'code-block',
    label: 'Code Block',
    description: 'Add a code block',
    icon: Code,
    insertText: '```\n\n```',
    cursorOffset: -4, // Move back into the block
    group: 'Technical'
  },
  {
    id: 'mermaid',
    label: 'Mermaid Chart',
    description: 'Add a diagram or chart',
    icon: FileCode,
    insertText: '```mermaid\ngraph TD;\n    A-->B;\n```',
    group: 'Technical'
  },
  {
    id: 'table',
    label: 'Table',
    description: 'Add a simple table',
    icon: Table,
    insertText: '| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |',
    group: 'Technical'
  },

  // Chat / Dialogues
  {
    id: 'chat-left',
    label: 'User Dialogue (Left)',
    description: 'Left-aligned chat bubble',
    icon: User,
    insertText: 'User ":: ',
    group: 'Chat'
  },
  {
    id: 'chat-right',
    label: 'AI Dialogue (Right)',
    description: 'Right-aligned chat bubble',
    icon: Bot,
    insertText: 'AI ::" ',
    group: 'Chat'
  },
  {
    id: 'chat-center',
    label: 'System Dialogue (Center)',
    description: 'Center-aligned chat bubble',
    icon: MessageCircle, // Using MessageCircle as generic icon for center
    insertText: 'System :": ',
    group: 'Chat'
  },

  // Media
  {
    id: 'image',
    label: 'Image',
    description: 'Upload or embed an image',
    icon: Image,
    insertText: '![Alt text](url)',
    group: 'Media'
  },
];
