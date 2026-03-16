// 菜品类型
export interface Dish {
  id: string;
  name: string;
  cost: number;
  price?: number;
  category_id?: string;
  category_name?: string;
  created_at: number;
  updated_at: number;
  deleted_at?: number;
  source: 'initial' | 'user';
}

// 菜品分类类型
export interface DishCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at?: number;
  source: 'initial' | 'user';
}

// 前端分类数据类型
export interface DishCategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  source: 'initial' | 'user';
}

// 默认分类配置
export const DISH_CATEGORIES: Record<string, { icon: string; color: string; description: string }> = {
  '主食': { icon: '🍚', color: '#10b981', description: '米饭、面食等主食' },
  '青菜': { icon: '🥬', color: '#22c55e', description: '各类蔬菜菜品' },
  '荤菜': { icon: '🍖', color: '#ef4444', description: '肉类菜品' },
  '汤类': { icon: '🍲', color: '#f59e0b', description: '各种汤品' },
  '饮品': { icon: '🥤', color: '#3b82f6', description: '饮料、茶水' },
  '小吃': { icon: '🍢', color: '#8b5cf6', description: '小食、零食' },
  '海鲜': { icon: '🦐', color: '#06b6d4', description: '海鲜类菜品' },
  '其他': { icon: '🍽️', color: '#6b7280', description: '其他菜品' },
};

// 套餐类型
export interface MealPlan {
  id: string;
  name: string;
  standard_price: number;
  promo_price1: number;
  promo_price2?: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at?: number;
  source: 'initial' | 'user';
  dishIds?: string[];
  dishes?: Dish[];
  is_single_dish?: boolean;
  sync_dish_id?: string;
}

// 套餐菜品关联
export interface MealDish {
  id: string;
  meal_id: string;
  dish_id: string;
  dish_order: number;
  created_at: number;
}

// API 响应格式
export interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// 创建菜品请求
export interface CreateDishRequest {
  name: string;
  cost: number;
  price?: number;
  category_id?: string;
}

// 更新菜品请求
export interface UpdateDishRequest {
  name?: string;
  cost?: number;
  price?: number;
  category?: string;
  category_id?: string;
}

// 创建分类请求
export interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

// 更新分类请求
export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
}

// 删除分类请求
export interface DeleteCategoryRequest {
  replace_with?: string;
}

// 创建套餐请求
export interface CreateMealRequest {
  name: string;
  dish_ids: string[];
  standard_price: number;
  promo_price1: number;
  promo_price2?: number;
  sort_order?: number;
}

// 更新套餐请求
export interface UpdateMealRequest {
  name?: string;
  dish_ids?: string[];
  standard_price?: number;
  promo_price1?: number;
  promo_price2?: number;
  sort_order?: number;
}

// 批量排序请求
export interface ReorderMealsRequest {
  meal_orders: Array<{ id: string; sort_order: number }>;
}

// 重复检查结果
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingDish?: Dish;
}

// 批量导入请求
export interface BatchImportRequest {
  dishes: CreateDishRequest[];
  strategy: 'skip' | 'update' | 'create_all';
}

// 批量导入结果
export interface BatchImportResult {
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
  };
  created: Dish[];
  updated: Dish[];
  skipped: string[];
}

// 前端导入导出相关类型
export interface FrontendPersistentDish {
  id: string;
  name: string;
  cost: number;
  price?: number;
  categoryId?: string;
  categoryName?: string;
  _source?: 'initial' | 'user';
  _initialId?: string;
  _deleted?: boolean;
}

export interface FrontendPersistentMealPlan {
  id: string;
  name: string;
  dishIds: string[];
  standardPrice: number;
  promoPrice1: number;
  promoPrice2?: number;
  order?: number;
  isSingleDish?: boolean;
  syncDishId?: string;
  _source?: 'initial' | 'user';
  _initialId?: string;
  _deleted?: boolean;
}

export interface AppData {
  version: string;
  appVersion: string;
  savedAt: string;
  metadata: {
    totalDishes: number;
    totalMeals: number;
  };
  data: {
    dishes: FrontendPersistentDish[];
    meals: FrontendPersistentMealPlan[];
  };
}

export interface ValidationError {
  field: string;
  expected: string;
  actual: unknown;
  message: string;
}

export interface LoadResult {
  success: boolean;
  data?: AppData;
  errors?: ValidationError[];
  warnings?: string[];
}

export interface ImportError {
  type: 'MISSING_DISH' | 'INVALID_DATA' | 'MISSING_REQUIRED_FIELD';
  mealName?: string;
  dishName?: string;
  message: string;
  row?: number;
}

export interface ImportWarning {
  type: 'PRICE_MISMATCH' | 'COST_MISMATCH';
  mealName?: string;
  dishName?: string;
  message: string;
  expected?: number;
  actual?: number;
}

export interface FrontendImportMeal {
  name: string;
  dishIds: string[];
  standardPrice: number;
  promoPrice1: number;
  promoPrice2?: number;
}

export interface ImportResult {
  success: boolean;
  meals: FrontendImportMeal[];
  errors: ImportError[];
  warnings: ImportWarning[];
}
