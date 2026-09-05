'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, X } from 'lucide-react';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  acceptedFormats?: string[];
  maxSizeMb?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  acceptedFormats = ['.xlsx', '.xls', '.csv'],
  maxSizeMb = 10,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndPass = (file: File) => {
    setError(null);
    const fileName = file.name.toLowerCase();
    const isAllowed = acceptedFormats.some((ext) => fileName.endsWith(ext));

    if (!isAllowed) {
      setError(`Unsupported file format. Please upload an Excel (${acceptedFormats.join(', ')}) file.`);
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File size exceeds the ${maxSizeMb} MB limit.`);
      return;
    }

    setSelectedFile(file);
    onFileSelected(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndPass(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Drag and drop your spreadsheet here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supports <span className="font-semibold">Excel (.xlsx)</span> and <span className="font-semibold">CSV (.csv)</span> up to {maxSizeMb} MB
              </p>
            </div>
            <button
              type="button"
              className="mt-2 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              Browse Files
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB • Ready for processing
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center space-x-2 text-rose-700 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
