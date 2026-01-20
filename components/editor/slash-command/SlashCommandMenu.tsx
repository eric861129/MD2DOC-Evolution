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
  cursorOffset?: number; // Cursor position relative to inserted text end (negative moves back)
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
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);
  const [positionStyle, setPositionStyle] = React.useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menuHeight = menuRef.current.offsetHeight;
      const spaceBelow = window.innerHeight - position.top;
      
      // If less than 320px below (approx max height), flip up
      // We assume line height is roughly 24px, so we move it up by that amount + padding if flipping
      if (spaceBelow < 320 && position.top > 320) {
        setPositionStyle({
          bottom: `calc(100% - ${position.top - 24 - 10}px)`, // Position above the line
          left: position.left,
          maxHeight: '320px'
        });
      } else {
        setPositionStyle({
          top: position.top,
          left: position.left,
          maxHeight: '320px'
        });
      }
    }
  }, [isOpen, position]);

  useEffect(() => {
    if (isOpen && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex, isOpen]);

  // Click outside to close
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
      className="absolute z-50 w-72 overflow-y-auto bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col p-1"
      style={positionStyle}
    >
      {items.length === 0 ? (
        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          No commands match
        </div>
      ) : (
        <div className="space-y-0.5">
          {/* Group headers could be added here if needed */}
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                ref={isSelected ? selectedItemRef : null}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-md transition-colors
                  ${isSelected 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }
                `}
                onClick={() => onSelect(item)}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded border 
                  ${isSelected 
                    ? 'bg-white dark:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium truncate">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {item.description}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
