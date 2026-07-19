import React, { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = memo(({ title, value, icon: Icon, description, trend, trendDirection = 'up', className = '', color = 'blue' }) => {
  const colorMap = {
    blue:    { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
    sky:     { bg: 'bg-sky-50',  text: 'text-sky-600',  ring: 'ring-sky-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
    red:     { bg: 'bg-red-50',  text: 'text-red-500',  ring: 'ring-red-100' },
    amber:   { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
    purple:  { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`card-hover rounded-2xl border border-slate-200 bg-white p-5 shadow-card ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`rounded-xl ${c.bg} ${c.ring} ring-1 p-2.5 ${c.text}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
        {trend && (
          <span
            className={`text-xs font-semibold flex items-center gap-0.5 ${
              trendDirection === 'up' ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {trendDirection === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
