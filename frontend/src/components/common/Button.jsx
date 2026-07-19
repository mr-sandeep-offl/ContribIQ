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
  const baseStyle =
    'ripple-btn inline-flex items-center justify-center font-semibold rounded-xl px-4 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]';

  const variants = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 focus:ring-offset-white shadow-sm hover:shadow-md',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400 focus:ring-offset-white',
    danger:
      'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 focus:ring-offset-white shadow-sm',
    outline:
      'border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 focus:ring-slate-400 focus:ring-offset-white bg-white shadow-sm',
    ghost:
      'hover:bg-slate-100 text-slate-600 hover:text-slate-900',
    sky:
      'bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-500 focus:ring-offset-white shadow-sm hover:shadow-md',
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
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
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
