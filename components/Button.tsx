import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex cursor-pointer items-center justify-center rounded-2xl border font-orbitron font-bold uppercase tracking-[0.22em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
  
  const variants = {
    primary: "border-sky-200/60 bg-sky-300 text-slate-950 hover:bg-sky-200 hover:shadow-[0_0_35px_rgba(125,211,252,0.28)]",
    secondary: "border-white/10 bg-white/[0.04] text-white hover:border-slate-300/35 hover:bg-white/[0.09]",
    danger: "border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-300/45",
    ghost: "border-transparent bg-transparent text-slate-400 hover:border-sky-300/20 hover:bg-sky-300/10 hover:text-sky-100",
  };

  const sizes = {
    sm: "px-3.5 py-2 text-[10px]",
    md: "px-4.5 py-3 text-xs",
    lg: "px-6 py-4 text-sm",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
