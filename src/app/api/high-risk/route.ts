import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getSmtpConfigFromDb } from '@/lib/app-config'

export const dynamic = 'force-dynamic'

// Singleton transporter (recreated when config changes)
let transporter: nodemailer.Transporter | null = null
let transporterConfigHash: string = ''

// High-risk thresholds
const SINGLE_TRANSACTION_THRESHOLD = 500
const DAILY_EARNINGS_THRESHOLD = 1000

async function sendHighRiskEmail(
  username: string,
  userId: string,
  walletIncrease: number,
  walletBalance: number,
  reason: string
) {
  const smtpConfig = await getSmtpConfigFromDb()

  if (!smtpConfig.user || !smtpConfig.pass) {
    console.warn('SMTP not configured. Cannot send high-risk alert email.')
    return
  }

  const currentConfigHash = `${smtpConfig.host}:${smtpConfig.port}:${smtpConfig.user}:${smtpConfig.pass}`

  try {
    if (!transporter || transporterConfigHash !== currentConfigHash) {
      transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      })
      transporterConfigHash = currentConfigHash
    }

    const fromAddress = smtpConfig.from || smtpConfig.user

    await transporter.sendMail({
      from: fromAddress,
      to: 'llucaseq@gmail.com',
      subject: '⚠️ 高危用户警告 - 会员商城',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">⚠️ 高危用户警告</h2>
          <p>系统检测到高危用户行为，请及时处理：</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #fef2f2;">用户名</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${username}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #fef2f2;">用户ID</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${userId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #fef2f2;">触发金额</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${walletIncrease}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #fef2f2;">当前钱包余额</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${walletBalance}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #fef2f2;">标记原因</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${reason}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #fef2f2;">标记时间</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date().toLocaleString('zh-CN')}</td>
            </tr>
          </table>
          <p style="color: #666; font-size: 12px;">此邮件由会员商城系统自动发送，请勿回复。</p>
        </div>
      `,
    })

    console.log(`High-risk alert email sent for user ${username} (${userId})`)
  } catch (error) {
    console.error('Failed to send high-risk alert email:', error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, walletIncrease } = body

    if (!userId || walletIncrease === undefined) {
      return NextResponse.json(
        { error: 'userId and walletIncrease are required' },
        { status: 400 }
      )
    }

    const walletIncreaseNum = parseFloat(String(walletIncrease))

    // Fetch the user
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already flagged
    if (user.isHighRisk) {
      return NextResponse.json({
        message: 'User is already flagged as high-risk',
        user: {
          id: user.id,
          username: user.username,
          walletBalance: user.walletBalance,
          isHighRisk: user.isHighRisk,
          highRiskReason: user.highRiskReason,
          highRiskAt: user.highRiskAt,
        },
      })
    }

    // Check high-risk conditions
    let isHighRisk = false
    let reason = ''

    // Condition 1: Single transaction increase > 500
    if (walletIncreaseNum > SINGLE_TRANSACTION_THRESHOLD) {
      isHighRisk = true
      reason = `钱包异常增长：单次增加${walletIncreaseNum}`
    }

    // Condition 2: Daily earnings exceed 1000
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const currentDailyEarnings = user.dailyEarningsDate === today ? user.dailyEarnings : 0
    const newDailyEarnings = currentDailyEarnings + walletIncreaseNum

    if (newDailyEarnings > DAILY_EARNINGS_THRESHOLD && !isHighRisk) {
      isHighRisk = true
      reason = `钱包异常增长：单次增加${walletIncreaseNum}（今日累计${newDailyEarnings}）`
    }

    if (!isHighRisk) {
      // Update daily earnings tracking even if not high-risk
      if (user.dailyEarningsDate === today) {
        await db.user.update({
          where: { id: userId },
          data: {
            dailyEarnings: user.dailyEarnings + walletIncreaseNum,
          },
        })
      } else {
        await db.user.update({
          where: { id: userId },
          data: {
            dailyEarnings: walletIncreaseNum,
            dailyEarningsDate: today,
          },
        })
      }

      return NextResponse.json({
        message: 'User is not high-risk',
        isHighRisk: false,
        dailyEarnings: user.dailyEarningsDate === today ? user.dailyEarnings + walletIncreaseNum : walletIncreaseNum,
      })
    }

    // Flag the user as high-risk
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        isHighRisk: true,
        highRiskReason: reason,
        highRiskAt: new Date(),
        // Also update daily earnings tracking
        dailyEarnings: user.dailyEarningsDate === today ? user.dailyEarnings + walletIncreaseNum : walletIncreaseNum,
        dailyEarningsDate: today,
      },
    })

    // Send email alert asynchronously (don't block the response)
    sendHighRiskEmail(
      updatedUser.username,
      updatedUser.id,
      walletIncreaseNum,
      updatedUser.walletBalance,
      reason
    ).catch((err) => {
      console.error('Background email send failed:', err)
    })

    // Return the updated user data (without password)
    const { password: _pwd, ...userWithoutPassword } = updatedUser
    return NextResponse.json({
      message: 'User flagged as high-risk',
      isHighRisk: true,
      highRiskReason: reason,
      user: {
        ...userWithoutPassword,
        membershipLevel: updatedUser.membershipLevel.toLowerCase(),
      },
    })
  } catch (error) {
    console.error('Failed to check high-risk user:', error)
    return NextResponse.json(
      { error: 'Failed to check high-risk user', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const highRiskUsers = await db.user.findMany({
      where: { isHighRisk: true },
      select: {
        id: true,
        username: true,
        walletBalance: true,
        highRiskReason: true,
        highRiskAt: true,
        isFrozen: true,
        isBanned: true,
      },
      orderBy: { highRiskAt: 'desc' },
    })

    return NextResponse.json(highRiskUsers)
  } catch (error) {
    console.error('Failed to fetch high-risk users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch high-risk users', details: String(error) },
      { status: 500 }
    )
  }
}
