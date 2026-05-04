import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// PATCH - Use/mark a coupon as used
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.action !== 'use') {
      return NextResponse.json(
        { error: 'Invalid action. Only "use" is supported.' },
        { status: 400 }
      )
    }

    const coupon = await db.coupon.findUnique({ where: { id } })
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: '优惠券已使用' }, { status: 400 })
    }

    if (coupon.usedAt) {
      return NextResponse.json({ error: '优惠券已使用' }, { status: 400 })
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: '优惠券已过期' }, { status: 400 })
    }

    const updatedCoupon = await db.coupon.update({
      where: { id },
      data: {
        isActive: false,
        usedAt: new Date(),
      },
    })

    return NextResponse.json({
      coupon: updatedCoupon,
      message: '优惠券已使用',
    })
  } catch (error) {
    console.error('Failed to update coupon:', error)
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    )
  }
}
