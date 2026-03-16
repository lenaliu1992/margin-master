'use client';

import React, { useState } from 'react';
import { Check, CheckSquare, Square, X } from 'lucide-react';
import type { FrontendDish } from '@/services/api/dishesApi';

interface MealForExport {
  id: string;
  name: string;
  dishIds: string[];
  promoPrice1: number;
  promoPrice2?: number;
}

interface ExportSelectionDialogProps {
  meals: MealForExport[];
  dishes: FrontendDish[];
  onExport: (selectedMeals: MealForExport[]) => void;
  onClose: () => void;
}

export function ExportSelectionDialog({
  meals,
  dishes,
  onExport,
  onClose,
}: ExportSelectionDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = meals.length > 0 && selectedIds.size === meals.length;
  const selectedCount = selectedIds.size;

  const toggleSelect = (id: string) => {
    const nextSelected = new Set(selectedIds);
    if (nextSelected.has(id)) {
      nextSelected.delete(id);
    } else {
      nextSelected.add(id);
    }
    setSelectedIds(nextSelected);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(meals.map((meal) => meal.id)));
    }
  };

  const getMealDishInfo = (meal: MealForExport) => {
    const dishCounts = meal.dishIds.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      uniqueDishCount: Object.keys(dishCounts).length,
      totalDishCount: meal.dishIds.length,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">选择要导出的套餐</h2>
            <p className="text-sm text-slate-500 mt-1">
              已选择 {selectedCount} / {meals.length} 个套餐
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {allSelected ? (
              <>
                <CheckSquare className="w-4 h-4" />
                取消全选
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                全选
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {meals.length === 0 ? (
            <div className="text-center py-12 text-slate-400">暂无套餐可导出</div>
          ) : (
            <div className="space-y-2">
              {meals.map((meal) => {
                const { uniqueDishCount, totalDishCount } = getMealDishInfo(meal);
                const isSelected = selectedIds.has(meal.id);

                return (
                  <div
                    key={meal.id}
                    onClick={() => toggleSelect(meal.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected ? 'bg-cyan-50 border-cyan-500' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-md bg-cyan-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-md border-2 border-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{meal.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
                        <span>{uniqueDishCount} 种菜品</span>
                        <span>•</span>
                        <span>共 {totalDishCount} 份</span>
                        <span>•</span>
                        <span className="font-medium text-cyan-600">秒杀价 ¥{meal.promoPrice1.toFixed(0)}</span>
                        {meal.promoPrice2 ? (
                          <>
                            <span>•</span>
                            <span className="font-medium text-amber-600">补贴 ¥{meal.promoPrice2.toFixed(0)}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onExport(meals.filter((meal) => selectedIds.has(meal.id)))}
            disabled={selectedCount === 0}
            className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              selectedCount > 0 ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            导出 {selectedCount > 0 ? `(${selectedCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
