'use client';

import React from 'react';
import { FolderOpen, Save } from 'lucide-react';

interface DataPersistenceControlsProps {
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DataPersistenceControls({
  hasUnsavedChanges,
  onSave,
  onLoad,
}: DataPersistenceControlsProps) {
  return (
    <>
      <div className="hidden sm:block w-px h-6 bg-slate-200 mx-2" />

      <button
        onClick={onSave}
        className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-all active:scale-95"
        title="保存数据到本地文件"
      >
        <Save className="w-4 h-4" />
        <span className="hidden sm:inline">保存数据</span>
        {hasUnsavedChanges && (
          <span
            className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"
            title="有未保存的更改"
          />
        )}
      </button>

      <button
        onClick={() => document.getElementById('data-load-input')?.click()}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all active:scale-95"
        title="从本地文件加载数据"
      >
        <FolderOpen className="w-4 h-4" />
        <span className="hidden sm:inline">加载数据</span>
      </button>

      <input
        id="data-load-input"
        type="file"
        accept=".json"
        className="hidden"
        onChange={onLoad}
      />
    </>
  );
}
