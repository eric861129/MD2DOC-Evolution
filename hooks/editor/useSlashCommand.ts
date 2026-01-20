/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { useState, useEffect, useCallback } from 'react';
import { getCaretCoordinates } from '../../utils/editor/caretCoordinates';
import { SLASH_COMMANDS } from '../../components/editor/slash-command/commands';
import { CommandItem } from '../../components/editor/slash-command/SlashCommandMenu';

interface UseSlashCommandProps {
  content: string;
  setContent: (content: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const useSlashCommand = ({ content, setContent, textareaRef }: UseSlashCommandProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [filterText, setFilterText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<CommandItem[]>(SLASH_COMMANDS);
  
  // Track where the slash was typed to know what to replace
  const [slashPosition, setSlashPosition] = useState<number | null>(null);

  // Close menu when content changes externally (optional, but safer)
  // or if the user deletes the slash
  useEffect(() => {
    if (isOpen && slashPosition !== null) {
      const currentText = textareaRef.current?.value || '';
      // If the slash is gone or cursor moved before it, close
      if (currentText.length < slashPosition || currentText[slashPosition] !== '/') {
        // Double check context around slashPosition
        // Actually, simpler logic: verify if we are still "tracking" a potential command
        // This is handled by handleKeyUp/KeyDown primarily, 
        // but if user clicks away, we should close.
      }
    }
  }, [content, isOpen, slashPosition, textareaRef]);

  // Update filtered commands when filterText changes
  useEffect(() => {
    const lowerFilter = filterText.toLowerCase();
    const filtered = SLASH_COMMANDS.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerFilter) || 
      (cmd.description && cmd.description.toLowerCase().includes(lowerFilter))
    );
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [filterText]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setSlashPosition(null);
    setFilterText('');
    setSelectedIndex(0);
  }, []);

  const insertCommand = useCallback((item: CommandItem) => {
    if (!textareaRef.current || slashPosition === null) return;

    const textarea = textareaRef.current;
    const currentVal = textarea.value;
    
    // We want to replace everything from slashPosition up to current cursor
    // However, usually we just replace the slash + filterText
    // Let's assume the cursor is at the end of the filter text
    const endPos = textarea.selectionEnd;
    
    const before = currentVal.substring(0, slashPosition);
    const after = currentVal.substring(endPos);
    
    const newContent = before + item.insertText + after;
    
    setContent(newContent);
    closeMenu();

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = slashPosition + item.insertText.length + (item.cursorOffset || 0);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [slashPosition, setContent, closeMenu, textareaRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen) {
      if (e.key === '/') {
        // Only trigger if it's the start of a line or preceded by whitespace
        const target = e.target as HTMLTextAreaElement;
        const pos = target.selectionStart;
        const charBefore = target.value.charAt(pos - 1);
        
        if (pos === 0 || /\s/.test(charBefore)) {
            // We'll handle opening in handleKeyUp to ensure caret position is updated
            // But we can flag it here if needed. 
            // Actually, best to do it in onKeyUp or onChange to get correct coords.
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands.length > 0) {
          insertCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeMenu();
        break;
      case 'Tab': // Optional: allow Tab to select
         e.preventDefault();
         if (filteredCommands.length > 0) {
           insertCommand(filteredCommands[selectedIndex]);
         }
         break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;

    // Logic to detect Slash
    if (!isOpen) {
        // If we just typed a slash
        if (val[pos - 1] === '/') {
             // Check if it is a valid trigger (start of line or after space)
             const charBeforeSlash = val[pos - 2];
             if (pos === 1 || !charBeforeSlash || /\s/.test(charBeforeSlash)) {
                 const coords = getCaretCoordinates(e.target, pos);
                 
                 // Calculate position relative to the EditorPane container
                 const target = e.target;
                 const top = target.offsetTop 
                           + coords.top 
                           - target.scrollTop 
                           + coords.height 
                           + 5; // Slight padding
                           
                 const left = target.offsetLeft 
                            + coords.left 
                            - target.scrollLeft;

                 setPosition({ top, left });
                 setSlashPosition(pos - 1);
                 setIsOpen(true);
                 setFilterText('');
             }
        }
    } else {
        // Menu is open, update filter text
        if (slashPosition !== null) {
            // Check if we are still valid
            if (pos <= slashPosition) {
                closeMenu(); // Cursor moved behind slash
                return;
            }
            
            // Extract text after slash
            const textAfterSlash = val.substring(slashPosition + 1, pos);
            
            // If text contains newline or space, usually we close menu?
            // Notion closes on space, Slack keeps it open for some args.
            // Let's close on newline, allow space for now? Or close on space?
            // Most slash commands are single word triggers.
            if (textAfterSlash.includes(' ') || textAfterSlash.includes('\n')) {
                 closeMenu();
                 return;
            }

            setFilterText(textAfterSlash);
        }
    }
  };

  return {
    isOpen,
    position,
    filteredCommands,
    selectedIndex,
    handleKeyDown,
    handleChange,
    insertCommand,
    closeMenu
  };
};
