import ZAI from 'z-ai-web-dev-sdk'
import { NextResponse } from 'next/server'

// System prompt for the AI customer service
const SYSTEM_PROMPT = `你是"会员商城"的AI客服助手。你的职责是：
1. 回答关于会员商城的问题，包括会员等级、商品购买、签到积分、虚拟钱包、优惠券等功能
2. 帮助用户解决使用问题
3. 解释会员权益（铜/银/金/钻石/黑金会员的不同特权）
4. 回答关于配送方式（楼梯间取货、预约取货、一对一急送）的问题
5. 提供友好的客户服务体验

会员等级说明：
- 铜会员：免费，基础访问权限、每日签到、商品购买
- 银会员：50元，所有铜会员权益 + 签到积分加倍 + 预约取货
- 金会员：150元，所有银会员权益 + 星期五88折购物 + 专属优惠码 + 优先配送
- 钻石会员：300元，所有金会员权益 + 每周两次88折购物 + 一对一急送 + 专属客服 + 独家商品
- 黑金会员：500元，所有钻石会员权益 + 每周四次88折购物 + 黑金独家优惠券 + 消费满100送5.2折券

请用中文回复，态度友好专业。如果遇到你无法解决的问题，建议用户联系开发者。`

let zaiInstance: any = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// Retry helper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      // Don't retry on client errors (4xx)
      if (error?.status >= 400 && error?.status < 500) {
        throw error
      }
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`Chat API retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
        // Reset ZAI instance on retry in case it's stale
        zaiInstance = null
      }
    }
  }
  throw lastError
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '请提供消息内容' }, { status: 400 })
    }

    // Build conversation with system prompt
    const conversationMessages = [
      { role: 'assistant' as const, content: SYSTEM_PROMPT },
      ...messages.slice(-20).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ]

    const completion = await withRetry(async () => {
      const zai = await getZAI()
      return await zai.chat.completions.create({
        messages: conversationMessages,
        thinking: { type: 'disabled' }
      })
    }, 2, 1000)

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json({ error: 'AI回复为空，请重试' }, { status: 502 })
    }

    return NextResponse.json({ response: aiResponse })
  } catch (error: any) {
    console.error('Chat API error:', error)
    
    // Return a more helpful error message
    const errorMessage = error?.message?.includes('network') || error?.message?.includes('ECONNREFUSED') || error?.message?.includes('timeout')
      ? 'AI服务网络连接失败，请稍后再试'
      : error?.message?.includes('rate') || error?.message?.includes('429')
      ? 'AI服务请求过于频繁，请稍后再试'
      : 'AI服务暂时不可用，请稍后再试'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 503 }
    )
  }
}
