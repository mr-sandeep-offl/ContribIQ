import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../common/Badge';
import { Calendar, Layers, ArrowRight } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

const ProjectCard = memo(({ project }) => {
  const navigate = useNavigate();

  const ownerName = project.createdBy?.name || 'Unknown';

  const statusVariants = {
    planning:  'secondary',
    active:    'info',
    completed: 'success',
    archived:  'danger',
  };

  const categoryColor = {
    college:   'bg-purple-50 text-purple-700 ring-purple-100',
    corporate: 'bg-sky-50 text-sky-700 ring-sky-100',
    personal:  'bg-amber-50 text-amber-700 ring-amber-100',
  };

  const catStyle = categoryColor[project.category] || 'bg-slate-100 text-slate-600 ring-slate-200';

  return (
    <div
      onClick={() => navigate(`/projects/${project._id}`)}
      className="card-hover group rounded-2xl border border-slate-200 bg-white p-5 shadow-card cursor-pointer flex flex-col justify-between min-h-[200px] text-left"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-slate-900 truncate max-w-[72%] leading-snug">
            {project.title}
          </h3>
          <Badge variant={statusVariants[project.status] || 'default'}>
            {project.status}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {project.description || 'No description provided.'}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(project.deadline)}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${catStyle} capitalize`}>
            <Layers size={10} />
            {project.category}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-blue-600 transition-colors">
          <span className="truncate max-w-[70px]">{ownerName}</span>
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;
