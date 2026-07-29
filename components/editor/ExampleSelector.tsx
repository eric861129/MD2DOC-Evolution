import React from 'react';
import {
  EXAMPLE_MANUSCRIPTS,
  type ExampleManuscriptId,
} from '../../constants/exampleContent';

interface ExampleSelectorProps {
  label: string;
  placeholder: string;
  onSelect: (id: ExampleManuscriptId) => void;
}

export const ExampleSelector: React.FC<ExampleSelectorProps> = ({
  label,
  placeholder,
  onSelect,
}) => (
  <label className="relative">
    <span className="sr-only">{label}</span>
    <select
      aria-label={label}
      value=""
      onChange={(event) => {
        const id = event.target.value as ExampleManuscriptId;
        if (id) {
          onSelect(id);
        }
      }}
      className="h-9 max-w-48 rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
    >
      <option value="">{placeholder}</option>
      <optgroup label="繁體中文">
        {EXAMPLE_MANUSCRIPTS
          .filter(({ language }) => language === 'zh')
          .map(({ id, label: optionLabel }) => (
            <option key={id} value={id}>{optionLabel}</option>
          ))}
      </optgroup>
      <optgroup label="English">
        {EXAMPLE_MANUSCRIPTS
          .filter(({ language }) => language === 'en')
          .map(({ id, label: optionLabel }) => (
            <option key={id} value={id}>{optionLabel}</option>
          ))}
      </optgroup>
    </select>
  </label>
);
