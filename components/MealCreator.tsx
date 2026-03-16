'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Minus, Plus, Search, ShoppingBag, X } from 'lucide-react';
import type { FrontendDish } from '@/services/api/dishesApi';
import type { FrontendMeal } from '@/services/api/mealsApi';

interface MealCreatorProps {
  dishes: FrontendDish[];
  initialData?: FrontendMeal | null;
  onSave: (meal: Omit<FrontendMeal, 'id'>) => void | Promise<void>;
  onCancel: () => void;
}

export const MealCreator: React.FC<MealCreatorProps> = ({
  dishes,
  initialData,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [selectedDishes, setSelectedDishes] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [promoPrice1, setPromoPrice1] = useState<number | ''>('');
  const [promoPrice2, setPromoPrice2] = useState<number | '' | undefined>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialData) {
      setName('');
      setSelectedDishes(new Map());
      setPromoPrice1('');
      setPromoPrice2(undefined);
      return;
    }

    setName(initialData.name);
    setPromoPrice1(initialData.promoPrice1);
    setPromoPrice2(initialData.promoPrice2 !== undefined ? initialData.promoPrice2 : undefined);

    const dishMap = new Map<string, number>();
    initialData.dishIds.forEach((id) => {
      dishMap.set(id, (dishMap.get(id) || 0) + 1);
    });
    setSelectedDishes(dishMap);
  }, [initialData]);

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => dish.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [dishes, searchTerm]);

  const { totalCost, totalOriginalPrice } = useMemo(
    () =>
      Array.from(selectedDishes.entries()).reduce<{ totalCost: number; totalOriginalPrice: number }>(
        (acc, [id, qty]) => {
          const dish = dishes.find((item) => item.id === id);
          if (dish) {
            acc.totalCost += dish.cost * qty;
            acc.totalOriginalPrice += (dish.price || 0) * qty;
          }
          return acc;
        },
        { totalCost: 0, totalOriginalPrice: 0 }
      ),
    [dishes, selectedDishes]
  );

  const calculateMargin = (price: number | '') => {
    const value = typeof price === 'number' ? price : 0;
    if (value <= 0) return 0;
    return ((value - totalCost) / value) * 100;
  };

  const calculateDiscount = (price: number | '') => {
    const value = typeof price === 'number' ? price : 0;
    if (value <= 0 || totalOriginalPrice <= 0) return 0;
    return (value / totalOriginalPrice) * 10;
  };

  const toggleDish = (id: string) => {
    const nextMap = new Map(selectedDishes);
    if (nextMap.has(id)) {
      nextMap.delete(id);
    } else {
      nextMap.set(id, 1);
    }
    setSelectedDishes(nextMap);
  };

  const updateQuantity = (id: string, delta: number) => {
    const nextMap = new Map<string, number>(selectedDishes);
    const currentQty = nextMap.get(id) || 0;
    const nextQty = currentQty + delta;

    if (nextQty <= 0) {
      nextMap.delete(id);
    } else {
      nextMap.set(id, nextQty);
    }
    setSelectedDishes(nextMap);
  };

  const handleSave = async () => {
    if (!name.trim() || selectedDishes.size === 0 || !promoPrice1) {
      alert('请填写套餐名称、选择至少一个菜品并设置秒杀价 1');
      return;
    }

    const dishIds: string[] = [];
    selectedDishes.forEach((qty, id) => {
      for (let index = 0; index < qty; index++) {
        dishIds.push(id);
      }
    });

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        dishIds,
        standardPrice: 0,
        promoPrice1: Number(promoPrice1) || 0,
        promoPrice2: promoPrice2 !== undefined && promoPrice2 !== '' ? Number(promoPrice2) : undefined,
        order: initialData?.order,
        isSingleDish: initialData?.isSingleDish,
        syncDishId: initialData?.syncDishId,
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedDishesList = useMemo(
    () =>
      Array.from(selectedDishes.entries())
        .map(([id, qty]) => {
          const dish = dishes.find((item) => item.id === id);
          return dish ? { ...dish, qty } : null;
        })
        .filter(Boolean) as Array<FrontendDish & { qty: number }>,
    [dishes, selectedDishes]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white p-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <ShoppingBag className="h-5 w-5 text-emerald-500" />
              {initialData ? '编辑团购套餐 (Edit Meal Plan)' : '新建团购套餐 (Create Meal Plan)'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">选择菜品组合，设定价格并分析毛利</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-2 transition-colors hover:bg-slate-100"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          <div className="custom-scrollbar flex w-full flex-col overflow-y-auto border-r border-slate-100 bg-slate-50 p-6 md:w-1/2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                选择菜品 (Select Dishes)
              </h3>
              <span className="text-xs font-normal text-slate-400">已选品种: {selectedDishes.size}</span>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索菜品名称..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto pr-1">
              {filteredDishes.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">未找到匹配菜品</div>
              ) : (
                filteredDishes.map((dish) => {
                  const qty = selectedDishes.get(dish.id) || 0;
                  const isSelected = qty > 0;

                  return (
                    <div
                      key={dish.id}
                      className={`flex flex-col rounded-lg border p-3 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-white shadow-sm ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="flex cursor-pointer items-center"
                        onClick={() => toggleDish(dish.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleDish(dish.id);
                          }
                        }}
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                            isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected ? <div className="h-2 w-2 rounded-full bg-white" /> : null}
                        </div>
                        <div className="ml-3 flex flex-1 items-center justify-between">
                          <span className={`text-sm ${isSelected ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                            {dish.name}
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-xs text-slate-400">
                              {dish.price ? `¥${dish.price}` : '-'} /{' '}
                              <span className="font-bold text-slate-500">¥{dish.cost}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="animate-in slide-in-from-top-1 mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                          <span className="pl-1 text-xs font-medium text-slate-400">数量 (Qty):</span>
                          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateQuantity(dish.id, -1);
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded bg-white text-slate-600 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-500"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-slate-800">{qty}</span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateQuantity(dish.id, 1);
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded bg-white text-slate-600 shadow-sm transition-colors hover:bg-emerald-50 hover:text-emerald-500"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="custom-scrollbar w-full overflow-y-auto bg-white p-6 md:w-1/2">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">套餐名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="例如：双人超值烤肉餐"
                />
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <span className="mb-2 block text-xs text-slate-500">已选菜品清单</span>
                <div className="custom-scrollbar mb-3 flex max-h-24 flex-wrap gap-2 overflow-y-auto">
                  {selectedDishesList.length > 0 ? (
                    selectedDishesList.map((item) => (
                      <span
                        key={item.id}
                        className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm"
                      >
                        {item.name}
                        {item.qty > 1 ? (
                          <span className="rounded bg-emerald-100 px-1 text-[10px] text-emerald-700">x{item.qty}</span>
                        ) : null}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">请选择左侧菜品...</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-3">
                  <div>
                    <span className="mb-1 block text-xs text-slate-500">组合总原价 (Value)</span>
                    <span className="font-mono text-lg font-bold text-slate-600">¥{totalOriginalPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs text-slate-500">组合总成本 (Cost)</span>
                    <span className="font-mono text-lg font-bold text-slate-800">¥{totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="absolute -right-8 -top-8 h-16 w-16 rounded-bl-full bg-purple-500/10" />
                  <label className="mb-2 block text-sm font-bold text-purple-700">秒杀价 1</label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                      <input
                        type="number"
                        value={promoPrice1}
                        onChange={(event) =>
                          setPromoPrice1(event.target.value === '' ? '' : parseFloat(event.target.value))
                        }
                        className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-4 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <span
                        className={`font-mono text-xl font-bold ${
                          calculateMargin(promoPrice1) < 20 ? 'text-rose-500' : 'text-emerald-500'
                        }`}
                      >
                        {calculateMargin(promoPrice1).toFixed(1)}%
                      </span>
                      {promoPrice1 && totalOriginalPrice > 0 ? (
                        <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-600">
                          {calculateDiscount(promoPrice1).toFixed(1)}折
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="absolute -right-8 -top-8 h-16 w-16 rounded-bl-full bg-amber-500/10" />
                  <label className="mb-2 block text-sm font-bold text-amber-700">官方补贴金额（可选）</label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                      <input
                        type="number"
                        value={promoPrice2 ?? ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          setPromoPrice2(value === '' ? undefined : parseFloat(value));
                        }}
                        onBlur={(event) => {
                          if (event.target.value === '') {
                            setPromoPrice2(undefined);
                          }
                        }}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-4 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        placeholder="留空表示无补贴"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      {promoPrice2 !== undefined && promoPrice2 !== '' ? (
                        <>
                          <span
                            className={`font-mono text-xl font-bold ${
                              calculateMargin(
                                (typeof promoPrice1 === 'number' ? promoPrice1 : 0) -
                                  (typeof promoPrice2 === 'number' ? promoPrice2 : 0)
                              ) < 15
                                ? 'text-rose-500'
                                : 'text-emerald-500'
                            }`}
                          >
                            {calculateMargin(
                              (typeof promoPrice1 === 'number' ? promoPrice1 : 0) -
                                (typeof promoPrice2 === 'number' ? promoPrice2 : 0)
                            ).toFixed(1)}%
                          </span>
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600">
                            官方补贴后毛利率
                          </span>
                        </>
                      ) : (
                        <span className="text-sm italic text-slate-400">未设置</span>
                      )}
                    </div>
                  </div>
                </div>

                {promoPrice1 && promoPrice2 !== undefined && promoPrice2 !== '' ? (
                  <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="absolute -right-8 -top-8 h-16 w-16 rounded-bl-full bg-emerald-500/10" />
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-emerald-700">最终到手价</span>
                        <span className="block text-xs text-slate-500">= 秒杀价1 - 官方补贴金额</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-2xl font-bold text-emerald-600">
                          ¥
                          {(
                            (typeof promoPrice1 === 'number' ? promoPrice1 : 0) -
                            (typeof promoPrice2 === 'number' ? promoPrice2 : 0)
                          ).toFixed(2)}
                        </span>
                        <span className="mt-1 block rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-600">
                          毛利率：
                          {calculateMargin(
                            (typeof promoPrice1 === 'number' ? promoPrice1 : 0) -
                              (typeof promoPrice2 === 'number' ? promoPrice2 : 0)
                          ).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-6 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Calculator className="h-4 w-4" />
            {saving ? '保存中...' : initialData ? '更新配置' : '保存套餐配置'}
          </button>
        </div>
      </div>
    </div>
  );
};
