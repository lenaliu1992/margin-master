import { NextResponse } from 'next/server';
import { getDishById, updateDish, deleteDish } from '@/lib/dishes';
import { UpdateDishRequest } from '@/types';

// 获取单个菜品
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dish = await getDishById(id);

    if (!dish) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DISH_NOT_FOUND',
            message: '菜品不存在',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: dish });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_DISH_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

// 更新菜品
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data: UpdateDishRequest = await request.json();

    // 验证
    if (data.cost !== undefined && (typeof data.cost !== 'number' || data.cost < 0)) {
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

    const dish = await updateDish(id, data);

    if (!dish) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DISH_NOT_FOUND',
            message: '菜品不存在',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: dish });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_DISH_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

// 删除菜品
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const success = await deleteDish(id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DISH_NOT_FOUND',
            message: '菜品不存在',
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
          code: 'DELETE_DISH_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
