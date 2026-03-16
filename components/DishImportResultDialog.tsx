'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface DishImportResultDialogProps {
  success: boolean;
  dishCount: number;
  errors: string[];
  onClose: () => void;
}

export function DishImportResultDialog({
  success,
  dishCount,
  errors,
  onClose,
}: DishImportResultDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {success ? (
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-500" />
            )}
            <h2 className="text-xl font-bold text-slate-800">{success ? '导入成功' : '导入失败'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600">
              {success ? (
                <>
                  <div className="font-medium text-emerald-700">成功导入 {dishCount} 个菜品</div>
                  <div className="text-xs text-slate-400 mt-1">菜品库已更新，相关套餐数据已同步刷新</div>
                </>
              ) : (
                <div className="font-medium text-rose-700">导入失败</div>
              )}
            </div>
          </div>

          {errors.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-rose-600 mb-3">
                <AlertTriangle className="w-4 h-4" />
                问题 ({errors.length})
              </h3>
              <div className="bg-rose-50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                {errors.map((error, index) => (
                  <div key={`${error}-${index}`} className="text-sm text-rose-700">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
