import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  isLoading,
  disabled,
  style,
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center gap-2 px-6 py-2.5 font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "text-white disabled:bg-slate-300 dark:disabled:bg-slate-700",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
    danger: "bg-red-500 text-white hover:bg-red-600"
  };

  const primaryStyles = variant === 'primary' ? {
    backgroundColor: 'var(--product-primary)',
    boxShadow: '0 4px 12px var(--product-glow)',
  } : {};

  // Handle hover for primary via CSS or just keep it simple if we can't easily do hover in inline styles without a library
  // Better yet, I can add a small CSS block in index.html for .btn-primary-product

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${variant === 'primary' ? 'btn-product-primary' : ''} ${className}`}
      style={{ ...primaryStyles, ...style }}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
    </button>
  );
};
