import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Get friends list and pending requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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

    // Friends: WHERE (userId = me AND status = ACCEPTED) OR (friendId = me AND status = ACCEPTED)
    const acceptedFriendships = await db.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ userId }, { friendId: userId }],
      },
      include: {
        user: { select: { id: true, username: true, membershipLevel: true } },
        friend: { select: { id: true, username: true, membershipLevel: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const friends = acceptedFriendships.map((f) => {
      const otherUser = f.userId === userId ? f.friend : f.user
      return {
        id: otherUser.id,
        username: otherUser.username,
        membershipLevel: otherUser.membershipLevel.toLowerCase(),
        friendshipId: f.id,
        status: f.status,
        createdAt: f.createdAt,
      }
    })

    // PendingReceived: WHERE friendId = me AND status = PENDING
    const pendingReceived = await db.friendship.findMany({
      where: {
        friendId: userId,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, username: true, membershipLevel: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const pendingReceivedList = pendingReceived.map((f) => ({
      id: f.user.id,
      username: f.user.username,
      membershipLevel: f.user.membershipLevel.toLowerCase(),
      friendshipId: f.id,
      createdAt: f.createdAt,
    }))

    // PendingSent: WHERE userId = me AND status = PENDING
    const pendingSent = await db.friendship.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        friend: { select: { id: true, username: true, membershipLevel: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const pendingSentList = pendingSent.map((f) => ({
      id: f.friend.id,
      username: f.friend.username,
      membershipLevel: f.friend.membershipLevel.toLowerCase(),
      friendshipId: f.id,
      createdAt: f.createdAt,
    }))

    return NextResponse.json({
      friends,
      pendingReceived: pendingReceivedList,
      pendingSent: pendingSentList,
    })
  } catch (error) {
    console.error('Error fetching friends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    )
  }
}

// POST - Send friend request / Accept / Remove / Reject
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, targetUsername, friendshipId } = body

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'action and userId are required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    switch (action) {
      case 'add': {
        if (!targetUsername) {
          return NextResponse.json(
            { error: 'targetUsername is required for add action' },
            { status: 400 }
          )
        }

        // Find target user by username
        const targetUser = await db.user.findUnique({
          where: { username: targetUsername },
        })
        if (!targetUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          )
        }

        // Check not self
        if (targetUser.id === userId) {
          return NextResponse.json(
            { error: 'Cannot add yourself as a friend' },
            { status: 400 }
          )
        }

        // Check if the other person already sent a pending request to us
        const reversePending = await db.friendship.findUnique({
          where: {
            userId_friendId: {
              userId: targetUser.id,
              friendId: userId,
            },
          },
        })

        if (reversePending) {
          if (reversePending.status === 'ACCEPTED') {
            return NextResponse.json(
              { error: 'Already friends with this user' },
              { status: 400 }
            )
          }
          if (reversePending.status === 'PENDING') {
            // Auto-accept: the other person already sent a pending request
            const updated = await db.friendship.update({
              where: { id: reversePending.id },
              data: { status: 'ACCEPTED' },
            })
            return NextResponse.json({
              message: 'Friend request auto-accepted',
              friendship: updated,
            })
          }
        }

        // Check if we already have a friendship record (sent by us)
        const existingForward = await db.friendship.findUnique({
          where: {
            userId_friendId: {
              userId,
              friendId: targetUser.id,
            },
          },
        })

        if (existingForward) {
          if (existingForward.status === 'ACCEPTED') {
            return NextResponse.json(
              { error: 'Already friends with this user' },
              { status: 400 }
            )
          }
          if (existingForward.status === 'PENDING') {
            return NextResponse.json(
              { error: 'Friend request already sent' },
              { status: 400 }
            )
          }
        }

        // Create new friend request
        const friendship = await db.friendship.create({
          data: {
            userId,
            friendId: targetUser.id,
            status: 'PENDING',
          },
        })

        return NextResponse.json({
          message: 'Friend request sent',
          friendship,
        })
      }

      case 'accept': {
        if (!friendshipId) {
          return NextResponse.json(
            { error: 'friendshipId is required for accept action' },
            { status: 400 }
          )
        }

        const friendship = await db.friendship.findUnique({
          where: { id: friendshipId },
        })
        if (!friendship) {
          return NextResponse.json(
            { error: 'Friendship not found' },
            { status: 404 }
          )
        }

        // Verify the user is the recipient
        if (friendship.friendId !== userId) {
          return NextResponse.json(
            { error: 'You can only accept requests sent to you' },
            { status: 403 }
          )
        }

        if (friendship.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Friendship is not in PENDING status' },
            { status: 400 }
          )
        }

        const updated = await db.friendship.update({
          where: { id: friendshipId },
          data: { status: 'ACCEPTED' },
        })

        return NextResponse.json({
          message: 'Friend request accepted',
          friendship: updated,
        })
      }

      case 'remove': {
        if (!friendshipId) {
          return NextResponse.json(
            { error: 'friendshipId is required for remove action' },
            { status: 400 }
          )
        }

        const friendship = await db.friendship.findUnique({
          where: { id: friendshipId },
        })
        if (!friendship) {
          return NextResponse.json(
            { error: 'Friendship not found' },
            { status: 404 }
          )
        }

        // Verify user is part of this friendship
        if (friendship.userId !== userId && friendship.friendId !== userId) {
          return NextResponse.json(
            { error: 'You are not part of this friendship' },
            { status: 403 }
          )
        }

        // Delete both directions of the friendship
        await db.friendship.deleteMany({
          where: {
            OR: [
              { id: friendshipId },
              {
                userId: friendship.friendId,
                friendId: friendship.userId,
              },
            ],
          },
        })

        return NextResponse.json({ message: 'Friend removed' })
      }

      case 'reject': {
        if (!friendshipId) {
          return NextResponse.json(
            { error: 'friendshipId is required for reject action' },
            { status: 400 }
          )
        }

        const friendship = await db.friendship.findUnique({
          where: { id: friendshipId },
        })
        if (!friendship) {
          return NextResponse.json(
            { error: 'Friendship not found' },
            { status: 404 }
          )
        }

        // Verify the user is the recipient of the pending request
        if (friendship.friendId !== userId) {
          return NextResponse.json(
            { error: 'You can only reject requests sent to you' },
            { status: 403 }
          )
        }

        if (friendship.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Friendship is not in PENDING status' },
            { status: 400 }
          )
        }

        await db.friendship.delete({ where: { id: friendshipId } })

        return NextResponse.json({ message: 'Friend request rejected' })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: add, accept, remove, or reject' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing friend action:', error)
    return NextResponse.json(
      { error: 'Failed to process friend action' },
      { status: 500 }
    )
  }
}
