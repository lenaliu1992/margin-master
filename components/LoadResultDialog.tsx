'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, X } from 'lucide-react';
import type { LoadResult } from '@/types';

interface LoadResultDialogProps {
  result: LoadResult;
  fileName: string;
  onClose: () => void;
}

export function LoadResultDialog({ result, fileName, onClose }: LoadResultDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-500" />
            )}
            <h2 className="text-xl font-bold text-slate-800">{result.success ? '加载成功' : '加载失败'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
            <div className="font-medium">文件: {fileName}</div>
            {result.success && result.data && (
              <>
                <div className="mt-2">{result.data.metadata.totalDishes} 个菜品</div>
                <div>{result.data.metadata.totalMeals} 个套餐</div>
                <div className="text-xs text-slate-400 mt-1">
                  保存于: {new Date(result.data.savedAt).toLocaleString('zh-CN')}
                </div>
              </>
            )}
          </div>

          {result.errors && result.errors.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-rose-600 mb-3">
                <AlertTriangle className="w-4 h-4" />
                错误 ({result.errors.length})
              </h3>
              <div className="bg-rose-50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                {result.errors.map((error, index) => (
                  <div key={`${error.field}-${index}`} className="text-sm text-rose-700">
                    <div className="font-medium">{error.message}</div>
                    <div className="text-xs text-rose-600 mt-1">
                      字段: {error.field} | 预期: {error.expected}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.warnings && result.warnings.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-amber-600 mb-3">
                <AlertTriangle className="w-4 h-4" />
                警告 ({result.warnings.length})
              </h3>
              <div className="bg-amber-50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                {result.warnings.map((warning, index) => (
                  <div key={`${warning}-${index}`} className="text-sm text-amber-700">
                    {warning}
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
