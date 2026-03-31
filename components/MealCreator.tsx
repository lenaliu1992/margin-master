'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Minus, Plus, Search, X, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { FrontendDish } from '@/services/api/dishesApi';
import type { FrontendMeal } from '@/services/api/mealsApi';

import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

interface MealCreatorProps {
  dishes: FrontendDish[];
  initialData?: FrontendMeal | null;
  onSave: (meal: Omit<FrontendMeal, 'id'>) => void | Promise<void>;
  onCancel: () => void;
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

// 毛利率环形进度条组件
const MarginRing: React.FC<{ value: number; size?: number }> = ({ value, size = 80 }) => {
  const meta = getMarginMeta(value);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={4}
        />
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
        <span className="text-xl font-bold tabular-nums" style={{ color: meta.color }}>
          {value.toFixed(0)}
        </span>
        <span className="text-[10px] text-gray-400">%</span>
      </div>
    </div>
  );
};

// 菜品卡片组件
const DishCard: React.FC<{
  dish: FrontendDish;
  quantity: number;
  isSelected: boolean;
  onToggle: () => void;
  onUpdateQuantity: (delta: number) => void;
  animationDelay?: number;
}> = ({ dish, quantity, isSelected, onToggle, onUpdateQuantity, animationDelay = 0 }) => {
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
      role="button"
      tabIndex={0}
      className={cn(
        'group rounded-2xl border bg-white p-4 transition-all duration-200',
        isSelected
          ? 'border-[#1E3A5F] bg-gradient-to-br from-[#F8FAFC] to-[#E8F4FC] shadow-md translate-x-1'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            'mt-0.5 h-5 w-5 rounded-md border-2 transition-all duration-200',
            isSelected
              ? 'border-[#1E3A5F] bg-[#1E3A5F]'
              : 'border-gray-300 group-hover:border-gray-400'
          )}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('truncate text-sm font-semibold', isSelected ? 'text-gray-900' : 'text-gray-800')}>
              {dish.name}
            </span>
            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', style.bg, style.text)}>
              {category}
            </span>
          </div>

          <div className="mt-1 text-xs text-gray-400">ID: {dish.id.slice(0, 8)}</div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 transition-colors duration-200 group-hover:border-gray-200">
              <div className="text-[11px] text-gray-400">单点价</div>
              <div className="mt-0.5 font-semibold text-gray-900 tabular-nums">
                {formatCurrency(dish.price || 0)}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 transition-colors duration-200 group-hover:border-gray-200">
              <div className="text-[11px] text-gray-400">成本</div>
              <div className="mt-0.5 font-semibold text-gray-900 tabular-nums">
                {formatCurrency(dish.cost)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 数量调整区域 */}
      <div
        className={cn(
          'mt-4 overflow-hidden transition-all duration-300',
          isSelected ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-xl border border-[#1E3A5F]/20 bg-white px-4 py-3">
          <div>
            <div className="text-xs font-medium text-gray-600">已选数量</div>
            <div className="mt-0.5 text-[11px] text-gray-400">仅在当前套餐中生效</div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-gray-300 bg-white text-gray-600 transition-all duration-150 hover:border-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white active:scale-95"
              onClick={() => onUpdateQuantity(-1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <div className="min-w-[32px] text-center text-sm font-bold tabular-nums">
              {quantity}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-gray-300 bg-white text-gray-600 transition-all duration-150 hover:border-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white active:scale-95"
              onClick={() => onUpdateQuantity(1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MealCreator: React.FC<MealCreatorProps> = ({
  dishes,
  initialData,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [selectedDishes, setSelectedDishes] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<Category>('全部');
  const [promoPrice1, setPromoPrice1] = useState<number | ''>('');
  const [promoPrice2, setPromoPrice2] = useState<number | '' | undefined>('');
  const [subsidyCount, setSubsidyCount] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  // 初始化数据
  useEffect(() => {
    if (!initialData) {
      setName('');
      setSelectedDishes(new Map());
      setPromoPrice1('');
      setPromoPrice2(undefined);
      setSubsidyCount('');
      return;
    }

    setName(initialData.name);
    setPromoPrice1(initialData.promoPrice1);
    setPromoPrice2(initialData.promoPrice2 !== undefined ? initialData.promoPrice2 : undefined);
    setSubsidyCount(initialData.subsidyCount ?? '');

    const dishMap = new Map<string, number>();
    initialData.dishIds.forEach((id) => {
      dishMap.set(id, (dishMap.get(id) || 0) + 1);
    });
    setSelectedDishes(dishMap);
  }, [initialData]);

  // 过滤菜品
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (category === '全部') return true;
      return getDishCategory(dish) === category;
    });
  }, [dishes, searchTerm, category]);

  // 计算汇总数据
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

  const totalSubsidyAmount = useMemo(() => {
    if (typeof promoPrice2 !== 'number' || typeof subsidyCount !== 'number') {
      return 0;
    }
    return promoPrice2 * subsidyCount;
  }, [promoPrice2, subsidyCount]);

  const finalPrice = useMemo(() => {
    const p1 = typeof promoPrice1 === 'number' ? promoPrice1 : 0;
    const p2 = typeof promoPrice2 === 'number' ? promoPrice2 : 0;
    return p1 - p2;
  }, [promoPrice1, promoPrice2]);

  const calculateMargin = useCallback(
    (price: number) => {
      if (price <= 0) return 0;
      return ((price - totalCost) / price) * 100;
    },
    [totalCost]
  );

  const calculateProfit = useCallback(
    (price: number) => price - totalCost,
    [totalCost]
  );

  const calculateDiscount = useCallback(
    (price: number) => {
      if (price <= 0 || totalOriginalPrice <= 0) return 0;
      return (price / totalOriginalPrice) * 10;
    },
    [totalOriginalPrice]
  );

  // 操作函数
  const toggleDish = useCallback((id: string) => {
    setSelectedDishes((prev) => {
      const nextMap = new Map(prev);
      if (nextMap.has(id)) {
        nextMap.delete(id);
      } else {
        nextMap.set(id, 1);
      }
      return nextMap;
    });
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setSelectedDishes((prev) => {
      const nextMap = new Map(prev);
      const currentQty = nextMap.get(id) || 0;
      const nextQty = currentQty + delta;

      if (nextQty <= 0) {
        nextMap.delete(id);
      } else {
        nextMap.set(id, nextQty);
      }
      return nextMap;
    });
  }, []);

  const handleSave = async () => {
    if (!name.trim() || selectedDishes.size === 0 || !promoPrice1) {
      alert('请填写套餐名称、选择至少一个菜品并设置秒杀价');
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
        subsidyCount: subsidyCount !== '' ? Number(subsidyCount) : undefined,
        order: initialData?.order,
        isSingleDish: initialData?.isSingleDish,
        syncDishId: initialData?.syncDishId,
      });
    } finally {
      setSaving(false);
    }
  };

  // 计算展示数据
  const totalSelectedQty = useMemo(
    () => Array.from(selectedDishes.values()).reduce((sum, qty) => sum + qty, 0),
    [selectedDishes]
  );

  const hasSubsidy = typeof promoPrice2 === 'number' && promoPrice2 > 0;
  const flashSalePrice = typeof promoPrice1 === 'number' ? promoPrice1 : 0;
  const flashMargin = calculateMargin(flashSalePrice);
  const flashProfit = calculateProfit(flashSalePrice);
  const finalMargin = calculateMargin(finalPrice);
  const finalProfit = calculateProfit(finalPrice);
  const effectiveMargin = hasSubsidy ? finalMargin : flashMargin;
  const effectiveProfit = hasSubsidy ? finalProfit : flashProfit;
  const flashMarginMeta = getMarginMeta(flashMargin);
  const effectiveMarginMeta = getMarginMeta(effectiveMargin);
  const canSave = Boolean(name.trim()) && selectedDishes.size > 0 && Boolean(promoPrice1) && !saving;

  // 状态图标
  const StatusIcon = effectiveMargin >= 60 ? CheckCircle2 : effectiveMargin >= 40 ? AlertTriangle : TrendingUp;

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'grid-rows-[auto,minmax(0,1fr),auto] w-[calc(100vw-24px)] max-w-[1400px] gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl',
          'sm:w-[calc(100vw-48px)] sm:h-[min(920px,calc(100vh-48px))]',
          'animate-[dialogEnter_240ms_cubic-bezier(0.16,1,0.3,1)_ease-out]'
        )}
      >
        {/* Header */}
        <DialogHeader className="flex-row items-start justify-between gap-6 border-b border-gray-100 bg-white px-6 py-5 text-left xl:px-8 xl:py-6">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full bg-[#1E3A5F]/5 px-3 py-1.5 text-xs font-semibold text-[#1E3A5F]">
              {initialData ? '编辑套餐' : '新建套餐'}
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold tracking-tight text-[#0F172A] xl:text-3xl">
                {initialData ? '编辑团购套餐' : '新建团购套餐'}
              </DialogTitle>
              <DialogDescription className="max-w-2xl text-sm text-gray-500">
                左侧选菜，右侧完成定价与毛利分析
              </DialogDescription>
            </div>
          </div>

          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl border-gray-200 bg-white text-gray-400 shadow-none transition-all duration-150 hover:bg-gray-50 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">关闭</span>
            </Button>
          </DialogClose>
        </DialogHeader>

        {/* Main Content */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,1fr)] xl:overflow-hidden">
          {/* Left: 选菜区 */}
          <section className="order-2 flex min-h-0 flex-col border-t border-gray-100 bg-gray-50/50 xl:order-1 xl:border-t-0 xl:border-r">
            <div className="border-b border-gray-100 bg-white px-5 py-5 xl:px-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">选菜区</h3>
                  <p className="mt-0.5 text-xs text-gray-500">选择菜品组合，调整数量</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#1E3A5F]/5 px-3 py-1.5">
                  <span className="text-xs font-semibold text-[#1E3A5F]">
                    已选 {selectedDishes.size} 种 / {totalSelectedQty} 份
                  </span>
                </div>
              </div>

              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="搜索菜品名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    'h-11 rounded-xl border-gray-200 bg-white pl-11 pr-4',
                    'text-sm text-gray-900 placeholder:text-gray-400',
                    'transition-all duration-150',
                    'hover:border-gray-300',
                    'focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/10'
                  )}
                />
              </div>

              {/* 分类标签 */}
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'h-8 rounded-full border px-4 text-xs font-semibold',
                      'transition-all duration-150',
                      category === cat
                        ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white hover:bg-[#162D4A]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* 菜品列表 */}
            <ScrollArea className="flex-1 px-5 py-4 xl:px-6">
              <div className="space-y-3">
                {filteredDishes.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-12 text-center">
                    <p className="text-sm font-medium text-gray-500">未找到匹配菜品</p>
                    <p className="mt-1 text-xs text-gray-400">尝试其他关键词</p>
                  </div>
                ) : (
                  filteredDishes.map((dish, index) => (
                    <DishCard
                      key={dish.id}
                      dish={dish}
                      quantity={selectedDishes.get(dish.id) || 0}
                      isSelected={selectedDishes.has(dish.id)}
                      onToggle={() => toggleDish(dish.id)}
                      onUpdateQuantity={(delta) => updateQuantity(dish.id, delta)}
                      animationDelay={index * 30}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </section>

          {/* Right: 定价区 */}
          <section className="order-1 min-h-0 overflow-y-auto bg-white px-5 py-5 xl:order-2 xl:px-6 xl:py-6">
            <div className="space-y-5">
              {/* 套餐名称 */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
                <div className="mb-3">
                  <h3 className="text-base font-bold text-[#0F172A]">套餐名称</h3>
                  <p className="mt-0.5 text-xs text-gray-500">名称会直接用于前台展示</p>
                </div>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：花生煲鸡爪 2-3 人餐"
                  className={cn(
                    'h-12 rounded-xl border-gray-200 bg-white px-4',
                    'text-sm text-gray-900 placeholder:text-gray-400',
                    'transition-all duration-150',
                    'hover:border-gray-300',
                    'focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/10'
                  )}
                />
              </div>

              {/* 已选菜品摘要 */}
              <div className="rounded-2xl border border-gray-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A]">已选菜品</h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {selectedDishes.size} 种菜 / {totalSelectedQty} 份
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex min-h-[60px] flex-wrap gap-2">
                  {selectedDishes.size > 0 ? (
                    Array.from(selectedDishes.entries()).map(([id, qty]) => {
                      const dish = dishes.find((d) => d.id === id);
                      if (!dish) return null;
                      return (
                        <div
                          key={id}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                        >
                          <span className="max-w-[140px] truncate">{dish.name}</span>
                          <span className="rounded-full bg-[#1E3A5F]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1E3A5F]">
                            ×{qty}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-400">
                      从左侧选择菜品
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-xs font-medium text-gray-500">组合总原价</div>
                    <div className="mt-1 text-xl font-bold text-gray-900 tabular-nums">
                      {formatCurrency(totalOriginalPrice)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-xs font-medium text-gray-500">组合总成本</div>
                    <div className="mt-1 text-xl font-bold text-gray-900 tabular-nums">
                      {formatCurrency(totalCost)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 定价输入 */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-[#0F172A]">定价输入</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* 秒杀价 */}
                  <div className="rounded-2xl border border-gray-100 p-4">
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-gray-900">秒杀价</div>
                      <p className="mt-0.5 text-xs text-gray-500">用户实际看到的售卖价格</p>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                        ¥
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={promoPrice1}
                        onChange={(e) =>
                          setPromoPrice1(e.target.value === '' ? '' : parseFloat(e.target.value))
                        }
                        className={cn(
                          'h-12 rounded-xl border-gray-200 bg-gray-50 pl-9 pr-4',
                          'text-xl font-bold text-gray-900 tabular-nums',
                          'placeholder:text-gray-300',
                          'transition-all duration-150',
                          'hover:border-gray-300',
                          'focus:border-[#1E3A5F] focus:bg-white focus:ring-[#1E3A5F]/10'
                        )}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <span className="text-xs font-medium text-gray-500">参考折扣</span>
                      <span className="text-sm font-semibold text-[#1E3A5F] tabular-nums">
                        {flashSalePrice > 0 ? `${calculateDiscount(flashSalePrice).toFixed(1)} 折` : '待填写'}
                      </span>
                    </div>
                  </div>

                  {/* 官方补贴 */}
                  <div className="rounded-2xl border border-gray-100 p-4">
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-gray-900">官方补贴金额</div>
                      <p className="mt-0.5 text-xs text-gray-500">用于计算补贴后实际入账</p>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                        ¥
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={promoPrice2 ?? ''}
                        onChange={(e) =>
                          setPromoPrice2(e.target.value === '' ? undefined : parseFloat(e.target.value))
                        }
                        className={cn(
                          'h-12 rounded-xl border-gray-200 bg-gray-50 pl-9 pr-4',
                          'text-xl font-bold text-gray-900 tabular-nums',
                          'placeholder:text-gray-300',
                          'transition-all duration-150',
                          'hover:border-gray-300',
                          'focus:border-[#1E3A5F] focus:bg-white focus:ring-[#1E3A5F]/10'
                        )}
                        placeholder="留空表示无补贴"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <span className="text-xs font-medium text-gray-500">补贴后到手价</span>
                      <span className="text-sm font-semibold text-[#1E3A5F] tabular-nums">
                        {hasSubsidy ? formatCurrency(finalPrice) : '待填写补贴'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 利润结果区 */}
              <div
                className={cn(
                  'rounded-2xl border-2 p-5',
                  effectiveMarginMeta.borderClassName,
                  effectiveMarginMeta.bgClassName
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A]">利润分析</h3>
                    <p className="mt-0.5 text-xs text-gray-500">基于当前定价的毛利预测</p>
                  </div>
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', effectiveMarginMeta.badgeClassName)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {effectiveMarginMeta.label}
                  </span>
                </div>

                {/* 核心数据展示 */}
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                  <div className="rounded-xl border border-gray-200/50 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {hasSubsidy ? '最终到手价' : '秒杀价入账'}
                    </div>
                    <div className="mt-2 text-3xl font-bold tracking-tight text-[#1E3A5F] tabular-nums">
                      {formatCurrency(hasSubsidy ? finalPrice : flashSalePrice)}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {hasSubsidy ? '秒杀价减去补贴后的实际入账' : '当前秒杀价对应的实际入账'}
                    </p>
                  </div>

                  {/* 毛利率仪表盘 */}
                  <div className="flex items-center justify-center rounded-xl border border-gray-200/50 bg-white p-4">
                    <MarginRing value={effectiveMargin} size={88} />
                  </div>
                </div>

                {/* 详细数据 */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-gray-200/50 bg-white px-3 py-2.5">
                    <div className="text-[11px] font-medium text-gray-500">组合总原价</div>
                    <div className="mt-1 text-base font-bold text-gray-900 tabular-nums">
                      {formatCurrency(totalOriginalPrice)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200/50 bg-white px-3 py-2.5">
                    <div className="text-[11px] font-medium text-gray-500">组合总成本</div>
                    <div className="mt-1 text-base font-bold text-gray-900 tabular-nums">
                      {formatCurrency(totalCost)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200/50 bg-white px-3 py-2.5">
                    <div className="text-[11px] font-medium text-gray-500">秒杀价毛利率</div>
                    <div className={cn('mt-1 text-base font-bold tabular-nums', flashMarginMeta.valueClassName)}>
                      {flashMargin.toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200/50 bg-white px-3 py-2.5">
                    <div className="text-[11px] font-medium text-gray-500">
                      {hasSubsidy ? '最终毛利率' : '预计净利润'}
                    </div>
                    <div className={cn('mt-1 text-base font-bold tabular-nums', effectiveMarginMeta.valueClassName)}>
                      {hasSubsidy ? `${effectiveMargin.toFixed(1)}%` : formatCurrency(effectiveProfit)}
                    </div>
                  </div>
                </div>

                {/* 补贴库存 */}
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
                  <div className="rounded-lg border border-gray-200/50 bg-white p-3">
                    <label className="mb-2 block text-sm font-semibold text-gray-900">补贴库存</label>
                    <p className="mb-2 text-xs text-gray-500">用于预估补贴资源占用</p>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={subsidyCount}
                      onChange={(e) =>
                        setSubsidyCount(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                      }
                      className={cn(
                        'h-10 rounded-lg border-gray-200 bg-gray-50 px-3',
                        'text-sm text-gray-900',
                        'placeholder:text-gray-400',
                        'transition-all duration-150',
                        'hover:border-gray-300',
                        'focus:border-[#1E3A5F] focus:bg-white focus:ring-[#1E3A5F]/10'
                      )}
                      placeholder="输入份数"
                      min="0"
                    />
                  </div>

                  <div className="rounded-lg border border-gray-200/50 bg-white px-4 py-3">
                    <div className="text-xs font-medium text-gray-500">补贴总额</div>
                    <div className="mt-2 text-xl font-bold text-[#1E3A5F] tabular-nums">
                      {formatCurrency(totalSubsidyAmount)}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-400">补贴金额 × 补贴库存</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-white px-6 py-4 xl:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-gray-900">
                {selectedDishes.size > 0
                  ? `已选 ${selectedDishes.size} 种菜，共 ${totalSelectedQty} 份`
                  : '请先从左侧选择菜品'}
              </div>
              <div className="text-xs text-gray-500">
                {selectedDishes.size > 0
                  ? `预计净利润 ${formatCurrency(effectiveProfit)}，${hasSubsidy ? '补贴后' : '秒杀价'}毛利率 ${effectiveMargin.toFixed(1)}%`
                  : '填写套餐名称、选择菜品并设置秒杀价后即可保存'}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className={cn(
                  'h-11 rounded-xl border-gray-200 bg-white px-6',
                  'text-sm font-semibold text-gray-600',
                  'transition-all duration-150',
                  'hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={!canSave}
                className={cn(
                  'h-11 rounded-xl px-6',
                  'text-sm font-semibold text-white',
                  'transition-all duration-150',
                  canSave
                    ? 'bg-[#1E3A5F] hover:bg-[#162D4A] active:scale-[0.98]'
                    : 'cursor-not-allowed bg-gray-300'
                )}
              >
                {saving ? '保存中...' : initialData ? '更新套餐' : '保存套餐'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MealCreator;
