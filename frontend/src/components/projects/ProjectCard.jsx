import React from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../common/Badge';
import { Calendar, Layers, GitBranch } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  // Find progress if available
  const ownerName = project.createdBy?.name || 'Unknown';
  const categoryVariants = {
    college: 'secondary',
    corporate: 'info',
    personal: 'default',
  };

  const statusVariants = {
    planning: 'secondary',
    active: 'info',
    completed: 'success',
    archived: 'danger',
  };

  return (
    <div
      onClick={() => navigate(`/projects/${project._id}`)}
      className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-sm transition-all hover:border-gray-700 hover:shadow-md cursor-pointer flex flex-col justify-between h-56 text-left"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-white truncate max-w-[70%]">
            {project.title}
          </h3>
          <Badge variant={statusVariants[project.status] || 'default'}>
            {project.status}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-gray-400 line-clamp-2 leading-relaxed">
          {project.description || 'No description provided.'}
        </p>
      </div>

      <div className="mt-4 border-t border-gray-800 pt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-gray-650" />
          <span>Due {formatDate(project.deadline)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers size={14} className="text-gray-650" />
          <span className="capitalize">{project.category}</span>
        </div>
        <span className="truncate max-w-[30%]">By {ownerName}</span>
      </div>
    </div>
  );
};

export default ProjectCard;
