import React from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { getCommandGroups } from './editorCommands';

interface InsertMenuProps {
  label: string;
  onInsert: (template: string) => void;
}

export const InsertMenu: React.FC<InsertMenuProps> = ({
  label,
  onInsert,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const groups = React.useMemo(() => getCommandGroups(), []);

  React.useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-product-primary hover:text-product-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
      >
        <Plus className="h-3.5 w-3.5" />
        {label}
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-50 max-h-[min(32rem,70vh)] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto rounded-md border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <section key={group.id}>
                <h3 className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        role="menuitem"
                        aria-label={action.description}
                        onClick={() => {
                          onInsert(action.insertText);
                          setIsOpen(false);
                        }}
                        className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-product-primary" />
                        <span>
                          <span className="block font-bold">{action.label}</span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                            {action.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
