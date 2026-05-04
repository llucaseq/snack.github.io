import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code, userId } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: '请输入邮箱和验证码' },
        { status: 400 }
      )
    }

    // Find matching unexpired verification
    const verification = await db.emailVerification.findFirst({
      where: {
        email,
        code,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!verification) {
      return NextResponse.json(
        { error: '验证码无效或已过期' },
        { status: 400 }
      )
    }

    // Mark as verified
    await db.emailVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    })

    // If userId provided, update user's emailVerified and email
    const targetUserId = userId || verification.userId
    let developerInfo = null

    if (targetUserId) {
      const updatedUser = await db.user.update({
        where: { id: targetUserId },
        data: {
          emailVerified: true,
          email: email, // Save/update the verified email
        },
      })

      developerInfo = {
        isDeveloper: updatedUser.isDeveloper,
        isPrimaryDeveloper: updatedUser.isPrimaryDeveloper,
      }

      // Sync user data to cloud (fire and forget, absolute URL for server-side fetch)
      try {
        fetch(`http://localhost:3000/api/cloud-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: targetUserId }),
        }).catch(() => {})
      } catch {
        // Cloud sync failure should not block email verification
      }
    }

    const response: any = {
      message: '邮箱验证成功',
      verified: true,
    }

    if (developerInfo) {
      response.isDeveloper = developerInfo.isDeveloper
      response.isPrimaryDeveloper = developerInfo.isPrimaryDeveloper
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to verify email code:', error)
    return NextResponse.json(
      { error: '验证邮箱失败', details: String(error) },
      { status: 500 }
    )
  }
}
