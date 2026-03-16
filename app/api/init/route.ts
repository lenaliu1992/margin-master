import { NextResponse } from 'next/server';
import { ensureDatabaseReady } from '@/lib/db';

// 初始化数据库表（首次部署时调用）
export async function POST() {
  try {
    await ensureDatabaseReady();
    return NextResponse.json({ success: true, message: '数据库已初始化并准备就绪' });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INIT_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
