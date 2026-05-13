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
  const baseStyles = "inline-flex items-center justify-center font-bold tracking-wider uppercase transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-orbitron";
  
  const variants = {
    primary: "bg-cyan-500 text-black hover:bg-cyan-400 focus:ring-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] border border-cyan-400",
    secondary: "bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-zinc-700 focus:ring-zinc-600 hover:border-zinc-500",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/50 focus:ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
    ghost: "bg-transparent text-zinc-400 hover:text-cyan-400 hover:bg-cyan-950/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-4 py-2.5 text-xs",
    lg: "px-6 py-3.5 text-sm",
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