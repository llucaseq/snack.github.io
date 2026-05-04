import { db } from '@/lib/db'
import nodemailer from 'nodemailer'
import { getSmtpConfigFromDb } from '@/lib/app-config'

// High-risk thresholds
const SINGLE_TRANSACTION_THRESHOLD = 500
const DAILY_EARNINGS_THRESHOLD = 1000

// Singleton transporter
let transporter: nodemailer.Transporter | null = null
let transporterConfigHash: string = ''

async function sendHighRiskEmail(
  username: string,
  userId: string,
  walletIncrease: number,
  walletBalance: number,
  reason: string
) {
  try {
    const smtpConfig = await getSmtpConfigFromDb()
    if (!smtpConfig.user || !smtpConfig.pass) {
      console.warn('SMTP not configured, skipping high-risk email alert')
      return
    }

    const currentConfigHash = `${smtpConfig.host}:${smtpConfig.port}:${smtpConfig.user}:${smtpConfig.pass}`
    if (!transporter || transporterConfigHash !== currentConfigHash) {
      transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465,
        auth: { user: smtpConfig.user, pass: smtpConfig.pass },
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
          <p>系统检测到用户钱包异常增长，请及时处理。</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #fef2f2;">用户名</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${username}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #fef2f2;">用户ID</td><td style="padding: 8px; border: 1px solid #e5e7eb; font-family: monospace; font-size: 12px;">${userId}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #fef2f2;">触发金额</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">+${walletIncrease.toFixed(2)} 元</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #fef2f2;">当前余额</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${walletBalance.toFixed(2)} 元</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #fef2f2;">触发原因</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${reason}</td></tr>
          </table>
          <p style="color: #666;">请在开发者管理面板中查看并处理此高危用户。</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `,
    })

    console.log(`High-risk email alert sent for user ${username}`)
  } catch (error) {
    console.error('Failed to send high-risk email:', error)
  }
}

/**
 * Check if a wallet increase should flag the user as high-risk.
 * Call this AFTER the wallet has been updated.
 *
 * @param userId - The user whose wallet changed
 * @param walletIncrease - How much the wallet increased by (positive number)
 */
export async function checkHighRisk(userId: string, walletIncrease: number) {
  if (walletIncrease <= 0) return // Only check increases

  try {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.isDeveloper || user.isPrimaryDeveloper) return // Skip developers

    let shouldFlag = false
    let reason = ''

    // Check 1: Single transaction exceeds threshold
    if (walletIncrease > SINGLE_TRANSACTION_THRESHOLD) {
      shouldFlag = true
      reason = `单次钱包增长异常：+${walletIncrease.toFixed(2)} 元（阈值：${SINGLE_TRANSACTION_THRESHOLD} 元）`
    }

    // Check 2: Daily earnings exceed threshold
    const today = new Date().toISOString().split('T')[0]
    if (user.dailyEarningsDate === today) {
      const newDailyEarnings = user.dailyEarnings + walletIncrease
      if (newDailyEarnings > DAILY_EARNINGS_THRESHOLD) {
        shouldFlag = true
        reason = reason
          ? `${reason}；日累计增长异常：${newDailyEarnings.toFixed(2)} 元（阈值：${DAILY_EARNINGS_THRESHOLD} 元）`
          : `日累计钱包增长异常：${newDailyEarnings.toFixed(2)} 元（阈值：${DAILY_EARNINGS_THRESHOLD} 元）`
      }

      // Update daily earnings
      await db.user.update({
        where: { id: userId },
        data: { dailyEarnings: newDailyEarnings },
      })
    } else {
      // New day, reset daily earnings
      await db.user.update({
        where: { id: userId },
        data: { dailyEarnings: walletIncrease, dailyEarningsDate: today },
      })

      if (walletIncrease > DAILY_EARNINGS_THRESHOLD) {
        shouldFlag = true
        reason = reason || `日累计钱包增长异常：${walletIncrease.toFixed(2)} 元（阈值：${DAILY_EARNINGS_THRESHOLD} 元）`
      }
    }

    if (shouldFlag && !user.isHighRisk) {
      // Flag the user as high-risk
      await db.user.update({
        where: { id: userId },
        data: {
          isHighRisk: true,
          highRiskReason: reason,
          highRiskAt: new Date(),
        },
      })

      // Send email alert
      await sendHighRiskEmail(user.username, userId, walletIncrease, user.walletBalance, reason)
    }
  } catch (error) {
    console.error('High-risk check failed:', error)
  }
}
