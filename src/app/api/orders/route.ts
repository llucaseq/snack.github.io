import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Get ISO week string like "2025-W26"
function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const orderNumber = searchParams.get('orderNumber')

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (orderNumber) where.orderNumber = orderNumber

    const orders = await db.order.findMany({
      where,
      include: {
        product: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // If searching by orderNumber, return the first match as a single object
    if (orderNumber && orders.length > 0) {
      const order = orders[0]
      const deliveryDetail = buildDeliveryDetail(order)
      return NextResponse.json({
        id: order.id,
        orderNumber: order.orderNumber,
        productId: order.productId,
        productName: order.product.name,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod.toLowerCase(),
        deliveryMethod: order.deliveryMethod.toLowerCase().replace(/_/g, '-'),
        deliveryDetail,
        contactName: order.realName,
        contactEmail: order.email,
        contactPhone: order.phone,
        notes: order.notes,
        status: order.status,
        promoCode: order.promoCode,
        couponId: order.couponId,
        createdAt: order.createdAt,
      })
    }

    if (orderNumber && orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(orders.map(o => ({
      ...o,
      membershipLevel: o.user?.membershipLevel?.toLowerCase(),
    })))
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

function buildDeliveryDetail(order: any): string | undefined {
  if (order.deliveryMethod === 'ONE_TO_ONE' && order.classGroup && order.studentNumber) {
    return `${order.classGroup}班 ${order.studentNumber}号 一对一急送`
  }
  if (order.deliveryMethod === 'SCHEDULED' && order.pickupDate && order.pickupTime) {
    return `${order.pickupDate} ${order.pickupTime} 预约取货`
  }
  if (order.deliveryMethod === 'FIXED') {
    return '楼梯间取货'
  }
  return undefined
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      productId,
      quantity,
      paymentMethod,
      deliveryMethod,
      deliveryDetail,
      promoCode,
      couponId,
      contactName,
      contactEmail,
      contactPhone,
      notes,
    } = body

    if (!userId || !productId || !contactName || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { error: 'userId, productId, contactName, contactEmail, and contactPhone are required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user's purchase ability is disabled
    if (user.purchaseDisabled) {
      return NextResponse.json(
        { error: '你的购买权限已被暂停，请联系管理员' },
        { status: 403 }
      )
    }

    // Verify product exists and get price
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const qty = quantity ? parseInt(String(quantity)) : 1

    // Check stock availability
    if (product.stock < qty) {
      return NextResponse.json(
        { error: `库存不足，当前仅剩 ${product.stock} 件` },
        { status: 400 }
      )
    }

    // Normalize payment method to uppercase
    const payMethod = (paymentMethod || 'online').toUpperCase()
    // Normalize delivery method
    const delivMethod = (deliveryMethod || 'fixed').toUpperCase().replace(/-/g, '_')

    // If deliveryMethod is ONE_TO_ONE, verify user is DIAMOND or BLACKGOLD
    if (delivMethod === 'ONE_TO_ONE' && user.membershipLevel !== 'DIAMOND' && user.membershipLevel !== 'BLACKGOLD') {
      return NextResponse.json(
        { error: '一对一急送仅限钻石和黑金会员使用' },
        { status: 403 }
      )
    }

    let basePrice = product.price * qty
    let discount = 0
    let discountSource = ''

    // Apply membership 88-discount (Gold: Friday only, Diamond: any day 2x/week, BlackGold: any day 4x/week)
    const membershipLevel = user.membershipLevel?.toUpperCase()
    const today = new Date()
    const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    const isoWeek = getISOWeek(today)

    // Reset weekly counter if new week
    if (user.discountUsedWeek !== isoWeek) {
      await db.user.update({
        where: { id: userId },
        data: { discountUsedWeek: isoWeek, discountUsedCount: 0 },
      })
      user.discountUsedCount = 0
      user.discountUsedWeek = isoWeek
    }

    if (membershipLevel === 'BLACKGOLD' && user.discountUsedCount < 4) {
      // BlackGold: 4x per week, any day
      discount = basePrice * 0.12
      discountSource = '黑金会员88折'
      await db.user.update({
        where: { id: userId },
        data: { discountUsedCount: user.discountUsedCount + 1 },
      })
    } else if (membershipLevel === 'DIAMOND' && user.discountUsedCount < 2) {
      // Diamond: 2x per week, any day
      discount = basePrice * 0.12
      discountSource = '钻石会员88折'
      await db.user.update({
        where: { id: userId },
        data: { discountUsedCount: user.discountUsedCount + 1 },
      })
    } else if (membershipLevel === 'GOLD' && dayOfWeek === 5) {
      // Gold: Friday only
      discount = basePrice * 0.12
      discountSource = '金会员星期五88折'
    }

    // Apply promo code if provided (stacks on top)
    if (promoCode) {
      const promo = await db.promoCode.findUnique({ where: { code: promoCode } })
      if (promo && promo.isActive && promo.usageCount < promo.maxUsage) {
        const promoDiscount = (basePrice - discount) * (promo.discount / 100)
        discount += promoDiscount
        discountSource += (discountSource ? ' + ' : '') + `优惠码${promo.code}`
        await db.promoCode.update({
          where: { id: promo.id },
          data: { usageCount: promo.usageCount + 1 },
        })
      }
    }

    // Apply coupon if provided (applies discountPercent on remaining price after membership discount)
    let appliedCouponId: string | null = null
    if (couponId) {
      const coupon = await db.coupon.findUnique({ where: { id: couponId } })
      if (!coupon) {
        return NextResponse.json(
          { error: '优惠券不存在' },
          { status: 400 }
        )
      }
      if (coupon.userId !== userId) {
        return NextResponse.json(
          { error: '优惠券不属于当前用户' },
          { status: 403 }
        )
      }
      if (!coupon.isActive) {
        return NextResponse.json(
          { error: '优惠券已使用' },
          { status: 400 }
        )
      }
      if (coupon.usedAt) {
        return NextResponse.json(
          { error: '优惠券已使用' },
          { status: 400 }
        )
      }
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return NextResponse.json(
          { error: '优惠券已过期' },
          { status: 400 }
        )
      }

      const priceAfterMembershipDiscount = basePrice - discount

      // Check minimum purchase
      if (coupon.minPurchase > 0 && priceAfterMembershipDiscount < coupon.minPurchase) {
        return NextResponse.json(
          { error: `未达到优惠券最低消费 ${coupon.minPurchase} 元` },
          { status: 400 }
        )
      }

      const couponDiscount = priceAfterMembershipDiscount * (coupon.discountPercent / 100)
      discount += couponDiscount
      discountSource += (discountSource ? ' + ' : '') + `${coupon.name}(${coupon.discountPercent}% off)`
      appliedCouponId = coupon.id
    }

    const totalPrice = Math.max(0, basePrice - discount)

    // If paymentMethod is ONLINE, deduct from wallet
    if (payMethod === 'ONLINE') {
      if (user.walletBalance < totalPrice) {
        return NextResponse.json(
          { error: `钱包余额不足，需要 ${totalPrice.toFixed(2)} 元，当前 ${user.walletBalance.toFixed(2)} 元` },
          { status: 400 }
        )
      }
    }

    // Generate order number
    const timestamp = Date.now()
    const random4 = Math.floor(1000 + Math.random() * 9000)
    const orderNumber = `ORD-${timestamp}${random4}`

    // Points: 1 point per yuan spent
    const pointsEarned = Math.floor(totalPrice)

    // Extract delivery details from nested object if provided
    const classGroup = deliveryDetail?.classGroup || null
    const studentNumber = deliveryDetail?.studentNumber ? parseInt(String(deliveryDetail.studentNumber)) : null
    const pickupDate = deliveryDetail?.pickupDay || null
    const pickupTime = deliveryDetail?.pickupTime || null

    // Create order and update user in transaction
    const order = await db.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber,
          userId,
          productId,
          quantity: qty,
          totalPrice,
          status: payMethod === 'ONLINE' ? 'PAID' : 'PENDING',
          paymentMethod: payMethod,
          deliveryMethod: delivMethod,
          classGroup,
          studentNumber,
          pickupDate,
          pickupTime,
          promoCode: promoCode || null,
          couponId: appliedCouponId,
          discount,
          realName: contactName,
          email: contactEmail,
          phone: contactPhone,
          notes: notes || null,
        },
      })

      // Mark coupon as used if applied
      if (appliedCouponId) {
        await tx.coupon.update({
          where: { id: appliedCouponId },
          data: {
            isActive: false,
            usedAt: new Date(),
          },
        })
      }

      // Update user
      const updateData: Record<string, unknown> = {
        points: user.points + pointsEarned,
      }

      if (payMethod === 'ONLINE') {
        updateData.walletBalance = user.walletBalance - totalPrice
      }

      await tx.user.update({
        where: { id: userId },
        data: updateData,
      })

      // Deduct stock
      await tx.product.update({
        where: { id: productId },
        data: { stock: product.stock - qty },
      })

      return o
    })

    // After successful order, if user is BLACKGOLD and totalPrice >= 100, auto-create thank-you coupon
    if (membershipLevel === 'BLACKGOLD' && totalPrice >= 100) {
      try {
        const bgRandom4 = Math.floor(1000 + Math.random() * 9000)
        const bgCode = `BG-THANKS-${bgRandom4}`
        const bgExpiresAt = new Date()
        bgExpiresAt.setDate(bgExpiresAt.getDate() + 30)

        await db.coupon.create({
          data: {
            userId,
            code: bgCode,
            name: '黑金感谢礼',
            description: '黑金会员专属5.2折优惠券',
            discountPercent: 48,
            minPurchase: 100,
            expiresAt: bgExpiresAt,
          },
        })
      } catch (couponError) {
        // Log but don't fail the order if coupon creation fails
        console.error('Failed to create Black Gold thank-you coupon:', couponError)
      }
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      orderId: order.id,
      pointsEarned,
      discount,
      totalPrice,
      discountSource: discountSource || undefined,
      couponApplied: appliedCouponId ? true : undefined,
      blackgoldCouponCreated: membershipLevel === 'BLACKGOLD' && totalPrice >= 100 ? true : undefined,
      newWalletBalance: payMethod === 'ONLINE' ? user.walletBalance - totalPrice : user.walletBalance,
      newPoints: user.points + pointsEarned,
      message: discount > 0
        ? `订单创建成功！优惠 ${discount.toFixed(2)} 元${discountSource ? `（${discountSource}）` : ''}，获得 ${pointsEarned} 积分`
        : `订单创建成功！获得 ${pointsEarned} 积分`,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json(
      { error: '创建订单失败' },
      { status: 500 }
    )
  }
}
