'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Edit, Filter, Package, Plus, Search, Settings, Trash2, Upload, X } from 'lucide-react';
import { CategoryManagementDialog } from './CategoryManagementDialog';
import { categoriesApi, type FrontendCategory } from '@/services/api/categoriesApi';
import { dishesApi, type FrontendDish } from '@/services/api/dishesApi';

interface DishLibraryProps {
  dishes: FrontendDish[];
  onAddDish: (name: string, cost: number, price?: number, category?: string) => void | Promise<void>;
  onDeleteDish: (id: string) => void | Promise<void>;
  onUpdateDish: (id: string, name: string, cost: number, price?: number, category?: string) => void | Promise<void>;
  onSingleDishMealCreated?: () => void | Promise<void>;
  onImportDishes?: () => void;
  importingDishes?: boolean;
}

const DEFAULT_CATEGORIES: FrontendCategory[] = [
  { id: 'cat_1', name: '主食', icon: '🍚', color: '#10b981', sortOrder: 1, source: 'initial' },
  { id: 'cat_2', name: '青菜', icon: '🥬', color: '#22c55e', sortOrder: 2, source: 'initial' },
  { id: 'cat_3', name: '荤菜', icon: '🍖', color: '#ef4444', sortOrder: 3, source: 'initial' },
  { id: 'cat_4', name: '汤类', icon: '🍲', color: '#f59e0b', sortOrder: 4, source: 'initial' },
  { id: 'cat_5', name: '饮品', icon: '🥤', color: '#3b82f6', sortOrder: 5, source: 'initial' },
  { id: 'cat_6', name: '小吃', icon: '🍢', color: '#8b5cf6', sortOrder: 6, source: 'initial' },
  { id: 'cat_7', name: '海鲜', icon: '🦐', color: '#06b6d4', sortOrder: 7, source: 'initial' },
  { id: 'cat_8', name: '其他', icon: '🍽️', color: '#6b7280', sortOrder: 8, source: 'initial' },
];

type SortField = 'price' | 'margin' | null;
type SortDirection = 'desc' | 'asc' | null;

export function DishLibraryNew({
  dishes,
  onAddDish,
  onDeleteDish,
  onUpdateDish,
  onSingleDishMealCreated,
  onImportDishes,
  importingDishes = false,
}: DishLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [categories, setCategories] = useState<FrontendCategory[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', cost: '', price: '', category: '其他' });
  const [selectedDishIds, setSelectedDishIds] = useState<Set<string>>(new Set());
  const [batchCategory, setBatchCategory] = useState('');
  const [newDish, setNewDish] = useState({ name: '', cost: '', price: '', category: '其他' });
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const loadedCategories = await categoriesApi.getAll();
        setCategories(loadedCategories.length > 0 ? loadedCategories : DEFAULT_CATEGORIES);
      } catch {
        setCategories(DEFAULT_CATEGORIES);
      }
    };

    void loadCategories();
  }, []);

  const filteredDishes = useMemo(() => {
    let filtered = dishes;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((dish) => dish.categoryName === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter((dish) => dish.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return filtered;
  }, [dishes, selectedCategory, searchTerm]);

  const calculateMargin = (cost: number, price?: number) => {
    if (!price) return null;
    return ((price - cost) / price) * 100;
  };

  const sortedDishes = useMemo(() => {
    if (!sortField || !sortDirection) {
      return filteredDishes;
    }

    const getSortValue = (dish: FrontendDish) => {
      if (sortField === 'price') {
        return dish.price ?? null;
      }

      return calculateMargin(dish.cost, dish.price);
    };

    return [...filteredDishes].sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);
      const aMissing = aValue === null || aValue === undefined || Number.isNaN(aValue);
      const bMissing = bValue === null || bValue === undefined || Number.isNaN(bValue);

      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (aValue === bValue) return 0;

      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [filteredDishes, sortDirection, sortField]);

  const visibleDishIds = useMemo(() => sortedDishes.map((dish) => dish.id), [sortedDishes]);

  const getMarginStyle = (margin: number) => {
    if (margin >= 60) return 'margin-high';
    if (margin >= 40) return 'margin-medium';
    return 'margin-low';
  };

  const handleSort = (field: Exclude<SortField, null>) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection('desc');
      return;
    }

    if (sortDirection === 'desc') {
      setSortDirection('asc');
      return;
    }

    if (sortDirection === 'asc') {
      setSortField(null);
      setSortDirection(null);
      return;
    }

    setSortDirection('desc');
  };

  const getSortIndicator = (field: Exclude<SortField, null>) => {
    if (sortField !== field || !sortDirection) {
      return '↕';
    }

    return sortDirection === 'desc' ? '↓' : '↑';
  };

  const isAllVisibleSelected = visibleDishIds.length > 0 && visibleDishIds.every((id) => selectedDishIds.has(id));

  const handleBatchUpdateCategory = async () => {
    if (!batchCategory) return;

    await Promise.all(
      Array.from(selectedDishIds).map(async (id) => {
        const dish = dishes.find((item) => item.id === id);
        if (dish) {
          await onUpdateDish(id, dish.name, dish.cost, dish.price, batchCategory);
        }
      })
    );

    setSelectedDishIds(new Set());
    setBatchCategory('');
  };

  const handleStartEdit = (dish: FrontendDish) => {
    setEditingDishId(dish.id);
    setEditForm({
      name: dish.name,
      cost: dish.cost.toString(),
      price: dish.price?.toString() || '',
      category: dish.categoryName || '其他',
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim() || !editForm.cost || !editingDishId) return;

    await onUpdateDish(
      editingDishId,
      editForm.name,
      parseFloat(editForm.cost),
      editForm.price ? parseFloat(editForm.price) : undefined,
      editForm.category
    );

    setEditingDishId(null);
  };

  const handleCancelEdit = () => {
    setEditingDishId(null);
  };

  const handleAddDish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newDish.name.trim() || !newDish.cost) return;

    await onAddDish(
      newDish.name,
      parseFloat(newDish.cost),
      newDish.price ? parseFloat(newDish.price) : undefined,
      newDish.category
    );

    setNewDish({ name: '', cost: '', price: '', category: '其他' });
  };

  const handleCreateSingleDishMeal = async (dish: FrontendDish) => {
    try {
      await dishesApi.createSingleDishMeal(dish.id, dish.name);
      await onSingleDishMealCreated?.();
    } catch (error: any) {
      alert(`创建单品套餐失败：${error.message || '未知错误'}`);
    }
  };

  return (
    <div className="dish-library">
      <div className="library-header">
        <div className="header-title">
          <h2>菜品库</h2>
          <span className="dish-count">共 {dishes.length} 道菜品</span>
        </div>

        <div className="header-actions">
          <button onClick={() => setCategoryModalOpen(true)} className="btn btn-secondary" title="管理分类">
            <Settings size={16} />
            分类设置
          </button>
          <button
            onClick={onImportDishes}
            className="btn btn-secondary"
            title="从 Excel 导入菜品"
            disabled={importingDishes}
          >
            <Upload size={16} />
            {importingDishes ? '导入中...' : '导入菜品'}
          </button>
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="搜索菜品..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="search-input input"
            />
          </div>
        </div>
      </div>

      <div className="library-content">
        <aside className="category-sidebar">
          <div className="category-header">
            <Filter size={18} />
            <span>菜品分类</span>
          </div>

          <div className="category-list">
            <button
              className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span className="category-icon">📋</span>
              <span className="category-name">全部菜品</span>
              <span className="category-count">{dishes.length}</span>
            </button>

            {categories.map((category) => {
              const count = dishes.filter((dish) => dish.categoryName === category.name).length;

              return (
                <button
                  key={category.id}
                  className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="dish-main">
          <div className="quick-add-form card animate-fadeIn">
            <form onSubmit={(event) => void handleAddDish(event)} className="add-form">
              <input
                type="text"
                placeholder="菜品名称"
                value={newDish.name}
                onChange={(event) => setNewDish({ ...newDish, name: event.target.value })}
                className="input input-name"
                required
              />

              <select
                value={newDish.category}
                onChange={(event) => setNewDish({ ...newDish, category: event.target.value })}
                className="input input-category"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="成本"
                value={newDish.cost}
                onChange={(event) => setNewDish({ ...newDish, cost: event.target.value })}
                step="0.01"
                min="0"
                className="input input-cost"
                required
              />

              <input
                type="number"
                placeholder="售价（可选）"
                value={newDish.price}
                onChange={(event) => setNewDish({ ...newDish, price: event.target.value })}
                step="0.01"
                min="0"
                className="input input-price"
              />

              <button type="submit" className="btn btn-primary">
                <Plus size={18} />
                添加
              </button>
            </form>
          </div>

          <div className="dish-table-container card animate-slideIn">
            {selectedDishIds.size > 0 ? (
              <div className="batch-toolbar card animate-fadeIn">
                <div className="batch-toolbar-content">
                  <span className="batch-info">
                    已选择 <strong>{selectedDishIds.size}</strong> 道菜品
                  </span>
                  <div className="batch-actions">
                    <select
                      value={batchCategory}
                      onChange={(event) => setBatchCategory(event.target.value)}
                      className="batch-category-select"
                    >
                      <option value="">选择新分类...</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => void handleBatchUpdateCategory()}
                      disabled={!batchCategory}
                      className="btn btn-primary"
                    >
                      批量修改分类
                    </button>
                    <button onClick={() => setSelectedDishIds(new Set())} className="btn btn-secondary">
                      取消选择
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedDishIds(new Set(visibleDishIds));
                        } else {
                          setSelectedDishIds(new Set());
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th>菜品名称</th>
                  <th>分类</th>
                  <th>成本</th>
                  <th>
                    <button
                      type="button"
                      className={`sortable-header ${sortField === 'price' ? 'active' : ''}`}
                      onClick={() => handleSort('price')}
                    >
                      售价
                      <span className="sort-indicator" aria-hidden="true">
                        {getSortIndicator('price')}
                      </span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className={`sortable-header ${sortField === 'margin' ? 'active' : ''}`}
                      onClick={() => handleSort('margin')}
                    >
                      毛利率
                      <span className="sort-indicator" aria-hidden="true">
                        {getSortIndicator('margin')}
                      </span>
                    </button>
                  </th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedDishes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      <div className="empty-content">
                        <p>暂无菜品数据</p>
                        <span className="empty-hint">请添加菜品或切换分类</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedDishes.map((dish) => {
                    const isEditing = editingDishId === dish.id;
                    const margin = calculateMargin(dish.cost, dish.price);
                    const category = categories.find((item) => item.name === (dish.categoryName || '其他'));

                    return (
                      <tr key={dish.id} className={selectedDishIds.has(dish.id) ? 'selected' : ''}>
                        {isEditing ? (
                          <>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedDishIds.has(dish.id)}
                                onChange={() => {
                                  const nextSelected = new Set(selectedDishIds);
                                  if (nextSelected.has(dish.id)) {
                                    nextSelected.delete(dish.id);
                                  } else {
                                    nextSelected.add(dish.id);
                                  }
                                  setSelectedDishIds(nextSelected);
                                }}
                                className="w-4 h-4 rounded border-gray-300"
                                onClick={(event) => event.stopPropagation()}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                                className="input input-inline"
                                autoFocus
                              />
                            </td>
                            <td>
                              <select
                                value={editForm.category}
                                onChange={(event) => setEditForm({ ...editForm, category: event.target.value })}
                                className="input input-inline"
                              >
                                {categories.map((categoryItem) => (
                                  <option key={categoryItem.id} value={categoryItem.name}>
                                    {categoryItem.icon} {categoryItem.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={editForm.cost}
                                onChange={(event) => setEditForm({ ...editForm, cost: event.target.value })}
                                step="0.01"
                                min="0"
                                className="input input-inline input-number"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={editForm.price}
                                onChange={(event) => setEditForm({ ...editForm, price: event.target.value })}
                                step="0.01"
                                min="0"
                                className="input input-inline input-number"
                                placeholder="可选"
                              />
                            </td>
                            <td>
                              <div className="edit-actions">
                                <button
                                  onClick={() => void handleSaveEdit()}
                                  className="btn btn-icon btn-ghost"
                                  title="保存"
                                >
                                  <Check size={16} />
                                </button>
                                <button onClick={handleCancelEdit} className="btn btn-icon btn-ghost btn-danger" title="取消">
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                            <td />
                          </>
                        ) : (
                          <>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedDishIds.has(dish.id)}
                                onChange={() => {
                                  const nextSelected = new Set(selectedDishIds);
                                  if (nextSelected.has(dish.id)) {
                                    nextSelected.delete(dish.id);
                                  } else {
                                    nextSelected.add(dish.id);
                                  }
                                  setSelectedDishIds(nextSelected);
                                }}
                                className="w-4 h-4 rounded border-gray-300"
                                onClick={(event) => event.stopPropagation()}
                              />
                            </td>
                            <td className="dish-name">{dish.name}</td>
                            <td>
                              <span
                                className="category-badge"
                                style={{
                                  backgroundColor: `${category?.color || '#6b7280'}20`,
                                  color: category?.color || '#6b7280',
                                }}
                              >
                                {category?.icon || '🍽️'} {category?.name || '其他'}
                              </span>
                            </td>
                            <td className="cost">¥{dish.cost.toFixed(2)}</td>
                            <td className="price">{dish.price ? `¥${dish.price.toFixed(2)}` : '-'}</td>
                            <td className="margin">
                              {margin !== null ? (
                                <div className="margin-cell">
                                  <div className={`margin-indicator ${getMarginStyle(margin)}`}>{margin.toFixed(1)}%</div>
                                  <div className="margin-bar">
                                    <div
                                      className="margin-bar-fill"
                                      style={{
                                        width: `${Math.min(margin, 100)}%`,
                                        backgroundColor:
                                          margin >= 60 ? '#10b981' : margin >= 40 ? '#f59e0b' : '#ef4444',
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="actions text-right">
                              <button onClick={() => handleStartEdit(dish)} className="btn btn-icon btn-ghost" title="编辑">
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => void handleCreateSingleDishMeal(dish)}
                                className="btn btn-icon btn-ghost"
                                title="创建单品套餐"
                              >
                                <Package size={16} />
                              </button>
                              <button
                                onClick={() => void onDeleteDish(dish.id)}
                                className="btn btn-icon btn-ghost btn-danger"
                                title="删除"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {categoryModalOpen ? (
        <CategoryManagementDialog
          onClose={() => setCategoryModalOpen(false)}
          onUpdate={async () => {
            const loadedCategories = await categoriesApi.getAll();
            setCategories(loadedCategories.length > 0 ? loadedCategories : DEFAULT_CATEGORIES);
          }}
        />
      ) : null}
    </div>
  );
}
