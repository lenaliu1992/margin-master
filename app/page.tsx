'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ChefHat,
  Download,
  FileSpreadsheet,
  Plus,
  Upload,
} from 'lucide-react';
import { DataPersistenceControls } from '@/components/DataPersistenceControls';
import { DishImportResultDialog } from '@/components/DishImportResultDialog';
import { DishImportStrategyDialog } from '@/components/DishImportStrategyDialog';
import { DishLibraryNew } from '@/components/DishLibraryNew';
import { ExportSelectionDialog } from '@/components/ExportSelectionDialog';
import { ImportResultDialog } from '@/components/ImportResultDialog';
import { LoadResultDialog } from '@/components/LoadResultDialog';
import { MealCreator } from '@/components/MealCreator';
import { MealListCompact } from '@/components/MealListCompact';
import { TabNavigation } from '@/components/TabNavigation';
import { dishesApi, mealsApi } from '@/services/api';
import { categoriesApi } from '@/services/api/categoriesApi';
import type { FrontendDish } from '@/services/api/dishesApi';
import type { FrontendMeal } from '@/services/api/mealsApi';
import {
  exportDishLibrary,
  exportMealTemplate,
  exportToExcel,
  importDishesFromExcel,
  importFromExcel,
  type ParsedDishImportResult,
} from '@/services/excelService';
import { exportToJson, importFromJson, mergeData } from '@/services/dataPersistenceService';
import type { ImportResult, LoadResult } from '@/types';

interface MealPlanAnalysis extends FrontendMeal {
  totalCost: number;
  totalOriginalPrice: number;
  standardMargin: number;
  promoMargin1: number;
  promoMargin2?: number;
  standardProfit: number;
  promoProfit1: number;
  promoProfit2?: number;
  finalPrice?: number;
  finalMargin?: number;
}

interface DishImportDialogResult {
  success: boolean;
  dishCount: number;
  errors: string[];
}

function calcMargin(price: number, cost: number) {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dishes, setDishes] = useState<FrontendDish[]>([]);
  const [meals, setMeals] = useState<FrontendMeal[]>([]);
  const [activeTab, setActiveTab] = useState<'dishes' | 'meals'>('dishes');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<FrontendMeal | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isImportingDishes, setIsImportingDishes] = useState(false);

  const [importDialog, setImportDialog] = useState<{ show: boolean; result: ImportResult | null }>({
    show: false,
    result: null,
  });
  const [loadResult, setLoadResult] = useState<{ result: LoadResult; fileName: string } | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [dishImportResult, setDishImportResult] = useState<DishImportDialogResult | null>(null);
  const [importStrategyDialog, setImportStrategyDialog] = useState<{
    show: boolean;
    duplicateCount: number;
    newCount: number;
    parsedData: ParsedDishImportResult | null;
  }>({
    show: false,
    duplicateCount: 0,
    newCount: 0,
    parsedData: null,
  });

  useEffect(() => {
    void loadFromApi();
  }, []);

  const loadFromApi = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dishesData, mealsData] = await Promise.all([dishesApi.getAll(), mealsApi.getAll()]);
      setDishes(dishesData);
      setMeals(mealsData);
      return { dishesData, mealsData };
    } catch (err: any) {
      console.error('加载数据失败:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const analyzedMeals: MealPlanAnalysis[] = useMemo(() => {
    const sortedMeals = [...meals].sort((a, b) => {
      const orderA = a.order ?? 9999;
      const orderB = b.order ?? 9999;
      return orderA - orderB;
    });

    return sortedMeals.map((meal) => {
      let totalCost = 0;
      let totalOriginalPrice = 0;

      meal.dishIds.forEach((id) => {
        const dish = dishes.find((item) => item.id === id);
        if (dish) {
          totalCost += dish.cost || 0;
          totalOriginalPrice += dish.price || 0;
        }
      });

      const normalizedPromoPrice2 = (meal.promoPrice2 || 0) > 0 ? meal.promoPrice2 : undefined;
      const effectiveStandardPrice = meal.standardPrice > 0 ? meal.standardPrice : totalOriginalPrice;
      const finalPrice = normalizedPromoPrice2 !== undefined ? meal.promoPrice1 - normalizedPromoPrice2 : undefined;

      return {
        ...meal,
        totalCost,
        totalOriginalPrice,
        standardProfit: effectiveStandardPrice - totalCost,
        standardMargin: calcMargin(effectiveStandardPrice, totalCost),
        promoProfit1: meal.promoPrice1 - totalCost,
        promoMargin1: calcMargin(meal.promoPrice1, totalCost),
        promoProfit2: finalPrice !== undefined ? finalPrice - totalCost : undefined,
        promoMargin2: finalPrice !== undefined ? calcMargin(finalPrice, totalCost) : undefined,
        promoPrice2: normalizedPromoPrice2,
        finalPrice,
        finalMargin: finalPrice !== undefined ? calcMargin(finalPrice, totalCost) : undefined,
      };
    });
  }, [meals, dishes]);

  const markDirty = () => setHasUnsavedChanges(true);

  const handleAddDish = async (name: string, cost: number, price?: number, category?: string) => {
    try {
      const newDish = await dishesApi.create({ name, cost, price, categoryName: category });
      setDishes([newDish, ...dishes]);
      markDirty();
    } catch (err: any) {
      alert(`创建菜品失败: ${err.message}`);
    }
  };

  const handleDeleteDish = async (id: string) => {
    if (meals.some((meal) => meal.dishIds.includes(id))) {
      alert('无法删除：该菜品已被包含在现有套餐中，请先修改或删除对应套餐。');
      return;
    }

    try {
      await dishesApi.delete(id);
      setDishes(dishes.filter((dish) => dish.id !== id));
      markDirty();
    } catch (err: any) {
      alert(`删除菜品失败: ${err.message}`);
    }
  };

  const handleUpdateDish = async (id: string, name: string, cost: number, price?: number, category?: string) => {
    try {
      const updatedDish = await dishesApi.update(id, { name, cost, price, categoryName: category });
      setDishes(dishes.map((dish) => (dish.id === id ? updatedDish : dish)));
      markDirty();
    } catch (err: any) {
      alert(`更新菜品失败: ${err.message}`);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!window.confirm('确定要删除这个套餐方案吗?')) return;

    try {
      await mealsApi.delete(id);
      setMeals(meals.filter((meal) => meal.id !== id));
      markDirty();
    } catch (err: any) {
      alert(`删除套餐失败: ${err.message}`);
    }
  };

  const handleReorder = async (newMeals: MealPlanAnalysis[]) => {
    const reorderedMeals: FrontendMeal[] = newMeals.map((meal, index) => ({
      id: meal.id,
      name: meal.name,
      dishIds: meal.dishIds,
      standardPrice: meal.standardPrice,
      promoPrice1: meal.promoPrice1,
      promoPrice2: meal.promoPrice2,
      order: index,
      isSingleDish: meal.isSingleDish,
      syncDishId: meal.syncDishId,
    }));

    setMeals(reorderedMeals);

    try {
      await mealsApi.reorder(reorderedMeals.map((meal, index) => ({ id: meal.id, sort_order: index })));
      markDirty();
    } catch (err: any) {
      alert(`排序失败: ${err.message}`);
    }
  };

  const closeCreator = () => {
    setIsCreatorOpen(false);
    setEditingMeal(null);
  };

  const handleSaveMeal = async (mealData: Omit<FrontendMeal, 'id'>) => {
    try {
      if (editingMeal) {
        const updatedMeal = await mealsApi.update(editingMeal.id, mealData);
        setMeals(meals.map((meal) => (meal.id === editingMeal.id ? updatedMeal : meal)));
      } else {
        const newMeal = await mealsApi.create(mealData);
        setMeals([newMeal, ...meals]);
      }
      markDirty();
      closeCreator();
    } catch (err: any) {
      alert(`保存套餐失败: ${err.message}`);
    }
  };

  const handleSingleDishMealCreated = async () => {
    const result = await loadFromApi();
    if (result) {
      markDirty();
    }
  };

  const openCreatorForEdit = (meal: MealPlanAnalysis) => {
    setEditingMeal({
      id: meal.id,
      name: meal.name,
      dishIds: meal.dishIds,
      standardPrice: meal.standardPrice,
      promoPrice1: meal.promoPrice1,
      promoPrice2: meal.promoPrice2,
      order: meal.order,
      isSingleDish: meal.isSingleDish,
      syncDishId: meal.syncDishId,
    });
    setIsCreatorOpen(true);
  };

  const handleExport = () => {
    if (analyzedMeals.length === 0) {
      alert('没有套餐数据可以导出，请先创建套餐');
      return;
    }
    setExportDialogOpen(true);
  };

  const handleExportSelected = (selectedMeals: Array<{ id: string }>) => {
    if (selectedMeals.length === 0) {
      alert('请至少选择一个套餐');
      return;
    }

    try {
      const selectedMealIds = new Set(selectedMeals.map((meal) => meal.id));
      const mealsToExport = analyzedMeals.filter((meal) => selectedMealIds.has(meal.id));
      exportToExcel(mealsToExport, dishes);
      setExportDialogOpen(false);
    } catch (error) {
      alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleImportMeals = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await importFromExcel(file, dishes);
    setImportDialog({ show: true, result });

    if (result.success && result.meals.length > 0) {
      try {
        for (const meal of result.meals) {
          await mealsApi.create({
            name: meal.name,
            dishIds: meal.dishIds,
            standardPrice: meal.standardPrice,
            promoPrice1: meal.promoPrice1,
            promoPrice2: meal.promoPrice2,
            order: 0,
          });
        }
        await loadFromApi();
        markDirty();
      } catch (err: any) {
        alert(`导入套餐失败: ${err.message}`);
      }
    }

    event.target.value = '';
  };

  const handleSaveData = () => {
    exportToJson(
      dishes.map((dish) => ({
        id: dish.id,
        name: dish.name,
        cost: dish.cost,
        price: dish.price,
        categoryId: dish.categoryId,
        categoryName: dish.categoryName,
      })),
      meals.map((meal) => ({
        id: meal.id,
        name: meal.name,
        dishIds: meal.dishIds,
        standardPrice: meal.standardPrice,
        promoPrice1: meal.promoPrice1,
        promoPrice2: meal.promoPrice2,
        order: meal.order,
        isSingleDish: meal.isSingleDish,
        syncDishId: meal.syncDishId,
      }))
    );
    setHasUnsavedChanges(false);
  };

  const ensureCategoriesForImport = async (importedDishes: Array<{ categoryName?: string }>) => {
    const existingCategories = await categoriesApi.getAll();
    const existingNames = new Set(existingCategories.map((category) => category.name.trim()));
    const categoryNames = Array.from(
      new Set(
        importedDishes
          .map((dish) => dish.categoryName?.trim())
          .filter((name): name is string => Boolean(name))
      )
    );

    for (const name of categoryNames) {
      if (!existingNames.has(name)) {
        await categoriesApi.create({ name, icon: '🍽️', color: '#6b7280' });
        existingNames.add(name);
      }
    }
  };

  const replaceAllData = async (
    importedDishes: Array<{
      id: string;
      name: string;
      cost: number;
      price?: number;
      categoryId?: string;
      categoryName?: string;
    }>,
    importedMeals: Array<{
      id: string;
      name: string;
      dishIds: string[];
      standardPrice: number;
      promoPrice1: number;
      promoPrice2?: number;
      order?: number;
      isSingleDish?: boolean;
      syncDishId?: string;
    }>
  ) => {
    await ensureCategoriesForImport(importedDishes);

    for (const meal of meals) {
      await mealsApi.delete(meal.id);
    }

    for (const dish of dishes) {
      await dishesApi.delete(dish.id);
    }

    const dishIdMap = new Map<string, string>();

    for (const dish of importedDishes) {
      const createdDish = await dishesApi.create({
        name: dish.name,
        cost: dish.cost,
        price: dish.price,
        categoryId: dish.categoryId,
        categoryName: dish.categoryName,
      });
      dishIdMap.set(dish.id, createdDish.id);
    }

    for (const [index, meal] of importedMeals.entries()) {
      const remappedDishIds = meal.dishIds.map((dishId) => dishIdMap.get(dishId)).filter(Boolean) as string[];

      if (remappedDishIds.length !== meal.dishIds.length) {
        throw new Error(`套餐 "${meal.name}" 中有菜品无法匹配`);
      }

      await mealsApi.create({
        name: meal.name,
        dishIds: remappedDishIds,
        standardPrice: meal.standardPrice,
        promoPrice1: meal.promoPrice1,
        promoPrice2: meal.promoPrice2,
        order: meal.order ?? index,
      });
    }

    await loadFromApi();
  };

  const handleLoadData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await importFromJson(file);
    setLoadResult({ result, fileName: file.name });

    if (result.success && result.data) {
      try {
        const merged = mergeData([], result.data.data.dishes, [], result.data.data.meals);
        await replaceAllData(merged.dishes, merged.meals);
        setHasUnsavedChanges(false);
      } catch (err: any) {
        alert(`加载数据失败: ${err.message}`);
      }
    }

    event.target.value = '';
  };

  const executeDishImport = async (
    newDishes: ParsedDishImportResult['dishes'],
    strategy: 'skip' | 'update' | 'create_all',
    duplicates: ParsedDishImportResult['duplicates']
  ) => {
    try {
      const payload = [
        ...newDishes.map((dish) => ({ name: dish.name, cost: dish.cost, price: dish.price })),
        ...(strategy === 'update' || strategy === 'create_all'
          ? duplicates.map((dish) => ({
              name: dish.new.name,
              cost: dish.new.cost,
              price: dish.new.price,
            }))
          : []),
      ];

      await dishesApi.batchImport({ dishes: payload, strategy });
      const loaded = await loadFromApi();
      setDishImportResult({
        success: true,
        dishCount: loaded?.dishesData.length ?? payload.length,
        errors: [],
      });
      markDirty();
    } catch (err: any) {
      setDishImportResult({
        success: false,
        dishCount: 0,
        errors: [`导入失败: ${err.message || '未知错误'}`],
      });
    }
  };

  const handleImportDishes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImportingDishes(true);
    setDishImportResult(null);

    try {
      const result = await importDishesFromExcel(file, dishes);

      if (!result.success || result.dishes.length === 0) {
        setDishImportResult({
          success: false,
          dishCount: 0,
          errors: result.errors,
        });
        return;
      }

      if (result.duplicates.length > 0) {
        setImportStrategyDialog({
          show: true,
          duplicateCount: result.duplicates.length,
          newCount: result.dishes.length,
          parsedData: result,
        });
        return;
      }

      await executeDishImport(result.dishes, 'skip', result.duplicates);
    } catch (err: any) {
      setDishImportResult({
        success: false,
        dishCount: 0,
        errors: [`导入过程发生错误: ${err.message || '未知错误'}`],
      });
    } finally {
      setIsImportingDishes(false);
      event.target.value = '';
    }
  };

  const handleImportStrategySelect = async (strategy: 'skip' | 'update' | 'create_all') => {
    if (!importStrategyDialog.parsedData) return;

    const { dishes: parsedDishes, duplicates } = importStrategyDialog.parsedData;
    setImportStrategyDialog({ show: false, duplicateCount: 0, newCount: 0, parsedData: null });
    await executeDishImport(parsedDishes, strategy, duplicates);
  };

  const handleExportDishes = () => {
    if (dishes.length === 0) {
      alert('没有菜品数据可以导出，请先添加菜品');
      return;
    }
    try {
      exportDishLibrary(dishes);
    } catch (error) {
      alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" />
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-500">加载失败: {error}</p>
            <button onClick={() => void loadFromApi()} className="btn btn-primary mt-4">
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <ChefHat className="logo-icon" size={32} />
          </div>
          <div className="header-title">
            <h1>MarginMaster</h1>
            <p>餐饮团购毛利测算系统</p>
          </div>
        </div>

        <div className="header-right">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-600 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">导出套餐数据</span>
          </button>

          <button
            onClick={() => document.getElementById('excel-upload-input')?.click()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-600 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">导入套餐数据</span>
          </button>

          <input
            id="excel-upload-input"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportMeals}
          />

          <button
            onClick={exportMealTemplate}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-cyan-600 hover:border-cyan-600 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>下载模板</span>
          </button>

          <DataPersistenceControls
            hasUnsavedChanges={hasUnsavedChanges}
            onSave={handleSaveData}
            onLoad={handleLoadData}
          />

          {activeTab === 'meals' ? (
            <button
              onClick={() => {
                setEditingMeal(null);
                setIsCreatorOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>新建套餐</span>
            </button>
          ) : null}
        </div>
      </header>

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dishCount={dishes.length}
        mealCount={analyzedMeals.length}
      />

      <main className="main-content">
        {activeTab === 'dishes' ? (
          <div className="tab-content dishes-tab">
            <input
              id="dish-import-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportDishes}
            />
            <DishLibraryNew
              dishes={dishes}
              onAddDish={handleAddDish}
              onDeleteDish={handleDeleteDish}
              onUpdateDish={handleUpdateDish}
              onSingleDishMealCreated={handleSingleDishMealCreated}
              onImportDishes={() => document.getElementById('dish-import-input')?.click()}
              onExportDishes={handleExportDishes}
              importingDishes={isImportingDishes}
            />
          </div>
        ) : (
          <div className="tab-content meals-tab">
            <MealListCompact
              meals={analyzedMeals}
              dishes={dishes}
              onSelectMeal={openCreatorForEdit}
              onDeleteMeal={handleDeleteMeal}
              onReorder={handleReorder}
            />
          </div>
        )}
      </main>

      {isCreatorOpen ? (
        <MealCreator
          dishes={dishes}
          initialData={editingMeal}
          onSave={handleSaveMeal}
          onCancel={closeCreator}
        />
      ) : null}

      {importDialog.show && importDialog.result ? (
        <ImportResultDialog
          result={importDialog.result}
          onClose={() => setImportDialog({ show: false, result: null })}
        />
      ) : null}

      {loadResult ? (
        <LoadResultDialog
          result={loadResult.result}
          fileName={loadResult.fileName}
          onClose={() => setLoadResult(null)}
        />
      ) : null}

      {dishImportResult ? (
        <DishImportResultDialog
          success={dishImportResult.success}
          dishCount={dishImportResult.dishCount}
          errors={dishImportResult.errors}
          onClose={() => setDishImportResult(null)}
        />
      ) : null}

      {importStrategyDialog.show && importStrategyDialog.parsedData ? (
        <DishImportStrategyDialog
          duplicateCount={importStrategyDialog.duplicateCount}
          newCount={importStrategyDialog.newCount}
          onSelect={handleImportStrategySelect}
          onCancel={() =>
            setImportStrategyDialog({ show: false, duplicateCount: 0, newCount: 0, parsedData: null })
          }
        />
      ) : null}

      {exportDialogOpen ? (
        <ExportSelectionDialog
          meals={analyzedMeals}
          dishes={dishes}
          onExport={handleExportSelected}
          onClose={() => setExportDialogOpen(false)}
        />
      ) : null}
    </div>
  );
}
