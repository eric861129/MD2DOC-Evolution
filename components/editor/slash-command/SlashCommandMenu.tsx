/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React, { useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  insertText: string;
  cursorOffset?: number;
  group: string;
}

interface SlashCommandMenuProps {
  isOpen: boolean;
  position: { top: number; left: number };
  items: CommandItem[];
  selectedIndex: number;
  onSelect: (item: CommandItem) => void;
  onClose: () => void;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  isOpen,
  position,
  items,
  selectedIndex,
  onSelect,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);
  const [positionStyle, setPositionStyle] = React.useState<React.CSSProperties>({});

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const spaceBelow = window.innerHeight - position.top;
    if (spaceBelow < 320 && position.top > 320) {
      setPositionStyle({
        bottom: `calc(100% - ${position.top - 34}px)`,
        left: position.left,
        maxHeight: '320px',
      });
    } else {
      setPositionStyle({
        top: position.top,
        left: position.left,
        maxHeight: '320px',
      });
    }
  }, [isOpen, position]);

  useEffect(() => {
    if (isOpen && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto rounded-md border border-slate-200/80 bg-white/95 p-1 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
      style={positionStyle}
    >
      {items.length === 0 ? (
        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          沒有符合的指令
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                ref={isSelected ? selectedItemRef : undefined}
                onClick={() => onSelect(item)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-all ${
                  isSelected
                    ? 'bg-product-glow text-product'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                    isSelected
                      ? 'border-product bg-white dark:bg-slate-950'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{item.label}</span>
                  {item.description && (
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.description}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  {item.group}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
