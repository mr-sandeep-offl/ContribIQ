import React from 'react';

const Badge = ({ variant = 'default', children, className = '' }) => {
  const baseStyle =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors';

  const variants = {
    default:   'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
    secondary: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    success:   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    warning:   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    danger:    'bg-red-50 text-red-600 ring-1 ring-red-200',
    info:      'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    purple:    'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  };

  return (
    <span className={`${baseStyle} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
