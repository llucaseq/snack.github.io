import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const promoCodes = await db.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    })
    // Return with frontend-compatible field names
    const normalized = promoCodes.map(pc => ({
      id: pc.id,
      code: pc.code,
      name: pc.name,
      description: pc.description,
      discountPercent: pc.discount,
      maxUsage: pc.maxUsage,
      usedCount: pc.usageCount,
      isActive: pc.isActive,
      createdAt: pc.createdAt,
    }))
    return NextResponse.json(normalized)
  } catch (error) {
    console.error('Failed to fetch promo codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Accept both discountPercent and discount
    const { code, name, description, discount, discountPercent, maxUsage } = body

    const discountValue = discountPercent || discount

    if (!code || !name || discountValue === undefined) {
      return NextResponse.json(
        { error: 'Code, name, and discount are required' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await db.promoCode.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json(
        { error: '优惠码已存在' },
        { status: 409 }
      )
    }

    const promo = await db.promoCode.create({
      data: {
        code,
        name,
        description: description || null,
        discount: parseFloat(String(discountValue)),
        maxUsage: maxUsage ? parseInt(String(maxUsage)) : 100,
      },
    })

    return NextResponse.json({
      ...promo,
      discountPercent: promo.discount,
      usedCount: promo.usageCount,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create promo code:', error)
    return NextResponse.json(
      { error: '创建优惠码失败' },
      { status: 500 }
    )
  }
}
