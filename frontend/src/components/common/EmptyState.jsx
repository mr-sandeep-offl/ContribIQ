import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from './Button';

const EmptyState = ({ title, description, actionText, onAction, icon: Icon = FolderOpen }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 p-8 text-center bg-gray-900/35">
      <div className="rounded-full bg-gray-850 p-4 text-gray-500 mb-4">
        <Icon size={32} />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
