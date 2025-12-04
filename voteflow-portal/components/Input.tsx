import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, id, className = '', ...props }) => {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-slate-200 transition-colors">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`
            w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-lg 
            ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3
            focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none
            transition-all duration-200 placeholder:text-slate-600
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
};