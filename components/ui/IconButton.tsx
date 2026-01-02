import React, { ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  children, 
  className = '', 
  active,
  ...props 
}) => {
  const baseStyles = "p-2 rounded-lg border transition-all flex items-center justify-center";
  const defaultStyles = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700";
  const activeStyles = "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800";

  return (
    <button 
      className={`${baseStyles} ${active ? activeStyles : defaultStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
