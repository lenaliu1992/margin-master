import { NextResponse } from 'next/server';
import { getAllMeals, createMeal, reorderMeals } from '@/lib/meals';
import { CreateMealRequest } from '@/types';

// 获取所有套餐
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDishes = searchParams.get('include_dishes') !== 'false';
    const includeDeleted = searchParams.get('include_deleted') === 'true';

    const meals = await getAllMeals({ includeDishes, includeDeleted });

    return NextResponse.json({ success: true, data: meals });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_MEALS_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

// 创建套餐
export async function POST(request: Request) {
  try {
    const data: CreateMealRequest = await request.json();

    // 验证
    if (!data.name || typeof data.name !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_NAME',
            message: '套餐名称无效',
          },
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(data.dish_ids)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DISH_IDS',
            message: 'dish_ids 必须是数组',
          },
        },
        { status: 400 }
      );
    }

    if (typeof data.standard_price !== 'number' || data.standard_price < 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STANDARD_PRICE',
            message: '套餐原价必须是非负数',
          },
        },
        { status: 400 }
      );
    }

    if (typeof data.promo_price1 !== 'number' || data.promo_price1 < 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PROMO_PRICE1',
            message: '秒杀价1必须是非负数',
          },
        },
        { status: 400 }
      );
    }

    const meal = await createMeal(data);

    return NextResponse.json({ success: true, data: meal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_MEAL_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

// 批量重新排序套餐
export async function PUT(request: Request) {
  try {
    const { meal_orders } = await request.json();

    if (!Array.isArray(meal_orders)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'meal_orders 必须是数组',
          },
        },
        { status: 400 }
      );
    }

    await reorderMeals(meal_orders);

    return NextResponse.json({ success: true, data: { message: '排序已更新' } });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REORDER_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
