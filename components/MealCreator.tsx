'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Minus, Plus, Search, ShoppingBag, X } from 'lucide-react';
import type { FrontendDish } from '@/services/api/dishesApi';
import type { FrontendMeal } from '@/services/api/mealsApi';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

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
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingBag className="h-5 w-5 text-emerald-500" />
              {initialData ? '编辑团购套餐 (Edit Meal Plan)' : '新建团购套餐 (Create Meal Plan)'}
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">选择菜品组合，设定价格并分析毛利</p>
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* 左侧：菜品选择 */}
          <div className="w-full md:w-1/2 border-r bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                选择菜品 (Select Dishes)
              </h3>
              <Badge variant="secondary" className="text-xs">
                已选: {selectedDishes.size}
              </Badge>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索菜品名称..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[400px] pr-2">
              <div className="space-y-2">
                {filteredDishes.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">未找到匹配菜品</div>
                ) : (
                  filteredDishes.map((dish) => {
                    const qty = selectedDishes.get(dish.id) || 0;
                    const isSelected = qty > 0;

                    return (
                      <Card
                        key={dish.id}
                        className={`transition-all ${
                          isSelected
                            ? 'border-emerald-500 ring-1 ring-emerald-500'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <CardContent className="p-3">
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
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleDish(dish.id)}
                              className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                            <div className="ml-3 flex flex-1 items-center justify-between">
                              <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                                {dish.name}
                              </span>
                              <div className="flex flex-col items-end">
                                <span className="font-mono text-xs text-muted-foreground">
                                  {dish.price ? `¥${dish.price}` : '-'} /{' '}
                                  <span className="font-bold text-foreground">¥{dish.cost}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="mt-3 flex items-center justify-between border-t pt-2">
                              <span className="text-xs font-medium text-muted-foreground">数量 (Qty):</span>
                              <div className="flex items-center gap-3 rounded-lg bg-muted p-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-rose-50 hover:text-rose-500"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    updateQuantity(dish.id, -1);
                                  }}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-sm font-bold">{qty}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-emerald-50 hover:text-emerald-500"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    updateQuantity(dish.id, 1);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* 右侧：套餐配置 */}
          <div className="w-full md:w-1/2 p-4 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <Label htmlFor="meal-name" className="mb-2 block">
                  套餐名称
                </Label>
                <Input
                  id="meal-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="例如：双人超值烤肉餐"
                />
              </div>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <span className="mb-2 block text-xs text-muted-foreground">已选菜品清单</span>
                  <ScrollArea className="max-h-24 mb-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedDishesList.length > 0 ? (
                        selectedDishesList.map((item) => (
                          <Badge
                            key={item.id}
                            variant="outline"
                            className="bg-background shadow-sm"
                          >
                            {item.name}
                            {item.qty > 1 && (
                              <Badge variant="secondary" className="ml-1 text-[10px] bg-emerald-100 text-emerald-700">
                                x{item.qty}
                              </Badge>
                            )}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">请选择左侧菜品...</span>
                      )}
                    </div>
                  </ScrollArea>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="mb-1 block text-xs text-muted-foreground">组合总原价 (Value)</span>
                      <span className="font-mono text-lg font-bold text-muted-foreground">
                        ¥{totalOriginalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-muted-foreground">组合总成本 (Cost)</span>
                      <span className="font-mono text-lg font-bold">¥{totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {/* 秒杀价 1 */}
                <Card className="relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 h-16 w-16 rounded-bl-full bg-purple-500/10" />
                  <CardContent className="p-4">
                    <Label className="mb-2 block text-sm font-bold text-purple-700">秒杀价 1</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                        <Input
                          type="number"
                          value={promoPrice1}
                          onChange={(event) =>
                            setPromoPrice1(event.target.value === '' ? '' : parseFloat(event.target.value))
                          }
                          className="pl-8 focus-visible:ring-purple-200"
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
                        {promoPrice1 && totalOriginalPrice > 0 && (
                          <Badge variant="secondary" className="bg-purple-50 text-purple-600 text-xs">
                            {calculateDiscount(promoPrice1).toFixed(1)}折
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 官方补贴金额 */}
                <Card className="relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 h-16 w-16 rounded-bl-full bg-amber-500/10" />
                  <CardContent className="p-4">
                    <Label className="mb-2 block text-sm font-bold text-amber-700">官方补贴金额（可选）</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                        <Input
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
                          className="pl-8 focus-visible:ring-amber-200"
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
                              ).toFixed(1)}
                              %
                            </span>
                            <Badge variant="secondary" className="bg-amber-50 text-amber-600 text-xs">
                              官方补贴后毛利率
                            </Badge>
                          </>
                        ) : (
                          <span className="text-sm italic text-muted-foreground">未设置</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 最终到手价 */}
                {promoPrice1 && promoPrice2 !== undefined && promoPrice2 !== '' && (
                  <Card className="border-emerald-200 bg-emerald-50 relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 h-16 w-16 rounded-bl-full bg-emerald-500/10" />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-emerald-700">最终到手价</span>
                          <span className="block text-xs text-muted-foreground">= 秒杀价1 - 官方补贴金额</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-2xl font-bold text-emerald-600">
                            ¥
                            {(
                              (typeof promoPrice1 === 'number' ? promoPrice1 : 0) -
                              (typeof promoPrice2 === 'number' ? promoPrice2 : 0)
                            ).toFixed(2)}
                          </span>
                          <Badge variant="secondary" className="mt-1 bg-emerald-100 text-emerald-600 text-xs">
                            毛利率：
                            {calculateMargin(
                              (typeof promoPrice1 === 'number' ? promoPrice1 : 0) -
                                (typeof promoPrice2 === 'number' ? promoPrice2 : 0)
                            ).toFixed(1)}
                            %
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t bg-muted/30">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="bg-foreground hover:bg-foreground/90"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : initialData ? '更新配置' : '保存套餐配置'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
