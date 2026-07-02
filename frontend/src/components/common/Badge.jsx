import React from 'react';

const Badge = ({ variant = 'default', children, className = '' }) => {
  const baseStyle = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variants = {
    default: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-gray-800 text-gray-200 hover:bg-gray-750',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/25',
  };

  return (
    <span className={`${baseStyle} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
