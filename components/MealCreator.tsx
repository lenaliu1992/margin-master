'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Search, ArrowLeft } from 'lucide-react';
import type { FrontendDish } from '@/services/api/dishesApi';
import type { FrontendMeal } from '@/services/api/mealsApi';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface MealCreatorProps {
  dishes: FrontendDish[];
  initialData?: FrontendMeal | null;
  onSave: (meal: Omit<FrontendMeal, 'id'>) => void | Promise<void>;
  onCancel?: () => void;
}

type Category = '全部' | '代金券' | '主菜' | '小食' | '饮品';

const categories: Category[] = ['全部', '代金券', '主菜', '小食', '饮品'];

const getDishCategory = (dish: FrontendDish): Exclude<Category, '全部'> => {
  const name = dish.name;
  if (name.includes('代金券') || name.includes('券')) return '代金券';
  if (name.includes('饮') || name.includes('茶') || name.includes('可乐') || name.includes('汤')) return '饮品';
  if (name.includes('小') || name.includes('配') || name.length <= 4) return '小食';
  return '主菜';
};

const formatCurrency = (value: number) => `¥${value.toFixed(2)}`;

const getMarginMeta = (margin: number) => {
  if (margin >= 60) {
    return {
      label: '健康',
      color: '#059669',
      badgeClassName: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
      valueClassName: 'text-emerald-700',
      borderClassName: 'border-emerald-300',
      bgClassName: 'bg-emerald-50/50',
    };
  }
  if (margin >= 40) {
    return {
      label: '关注',
      color: '#D97706',
      badgeClassName: 'border border-amber-200 bg-amber-50 text-amber-700',
      valueClassName: 'text-amber-700',
      borderClassName: 'border-amber-300',
      bgClassName: 'bg-amber-50/50',
    };
  }
  return {
    label: '风险',
    color: '#DC2626',
    badgeClassName: 'border border-rose-200 bg-rose-50 text-rose-700',
    valueClassName: 'text-rose-700',
    borderClassName: 'border-rose-300',
    bgClassName: 'bg-rose-50/50',
  };
};

const MarginRing: React.FC<{ value: number; size?: number }> = ({ value, size = 80 }) => {
  const meta = getMarginMeta(value);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={meta.color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums" style={{ color: meta.color }}>{value.toFixed(0)}</span>
        <span className="text-[10px] text-gray-400">%</span>
      </div>
    </div>
  );
};

const DishCard: React.FC<{
  dish: FrontendDish;
  quantity: number;
  isSelected: boolean;
  onToggle: () => void;
  onUpdateQuantity: (delta: number) => void;
}> = ({ dish, quantity, isSelected, onToggle, onUpdateQuantity }) => {
  const category = getDishCategory(dish);
  const categoryStyle: Record<string, { bg: string; text: string }> = {
    '代金券': { bg: 'bg-purple-50', text: 'text-purple-700' },
    '主菜': { bg: 'bg-orange-50', text: 'text-orange-700' },
    '小食': { bg: 'bg-blue-50', text: 'text-blue-700' },
    '饮品': { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  };
  const style = categoryStyle[category] || { bg: 'bg-gray-50', text: 'text-gray-700' };

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-lg border bg-white px-4 py-3 transition-all duration-200 cursor-pointer',
        isSelected ? 'border-[#1E3A5F] bg-[#F0F7FF]' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      )}
      onClick={onToggle}
    >
      <Checkbox checked={isSelected} onCheckedChange={onToggle} className="h-5 w-5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-gray-900">{dish.name}</span>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', style.bg, style.text)}>{category}</span>
        </div>
        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
          <span>原价 <span className="font-semibold text-gray-700">{formatCurrency(dish.price || 0)}</span></span>
          <span>成本 <span className="font-semibold text-gray-700">{formatCurrency(dish.cost)}</span></span>
        </div>
      </div>
      {isSelected && (
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => onUpdateQuantity(-1)}><Minus className="h-4 w-4" /></Button>
          <span className="w-8 text-center text-base font-bold">{quantity}</span>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => onUpdateQuantity(1)}><Plus className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
};

export const MealCreator: React.FC<MealCreatorProps> = ({ dishes, initialData, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [selectedDishes, setSelectedDishes] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<Category>('全部');
  const [promoPrice1, setPromoPrice1] = useState<number | ''>('');
  const [promoPrice2, setPromoPrice2] = useState<number | '' | undefined>('');
  const [subsidyCount, setSubsidyCount] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialData) {
      setName(''); setSelectedDishes(new Map()); setPromoPrice1(''); setPromoPrice2(undefined); setSubsidyCount('');
      return;
    }
    setName(initialData.name);
    setPromoPrice1(initialData.promoPrice1);
    setPromoPrice2(initialData.promoPrice2);
    setSubsidyCount(initialData.subsidyCount ?? '');
    const dishMap = new Map<string, number>();
    initialData.dishIds.forEach((id) => dishMap.set(id, (dishMap.get(id) || 0) + 1));
    setSelectedDishes(dishMap);
  }, [initialData]);

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      return category === '全部' ? true : getDishCategory(dish) === category;
    });
  }, [dishes, searchTerm, category]);

  const { totalCost, totalOriginalPrice } = useMemo(() =>
    Array.from(selectedDishes.entries()).reduce((acc, [id, qty]) => {
      const dish = dishes.find((item) => item.id === id);
      if (dish) { acc.totalCost += dish.cost * qty; acc.totalOriginalPrice += (dish.price || 0) * qty; }
      return acc;
    }, { totalCost: 0, totalOriginalPrice: 0 }),
  [dishes, selectedDishes]);

  const finalPrice = useMemo(() => (Number(promoPrice1) || 0) - (Number(promoPrice2) || 0), [promoPrice1, promoPrice2]);
  const effectiveMargin = useMemo(() => finalPrice > 0 ? ((finalPrice - totalCost) / finalPrice) * 100 : 0, [finalPrice, totalCost]);
  const marginMeta = getMarginMeta(effectiveMargin);
  const totalSelectedQty = Array.from(selectedDishes.values()).reduce((sum, qty) => sum + qty, 0);

  const toggleDish = (id: string) => {
    setSelectedDishes((prev) => {
      const next = new Map(prev);
      next.has(id) ? next.delete(id) : next.set(id, 1);
      return next;
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedDishes((prev) => {
      const next = new Map(prev);
      const qty = (next.get(id) || 0) + delta;
      qty <= 0 ? next.delete(id) : next.set(id, qty);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim() || selectedDishes.size === 0 || !promoPrice1) return alert('请完善信息');
    setSaving(true);
    const dishIds: string[] = [];
    selectedDishes.forEach((qty, id) => { for (let i = 0; i < qty; i++) dishIds.push(id); });
    try {
      await onSave({
        name: name.trim(), dishIds, standardPrice: 0,
        promoPrice1: Number(promoPrice1), promoPrice2: promoPrice2 ? Number(promoPrice2) : undefined,
        subsidyCount: subsidyCount ? Number(subsidyCount) : undefined,
      });
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between bg-white px-6 py-4 border-b shadow-sm">
        <div className="flex items-center gap-3">
          <span className="rounded bg-[#1E3A5F] px-2 py-1 text-xs text-white">{initialData ? '编辑' : '新建'}</span>
          <h1 className="text-xl font-bold text-gray-900">套餐管理</h1>
        </div>
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">返回列表</span>
        </button>
      </header>

      {/* 主内容区 - 响应式布局 */}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* 左侧：选菜区 */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:border-r border-gray-200">
          <div className="shrink-0 bg-gray-50 px-5 py-4 border-b">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg text-gray-900">选菜区</h3>
              <span className="text-sm font-medium text-[#1E3A5F]">已选 {selectedDishes.size} 种</span>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-9 h-10" placeholder="搜索菜品..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <Button key={cat} variant={category === cat ? 'default' : 'outline'} size="sm" className="rounded-full shrink-0" onClick={() => setCategory(cat)}>{cat}</Button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredDishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  quantity={selectedDishes.get(dish.id) || 0}
                  isSelected={selectedDishes.has(dish.id)}
                  onToggle={() => toggleDish(dish.id)}
                  onUpdateQuantity={(d) => updateQuantity(dish.id, d)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 右侧：定价区 */}
        <aside className="md:w-[380px] shrink-0 flex flex-col bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200">
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-5">
              <div>
                <label className="text-sm font-bold block mb-2 text-gray-700">套餐名称</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="输入名称..." className="bg-white" />
              </div>

              {/* 已选菜品摘要 */}
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">已选菜品</h3>
                  <span className="text-sm text-gray-500">{selectedDishes.size} 种 / {totalSelectedQty} 份</span>
                </div>
                <div className="mt-3 flex min-h-[48px] flex-wrap gap-2">
                  {selectedDishes.size > 0 ? (
                    Array.from(selectedDishes.entries()).map(([id, qty]) => {
                      const dish = dishes.find((d) => d.id === id);
                      if (!dish) return null;
                      return (
                        <div key={id} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
                          <span className="max-w-[120px] truncate">{dish.name}</span>
                          <span className="rounded-full bg-[#1E3A5F]/10 px-1.5 py-0.5 text-xs font-semibold text-[#1E3A5F]">×{qty}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400">
                      从左侧选择菜品
                    </div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-xs text-gray-500">组合总原价</div>
                    <div className="mt-1 text-xl font-bold text-gray-900 tabular-nums">{formatCurrency(totalOriginalPrice)}</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-xs text-gray-500">组合总成本</div>
                    <div className="mt-1 text-xl font-bold text-gray-900 tabular-nums">{formatCurrency(totalCost)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-gray-900">定价分析</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-500 mb-1 block">秒杀价</label><Input type="number" value={promoPrice1} onChange={e => setPromoPrice1(e.target.value === '' ? '' : Number(e.target.value))} className="bg-gray-50 font-bold" /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">平台补贴</label><Input type="number" value={promoPrice2 ?? ''} onChange={e => setPromoPrice2(e.target.value === '' ? '' : Number(e.target.value))} className="bg-gray-50 font-bold" /></div>
                </div>

                <div className={cn("p-4 rounded-xl border-2 transition-colors", marginMeta.bgClassName, marginMeta.borderClassName)}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold">最终利润分析</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold", marginMeta.badgeClassName)}>{marginMeta.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <MarginRing value={effectiveMargin} size={64} />
                    <div>
                      <div className="text-2xl font-black text-[#1E3A5F]">{formatCurrency(finalPrice)}</div>
                      <div className="text-xs text-gray-500">预估到手 (成本 {formatCurrency(totalCost)})</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <label className="text-sm font-bold block mb-2 text-gray-700">补贴库存设置</label>
                <Input type="number" value={subsidyCount} onChange={e => setSubsidyCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="输入补贴份数..." className="bg-white" />
                <p className="mt-2 text-xs text-gray-400">设置后将在前端显示"官方补贴"标识</p>
              </div>
            </div>
          </div>

          {/* 底部操作栏 */}
          <div className="shrink-0 p-5 border-t bg-white">
            <Button className="w-full bg-[#1E3A5F] h-11 text-base font-bold hover:bg-[#162D4A] shadow-lg" onClick={() => void handleSave()} disabled={saving}>
              {saving ? '正在保存...' : initialData ? '更新套餐方案' : '确认发布套餐'}
            </Button>
            <Button variant="ghost" className="w-full mt-2 text-gray-400" onClick={handleCancel}>取消操作</Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MealCreator;
