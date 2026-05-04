import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const DEVELOPER_PASSWORD = 'happyIDK'
const MAX_DEVELOPER_MANAGER_SLOTS = 3

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password, userId, action } = body

    // ─── Action: enter-dev-settings ────────────────────────────────────────
    // First 3 users who enter → auto become Developer Manager
    // After 3 slots filled → need password "HappyIDK" to become a Developer
    if (action === 'enter-dev-settings' && userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 })
      }

      // If already a developer or developer manager, just return their status
      if (user.isDeveloper || user.isPrimaryDeveloper || user.isDeveloperManager) {
        return NextResponse.json({
          success: true,
          isDeveloper: user.isDeveloper,
          isPrimaryDeveloper: user.isPrimaryDeveloper,
          isDeveloperManager: user.isDeveloperManager,
          autoPromoted: false,
          message: '开发者身份验证成功',
        })
      }

      // Count how many Developer Managers already exist
      const managerCount = await db.user.count({
        where: {
          OR: [
            { isDeveloperManager: true },
            { isPrimaryDeveloper: true },
          ],
        },
      })

      if (managerCount < MAX_DEVELOPER_MANAGER_SLOTS) {
        // Auto-promote this user to Developer Manager
        await db.user.update({
          where: { id: userId },
          data: {
            isDeveloper: true,
            isDeveloperManager: true,
          },
        })

        return NextResponse.json({
          success: true,
          isDeveloper: true,
          isPrimaryDeveloper: false,
          isDeveloperManager: true,
          autoPromoted: true,
          slotInfo: {
            used: managerCount + 1,
            total: MAX_DEVELOPER_MANAGER_SLOTS,
          },
          message: `你已成为开发管理者（第 ${managerCount + 1}/${MAX_DEVELOPER_MANAGER_SLOTS} 位）`,
        })
      }

      // All 3 slots used — need password to become a regular developer
      return NextResponse.json({
        success: false,
        needsPassword: true,
        slotsFull: true,
        slotInfo: {
          used: managerCount,
          total: MAX_DEVELOPER_MANAGER_SLOTS,
        },
        error: `开发管理者名额已满（${MAX_DEVELOPER_MANAGER_SLOTS}/${MAX_DEVELOPER_MANAGER_SLOTS}），请输入开发者密码以成为开发者`,
      }, { status: 403 })
    }

    // ─── Action: verify-dev-password ────────────────────────────────────────
    // Verify password and promote user to developer (not manager)
    if (action === 'verify-dev-password' && userId && password) {
      if (password !== DEVELOPER_PASSWORD) {
        return NextResponse.json({
          success: false,
          error: '开发者密码错误',
        }, { status: 401 })
      }

      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 })
      }

      // If already a developer, just return success
      if (user.isDeveloper || user.isDeveloperManager || user.isPrimaryDeveloper) {
        return NextResponse.json({
          success: true,
          isDeveloper: user.isDeveloper,
          isPrimaryDeveloper: user.isPrimaryDeveloper,
          isDeveloperManager: user.isDeveloperManager,
          message: '你已是开发者',
        })
      }

      // Promote to regular developer (NOT manager)
      await db.user.update({
        where: { id: userId },
        data: {
          isDeveloper: true,
        },
      })

      return NextResponse.json({
        success: true,
        isDeveloper: true,
        isPrimaryDeveloper: false,
        isDeveloperManager: false,
        passwordVerified: true,
        message: '密码验证成功！你已成为开发者',
      })
    }

    // ─── Action: get-manager-status ────────────────────────────────────────
    if (action === 'get-manager-status') {
      const managerCount = await db.user.count({
        where: {
          OR: [
            { isDeveloperManager: true },
            { isPrimaryDeveloper: true },
          ],
        },
      })
      return NextResponse.json({
        slotsUsed: managerCount,
        slotsTotal: MAX_DEVELOPER_MANAGER_SLOTS,
        slotsFull: managerCount >= MAX_DEVELOPER_MANAGER_SLOTS,
      })
    }

    // ─── Support userId-based verification ──────────────────────────────────
    if (userId && !password) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user && (user.isDeveloper || user.isPrimaryDeveloper || user.isDeveloperManager)) {
        return NextResponse.json({
          success: true,
          isPrimaryDeveloper: user.isPrimaryDeveloper,
          isDeveloper: user.isDeveloper,
          isDeveloperManager: user.isDeveloperManager,
          message: '开发者身份验证成功',
        })
      }
      return NextResponse.json(
        { success: false, error: '该用户不是开发者' },
        { status: 403 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    if (password === DEVELOPER_PASSWORD) {
      return NextResponse.json({
        success: true,
        token: DEVELOPER_PASSWORD,
        message: '验证成功',
      })
    }

    return NextResponse.json(
      { success: false, error: '密码错误' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Failed to verify developer:', error)
    return NextResponse.json(
      { error: 'Failed to verify developer' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get all subscriptions
    const subscriptions = await db.subscription.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Get all orders summary
    const orders = await db.order.findMany({
      include: {
        product: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalRevenue = orders
      .filter((o) => o.paymentMethod === 'ONLINE')
      .reduce((sum, o) => sum + o.totalPrice, 0)

    const totalOrders = orders.length
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length

    // Normalize membership levels
    const normalizedSubs = subscriptions.map(s => ({
      ...s,
      membershipLevel: s.membershipLevel.toLowerCase(),
    }))

    return NextResponse.json({
      subscriptions: normalizedSubs,
      orders,
      summary: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
      },
    })
  } catch (error) {
    console.error('Failed to fetch developer dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch developer dashboard' },
      { status: 500 }
    )
  }
}
