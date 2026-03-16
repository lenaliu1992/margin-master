import { db, ensureDatabaseReady, getCurrentTimestamp } from './db';
import { DishCategory, CreateCategoryRequest, UpdateCategoryRequest } from '@/types';
import { createId } from './id';

// 获取所有分类
export async function getCategories(options: { includeDeleted?: boolean } = {}): Promise<DishCategory[]> {
  await ensureDatabaseReady();

  let sql = 'SELECT * FROM dish_categories';
  const conditions: string[] = [];

  if (!options.includeDeleted) {
    conditions.push('deleted_at IS NULL');
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY sort_order ASC';

  const result = await db.execute(sql);
  return result.rows as unknown as DishCategory[];
}

// 根据 ID 获取分类
export async function getCategoryById(id: string): Promise<DishCategory | null> {
  await ensureDatabaseReady();

  const result = await db.execute({
    sql: 'SELECT * FROM dish_categories WHERE id = ? AND deleted_at IS NULL',
    args: [id],
  });

  return (result.rows[0] as unknown as DishCategory) || null;
}

// 创建分类
export async function createCategory(data: CreateCategoryRequest): Promise<DishCategory> {
  await ensureDatabaseReady();

  const id = createId('cat');
  const now = getCurrentTimestamp();

  // 获取当前最大sort_order
  const maxOrderResult = await db.execute(
    'SELECT MAX(sort_order) as max_order FROM dish_categories WHERE deleted_at IS NULL'
  );
  const maxOrder = (maxOrderResult.rows[0]?.max_order as number) || 0;

  await db.execute({
    sql: `INSERT INTO dish_categories (id, name, icon, color, description, sort_order, created_at, updated_at, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'user')`,
    args: [
      id,
      data.name,
      data.icon || '🍽️',
      data.color || '#6b7280',
      data.description || null,
      maxOrder + 1,
      now,
      now,
    ],
  });

  return (await getCategoryById(id))!;
}

// 更新分类
export async function updateCategory(id: string, data: UpdateCategoryRequest): Promise<DishCategory | null> {
  await ensureDatabaseReady();

  const category = await getCategoryById(id);
  if (!category) {
    return null;
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.icon !== undefined) {
    updates.push('icon = ?');
    params.push(data.icon);
  }
  if (data.color !== undefined) {
    updates.push('color = ?');
    params.push(data.color);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }

  if (updates.length === 0) {
    return category;
  }

  updates.push('updated_at = ?');
  params.push(getCurrentTimestamp());
  params.push(id);

  await db.execute({
    sql: `UPDATE dish_categories SET ${updates.join(', ')} WHERE id = ?`,
    args: params,
  });

  return getCategoryById(id);
}

// 删除分类（软删除）
export async function deleteCategory(id: string, replaceWith?: string): Promise<boolean> {
  await ensureDatabaseReady();

  const category = await getCategoryById(id);
  if (!category) {
    return false;
  }

  // 如果有替换分类，先将使用此分类的菜品迁移到新分类
  if (replaceWith) {
    await db.execute({
      sql: 'UPDATE dishes SET category_id = ?, updated_at = ? WHERE category_id = ?',
      args: [replaceWith, getCurrentTimestamp(), id],
    });
  } else {
    // 检查是否有菜品使用此分类
    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM dishes WHERE category_id = ? AND deleted_at IS NULL',
      args: [id],
    });
    const dishCount = (countResult.rows[0]?.count as number) || 0;

    if (dishCount > 0) {
      throw new Error(`无法删除：还有 ${dishCount} 个菜品使用此分类，请先选择新分类或删除这些菜品`);
    }
  }

  await db.execute({
    sql: 'UPDATE dish_categories SET deleted_at = ? WHERE id = ?',
    args: [getCurrentTimestamp(), id],
  });

  return true;
}

// 重新排序分类
export async function reorderCategories(orders: Array<{ id: string; sort_order: number }>): Promise<void> {
  await ensureDatabaseReady();

  const now = getCurrentTimestamp();

  for (const { id, sort_order } of orders) {
    await db.execute({
      sql: 'UPDATE dish_categories SET sort_order = ?, updated_at = ? WHERE id = ?',
      args: [sort_order, now, id],
    });
  }
}
