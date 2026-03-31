import { apiClient } from './client';

// 前端使用的 Meal 类型（camelCase）
export interface FrontendMeal {
  id: string;
  name: string;
  dishIds: string[];
  standardPrice: number;
  promoPrice1: number;
  promoPrice2?: number;
  subsidyCount?: number; // 补贴份数
  order?: number;
  isSingleDish?: boolean;
  syncDishId?: string;
}

// 转换函数：后端 snake_case → 前端 camelCase
function toFrontendMeal(backendMeal: any): FrontendMeal {
  return {
    id: backendMeal.id,
    name: backendMeal.name,
    dishIds: backendMeal.dishIds || backendMeal.dish_ids || [],
    standardPrice: backendMeal.standard_price,
    promoPrice1: backendMeal.promo_price1,
    promoPrice2: backendMeal.promo_price2,
    subsidyCount: backendMeal.subsidy_count,
    order: backendMeal.sort_order,
    isSingleDish: backendMeal.is_single_dish === 1 || backendMeal.is_single_dish === true,
    syncDishId: backendMeal.sync_dish_id,
  };
}

// 转换函数：前端 camelCase → 后端 snake_case
function toBackendMeal(frontendMeal: Partial<FrontendMeal>): any {
  const result: any = {};
  if (frontendMeal.name !== undefined) result.name = frontendMeal.name;
  if (frontendMeal.dishIds !== undefined) result.dish_ids = frontendMeal.dishIds;
  if (frontendMeal.standardPrice !== undefined) result.standard_price = frontendMeal.standardPrice;
  if (frontendMeal.promoPrice1 !== undefined) result.promo_price1 = frontendMeal.promoPrice1;
  if (frontendMeal.promoPrice2 !== undefined) result.promo_price2 = frontendMeal.promoPrice2;
  if (frontendMeal.subsidyCount !== undefined) result.subsidy_count = frontendMeal.subsidyCount;
  if (frontendMeal.order !== undefined) result.sort_order = frontendMeal.order;
  return result;
}

export const mealsApi = {
  getAll: async (): Promise<FrontendMeal[]> => {
    const meals = await apiClient.get<any[]>('/meals');
    return meals.map(toFrontendMeal);
  },

  getById: async (id: string): Promise<FrontendMeal> => {
    const meal = await apiClient.get<any>(`/meals/${id}`);
    return toFrontendMeal(meal);
  },

  create: async (data: Partial<FrontendMeal>): Promise<FrontendMeal> => {
    const meal = await apiClient.post<any>('/meals', toBackendMeal(data));
    return toFrontendMeal(meal);
  },

  update: async (id: string, data: Partial<FrontendMeal>): Promise<FrontendMeal> => {
    const meal = await apiClient.put<any>(`/meals/${id}`, toBackendMeal(data));
    return toFrontendMeal(meal);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/meals/${id}`);
  },

  reorder: async (mealOrders: Array<{ id: string; sort_order: number }>): Promise<void> => {
    await apiClient.put('/meals', { meal_orders: mealOrders });
  },
};
