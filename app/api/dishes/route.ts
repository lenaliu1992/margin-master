import { NextResponse } from 'next/server';
import { getAllDishes, createDish } from '@/lib/dishes';
import { getCategories } from '@/lib/categories';
import { CreateDishRequest } from '@/types';

// 获取所有菜品
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('include_deleted') === 'true';
    const search = searchParams.get('search') || undefined;

    const dishes = await getAllDishes({ includeDeleted, search });

    return NextResponse.json({ success: true, data: dishes });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_DISHES_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

// 创建菜品
export async function POST(request: Request) {
  try {
    const data: CreateDishRequest & { category?: string } = await request.json();

    // 验证
    if (!data.name || typeof data.name !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_NAME',
            message: '菜品名称无效',
          },
        },
        { status: 400 }
      );
    }

    if (typeof data.cost !== 'number' || data.cost < 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_COST',
            message: '成本价必须是非负数',
          },
        },
        { status: 400 }
      );
    }

    // 如果提供了category（分类名称），查找对应的category_id
    let categoryId = undefined;
    if (data.category) {
      const categories = await getCategories();
      const category = categories.find((c) => c.name === data.category);
      if (category) {
        categoryId = category.id;
      }
    }

    const dish = await createDish({
      name: data.name,
      cost: data.cost,
      price: data.price,
      category_id: categoryId || data.category_id,
    });

    return NextResponse.json({ success: true, data: dish }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_DISH_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
