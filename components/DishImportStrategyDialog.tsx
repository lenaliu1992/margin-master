'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, PlusCircle, RefreshCw } from 'lucide-react';

type ImportStrategy = 'skip' | 'update' | 'create_all';

interface DishImportStrategyDialogProps {
  duplicateCount: number;
  newCount: number;
  onSelect: (strategy: ImportStrategy) => void;
  onCancel: () => void;
}

export function DishImportStrategyDialog({
  duplicateCount,
  newCount,
  onSelect,
  onCancel,
}: DishImportStrategyDialogProps) {
  const total = duplicateCount + newCount;
  const strategies = [
    {
      value: 'skip' as const,
      icon: <CheckCircle className="w-5 h-5" />,
      title: '跳过重复项',
      description: `保留现有菜品，只导入 ${newCount} 个新菜品`,
    },
    {
      value: 'update' as const,
      icon: <RefreshCw className="w-5 h-5" />,
      title: '覆盖现有菜品',
      description: `用 Excel 数据更新 ${duplicateCount} 个已存在的菜品`,
    },
    {
      value: 'create_all' as const,
      icon: <PlusCircle className="w-5 h-5" />,
      title: '全部新建',
      description: `忽略重复检查，导入全部 ${total} 个菜品`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">检测到重复菜品</h2>
              <p className="text-sm text-slate-500 mt-1">
                共 {total} 个菜品，其中 {duplicateCount} 个已存在
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {strategies.map((strategy) => (
            <button
              key={strategy.value}
              onClick={() => onSelect(strategy.value)}
              className="w-full p-4 rounded-lg border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <div className="text-emerald-600 mt-0.5">{strategy.icon}</div>
                <div className="flex-1">
                  <div className="font-bold text-slate-700">{strategy.title}</div>
                  <div className="text-sm text-slate-600 mt-1">{strategy.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            取消导入
          </button>
        </div>
      </div>
    </div>
  );
}
