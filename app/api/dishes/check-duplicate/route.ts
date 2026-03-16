import { NextResponse } from 'next/server';
import { checkDishDuplicate } from '@/lib/dishes';

export async function POST(request: Request) {
  try {
    const { name, excludeId } = await request.json();

    if (!name || typeof name !== 'string') {
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

    const result = await checkDishDuplicate(name, excludeId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CHECK_DUPLICATE_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
