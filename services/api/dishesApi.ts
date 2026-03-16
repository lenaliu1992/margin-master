import { apiClient } from './client';
import { Dish, CreateDishRequest, UpdateDishRequest, DuplicateCheckResult, BatchImportResult } from '@/types';

// 前端使用的 Dish 类型（camelCase）
export interface FrontendDish {
  id: string;
  name: string;
  cost: number;
  price?: number;
  categoryId?: string;
  categoryName?: string;
}

// 转换函数：后端 snake_case → 前端 camelCase
function toFrontendDish(backendDish: any): FrontendDish {
  return {
    id: backendDish.id,
    name: backendDish.name,
    cost: backendDish.cost,
    price: backendDish.price,
    categoryId: backendDish.category_id,
    categoryName: backendDish.category_name,
  };
}

// 转换函数：前端 camelCase → 后端 snake_case
function toBackendDish(frontendDish: Partial<FrontendDish>): any {
  const result: any = {};
  if (frontendDish.name !== undefined) result.name = frontendDish.name;
  if (frontendDish.cost !== undefined) result.cost = frontendDish.cost;
  if (frontendDish.price !== undefined) result.price = frontendDish.price;
  if (frontendDish.categoryId !== undefined) result.category_id = frontendDish.categoryId;
  if (frontendDish.categoryName !== undefined) result.category = frontendDish.categoryName;
  return result;
}

export const dishesApi = {
  getAll: async (): Promise<FrontendDish[]> => {
    const dishes = await apiClient.get<any[]>('/dishes');
    return dishes.map(toFrontendDish);
  },

  getById: async (id: string): Promise<FrontendDish> => {
    const dish = await apiClient.get<any>(`/dishes/${id}`);
    return toFrontendDish(dish);
  },

  create: async (data: Partial<FrontendDish>): Promise<FrontendDish> => {
    const dish = await apiClient.post<any>('/dishes', toBackendDish(data));
    return toFrontendDish(dish);
  },

  update: async (id: string, data: Partial<FrontendDish>): Promise<FrontendDish> => {
    const dish = await apiClient.put<any>(`/dishes/${id}`, toBackendDish(data));
    return toFrontendDish(dish);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/dishes/${id}`);
  },

  checkDuplicate: async (name: string, excludeId?: string): Promise<DuplicateCheckResult> => {
    const result = await apiClient.post<DuplicateCheckResult>('/dishes/check-duplicate', {
      name,
      excludeId,
    });
    return result;
  },

  batchCreate: async (dishes: CreateDishRequest[]): Promise<FrontendDish[]> => {
    const result = await apiClient.post<any[]>('/dishes/batch', { dishes });
    return result.map(toFrontendDish);
  },

  batchImport: async (data: { dishes: CreateDishRequest[]; strategy: 'skip' | 'update' | 'create_all' }): Promise<BatchImportResult> => {
    const result = await apiClient.post<BatchImportResult>('/dishes/batch/import', data);
    return result;
  },

  createSingleDishMeal: async (dishId: string, name?: string): Promise<any> => {
    const meal = await apiClient.post<any>(`/dishes/${dishId}/create-single-dish-meal`, { name });
    return meal;
  },
};
