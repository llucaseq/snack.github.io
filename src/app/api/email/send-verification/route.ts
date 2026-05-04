import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getSmtpConfigFromDb } from '@/lib/app-config'

export const dynamic = 'force-dynamic'

// Singleton transporter (recreated when config changes)
let transporter: nodemailer.Transporter | null = null
let transporterConfigHash: string = ''
let lastAuthError: string | null = null

function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, userId } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const code = generate6DigitCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save verification code to database
    await db.emailVerification.create({
      data: {
        email,
        code,
        userId: userId || null,
        verified: false,
        expiresAt,
      },
    })

    // If userId provided and they're changing their email from a verified one, 
    // mark emailVerified as false until the new email is verified
    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user && user.emailVerified && user.email !== email) {
        await db.user.update({
          where: { id: userId },
          data: { emailVerified: false },
        })
      }
    }

    // Get SMTP config from database or env
    const smtpConfig = await getSmtpConfigFromDb()

    if (!smtpConfig.user || !smtpConfig.pass) {
      // SMTP not configured — return code directly
      console.warn('SMTP credentials not configured. Verification code:', code)
      return NextResponse.json({
        message: 'SMTP not configured. Verification code returned directly.',
        email,
        warning: 'SMTP未配置，验证码已直接返回。请在开发者设置中配置SMTP邮箱服务。',
        devCode: code,
      })
    }

    // If we had a previous auth error with same config, skip SMTP and return code directly
    const currentConfigHash = `${smtpConfig.host}:${smtpConfig.port}:${smtpConfig.user}:${smtpConfig.pass}`
    if (lastAuthError && transporterConfigHash === currentConfigHash) {
      console.warn('SMTP auth previously failed, skipping send. Code:', code)
      return NextResponse.json({
        message: 'SMTP authentication failed. Verification code returned directly.',
        email,
        warning: `SMTP认证失败：${lastAuthError}。验证码已直接返回，请检查开发者设置中的SMTP配置。`,
        devCode: code,
      })
    }

    try {
      // Create transporter with current config (recreate if config changed)
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
        lastAuthError = null // reset on new config
      }

      const fromAddress = smtpConfig.from || smtpConfig.user

      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: '邮箱验证码 / Email Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">邮箱验证</h2>
            <p>您的验证码是：</p>
            <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; padding: 10px 0;">
              ${code}
            </div>
            <p style="color: #666;">验证码将在 10 分钟后过期。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <h2 style="color: #333;">Email Verification</h2>
            <p>Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; padding: 10px 0;">
              ${code}
            </div>
            <p style="color: #666;">This code will expire in 10 minutes.</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              If you did not request this verification, please ignore this email.
            </p>
          </div>
        `,
      })

      // SMTP send succeeded — clear any previous auth error
      lastAuthError = null

      const response: any = {
        message: 'Verification code sent successfully',
        email,
      }

      // In development mode, return the code in response for testing
      if (process.env.NODE_ENV !== 'production') {
        response.devCode = code
      }

      return NextResponse.json(response)
    } catch (smtpError: any) {
      // SMTP send failed — cache the error and fall back to returning code directly
      const errorMsg = smtpError?.response || smtpError?.message || String(smtpError)
      console.error('SMTP send failed, falling back to direct code return:', errorMsg)

      // Cache auth errors so we don't retry every time
      if (smtpError?.code === 'EAUTH' || smtpError?.responseCode === 535) {
        lastAuthError = '用户名或密码不正确，请检查SMTP邮箱和应用专用密码'
      } else if (smtpError?.code === 'ECONNECTION' || smtpError?.code === 'ETIMEDOUT') {
        lastAuthError = '无法连接SMTP服务器，请检查服务器地址和端口'
      } else {
        lastAuthError = errorMsg
      }

      return NextResponse.json({
        message: 'SMTP send failed. Verification code returned directly.',
        email,
        warning: `邮件发送失败：${lastAuthError}。验证码已直接返回。`,
        devCode: code,
      })
    }
  } catch (error) {
    console.error('Failed to process verification request:', error)
    return NextResponse.json(
      { error: 'Failed to process verification request', details: String(error) },
      { status: 500 }
    )
  }
}
