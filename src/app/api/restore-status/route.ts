import { NextResponse } from 'next/server'
import { readFile, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const RESTORE_FLAG_FILE = join(process.cwd(), '.restore-notify.json')

export async function GET() {
  try {
    if (existsSync(RESTORE_FLAG_FILE)) {
      const content = await readFile(RESTORE_FLAG_FILE, 'utf-8')
      const data = JSON.parse(content)
      return NextResponse.json(data)
    }
    return NextResponse.json({ lastRestore: null, message: null })
  } catch {
    return NextResponse.json({ lastRestore: null, message: null })
  }
}

// Called after a cloud restore to set the notification flag
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = body.message || '更新已完成，请您重新加载页面'

    const data = {
      lastRestore: new Date().toISOString(),
      message,
    }

    await writeFile(RESTORE_FLAG_FILE, JSON.stringify(data, null, 2))

    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error('Failed to set restore notification:', error)
    return NextResponse.json(
      { error: 'Failed to set notification' },
      { status: 500 }
    )
  }
}

// DELETE: Clear the notification flag (called after user acknowledges)
export async function DELETE() {
  try {
    if (existsSync(RESTORE_FLAG_FILE)) {
      await unlink(RESTORE_FLAG_FILE)
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
