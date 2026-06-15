import React, { ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  className = '',
  active,
  title,
  ...props
}) => {
  const baseStyles = 'inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50';
  const defaultStyles = 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800';
  const activeStyles = 'border-product-primary bg-product-glow text-product-primary';

  return (
    <button
      className={`${baseStyles} ${active ? activeStyles : defaultStyles} ${className}`}
      title={title}
      aria-label={title}
      {...props}
    >
      {children}
    </button>
  );
};
