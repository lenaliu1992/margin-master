import { NextResponse } from 'next/server';
import { batchCreateDishes } from '@/lib/dishes';
import { CreateDishRequest } from '@/types';

export async function POST(request: Request) {
  try {
    const { dishes }: { dishes: CreateDishRequest[] } = await request.json();

    if (!Array.isArray(dishes)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'dishes 必须是数组',
          },
        },
        { status: 400 }
      );
    }

    const created = await batchCreateDishes(dishes);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BATCH_CREATE_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
