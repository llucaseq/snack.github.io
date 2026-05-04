import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Simple hash function for demo purposes
function simpleHash(str: string): string {
  return Buffer.from(str).toString('base64')
}

// Generate a unique 8-char alphanumeric invite code
async function generateUniqueInviteCode(): Promise<string> {
  let code = Math.random().toString(36).substring(2, 10).toUpperCase()
  let existing = await db.user.findUnique({ where: { inviteCode: code } })
  while (existing) {
    code = Math.random().toString(36).substring(2, 10).toUpperCase()
    existing = await db.user.findUnique({ where: { inviteCode: code } })
  }
  return code
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, username, password, inviteCode } = body

    if (!action || !username || !password) {
      return NextResponse.json(
        { error: '请提供完整的登录信息' },
        { status: 400 }
      )
    }

    if (action === 'register') {
      // Check if username already exists
      const existing = await db.user.findUnique({ where: { username } })
      if (existing) {
        return NextResponse.json(
          { error: '该用户名已被注册' },
          { status: 409 }
        )
      }

      if (password.length < 4) {
        return NextResponse.json(
          { error: '密码至少需要4个字符' },
          { status: 400 }
        )
      }

      const hashedPassword = simpleHash(password)
      const newInviteCode = await generateUniqueInviteCode()
      const user = await db.user.create({
        data: {
          username,
          password: hashedPassword,
          membershipLevel: 'COPPER',
          points: 0,
          walletBalance: 0,
          checkInStreak: 0,
          isNewUser: true,
          newUserDaysLeft: 2,
          inviteCode: newInviteCode,
          invitedBy: inviteCode || null,
        },
      })

      // If an invite code was provided, reward the inviter
      if (inviteCode && typeof inviteCode === 'string') {
        const inviter = await db.user.findUnique({ where: { inviteCode: inviteCode as string } })
        if (inviter) {
          // Give inviter +50 points and +2.0 wallet balance
          await db.user.update({
            where: { id: inviter.id },
            data: {
              points: { increment: 50 },
              walletBalance: { increment: 2.0 },
            },
          })
          // Create invite reward record
          await db.inviteReward.create({
            data: {
              inviterId: inviter.id,
              inviteeId: user.id,
              inviteeName: user.username,
              reward: 50,
              walletReward: 2.0,
            },
          })
        }
      }

      // Sync new user to cloud (fire and forget)
      try {
        fetch('http://localhost:3000/api/cloud-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        }).catch(() => {})
      } catch {}

      return NextResponse.json({
        id: user.id,
        username: user.username,
        membershipLevel: user.membershipLevel.toLowerCase(),
        emailVerified: user.emailVerified,
        isDeveloper: user.isDeveloper,
        isPrimaryDeveloper: user.isPrimaryDeveloper,
        isDeveloperManager: user.isDeveloperManager,
        message: '注册成功',
      }, { status: 201 })
    }

    if (action === 'login') {
      const user = await db.user.findUnique({ where: { username } })
      if (!user) {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        )
      }

      // If user has empty password (legacy user), set their password now
      if (user.password === '') {
        const hashedPassword = simpleHash(password)
        await db.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        })
        return NextResponse.json({
          id: user.id,
          username: user.username,
          membershipLevel: user.membershipLevel.toLowerCase(),
          emailVerified: user.emailVerified,
          isDeveloper: user.isDeveloper,
          isPrimaryDeveloper: user.isPrimaryDeveloper,
          isDeveloperManager: user.isDeveloperManager,
          needsEmailVerification: !user.emailVerified && !user.isDeveloper,
          message: '登录成功',
        })
      }

      const hashedPassword = simpleHash(password)
      if (user.password !== hashedPassword) {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        id: user.id,
        username: user.username,
        membershipLevel: user.membershipLevel.toLowerCase(),
        emailVerified: user.emailVerified,
        isDeveloper: user.isDeveloper,
        isPrimaryDeveloper: user.isPrimaryDeveloper,
        isDeveloperManager: user.isDeveloperManager,
        needsEmailVerification: !user.emailVerified && !user.isDeveloper,
        message: '登录成功',
      })
    }

    return NextResponse.json(
      { error: '无效的操作' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    )
  }
}
