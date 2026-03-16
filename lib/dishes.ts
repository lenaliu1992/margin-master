import { db, ensureDatabaseReady, getCurrentTimestamp } from './db';
import { Dish, CreateDishRequest, UpdateDishRequest, DuplicateCheckResult, BatchImportResult } from '@/types';
import { getCategories } from './categories';
import { createId } from './id';

// 获取所有菜品
export async function getAllDishes(options: { includeDeleted?: boolean; search?: string } = {}): Promise<Dish[]> {
  await ensureDatabaseReady();

  let sql = `
    SELECT
      d.*,
      dc.name as category_name
    FROM dishes d
    LEFT JOIN dish_categories dc ON d.category_id = dc.id AND dc.deleted_at IS NULL
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (!options.includeDeleted) {
    conditions.push('d.deleted_at IS NULL');
  }

  if (options.search) {
    conditions.push('d.name LIKE ?');
    params.push(`%${options.search}%`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY d.name';

  const result = await db.execute({ sql, args: params });
  return result.rows as unknown as unknown as Dish[];
}

// 根据 ID 获取菜品
export async function getDishById(id: string): Promise<Dish | null> {
  await ensureDatabaseReady();

  const result = await db.execute({
    sql: `
      SELECT
        d.*,
        dc.name as category_name
      FROM dishes d
      LEFT JOIN dish_categories dc ON d.category_id = dc.id AND dc.deleted_at IS NULL
      WHERE d.id = ? AND d.deleted_at IS NULL
    `,
    args: [id],
  });

  return (result.rows[0] as unknown as Dish) || null;
}

// 创建菜品
export async function createDish(data: CreateDishRequest): Promise<Dish> {
  await ensureDatabaseReady();

  const id = createId('dish');
  const now = getCurrentTimestamp();

  await db.execute({
    sql: `INSERT INTO dishes (id, name, cost, price, category_id, created_at, updated_at, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'user')`,
    args: [id, data.name, data.cost, data.price || null, data.category_id || null, now, now],
  });

  const dish = await getDishById(id);
  return dish!;
}

// 更新菜品
export async function updateDish(id: string, data: UpdateDishRequest): Promise<Dish | null> {
  await ensureDatabaseReady();

  const dish = await getDishById(id);
  if (!dish) {
    return null;
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.cost !== undefined) {
    updates.push('cost = ?');
    params.push(data.cost);
  }
  if (data.price !== undefined) {
    updates.push('price = ?');
    params.push(data.price);
  }

  // 处理 category 字段（字符串），需要查找对应的 category_id
  if (data.category !== undefined) {
    const categories = await getCategories();
    const category = categories.find((c) => c.name === data.category);

    if (category) {
      updates.push('category_id = ?');
      params.push(category.id);
    } else {
      updates.push('category_id = ?');
      params.push(null);
    }
  }

  // 直接处理 category_id
  if (data.category_id !== undefined) {
    updates.push('category_id = ?');
    params.push(data.category_id);
  }

  if (updates.length === 0) {
    return dish;
  }

  updates.push('updated_at = ?');
  params.push(getCurrentTimestamp());
  params.push(id);

  await db.execute({
    sql: `UPDATE dishes SET ${updates.join(', ')} WHERE id = ?`,
    args: params,
  });

  // 价格自动同步逻辑：如果修改了cost或price，更新所有关联的单品套餐
  if (data.cost !== undefined || data.price !== undefined) {
    await syncSingleDishMealPrices(id, data.cost !== undefined ? data.cost : dish.cost, data.price !== undefined ? data.price : dish.price);
  }

  return getDishById(id);
}

// 同步单品套餐的价格
async function syncSingleDishMealPrices(dishId: string, newCost: number, newPrice?: number): Promise<void> {
  await ensureDatabaseReady();

  const result = await db.execute({
    sql: 'SELECT * FROM meal_plans WHERE is_single_dish = 1 AND sync_dish_id = ? AND deleted_at IS NULL',
    args: [dishId],
  });

  if (result.rows.length === 0) {
    return;
  }

  const standardPrice = newPrice || newCost * 1.5;
  const promoPrice1 = newCost * 1.2;
  const now = getCurrentTimestamp();

  for (const meal of result.rows) {
    await db.execute({
      sql: 'UPDATE meal_plans SET standard_price = ?, promo_price1 = ?, updated_at = ? WHERE id = ?',
      args: [standardPrice, promoPrice1, now, meal.id],
    });
  }
}

// 删除菜品（软删除）
export async function deleteDish(id: string): Promise<boolean> {
  await ensureDatabaseReady();

  const dish = await getDishById(id);
  if (!dish) {
    return false;
  }

  await db.execute({
    sql: 'UPDATE dishes SET deleted_at = ? WHERE id = ?',
    args: [getCurrentTimestamp(), id],
  });

  return true;
}

// 批量创建菜品
export async function batchCreateDishes(data: CreateDishRequest[]): Promise<Dish[]> {
  await ensureDatabaseReady();

  const now = getCurrentTimestamp();
  const dishes: Dish[] = [];

  for (const item of data) {
    const id = createId('dish');
    await db.execute({
      sql: `INSERT INTO dishes (id, name, cost, price, created_at, updated_at, source)
            VALUES (?, ?, ?, ?, ?, ?, 'user')`,
      args: [id, item.name, item.cost, item.price || null, now, now],
    });
    const dish = await getDishById(id);
    if (dish) dishes.push(dish);
  }

  return dishes;
}

// 检查菜品名称是否已存在
export async function checkDishDuplicate(name: string, excludeId?: string): Promise<DuplicateCheckResult> {
  await ensureDatabaseReady();

  const normalizedName = name.trim();
  const allDishes = await getAllDishes({ includeDeleted: false });

  const existing = allDishes.find((d) => {
    if (excludeId && d.id === excludeId) return false;
    return d.name.trim() === normalizedName;
  });

  return {
    isDuplicate: !!existing,
    existingDish: existing,
  };
}

// 批量创建菜品（支持重复处理策略）
export async function batchCreateDishesWithStrategy(
  dishes: CreateDishRequest[],
  strategy: 'skip' | 'update' | 'create_all'
): Promise<Omit<BatchImportResult, 'summary'>> {
  await ensureDatabaseReady();

  const result = {
    created: [] as unknown as unknown as Dish[],
    updated: [] as unknown as unknown as Dish[],
    skipped: [] as string[],
  };

  if (strategy === 'create_all') {
    for (const dishData of dishes) {
      const newDish = await createDish(dishData);
      result.created.push(newDish);
    }
    return result;
  }

  // 批量检查重复
  const allDishes = await getAllDishes({ includeDeleted: false });
  const nameIndex = new Map<string, Dish>();
  allDishes.forEach((dish) => {
    nameIndex.set(dish.name.trim(), dish);
  });

  for (const dishData of dishes) {
    const normalizedName = dishData.name.trim();
    const existing = nameIndex.get(normalizedName);

    if (!existing) {
      const newDish = await createDish(dishData);
      result.created.push(newDish);
    } else if (strategy === 'skip') {
      result.skipped.push(dishData.name);
    } else if (strategy === 'update') {
      const updated = await updateDish(existing.id, dishData);
      if (updated) {
        result.updated.push(updated);
      }
    }
  }

  return result;
}
