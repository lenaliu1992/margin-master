'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MealCreator } from '@/components/MealCreator';
import { dishesApi, mealsApi } from '@/services/api';
import type { FrontendDish } from '@/services/api/dishesApi';

export default function CreateMealPage() {
  const router = useRouter();
  const [dishes, setDishes] = useState<FrontendDish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dishesApi.getAll().then(setDishes).finally(() => setLoading(false));
  }, []);

  const handleSave = async (meal: Parameters<typeof mealsApi.create>[0]) => {
    await mealsApi.create(meal);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <MealCreator
      dishes={dishes}
      initialData={null}
      onSave={handleSave}
      onCancel={() => router.push('/')}
    />
  );
}
