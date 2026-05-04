import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Simple hash function for demo purposes (must match auth route)
function simpleHash(str: string): string {
  return Buffer.from(str).toString('base64')
}

function sanitizeUser(user: any) {
  const { password, ...rest } = user
  return {
    ...rest,
    membershipLevel: rest.membershipLevel.toLowerCase(),
  }
}

export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
    })
    // Return with lowercase membershipLevel and without password
    const normalized = users.map(u => sanitizeUser(u))
    return NextResponse.json(normalized)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, realName, email, phone } = body

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existing = await db.user.findUnique({ where: { username } })
    if (existing) {
      // Return existing user with lowercase membership, without password
      return NextResponse.json(sanitizeUser(existing))
    }

    // Check if this is the first user (becomes primary developer)
    const userCount = await db.user.count()
    const isFirstUser = userCount === 0

    const hashedPassword = password ? simpleHash(password) : ''
    // Generate a unique invite code
    let inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    let codeExists = await db.user.findUnique({ where: { inviteCode } })
    while (codeExists) {
      inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      codeExists = await db.user.findUnique({ where: { inviteCode } })
    }
    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        realName: realName || null,
        email: email || null,
        phone: phone || null,
        membershipLevel: 'COPPER',
        points: 0,
        walletBalance: 0,
        checkInStreak: 0,
        isNewUser: true,
        newUserDaysLeft: 2,
        inviteCode,
        isDeveloper: isFirstUser,
        isPrimaryDeveloper: isFirstUser,
      },
    })

    // Return with lowercase membershipLevel, without password
    // Sync user data to cloud (non-blocking)
    fetch(`${new URL(request.url).origin}/api/cloud-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    }).catch(() => {}) // non-blocking

    return NextResponse.json(sanitizeUser(user), { status: 201 })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
