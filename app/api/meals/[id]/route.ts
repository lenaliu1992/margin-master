import { NextResponse } from 'next/server';
import { getMealById, updateMeal, deleteMeal } from '@/lib/meals';
import { UpdateMealRequest } from '@/types';

// 获取单个套餐
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const meal = await getMealById(id);

    if (!meal) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEAL_NOT_FOUND',
            message: '套餐不存在',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: meal });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_MEAL_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

// 更新套餐
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data: UpdateMealRequest = await request.json();

    // 验证
    if (data.dish_ids !== undefined && !Array.isArray(data.dish_ids)) {
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

    const meal = await updateMeal(id, data);

    if (!meal) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEAL_NOT_FOUND',
            message: '套餐不存在',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: meal });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_MEAL_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

// 删除套餐
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const success = await deleteMeal(id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEAL_NOT_FOUND',
            message: '套餐不存在',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { message: '删除成功' } });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_MEAL_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
