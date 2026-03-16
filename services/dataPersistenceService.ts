import type {
  AppData,
  FrontendPersistentDish,
  FrontendPersistentMealPlan,
  LoadResult,
  ValidationError,
} from '@/types';

export interface SerializableDish {
  id: string;
  name: string;
  cost: number;
  price?: number;
  categoryId?: string;
  categoryName?: string;
}

export interface SerializableMeal {
  id: string;
  name: string;
  dishIds: string[];
  standardPrice: number;
  promoPrice1: number;
  promoPrice2?: number;
  order?: number;
  isSingleDish?: boolean;
  syncDishId?: string;
}

const DATA_VERSION = '1.0.0';

export const exportToJson = (dishes: SerializableDish[], meals: SerializableMeal[]): void => {
  const appData: AppData = {
    version: DATA_VERSION,
    appVersion: '1.0.0',
    savedAt: new Date().toISOString(),
    metadata: {
      totalDishes: dishes.length,
      totalMeals: meals.length,
    },
    data: {
      dishes: dishes.map((dish) => ({ ...dish, _source: 'user' as const })),
      meals: meals.map((meal) => ({ ...meal, _source: 'user' as const })),
    },
  };

  const jsonString = JSON.stringify(appData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `菜品毛利数据_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const validateAppData = (data: unknown): ValidationError[] => {
  const errors: ValidationError[] = [];
  const typedData = data as Partial<AppData>;

  if (!typedData.version) {
    errors.push({
      field: 'version',
      expected: 'string',
      actual: typeof typedData.version,
      message: '缺少数据版本号',
    });
  }

  if (!typedData.data || typeof typedData.data !== 'object') {
    errors.push({
      field: 'data',
      expected: 'object',
      actual: typeof typedData.data,
      message: '缺少 data 字段',
    });
    return errors;
  }

  if (!Array.isArray(typedData.data.dishes)) {
    errors.push({
      field: 'data.dishes',
      expected: 'array',
      actual: typeof typedData.data.dishes,
      message: '菜品数据格式错误',
    });
  }

  if (!Array.isArray(typedData.data.meals)) {
    errors.push({
      field: 'data.meals',
      expected: 'array',
      actual: typeof typedData.data.meals,
      message: '套餐数据格式错误',
    });
  }

  return errors;
};

export const importFromJson = async (file: File): Promise<LoadResult> => {
  try {
    const text = await file.text();
    const jsonData = JSON.parse(text) as AppData;
    const errors = validateAppData(jsonData);

    if (errors.length > 0) {
      return { success: false, errors };
    }

    jsonData.data.meals = jsonData.data.meals.map((meal) => ({
      ...meal,
      promoPrice2: (meal.promoPrice2 || 0) > 0 ? meal.promoPrice2 : undefined,
    }));

    return { success: true, data: jsonData };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          field: 'file',
          expected: 'valid JSON',
          actual: error,
          message: `文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
        },
      ],
    };
  }
};

export const mergeData = (
  initialDishes: SerializableDish[],
  userDishes: FrontendPersistentDish[],
  initialMeals: SerializableMeal[],
  userMeals: FrontendPersistentMealPlan[]
): { dishes: SerializableDish[]; meals: SerializableMeal[] } => {
  const mergedDishes = new Map<string, FrontendPersistentDish>();

  userDishes.forEach((dish) => {
    if (!dish._deleted) {
      mergedDishes.set(dish.id, dish);
    }
  });

  initialDishes.forEach((initialDish) => {
    const matchedUserDish = userDishes.find(
      (dish) => dish._initialId === initialDish.id || dish.id === initialDish.id
    );

    if (!matchedUserDish) {
      mergedDishes.set(initialDish.id, {
        ...initialDish,
        _source: 'initial',
        _initialId: initialDish.id,
      });
    }
  });

  const mergedMeals = new Map<string, FrontendPersistentMealPlan>();

  userMeals.forEach((meal) => {
    if (!meal._deleted) {
      mergedMeals.set(meal.id, meal);
    }
  });

  initialMeals.forEach((initialMeal) => {
    const matchedUserMeal = userMeals.find(
      (meal) => meal._initialId === initialMeal.id || meal.id === initialMeal.id
    );

    if (!matchedUserMeal) {
      mergedMeals.set(initialMeal.id, {
        ...initialMeal,
        _source: 'initial',
        _initialId: initialMeal.id,
      });
    }
  });

  const cleanDishes = Array.from(mergedDishes.values()).map(
    ({ _source, _initialId, _deleted, ...dish }) => dish
  );
  const cleanMeals = Array.from(mergedMeals.values()).map(
    ({ _source, _initialId, _deleted, ...meal }) => meal
  );

  return {
    dishes: cleanDishes,
    meals: cleanMeals,
  };
};
