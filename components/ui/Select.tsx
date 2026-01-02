import React, { SelectHTMLAttributes, ReactNode } from 'react';

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
    <div className={`flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 ${containerClassName}`}>
      {icon && <span className="text-slate-500 dark:text-slate-400 flex items-center justify-center">{icon}</span>}
      <select 
        className={`bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer w-full ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};
