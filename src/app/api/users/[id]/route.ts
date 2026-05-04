import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      include: {
        orders: true,
        checkIns: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return with lowercase membershipLevel for frontend compatibility, without password
    const { password, ...userWithoutPassword } = user
    return NextResponse.json({
      ...userWithoutPassword,
      membershipLevel: user.membershipLevel.toLowerCase(),
    })
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check user exists
    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Normalize membershipLevel to uppercase for DB
    const updateData: Record<string, unknown> = {}

    // Handle username change
    if (body.username && body.username !== existingUser.username) {
      // Check if new username is already taken
      const existingWithNewName = await db.user.findUnique({ where: { username: body.username } })
      if (existingWithNewName) {
        return NextResponse.json(
          { error: '该用户名已被使用' },
          { status: 409 }
        )
      }
      if (body.username.length < 2 || body.username.length > 20) {
        return NextResponse.json(
          { error: '用户名长度需要在2-20个字符之间' },
          { status: 400 }
        )
      }
      updateData.username = body.username
    }

    if (body.membershipLevel) {
      const newLevel = body.membershipLevel.toUpperCase()
      if (newLevel !== existingUser.membershipLevel) {
        // Create subscription record
        await db.subscription.create({
          data: {
            userId: id,
            username: existingUser.username,
            membershipLevel: newLevel,
          },
        })
      }
      updateData.membershipLevel = newLevel
    }

    // Handle wallet deduction for membership upgrade
    if (body.deductAmount) {
      const deductAmount = parseFloat(body.deductAmount)
      if (existingUser.walletBalance < deductAmount) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance for upgrade' },
          { status: 400 }
        )
      }
      updateData.walletBalance = existingUser.walletBalance - deductAmount
    }

    // Copy other allowed fields (but NOT walletBalance if deductAmount was used)
    // Note: isFrozen, isBanned, isHighRisk, isDeveloper are handled separately below
    const allowedFields = ['realName', 'email', 'phone', 'checkInStreak', 'isNewUser', 'newUserDaysLeft', 'purchaseDisabled', 'emailVerified']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Handle points with proper type validation (Int field)
    if (body.points !== undefined && body.points !== null) {
      const parsedPoints = parseInt(String(body.points), 10)
      if (!isNaN(parsedPoints)) {
        updateData.points = parsedPoints
      }
    }

    // Handle walletBalance directly (Float field) - only if deductAmount is NOT used
    if (body.walletBalance !== undefined && body.walletBalance !== null && !body.deductAmount) {
      const parsedWallet = parseFloat(String(body.walletBalance))
      if (!isNaN(parsedWallet)) {
        updateData.walletBalance = parsedWallet
      }
    }

    // Handle freeze/unfreeze
    if (body.isFrozen !== undefined) {
      if (body.isFrozen === true) {
        updateData.isFrozen = true
        updateData.frozenReason = body.frozenReason || '管理员冻结'
        updateData.frozenAt = new Date()
      } else {
        updateData.isFrozen = false
        updateData.frozenReason = null
        updateData.frozenAt = null
      }
    }

    // Handle ban/unban
    if (body.isBanned !== undefined) {
      if (body.isBanned === true) {
        updateData.isBanned = true
        updateData.bannedReason = body.bannedReason || '管理员封号'
        updateData.bannedAt = new Date()
      } else {
        updateData.isBanned = false
        updateData.bannedReason = null
        updateData.bannedAt = null
      }
    }

    // Handle high-risk flag
    if (body.isHighRisk !== undefined) {
      if (body.isHighRisk === true) {
        updateData.isHighRisk = true
        updateData.highRiskReason = body.highRiskReason || '管理员标记'
        updateData.highRiskAt = new Date()
      } else {
        updateData.isHighRisk = false
        updateData.highRiskReason = null
        updateData.highRiskAt = null
      }
    }

    // Handle isDeveloper — Developers can grant; only Developer Managers can revoke
    if (body.isDeveloper !== undefined) {
      const requestingUserId = body.requestingUserId
      if (!requestingUserId) {
        return NextResponse.json(
          { error: 'requestingUserId is required to change isDeveloper status' },
          { status: 403 }
        )
      }
      const requestingUser = await db.user.findUnique({ where: { id: requestingUserId } })
      if (!requestingUser || !requestingUser.isDeveloper) {
        return NextResponse.json(
          { error: 'Only developers can change developer status' },
          { status: 403 }
        )
      }
      // Only Developer Managers and primary developers can REVOKE developer status
      if (!body.isDeveloper && !(requestingUser.isPrimaryDeveloper || requestingUser.isDeveloperManager)) {
        return NextResponse.json(
          { error: '只有开发管理者才能撤销开发者权限' },
          { status: 403 }
        )
      }
      updateData.isDeveloper = body.isDeveloper
      // If revoking developer, also revoke manager status
      if (!body.isDeveloper) {
        updateData.isDeveloperManager = false
      }
    }

    // Handle isDeveloperManager — Developers can grant; only Developer Managers can revoke
    if (body.isDeveloperManager !== undefined) {
      const requestingUserId = body.requestingUserId
      if (!requestingUserId) {
        return NextResponse.json(
          { error: 'requestingUserId is required to change isDeveloperManager status' },
          { status: 403 }
        )
      }
      const requestingUser = await db.user.findUnique({ where: { id: requestingUserId } })
      if (!requestingUser || !requestingUser.isDeveloper) {
        return NextResponse.json(
          { error: 'Only developers can change developer manager status' },
          { status: 403 }
        )
      }
      // Only Developer Managers and primary developers can REVOKE manager status
      if (!body.isDeveloperManager && !(requestingUser.isPrimaryDeveloper || requestingUser.isDeveloperManager)) {
        return NextResponse.json(
          { error: '只有开发管理者才能撤销管理权限' },
          { status: 403 }
        )
      }
      updateData.isDeveloperManager = body.isDeveloperManager
      // If granting developer manager, also grant developer
      if (body.isDeveloperManager) {
        updateData.isDeveloper = true
      }
    }

    // Handle isPrimaryDeveloper — only primary developers can change this
    if (body.isPrimaryDeveloper !== undefined) {
      const requestingUserId = body.requestingUserId
      if (!requestingUserId) {
        return NextResponse.json(
          { error: 'requestingUserId is required to change isPrimaryDeveloper status' },
          { status: 403 }
        )
      }
      const requestingUser = await db.user.findUnique({ where: { id: requestingUserId } })
      if (!requestingUser || !requestingUser.isPrimaryDeveloper) {
        return NextResponse.json(
          { error: 'Only primary developers can change primary developer status' },
          { status: 403 }
        )
      }
      updateData.isPrimaryDeveloper = body.isPrimaryDeveloper
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
    })

    // Return with lowercase membershipLevel, without password
    const { password, ...userWithoutPassword } = user
    return NextResponse.json({
      ...userWithoutPassword,
      membershipLevel: user.membershipLevel.toLowerCase(),
    })
  } catch (error: any) {
    console.error('Failed to update user:', error)
    
    // Handle specific Prisma errors
    if (error?.code === 'P2002') {
      // Unique constraint violation
      const target = error?.meta?.target?.[0] || 'field'
      return NextResponse.json(
        { error: `该${target}已被使用` },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}
