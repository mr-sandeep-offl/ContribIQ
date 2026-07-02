import React from 'react';

const StatCard = ({ title, value, icon: Icon, description, trend, trendDirection = 'up', className = '' }) => {
  return (
    <div className={`rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-sm transition-all hover:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">{title}</span>
        {Icon && (
          <div className="rounded-lg bg-gray-850 p-2 text-indigo-400">
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trendDirection === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend}
          </span>
        )}
      </div>
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </div>
  );
};

export default StatCard;
