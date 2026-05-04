import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Helper: verify two users are friends (ACCEPTED status in either direction)
async function areFriends(userId: string, friendId: string): Promise<boolean> {
  const friendship = await db.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  })
  return !!friendship
}

// GET - Get messages with a friend OR get unread count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Unread count action
    if (action === 'unread-count') {
      const count = await db.message.count({
        where: {
          receiverId: userId,
          isRead: false,
        },
      })
      return NextResponse.json({ count })
    }

    // Get messages with a friend
    const friendId = searchParams.get('friendId')
    if (!friendId) {
      return NextResponse.json(
        { error: 'friendId is required' },
        { status: 400 }
      )
    }

    // Verify they are friends
    const isFriend = await areFriends(userId, friendId)
    if (!isFriend) {
      return NextResponse.json(
        { error: 'You are not friends with this user' },
        { status: 403 }
      )
    }

    // Get friend info
    const friend = await db.user.findUnique({
      where: { id: friendId },
      select: { username: true, membershipLevel: true },
    })
    if (!friend) {
      return NextResponse.json(
        { error: 'Friend user not found' },
        { status: 404 }
      )
    }

    // Build where clause for messages
    const after = searchParams.get('after')
    const whereClause: Record<string, unknown> = {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    }

    // Pagination: get messages after a specific ID
    if (after) {
      const afterMessage = await db.message.findUnique({
        where: { id: after },
        select: { createdAt: true },
      })
      if (afterMessage) {
        whereClause.OR = [
          {
            senderId: userId,
            receiverId: friendId,
            createdAt: { gt: afterMessage.createdAt },
          },
          {
            senderId: friendId,
            receiverId: userId,
            createdAt: { gt: afterMessage.createdAt },
          },
        ]
      }
    }

    // Get messages
    const messages = await db.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    })

    // Mark unread messages from friend as read
    await db.message.updateMany({
      where: {
        senderId: friendId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        isRead: m.isRead,
        createdAt: m.createdAt,
      })),
      friendInfo: {
        username: friend.username,
        membershipLevel: friend.membershipLevel.toLowerCase(),
      },
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { senderId, receiverId, content } = body

    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { error: 'senderId, receiverId, and content are required' },
        { status: 400 }
      )
    }

    // Verify sender exists
    const sender = await db.user.findUnique({ where: { id: senderId } })
    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      )
    }

    // Verify receiver exists
    const receiver = await db.user.findUnique({ where: { id: receiverId } })
    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      )
    }

    // Verify they are friends
    const isFriend = await areFriends(senderId, receiverId)
    if (!isFriend) {
      return NextResponse.json(
        { error: 'You can only message friends' },
        { status: 403 }
      )
    }

    // Create message
    const message = await db.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
    })

    return NextResponse.json({
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
