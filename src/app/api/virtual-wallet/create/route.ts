import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

function generateRandomCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'A valid positive amount is required' },
        { status: 400 }
      )
    }

    // Generate unique code
    const code = `VW-${generateRandomCode(12)}`

    // Ensure code is unique
    const existing = await db.virtualWalletCode.findUnique({ where: { code } })
    if (existing) {
      // Very unlikely but retry with a different code
      const retryCode = `VW-${generateRandomCode(12)}`
      const walletCode = await db.virtualWalletCode.create({
        data: {
          code: retryCode,
          amount: parseFloat(amount),
        },
      })
      return NextResponse.json(walletCode, { status: 201 })
    }

    const walletCode = await db.virtualWalletCode.create({
      data: {
        code,
        amount: parseFloat(amount),
      },
    })

    return NextResponse.json(walletCode, { status: 201 })
  } catch (error) {
    console.error('Failed to create virtual wallet code:', error)
    return NextResponse.json(
      { error: 'Failed to create virtual wallet code' },
      { status: 500 }
    )
  }
}
