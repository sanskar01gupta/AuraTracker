import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

/**
 * POST /api/alerts
 * Creates a new alert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_url,
      product_title,
      product_image,
      current_price,
      target_price,
      email,
      notify_stock,
      notify_percentage_drop,
      store_name,
    } = body;

    // Validation
    if (!product_url || !product_title || current_price === undefined || target_price === undefined || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required alert fields' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const newAlert = db.createAlert({
      id,
      product_url,
      product_title,
      product_image: product_image || null,
      current_price: parseFloat(current_price),
      target_price: parseFloat(target_price),
      email,
      status: 'active',
      notify_stock: notify_stock ? 1 : 0,
      notify_percentage_drop: notify_percentage_drop ? 1 : 0,
      store_name: store_name || null,
    });

    return NextResponse.json({
      success: true,
      alert: newAlert,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create alert' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/alerts
 * Updates/Edits an alert
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Alert ID is required for updates' },
        { status: 400 }
      );
    }

    const updatedAlert = db.updateAlert(id, updates);
    if (!updatedAlert) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update alert' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts
 * Deletes an alert
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Alert ID is required for deletion' },
        { status: 400 }
      );
    }

    const success = db.deleteAlert(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Alert not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete alert' },
      { status: 500 }
    );
  }
}
