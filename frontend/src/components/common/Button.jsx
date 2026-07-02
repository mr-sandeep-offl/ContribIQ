import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  loading = false,
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 focus:ring-offset-gray-900',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-200 focus:ring-gray-700 focus:ring-offset-gray-900',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 focus:ring-offset-gray-900',
    outline: 'border border-gray-700 hover:bg-gray-850 text-gray-300 focus:ring-gray-700 focus:ring-offset-gray-900',
    ghost: 'hover:bg-gray-850 text-gray-400 hover:text-gray-200',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
