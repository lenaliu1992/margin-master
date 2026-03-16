import { apiClient } from './client';
import { DishCategory, CreateCategoryRequest, UpdateCategoryRequest } from '@/types';

// 前端使用的 Category 类型（camelCase）
export interface FrontendCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  sortOrder: number;
  source?: 'initial' | 'user';
  createdAt?: number;
  updatedAt?: number;
}

// 转换函数：后端 snake_case → 前端 camelCase
function toFrontendCategory(backendCategory: any): FrontendCategory {
  return {
    id: backendCategory.id,
    name: backendCategory.name,
    icon: backendCategory.icon,
    color: backendCategory.color,
    description: backendCategory.description,
    sortOrder: backendCategory.sort_order,
    source: backendCategory.source,
    createdAt: backendCategory.created_at,
    updatedAt: backendCategory.updated_at,
  };
}

// 转换函数：前端 camelCase → 后端 snake_case
function toBackendCategory(frontendCategory: Partial<FrontendCategory>): any {
  const result: any = {};
  if (frontendCategory.name !== undefined) result.name = frontendCategory.name;
  if (frontendCategory.icon !== undefined) result.icon = frontendCategory.icon;
  if (frontendCategory.color !== undefined) result.color = frontendCategory.color;
  if (frontendCategory.description !== undefined) result.description = frontendCategory.description;
  return result;
}

export const categoriesApi = {
  getAll: async (): Promise<FrontendCategory[]> => {
    const categories = await apiClient.get<any[]>('/categories');
    return categories.map(toFrontendCategory);
  },

  getById: async (id: string): Promise<FrontendCategory> => {
    const category = await apiClient.get<any>(`/categories/${id}`);
    return toFrontendCategory(category);
  },

  create: async (data: CreateCategoryRequest): Promise<FrontendCategory> => {
    const category = await apiClient.post<any>('/categories', toBackendCategory(data as any));
    return toFrontendCategory(category);
  },

  update: async (id: string, data: UpdateCategoryRequest): Promise<FrontendCategory> => {
    const category = await apiClient.put<any>(`/categories/${id}`, toBackendCategory(data as any));
    return toFrontendCategory(category);
  },

  delete: async (id: string, replaceWith?: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`, { replace_with: replaceWith });
  },

  reorder: async (orders: Array<{ id: string; sort_order: number }>): Promise<void> => {
    await apiClient.put('/categories', { orders });
  },
};
