import { db, ensureDatabaseReady, getCurrentTimestamp } from './db';
import { MealPlan, CreateMealRequest, UpdateMealRequest } from '@/types';
import { getDishById } from './dishes';
import { createId } from './id';

// 获取所有套餐（含菜品详情）
export async function getAllMeals(options: { includeDishes?: boolean; includeDeleted?: boolean } = {}): Promise<MealPlan[]> {
  await ensureDatabaseReady();

  let sql = 'SELECT * FROM meal_plans';
  const conditions: string[] = [];

  if (!options.includeDeleted) {
    conditions.push('deleted_at IS NULL');
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY sort_order';

  const result = await db.execute(sql);
  const meals = result.rows as unknown as MealPlan[];

  if (options.includeDishes !== false && meals.length > 0) {
    // 获取所有套餐的菜品关联
    const mealIds = meals.map((m) => m.id);
    const placeholders = mealIds.map(() => '?').join(',');

    const dishRelationsResult = await db.execute({
      sql: `SELECT meal_id, dish_id FROM meal_dishes
            WHERE meal_id IN (${placeholders})
            ORDER BY meal_id, dish_order`,
      args: mealIds,
    });

    // 构建菜品 ID 映射
    const dishMap = new Map<string, string[]>();
    dishRelationsResult.rows.forEach((rel) => {
      const mealId = rel.meal_id as string;
      const dishId = rel.dish_id as string;
      if (!dishMap.has(mealId)) {
        dishMap.set(mealId, []);
      }
      dishMap.get(mealId)!.push(dishId);
    });

    // 为每个套餐添加 dishIds
    meals.forEach((meal) => {
      meal.dishIds = dishMap.get(meal.id) || [];
    });
  }

  return meals;
}

// 根据 ID 获取套餐
export async function getMealById(id: string): Promise<MealPlan | null> {
  await ensureDatabaseReady();

  const result = await db.execute({
    sql: 'SELECT * FROM meal_plans WHERE id = ? AND deleted_at IS NULL',
    args: [id],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const meal = result.rows[0] as unknown as MealPlan;

  // 获取菜品列表
  const dishRelationsResult = await db.execute({
    sql: 'SELECT dish_id FROM meal_dishes WHERE meal_id = ? ORDER BY dish_order',
    args: [id],
  });

  meal.dishIds = dishRelationsResult.rows.map((rel) => rel.dish_id as string);

  return meal;
}

// 创建套餐
export async function createMeal(data: CreateMealRequest): Promise<MealPlan> {
  await ensureDatabaseReady();

  const id = createId('meal');
  const now = getCurrentTimestamp();

  await db.execute({
    sql: `INSERT INTO meal_plans (id, name, standard_price, promo_price1, promo_price2, sort_order, created_at, updated_at, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'user')`,
    args: [
      id,
      data.name,
      data.standard_price,
      data.promo_price1,
      data.promo_price2 || null,
      data.sort_order || 0,
      now,
      now,
    ],
  });

  // 插入菜品关联
  if (data.dish_ids && data.dish_ids.length > 0) {
    for (let index = 0; index < data.dish_ids.length; index++) {
      const dishId = data.dish_ids[index];
      const relationId = createId('meal_dish');
      await db.execute({
        sql: 'INSERT INTO meal_dishes (id, meal_id, dish_id, dish_order, created_at) VALUES (?, ?, ?, ?, ?)',
        args: [relationId, id, dishId, index, now],
      });
    }
  }

  return (await getMealById(id))!;
}

// 创建单品套餐
export async function createSingleDishMeal(dishId: string, name?: string): Promise<MealPlan | null> {
  await ensureDatabaseReady();

  // 获取菜品信息
  const dish = await getDishById(dishId);
  if (!dish) {
    return null;
  }

  const id = createId('meal');
  const now = getCurrentTimestamp();
  const mealName = name || dish.name;

  // 单品套餐的价格 = 菜品价格
  const standardPrice = dish.price || dish.cost * 1.5;
  const promoPrice1 = dish.cost * 1.2;

  await db.execute({
    sql: `INSERT INTO meal_plans (id, name, standard_price, promo_price1, promo_price2, sort_order, is_single_dish, sync_dish_id, created_at, updated_at, source)
          VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 'user')`,
    args: [
      id,
      mealName,
      standardPrice,
      promoPrice1,
      null,
      0,
      dishId,
      now,
      now,
    ],
  });

  // 插入菜品关联
  const relationId = createId('meal_dish');
  await db.execute({
    sql: 'INSERT INTO meal_dishes (id, meal_id, dish_id, dish_order, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [relationId, id, dishId, 0, now],
  });

  return getMealById(id);
}

// 更新套餐
export async function updateMeal(id: string, data: UpdateMealRequest): Promise<MealPlan | null> {
  await ensureDatabaseReady();

  const meal = await getMealById(id);
  if (!meal) {
    return null;
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.standard_price !== undefined) {
    updates.push('standard_price = ?');
    params.push(data.standard_price);
  }
  if (data.promo_price1 !== undefined) {
    updates.push('promo_price1 = ?');
    params.push(data.promo_price1);
  }
  if (data.promo_price2 !== undefined) {
    updates.push('promo_price2 = ?');
    params.push(data.promo_price2);
  }
  if (data.sort_order !== undefined) {
    updates.push('sort_order = ?');
    params.push(data.sort_order);
  }

  if (updates.length > 0) {
    updates.push('updated_at = ?');
    params.push(getCurrentTimestamp());
    params.push(id);

    await db.execute({
      sql: `UPDATE meal_plans SET ${updates.join(', ')} WHERE id = ?`,
      args: params,
    });
  }

  // 更新菜品关联
  if (data.dish_ids !== undefined) {
    // 删除旧的关联
    await db.execute({
      sql: 'DELETE FROM meal_dishes WHERE meal_id = ?',
      args: [id],
    });

    // 插入新的关联
    const now = getCurrentTimestamp();
    for (let index = 0; index < data.dish_ids.length; index++) {
      const dishId = data.dish_ids[index];
      const relationId = createId('meal_dish');
      await db.execute({
        sql: 'INSERT INTO meal_dishes (id, meal_id, dish_id, dish_order, created_at) VALUES (?, ?, ?, ?, ?)',
        args: [relationId, id, dishId, index, now],
      });
    }
  }

  return getMealById(id);
}

// 删除套餐（软删除）
export async function deleteMeal(id: string): Promise<boolean> {
  await ensureDatabaseReady();

  const meal = await getMealById(id);
  if (!meal) {
    return false;
  }

  await db.execute({
    sql: 'UPDATE meal_plans SET deleted_at = ? WHERE id = ?',
    args: [getCurrentTimestamp(), id],
  });

  return true;
}

// 批量重新排序套餐
export async function reorderMeals(mealOrders: Array<{ id: string; sort_order: number }>): Promise<void> {
  await ensureDatabaseReady();

  const now = getCurrentTimestamp();

  for (const { id, sort_order } of mealOrders) {
    await db.execute({
      sql: 'UPDATE meal_plans SET sort_order = ?, updated_at = ? WHERE id = ?',
      args: [sort_order, now, id],
    });
  }
}
