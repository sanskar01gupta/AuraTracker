import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { success: false, error: 'An array of Alert IDs is required' },
        { status: 400 }
      );
    }

    const alerts = db.getAlertsByIds(ids);

    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch batch alerts' },
      { status: 500 }
    );
  }
}
