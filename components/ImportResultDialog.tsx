'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import type { ImportResult } from '@/types';

interface ImportResultDialogProps {
  result: ImportResult;
  onClose: () => void;
}

export function ImportResultDialog({ result, onClose }: ImportResultDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-500" />
            )}
            <h2 className="text-xl font-bold text-slate-800">{result.success ? '导入成功' : '导入失败'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-slate-700">成功导入 {result.meals.length} 个套餐</span>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-rose-600 mb-3">
                <AlertCircle className="w-4 h-4" />
                错误 ({result.errors.length})
              </h3>
              <div className="bg-rose-50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                {result.errors.map((error, index) => (
                  <div key={`${error.message}-${index}`} className="text-sm text-rose-700">
                    <div className="font-medium">{error.message}</div>
                    {(error.mealName || error.dishName) && (
                      <div className="text-xs text-rose-600 mt-1">
                        {error.mealName && `套餐: ${error.mealName}`}
                        {error.mealName && error.dishName && ' | '}
                        {error.dishName && `菜品: ${error.dishName}`}
                        {error.row && ` | 行: ${error.row}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.warnings.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-amber-600 mb-3">
                <AlertTriangle className="w-4 h-4" />
                警告 ({result.warnings.length})
              </h3>
              <div className="bg-amber-50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                {result.warnings.map((warning, index) => (
                  <div key={`${warning.message}-${index}`} className="text-sm text-amber-700">
                    <div className="font-medium">{warning.message}</div>
                    {(warning.mealName || warning.dishName) && (
                      <div className="text-xs text-amber-600 mt-1">
                        {warning.mealName && `套餐: ${warning.mealName}`}
                        {warning.mealName && warning.dishName && ' | '}
                        {warning.dishName && `菜品: ${warning.dishName}`}
                        {(warning.expected !== undefined || warning.actual !== undefined) && (
                          <>
                            {' '}
                            | 预期: ¥{warning.expected?.toFixed(2)} | 实际: ¥
                            {warning.actual?.toFixed(2)}
                          </>
                        )}
                      </div>
                    )}
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
