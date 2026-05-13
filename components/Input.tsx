import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || (props.name
    ? `input-${props.name}`
    : label
      ? `input-${label.toLowerCase().replace(/\s+/g, '-')}`
      : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-mono text-cyan-500/70 mb-1.5 uppercase tracking-widest"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full bg-[#0a0a0c] border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100
          placeholder-zinc-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50
          transition-colors duration-200 outline-none font-mono text-sm shadow-inner
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400 font-mono">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, className = '', id, children, ...props }) => {
  const selectId = id || (props.name
    ? `select-${props.name}`
    : label
      ? `select-${label.toLowerCase().replace(/\s+/g, '-')}`
      : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-mono text-cyan-500/70 mb-1.5 uppercase tracking-widest"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`
            w-full bg-[#0a0a0c] border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100
            focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50
            transition-colors duration-200 outline-none appearance-none font-mono text-sm
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};
