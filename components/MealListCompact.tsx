'use client';
import React, { useState } from 'react';
import { GripVertical, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 简化的类型定义
interface SimpleDish {
  id: string;
  name: string;
  cost: number;
  price?: number;
}

interface MealPlan {
  id: string;
  name: string;
  dishIds: string[];
  standardPrice: number;
  promoPrice1: number;
  promoPrice2?: number;
  totalCost: number;
  totalOriginalPrice: number;
  standardMargin: number;
  promoMargin1: number;
  standardProfit: number;
  promoProfit1: number;
  finalPrice?: number;
  finalMargin?: number;
  isSingleDish?: boolean;
}

interface MealListCompactProps {
  meals: MealPlan[];
  dishes: SimpleDish[];
  onSelectMeal: (meal: MealPlan) => void;
  onDeleteMeal: (id: string) => void;
  onReorder?: (meals: MealPlan[]) => void;
}

// 可排序的套餐项组件
interface SortableMealItemProps {
  meal: MealPlan;
  dishes: SimpleDish[];
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onSelectMeal: (meal: MealPlan) => void;
  onDeleteMeal: (id: string) => void;
  getMarginClass: (margin: number) => string;
}

function SortableMealItem({
  meal,
  dishes,
  isExpanded,
  onToggleExpand,
  onSelectMeal,
  onDeleteMeal,
  getMarginClass,
}: SortableMealItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: meal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const marginClass = getMarginClass(meal.standardMargin);

  return (
    <div ref={setNodeRef} style={style} className={`meal-item ${isExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''}`}>
      <div className="meal-item-main">
        <div {...attributes} {...listeners} className="meal-drag-handle">
          <GripVertical size={18} className="drag-icon" />
        </div>

        <button className="meal-expand-btn" onClick={() => onToggleExpand(meal.id)}>
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        <div className="meal-info">
          <h3 className="meal-name">
            {meal.name}
            {meal.isSingleDish && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 'normal',
                backgroundColor: '#10b981',
                color: 'white',
                borderRadius: '12px',
                display: 'inline-block'
              }}>
                🍱 单品
              </span>
            )}
          </h3>
          <div className="meal-meta">
            <span className="dish-count">{meal.dishIds.length} 道菜</span>
          </div>
        </div>

        <div className="meal-pricing">
          <div className="price-group">
            <span className="price-label">秒杀价</span>
            <span className="price-value price-accent">¥{meal.promoPrice1}</span>
          </div>
          {meal.promoPrice2 !== undefined && meal.promoPrice2 > 0 && (
            <div className="price-group">
              <span className="price-label">官方补贴</span>
              <span className="price-value price-special">-¥{meal.promoPrice2}</span>
            </div>
          )}
          {meal.finalPrice !== undefined && (
            <div className="price-group">
              <span className="price-label" style={{ color: '#10b981' }}>最终到手</span>
              <span className="price-value" style={{ color: '#10b981', fontWeight: 'bold' }}>
                ¥{meal.finalPrice.toFixed(0)}
              </span>
            </div>
          )}
        </div>

        <div className="meal-margin">
          <div className={`margin-badge margin-${marginClass}`}>
            <span className="margin-label">毛利率</span>
            <span className="margin-value">{meal.standardMargin.toFixed(1)}%</span>
          </div>
          <div className="margin-detail">
            <span className="profit-value">¥{meal.standardProfit.toFixed(0)}</span>
            <span className="profit-label">利润</span>
          </div>
        </div>

        <div className="meal-actions">
          <button onClick={() => onSelectMeal(meal)} className="btn btn-icon btn-ghost" title="编辑">
            <Edit size={16} />
          </button>
          <button onClick={() => onDeleteMeal(meal.id)} className="btn btn-icon btn-ghost btn-danger" title="删除">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="meal-item-details">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">总成本</span>
              <span className="detail-value">¥{meal.totalCost.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">单点原价总计</span>
              <span className="detail-value">¥{meal.totalOriginalPrice.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">秒杀毛利率</span>
              <span className={`detail-value margin-${getMarginClass(meal.promoMargin1)}`}>
                {meal.promoMargin1.toFixed(1)}%
              </span>
            </div>
            {meal.finalMargin !== undefined ? (
              <div className="detail-item">
                <span className="detail-label">最终到手毛利率</span>
                <span className={`detail-value margin-${getMarginClass(meal.finalMargin)}`}>
                  {meal.finalMargin.toFixed(1)}%
                </span>
              </div>
            ) : null}
            <div className="detail-item detail-full">
              <span className="detail-label">包含菜品</span>
              <div className="dish-tags">
                {meal.dishIds.map((dishId) => {
                  const dish = dishes.find(d => d.id === dishId);
                  return (
                    <span key={dishId} className="dish-tag">
                      {dish ? dish.name : `未知菜品 (${dishId})`}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const MealListCompact: React.FC<MealListCompactProps> = ({
  meals,
  dishes,
  onSelectMeal,
  onDeleteMeal,
  onReorder,
}) => {
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = () => setIsDragging(true);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = meals.findIndex((m) => m.id === active.id);
      const newIndex = meals.findIndex((m) => m.id === over.id);
      const newMeals = arrayMove(meals, oldIndex, newIndex);
      if (onReorder) onReorder(newMeals);
    }
    setIsDragging(false);
  };

  const getMarginClass = (margin: number) => {
    if (margin >= 60) return 'success';
    if (margin >= 40) return 'warning';
    return 'danger';
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="meal-list-compact">
        <div className="meal-list-header">
          <div className="header-info">
            <h2>套餐列表</h2>
            <span className="meal-count">{meals.length} 个套餐</span>
          </div>
        </div>

        <div className="meal-list-content">
          {meals.length === 0 ? (
            <div className="empty-state">
              <p>暂无套餐</p>
              <span className="empty-hint">点击上方按钮创建第一个套餐</span>
            </div>
          ) : (
            <SortableContext items={meals.map(m => m.id)} strategy={verticalListSortingStrategy}>
              <div className={`meal-items ${isDragging ? 'dragging' : ''}`}>
                {meals.map((meal) => (
                  <SortableMealItem
                    key={meal.id}
                    meal={meal}
                    dishes={dishes}
                    isExpanded={expandedMealId === meal.id}
                    onToggleExpand={setExpandedMealId}
                    onSelectMeal={onSelectMeal}
                    onDeleteMeal={onDeleteMeal}
                    getMarginClass={getMarginClass}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </DndContext>
  );
};
