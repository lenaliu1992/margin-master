'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MealCreator } from '@/components/MealCreator';
import { dishesApi, mealsApi } from '@/services/api';
import type { FrontendDish } from '@/services/api/dishesApi';
import type { FrontendMeal } from '@/services/api/mealsApi';

function EditMealContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mealId = searchParams.get('id');

  const [dishes, setDishes] = useState<FrontendDish[]>([]);
  const [meal, setMeal] = useState<FrontendMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mealId) {
      setError('缺少套餐 ID');
      setLoading(false);
      return;
    }

    Promise.all([
      dishesApi.getAll(),
      mealsApi.getById(mealId),
    ])
      .then(([d, m]) => {
        setDishes(d);
        setMeal(m);
      })
      .catch((err) => {
        setError(err.message || '加载失败');
      })
      .finally(() => setLoading(false));
  }, [mealId]);

  const handleSave = async (data: Omit<FrontendMeal, 'id'>) => {
    if (mealId) {
      await mealsApi.update(mealId, data);
    }
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="text-red-500">{error || '套餐不存在'}</div>
        <button
          onClick={() => router.push('/')}
          className="text-blue-600 hover:underline"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <MealCreator
      dishes={dishes}
      initialData={meal}
      onSave={handleSave}
      onCancel={() => router.push('/')}
    />
  );
}

export default function EditMealPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    }>
      <EditMealContent />
    </Suspense>
  );
}
