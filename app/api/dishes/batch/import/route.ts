import { NextResponse } from 'next/server';
import { batchCreateDishesWithStrategy } from '@/lib/dishes';
import { BatchImportRequest } from '@/types';

export async function POST(request: Request) {
  try {
    const { dishes, strategy = 'skip' }: BatchImportRequest = await request.json();

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

    const result = await batchCreateDishesWithStrategy(dishes, strategy);

    return NextResponse.json(
      {
        success: true,
        data: {
          summary: {
            total: dishes.length,
            created: result.created.length,
            updated: result.updated.length,
            skipped: result.skipped.length,
          },
          ...result,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BATCH_IMPORT_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
