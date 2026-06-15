import React, { ReactNode, SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  icon?: ReactNode;
  containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  children,
  icon,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <label className={`inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 ${containerClassName}`}>
      {icon && <span className="flex items-center justify-center text-slate-500 dark:text-slate-400">{icon}</span>}
      <select
        className={`w-full cursor-pointer bg-transparent focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
};
