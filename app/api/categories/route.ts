import { NextResponse } from 'next/server';
import { getCategories, createCategory, reorderCategories } from '@/lib/categories';
import { CreateCategoryRequest } from '@/types';

// 获取所有分类
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('include_deleted') === 'true';

    const categories = await getCategories({ includeDeleted });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_CATEGORIES_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

// 创建分类
export async function POST(request: Request) {
  try {
    const data: CreateCategoryRequest = await request.json();

    // 验证
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_NAME',
            message: '分类名称不能为空',
          },
        },
        { status: 400 }
      );
    }

    const category = await createCategory({
      name: data.name.trim(),
      icon: data.icon,
      color: data.color,
      description: data.description,
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_CATEGORY_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

// 重新排序
export async function PUT(request: Request) {
  try {
    const { orders } = await request.json();

    if (!Array.isArray(orders)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'orders 必须是数组',
          },
        },
        { status: 400 }
      );
    }

    await reorderCategories(orders);

    return NextResponse.json({ success: true, data: { message: '排序成功' } });
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
