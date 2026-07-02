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
        <label htmlFor={id} className="text-sm font-medium text-gray-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-lg border bg-gray-950 px-3.5 py-2 text-sm text-white placeholder-gray-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-rose-500' : 'border-gray-800'
        }`}
        {...props}
      />
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </div>
  );
};

export default Input;
