import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-slate-700">
          {label}{' '}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`input-field w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
            : 'border-slate-300 focus:border-blue-500'
        }`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
};

export default Input;
