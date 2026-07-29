import {
  AlertTriangle,
  BarChart,
  BookOpen,
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
  QrCode,
  StickyNote,
  Table,
  User,
  type LucideIcon,
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
  chapter: BookOpen,
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
  qr: QrCode,
  frontmatter: FileText,
  'quick-mermaid': BarChart,
};

const GROUP_ORDER = [
  'Basic',
  'List',
  'Callout',
  'Technical',
  'Chat',
  'Media',
  'Metadata',
] as const;

const GROUP_PRESENTATION: Record<
  (typeof GROUP_ORDER)[number],
  { label: string; icon: LucideIcon }
> = {
  Basic: { label: '基本結構', icon: Heading1 },
  List: { label: '清單', icon: List },
  Callout: { label: '提示框', icon: StickyNote },
  Technical: { label: '技術內容', icon: Code },
  Chat: { label: '角色對話', icon: MessageCircle },
  Media: { label: '圖片與連結', icon: Image },
  Metadata: { label: '文件資訊', icon: FileText },
};

export interface EditorCommandGroup {
  id: (typeof GROUP_ORDER)[number];
  label: string;
  icon: LucideIcon;
  actions: CommandItem[];
}

export const EDITOR_COMMANDS: CommandItem[] = SYNTAX_COMMANDS.map((command) => ({
  ...command,
  icon: commandIcons[command.id as keyof typeof commandIcons] || FileText,
}));

export const QUICK_ACTION_IDS = SPEC_QUICK_ACTION_IDS;

export const getQuickActions = () =>
  QUICK_ACTION_IDS
    .map((id) => EDITOR_COMMANDS.find((command) => command.id === id))
    .filter((command): command is CommandItem => Boolean(command));

export const getCommandGroups = (
  commands: CommandItem[] = EDITOR_COMMANDS,
): EditorCommandGroup[] => GROUP_ORDER
  .map((id) => ({
    id,
    ...GROUP_PRESENTATION[id],
    actions: commands.filter(({ group }) => group === id),
  }))
  .filter(({ actions }) => actions.length > 0);

export const getQuickActionGroups = () => getCommandGroups(getQuickActions());
