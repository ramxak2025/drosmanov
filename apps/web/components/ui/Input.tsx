'use client';

import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-secondary">{label}</label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-2xl bg-surface border border-border
          text-text placeholder:text-text-secondary/50
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          transition-all duration-150
          ${error ? 'border-error ring-2 ring-error/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
