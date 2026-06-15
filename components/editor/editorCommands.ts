import {
  AlertTriangle,
  BarChart,
  Bot,
  CheckSquare,
  Code,
  FileCode,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Info,
  List,
  ListOrdered,
  ListTree,
  MessageCircle,
  Minus,
  Quote,
  StickyNote,
  Table,
  User,
} from 'lucide-react';
import { CommandItem } from './slash-command/SlashCommandMenu';
import {
  QUICK_ACTION_IDS as SPEC_QUICK_ACTION_IDS,
  SYNTAX_COMMANDS,
} from '../../services/syntaxSpec';

const commandIcons = {
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  'bullet-list': List,
  'numbered-list': ListOrdered,
  'todo-list': CheckSquare,
  quote: Quote,
  divider: Minus,
  toc: ListTree,
  'callout-note': StickyNote,
  'callout-tip': Info,
  'callout-warning': AlertTriangle,
  'code-block': Code,
  mermaid: FileCode,
  table: Table,
  'chat-left': User,
  'chat-right': Bot,
  'chat-center': MessageCircle,
  image: Image,
  frontmatter: FileText,
  'quick-mermaid': BarChart,
};

export const EDITOR_COMMANDS: CommandItem[] = SYNTAX_COMMANDS.map((command) => ({
  ...command,
  icon: commandIcons[command.id as keyof typeof commandIcons] || FileText,
}));

export const QUICK_ACTION_IDS = SPEC_QUICK_ACTION_IDS;

export const getQuickActions = () =>
  QUICK_ACTION_IDS
    .map((id) => EDITOR_COMMANDS.find((command) => command.id === id))
    .filter((command): command is CommandItem => Boolean(command));
