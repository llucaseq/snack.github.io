import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const SAMPLE_PRODUCTS = [
  {
    name: '精品笔记本',
    description: '优质纸张，精美装订',
    price: 15.0,
    stock: 999,
  },
  {
    name: '高级钢笔',
    description: '书写流畅，经典设计',
    price: 28.0,
    stock: 999,
  },
  {
    name: '创意文具套装',
    description: '多功能组合，学习必备',
    price: 35.0,
    stock: 999,
  },
  {
    name: '便携式台灯',
    description: '三档调光，护眼首选',
    price: 45.0,
    stock: 999,
  },
  {
    name: '电子计算器',
    description: '科学计算，考试利器',
    price: 22.0,
    stock: 999,
  },
  {
    name: '保温水杯',
    description: '316不锈钢，长效保温',
    price: 38.0,
    stock: 999,
  },
]

export async function POST() {
  try {
    const results = {
      products: [] as string[],
      user: null as string | null,
    }

    // Create sample products (skip if already exist by name)
    for (const product of SAMPLE_PRODUCTS) {
      const existing = await db.product.findFirst({
        where: { name: product.name },
      })
      if (!existing) {
        await db.product.create({ data: product })
        results.products.push(product.name)
      }
    }

    // Create demo user with 100 yuan balance (skip if exists)
    const existingUser = await db.user.findUnique({
      where: { username: 'demo' },
    })
    if (!existingUser) {
      // Generate a unique invite code for the demo user
      const demoInviteCode = 'DEMO0001'
      await db.user.create({
        data: {
          username: 'demo',
          realName: 'Demo User',
          email: 'demo@example.com',
          phone: '13800000000',
          membershipLevel: 'COPPER',
          points: 0,
          walletBalance: 100,
          checkInStreak: 0,
          isNewUser: true,
          newUserDaysLeft: 2,
          inviteCode: demoInviteCode,
        },
      })
      results.user = 'demo'
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      results,
    })
  } catch (error) {
    console.error('Failed to seed database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
