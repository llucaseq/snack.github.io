import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/config — Read all config (masked sensitive values)
export async function GET() {
  try {
    const configs = await db.appConfig.findMany()

    // Mask sensitive values for frontend display
    const masked = configs.map((c) => ({
      key: c.key,
      value: c.encrypted && c.value.length > 4
        ? c.value.slice(0, 2) + '****' + c.value.slice(-2)
        : c.value,
      encrypted: c.encrypted,
      hasValue: c.value.length > 0,
      updatedAt: c.updatedAt.toISOString(),
    }))

    return NextResponse.json({ configs: masked })
  } catch (error) {
    console.error('Failed to read config:', error)
    return NextResponse.json(
      { error: 'Failed to read config' },
      { status: 500 }
    )
  }
}

// POST /api/config — Update config values
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { configs } = body as {
      configs: { key: string; value: string; encrypted?: boolean }[]
    }

    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json(
        { error: 'configs array is required' },
        { status: 400 }
      )
    }

    const results = []

    for (const config of configs) {
      if (!config.key) continue

      const encrypted = config.encrypted ?? false

      // If value looks like a masked value (contains ****), skip update
      if (config.value.includes('****')) continue

      const result = await db.appConfig.upsert({
        where: { key: config.key },
        update: { value: config.value, encrypted },
        create: { key: config.key, value: config.value, encrypted },
      })

      results.push({ key: result.key, updated: true })
    }

    return NextResponse.json({
      message: 'Config updated successfully',
      results,
    })
  } catch (error) {
    console.error('Failed to update config:', error)
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    )
  }
}
