import { NextResponse } from 'next/server';
import { getCategoryById, updateCategory, deleteCategory } from '@/lib/categories';
import { UpdateCategoryRequest } from '@/types';

// 获取单个分类
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const category = await getCategoryById(id);

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: '分类不存在',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_CATEGORY_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

// 更新分类
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data: UpdateCategoryRequest = await request.json();

    const category = await updateCategory(id, data);

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: '分类不存在',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_CATEGORY_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

// 删除分类
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const replaceWith = body.replace_with as string | undefined;

    const success = await deleteCategory(id, replaceWith);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: '分类不存在',
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
          code: 'DELETE_CATEGORY_FAILED',
          message: error.message,
        },
      },
      { status: 400 }
    );
  }
}
