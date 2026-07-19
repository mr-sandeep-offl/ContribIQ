import React, { memo } from 'react';
import Badge from '../common/Badge';
import { Calendar, Star } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

const ContributionCard = memo(({ contribution }) => {
  const sourceVariants = {
    manual:  'secondary',
    github:  'default',
    docs:    'info',
    meeting: 'warning',
  };

  const impactConfig = (score) => {
    if (score >= 8) return { cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', stars: 3 };
    if (score >= 5) return { cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', stars: 2 };
    return { cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200', stars: 1 };
  };

  const ic = impactConfig(contribution.impactScore);

  return (
    <div className="card-hover rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between min-h-[168px] text-left shadow-card">
      <div>
        <div className="flex items-center justify-between mb-3">
          <Badge variant={sourceVariants[contribution.source] || 'secondary'}>
            {contribution.source}
          </Badge>
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${ic.cls}`}>
            <Star size={10} fill="currentColor" />
            {contribution.impactScore}/10
          </div>
        </div>
        <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{contribution.title}</h4>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {contribution.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {formatDate(contribution.createdAt)}
        </span>
        <div className="flex items-center gap-1.5 truncate max-w-[55%]">
          <span className="font-semibold text-slate-500 capitalize">{contribution.type}</span>
          <span className="text-slate-300">·</span>
          <span className="truncate">{contribution.userId?.name || 'Unknown'}</span>
        </div>
      </div>
    </div>
  );
});

ContributionCard.displayName = 'ContributionCard';

export default ContributionCard;
