import { NextResponse } from 'next/server';
import { createSingleDishMeal } from '@/lib/meals';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name : undefined;

    const meal = await createSingleDishMeal(id, name);

    if (!meal) {
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

    return NextResponse.json({ success: true, data: meal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_SINGLE_DISH_MEAL_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
