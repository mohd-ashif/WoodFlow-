'use client';

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { ImportModal, ImportModule } from './ImportModal';

interface ImportButtonProps {
  module: ImportModule;
  moduleTitle: string;
  onImportSuccess?: () => void;
  className?: string;
}

export const ImportButton: React.FC<ImportButtonProps> = ({
  module,
  moduleTitle,
  onImportSuccess,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors shadow-sm ${className}`}
      >
        <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        <span>Import</span>
      </button>

      <ImportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        module={module}
        moduleTitle={moduleTitle}
        onImportComplete={() => {
          if (onImportSuccess) onImportSuccess();
        }}
      />
    </>
  );
};
