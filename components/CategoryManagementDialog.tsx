'use client';

import React, { useEffect, useState } from 'react';
import { Check, Edit2, Plus, Settings, Trash2, X } from 'lucide-react';
import { categoriesApi, type FrontendCategory } from '@/services/api/categoriesApi';

interface CategoryManagementDialogProps {
  onClose: () => void;
  onUpdate: () => void | Promise<void>;
}

export function CategoryManagementDialog({ onClose, onUpdate }: CategoryManagementDialogProps) {
  const [categories, setCategories] = useState<FrontendCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [replaceWith, setReplaceWith] = useState('');

  useEffect(() => {
    void loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error: any) {
      alert(`加载分类失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await categoriesApi.create({
        name: newCategoryName.trim(),
        icon: '🍽️',
        color: '#6b7280',
      });
      setNewCategoryName('');
      await loadCategories();
      await onUpdate();
    } catch (error: any) {
      alert(`创建分类失败: ${error.message}`);
    }
  };

  const handleStartEdit = (category: FrontendCategory) => {
    setEditingId(category.id);
    setEditForm({ name: category.name });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name.trim()) return;

    try {
      await categoriesApi.update(editingId, { name: editForm.name.trim() });
      setEditingId(null);
      await loadCategories();
      await onUpdate();
    } catch (error: any) {
      alert(`更新分类失败: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '' });
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await categoriesApi.delete(categoryId, replaceWith || undefined);
      setDeleteConfirm(null);
      setReplaceWith('');
      await loadCategories();
      await onUpdate();
    } catch (error: any) {
      alert(`删除分类失败: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center text-slate-600">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-800">分类管理</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <label className="text-sm font-medium text-slate-700 mb-2 block">新增分类</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入分类名称"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleCreate();
                  }
                }}
              />
              <button
                onClick={() => void handleCreate()}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors group"
              >
                <span className="text-2xl">{category.icon}</span>

                {editingId === category.id ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(event) => setEditForm({ name: event.target.value })}
                    className="flex-1 px-3 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        void handleSaveEdit();
                      }
                    }}
                  />
                ) : (
                  <span className="flex-1 font-medium text-slate-700">{category.name}</span>
                )}

                <span className="text-xs text-slate-500">{category.description || '无描述'}</span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId === category.id ? (
                    <>
                      <button
                        onClick={() => void handleSaveEdit()}
                        className="p-2 hover:bg-emerald-100 text-emerald-600 rounded transition-colors"
                        title="保存"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                        title="取消"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(category)}
                        className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(category.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="删除"
                        disabled={category.source === 'initial'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            完成
          </button>
        </div>
      </div>

      {deleteConfirm && (
        <DeleteCategoryDialog
          categoryId={deleteConfirm}
          categories={categories}
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleteConfirm(null);
            setReplaceWith('');
          }}
          replaceWith={replaceWith}
          onReplaceChange={setReplaceWith}
        />
      )}
    </div>
  );
}

interface DeleteCategoryDialogProps {
  categoryId: string;
  categories: FrontendCategory[];
  onConfirm: (categoryId: string) => void | Promise<void>;
  onCancel: () => void;
  replaceWith: string;
  onReplaceChange: (value: string) => void;
}

function DeleteCategoryDialog({
  categoryId,
  categories,
  onConfirm,
  onCancel,
  replaceWith,
  onReplaceChange,
}: DeleteCategoryDialogProps) {
  const category = categories.find((item) => item.id === categoryId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2">删除分类</h3>
          <p className="text-slate-600 mb-4">
            确定要删除分类 <span className="font-bold">"{category?.name}"</span> 吗？
          </p>

          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              将使用此分类的菜品重新分类到：
            </label>
            <select
              value={replaceWith}
              onChange={(event) => onReplaceChange(event.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- 请选择新分类 --</option>
              {categories
                .filter((item) => item.id !== categoryId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.icon} {item.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => void onConfirm(categoryId)}
              disabled={!replaceWith}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
