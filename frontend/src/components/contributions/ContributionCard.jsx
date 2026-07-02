import React from 'react';
import Badge from '../common/Badge';
import { Calendar, GitPullRequest, Award, ShieldAlert } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

const ContributionCard = ({ contribution }) => {
  const sourceVariants = {
    manual: 'secondary',
    github: 'default',
    docs: 'info',
    meeting: 'warning',
  };

  const getImpactColor = (score) => {
    if (score >= 8) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
    if (score >= 5) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25';
    return 'text-gray-400 bg-gray-800 border-gray-700';
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 flex flex-col justify-between h-44 text-left">
      <div>
        <div className="flex items-center justify-between">
          <Badge variant={sourceVariants[contribution.source] || 'secondary'}>
            {contribution.source}
          </Badge>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Impact:</span>
            <span className={`text-xs px-1.5 py-0.5 rounded border font-bold ${getImpactColor(contribution.impactScore)}`}>
              {contribution.impactScore}/10
            </span>
          </div>
        </div>
        <h4 className="mt-3 text-sm font-semibold text-white truncate">{contribution.title}</h4>
        <p className="mt-1 text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {contribution.description}
        </p>
      </div>

      <div className="mt-4 border-t border-gray-800 pt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar size={13} className="text-gray-650" />
          <span>{formatDate(contribution.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate max-w-[50%]">
          <span className="text-gray-650 font-semibold capitalize">{contribution.type}</span>
          <span className="text-gray-750">|</span>
          <span className="truncate">{contribution.userId?.name || 'Unknown'}</span>
        </div>
      </div>
    </div>
  );
};

export default ContributionCard;
