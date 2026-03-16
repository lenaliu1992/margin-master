import type { Client } from '@libsql/client';

const DEFAULT_CATEGORY_ID = 'cat_other';

export const DEFAULT_CATEGORIES = [
  { id: 'cat_main', name: '主食', icon: '🍚', color: '#10b981', description: '米饭、面食等主食', sortOrder: 1 },
  { id: 'cat_veg', name: '青菜', icon: '🥬', color: '#22c55e', description: '各类蔬菜菜品', sortOrder: 2 },
  { id: 'cat_meat', name: '荤菜', icon: '🍖', color: '#ef4444', description: '肉类菜品', sortOrder: 3 },
  { id: 'cat_soup', name: '汤类', icon: '🍲', color: '#f59e0b', description: '各种汤品', sortOrder: 4 },
  { id: 'cat_drink', name: '饮品', icon: '🥤', color: '#3b82f6', description: '饮料、茶水', sortOrder: 5 },
  { id: 'cat_snack', name: '小吃', icon: '🍢', color: '#8b5cf6', description: '小食、零食', sortOrder: 6 },
  { id: 'cat_seafood', name: '海鲜', icon: '🦐', color: '#06b6d4', description: '海鲜类菜品', sortOrder: 7 },
  { id: DEFAULT_CATEGORY_ID, name: '其他', icon: '🍽️', color: '#6b7280', description: '其他菜品', sortOrder: 8 },
] as const;

export const INITIAL_DISHES = [
  { id: '1', name: '馋嘴土豆片', price: 29, cost: 5.8 },
  { id: '2', name: '撒娇辣子鸡', price: 58, cost: 13.85 },
  { id: '3', name: '手打鱼丸', price: 58, cost: 14.75 },
  { id: '4', name: '外婆红烧肉', price: 68, cost: 18.05 },
  { id: '5', name: '云南油焖鸡', price: 68, cost: 19.5 },
  { id: '6', name: '麻辣干锅鸭头', price: 78, cost: 23 },
  { id: '7', name: '手撕包菜', price: 22, cost: 6.6 },
  { id: '8', name: '梅菜扣肉', price: 48, cost: 14.65 },
  { id: '9', name: '静小静炒鸡', price: 68, cost: 21.8 },
  { id: '10', name: '有机花菜', price: 18, cost: 6 },
  { id: '11', name: '泉水玉米饭', price: 3, cost: 1 },
  { id: '12', name: '小炒黄牛肉', price: 58, cost: 19.8 },
  { id: '13', name: '超级海鲜桶（小份）', price: 98, cost: 35.5 },
  { id: '14', name: '海鲜毛血旺（小份）', price: 68, cost: 25 },
  { id: '15', name: '银耳汤', price: 5, cost: 1.85 },
  { id: '16', name: '小米虾滑', price: 38, cost: 14.5 },
  { id: '17', name: '蛋黄焗玉米', price: 22, cost: 8.5 },
  { id: '18', name: '螺丝椒炒云南土腊肠', price: 38, cost: 14.85 },
  { id: '19', name: '黑鸭煲', price: 42, cost: 16.5 },
  { id: '20', name: '辣子鸡', price: 58, cost: 22.8 },
  { id: '21', name: '清蒸蟹（大份）', price: 198, cost: 78 },
  { id: '22', name: '秘制蟹（小份）', price: 105, cost: 41.5 },
  { id: '23', name: '爆炒卤肥肠', price: 56, cost: 22.18 },
  { id: '24', name: '秘制虾尾', price: 108, cost: 42.95 },
  { id: '25', name: '招牌巴厘香蟹（大份）', price: 198, cost: 79.5 },
  { id: '26', name: '山楂小排', price: 68, cost: 27.5 },
  { id: '27', name: '梅干菜烧鸡爪', price: 56, cost: 22.8 },
  { id: '28', name: '蒜蓉粉丝虾', price: 48, cost: 19.55 },
  { id: '29', name: '沸腾鱼（小份）', price: 62, cost: 25.5 },
  { id: '30', name: '秘制蟹（大份）', price: 198, cost: 83 },
  { id: '31', name: '花生煲鸡爪', price: 56, cost: 23.5 },
  { id: '32', name: '金汤肥牛（大份）', price: 98, cost: 41.8 },
  { id: '33', name: '柠檬酸菜鱼（大份）', price: 90, cost: 38.5 },
  { id: '34', name: '清蒸蟹（小份）', price: 105, cost: 45.5 },
  { id: '35', name: '吮指猪蹄', price: 68, cost: 29.8 },
  { id: '36', name: '沸腾鱼（大份）', price: 90, cost: 39.5 },
  { id: '37', name: '超级海鲜桶（大份）', price: 168, cost: 74 },
  { id: '38', name: '脱骨金沙带鱼（小份）', price: 49, cost: 21.75 },
  { id: '39', name: '酱汁笋尖', price: 32, cost: 14.5 },
  { id: '40', name: '胶原海笋', price: 15, cost: 6.85 },
  { id: '41', name: '干锅鹿茸菌', price: 48, cost: 22.5 },
  { id: '42', name: '西红柿炖牛腩', price: 68, cost: 32 },
  { id: '43', name: '黄焖山羊排', price: 78, cost: 36.8 },
  { id: '44', name: '脱骨金沙带鱼（大份）', price: 90, cost: 43.15 },
  { id: '45', name: '泼辣肥牛', price: 78, cost: 39.2 },
  { id: '46', name: '招牌巴厘香蟹（小份）', price: 105, cost: 54 },
  { id: '47', name: '蒜蓉油麦菜', price: 16, cost: 8.35 },
  { id: '48', name: '蒜蓉深海黄鱼', price: 22, cost: 14.45 },
] as const;

export const INITIAL_MEALS = [
  {
    id: 'm1',
    name: '超值双人餐 (示例)',
    dishIds: ['2', '12', '10', '11'],
    standardPrice: 128,
    promoPrice1: 99,
    promoPrice2: 88,
    sortOrder: 0,
  },
] as const;

export async function seedDefaultData(db: Client): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);

  for (const category of DEFAULT_CATEGORIES) {
    await db.execute({
      sql: `INSERT INTO dish_categories (id, name, icon, color, description, sort_order, created_at, updated_at, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'initial')`,
      args: [
        category.id,
        category.name,
        category.icon,
        category.color,
        category.description,
        category.sortOrder,
        timestamp,
        timestamp,
      ],
    });
  }

  for (const dish of INITIAL_DISHES) {
    await db.execute({
      sql: `INSERT INTO dishes (id, name, cost, price, category_id, created_at, updated_at, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'initial')`,
      args: [dish.id, dish.name, dish.cost, dish.price, DEFAULT_CATEGORY_ID, timestamp, timestamp],
    });
  }

  for (const meal of INITIAL_MEALS) {
    await db.execute({
      sql: `INSERT INTO meal_plans (id, name, standard_price, promo_price1, promo_price2, sort_order, created_at, updated_at, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'initial')`,
      args: [
        meal.id,
        meal.name,
        meal.standardPrice,
        meal.promoPrice1,
        meal.promoPrice2,
        meal.sortOrder,
        timestamp,
        timestamp,
      ],
    });

    for (let index = 0; index < meal.dishIds.length; index++) {
      const dishId = meal.dishIds[index];
      await db.execute({
        sql: 'INSERT INTO meal_dishes (id, meal_id, dish_id, dish_order, created_at) VALUES (?, ?, ?, ?, ?)',
        args: [`${meal.id}-${dishId}-${index}`, meal.id, dishId, index, timestamp],
      });
    }
  }
}
