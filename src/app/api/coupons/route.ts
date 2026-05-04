import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { checkHighRisk } from '@/lib/high-risk'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/coupons?userId=xxx — Get user's coupons
// GET /api/coupons?all=true — Get all coupons (for backup)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const all = searchParams.get('all')

    // If all=true, return all coupons (for backup)
    if (all === 'true') {
      const coupons = await db.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(coupons)
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const coupons = await db.coupon.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const normalized = coupons.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      discountPercent: c.discountPercent,
      minPurchase: c.minPurchase,
      isActive: c.isActive && !c.usedAt && (!c.expiresAt || new Date(c.expiresAt) > new Date()),
      usedAt: c.usedAt ? c.usedAt.toISOString() : null,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    }))

    return NextResponse.json(normalized)
  } catch (error) {
    console.error('Failed to fetch coupons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}

// POST /api/coupons — Multiple actions:
//   { action: 'exchange', userId, exchangeTier } — Exchange points for wallet balance
//   { action: 'blackgold_thankyou', userId } — Create Black Gold thank-you coupon
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, action } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const membershipLevel = user.membershipLevel?.toUpperCase()
    const isBlackgold = membershipLevel === 'BLACKGOLD'
    const isGoldOrAbove = ['GOLD', 'DIAMOND', 'BLACKGOLD'].includes(membershipLevel)

    // ─── Action: Exchange points for wallet balance ────────────────────────
    if (action === 'exchange' || (!action && body.exchangeTier)) {
      const { exchangeTier } = body
      if (!exchangeTier) {
        return NextResponse.json({ error: 'exchangeTier is required' }, { status: 400 })
      }

      // Point exchange tiers — directly add money to wallet
      // Gold/Diamond: 399→50元, 799→120元, 1199→198元
      // Black Gold:   399→60元, 799→144元, 1199→237元
      // Each higher tier gives ~1.1x better value per point
      const goldExchangeTiers: Record<string, { points: number; walletAmount: number; label: string }> = {
        tier1: { points: 399, walletAmount: 50, label: '50元' },
        tier2: { points: 799, walletAmount: 120, label: '120元' },
        tier3: { points: 1199, walletAmount: 198, label: '198元' },
      }
      const blackgoldExchangeTiers: Record<string, { points: number; walletAmount: number; label: string }> = {
        tier1: { points: 399, walletAmount: 60, label: '60元' },
        tier2: { points: 799, walletAmount: 144, label: '144元' },
        tier3: { points: 1199, walletAmount: 237, label: '237元' },
      }

      if (!isGoldOrAbove) {
        return NextResponse.json(
          { error: '积分兑换仅限金会员及以上等级' },
          { status: 403 }
        )
      }

      const tiers = isBlackgold ? blackgoldExchangeTiers : goldExchangeTiers
      const tier = tiers[exchangeTier]
      if (!tier) {
        return NextResponse.json({ error: 'Invalid exchange tier' }, { status: 400 })
      }

      if (user.points < tier.points) {
        return NextResponse.json(
          { error: `积分不足，需要 ${tier.points} 积分，当前 ${user.points} 积分` },
          { status: 400 }
        )
      }

      // Deduct points and add to wallet in transaction
      const updatedUser = await db.$transaction(async (tx) => {
        return await tx.user.update({
          where: { id: userId },
          data: {
            points: user.points - tier.points,
            walletBalance: user.walletBalance + tier.walletAmount,
          },
        })
      })

      // Check high-risk after wallet increase (non-blocking)
      checkHighRisk(userId, tier.walletAmount).catch(() => {})

      return NextResponse.json({
        success: true,
        type: 'wallet',
        pointsDeducted: tier.points,
        walletAdded: tier.walletAmount,
        newBalance: updatedUser.walletBalance,
        newPoints: updatedUser.points,
        message: `兑换成功！消耗 ${tier.points} 积分，¥${tier.walletAmount} 已充入钱包`,
      })
    }

    // ─── Action: Black Gold thank-you coupon ────────────────────────────────
    if (action === 'blackgold_thankyou') {
      if (!isBlackgold) {
        return NextResponse.json(
          { error: '黑金感谢礼仅限黑金会员' },
          { status: 403 }
        )
      }

      // Check if user already has an active thank-you coupon
      const existing = await db.coupon.findFirst({
        where: {
          userId,
          name: '黑金感谢礼',
          isActive: true,
          usedAt: null,
        },
      })
      if (existing) {
        return NextResponse.json(
          { error: '您已有一张未使用的黑金感谢礼优惠券' },
          { status: 400 }
        )
      }

      const couponCode = `BG-THANKS-${Math.floor(1000 + Math.random() * 9000)}`
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const coupon = await db.coupon.create({
        data: {
          userId,
          code: couponCode,
          name: '黑金感谢礼',
          description: '黑金会员消费满100元赠送 - 5.2折优惠',
          discountPercent: 48, // 48% off = 5.2折
          minPurchase: 100,
          isActive: true,
          expiresAt,
        },
      })

      return NextResponse.json({
        success: true,
        type: 'coupon',
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          discountPercent: coupon.discountPercent,
          minPurchase: coupon.minPurchase,
          expiresAt: coupon.expiresAt?.toISOString(),
        },
        message: '获得黑金感谢礼优惠券！5.2折，满¥100可用',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "exchange" or "blackgold_thankyou"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to process coupon action:', error)
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    )
  }
}
