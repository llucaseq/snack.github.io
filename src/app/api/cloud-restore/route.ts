import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getS3Config } from '@/lib/app-config'

export const dynamic = 'force-dynamic'

// Create a fresh S3 client for each restore operation to avoid stale config issues
async function getS3Client(): Promise<S3Client> {
  const config = await getS3Config()
  
  if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error('S3 configuration is incomplete. Please configure S3 settings in the developer panel.')
  }
  
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
    requestHandler: {
      requestTimeout: 30000, // 30 second timeout
    },
  })
}

async function getBucketAsync(): Promise<string> {
  const config = await getS3Config()
  return config.bucket || 'member-store-backup'
}

async function ensureBucketExists(client: S3Client, bucket: string): Promise<void> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }))
  }
}

interface BackupData {
  exportedAt: string
  version: number
  data: {
    users: any[]
    orders: any[]
    products: any[]
    checkIns: any[]
    promoCodes: any[]
    virtualWalletCodes: any[]
    coupons: any[]
    subscriptions: any[]
    inviteRewards: any[]
    emailVerifications: any[]
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const backupKey = body?.backupKey as string | undefined

    const client = await getS3Client()
    const bucket = await getBucketAsync()
    await ensureBucketExists(client, bucket)

    // Determine which backup to restore
    let targetKey = backupKey
    if (!targetKey) {
      // Find the latest backup
      const listResponse = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: 'backups/backup-',
        })
      )
      const backupFiles = (listResponse.Contents || [])
        .filter((obj) => obj.Key?.startsWith('backups/backup-'))
        .sort((a, b) => {
          const timeA = a.LastModified?.getTime() || 0
          const timeB = b.LastModified?.getTime() || 0
          return timeB - timeA // newest first
        })

      if (backupFiles.length === 0) {
        return NextResponse.json(
          { error: 'No backups found in cloud storage' },
          { status: 404 }
        )
      }

      targetKey = backupFiles[0].Key!
    }

    // Download backup from S3
    const getResponse = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: targetKey })
    )
    const bodyStr = await getResponse.Body?.transformToString()
    if (!bodyStr) {
      return NextResponse.json(
        { error: 'Failed to read backup data' },
        { status: 500 }
      )
    }

    const backup: BackupData = JSON.parse(bodyStr)

    // Create safety backup before restoring
    const currentData = {
      users: await db.user.findMany(),
      orders: await db.order.findMany(),
      products: await db.product.findMany(),
      checkIns: await db.checkIn.findMany(),
      promoCodes: await db.promoCode.findMany(),
      virtualWalletCodes: await db.virtualWalletCode.findMany(),
      coupons: await db.coupon.findMany(),
      subscriptions: await db.subscription.findMany(),
      inviteRewards: await db.inviteReward.findMany(),
      emailVerifications: await db.emailVerification.findMany(),
    }

    const safetyBackup = {
      exportedAt: new Date().toISOString(),
      version: 1,
      reason: 'pre-restore-safety',
      data: currentData,
    }

    const safetyTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safetyKey = `backups/safety-${safetyTimestamp}.json`

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: safetyKey,
        Body: JSON.stringify(safetyBackup, null, 2),
        ContentType: 'application/json',
      })
    )

    // Phase 1: Delete orphaned records (in DB but not in backup)
    const backupUserIds = new Set(backup.data.users.map((u: any) => u.id))
    const backupOrderIds = new Set(backup.data.orders.map((o: any) => o.id))
    const backupProductIds = new Set(backup.data.products.map((p: any) => p.id))
    const backupCheckInIds = new Set(backup.data.checkIns.map((c: any) => c.id))
    const backupPromoCodeIds = new Set(backup.data.promoCodes.map((p: any) => p.id))
    const backupVWCodeIds = new Set(backup.data.virtualWalletCodes.map((v: any) => v.id))
    const backupCouponIds = new Set(backup.data.coupons.map((c: any) => c.id))
    const backupSubscriptionIds = new Set(backup.data.subscriptions.map((s: any) => s.id))
    const backupInviteRewardIds = new Set(backup.data.inviteRewards.map((i: any) => i.id))
    const backupEmailVerificationIds = new Set(backup.data.emailVerifications.map((e: any) => e.id))

    // Delete orphaned records (careful with order due to foreign keys)
    const orphanedOrders = currentData.orders.filter((o: any) => !backupOrderIds.has(o.id))
    for (const order of orphanedOrders) {
      await db.order.delete({ where: { id: order.id } })
    }

    const orphanedCheckIns = currentData.checkIns.filter((c: any) => !backupCheckInIds.has(c.id))
    for (const checkIn of orphanedCheckIns) {
      await db.checkIn.delete({ where: { id: checkIn.id } })
    }

    const orphanedCoupons = currentData.coupons.filter((c: any) => !backupCouponIds.has(c.id))
    for (const coupon of orphanedCoupons) {
      await db.coupon.delete({ where: { id: coupon.id } })
    }

    const orphanedInviteRewards = currentData.inviteRewards.filter((i: any) => !backupInviteRewardIds.has(i.id))
    for (const ir of orphanedInviteRewards) {
      await db.inviteReward.delete({ where: { id: ir.id } })
    }

    const orphanedEmailVerifications = currentData.emailVerifications.filter((e: any) => !backupEmailVerificationIds.has(e.id))
    for (const ev of orphanedEmailVerifications) {
      await db.emailVerification.delete({ where: { id: ev.id } })
    }

    const orphanedSubscriptions = currentData.subscriptions.filter((s: any) => !backupSubscriptionIds.has(s.id))
    for (const sub of orphanedSubscriptions) {
      await db.subscription.delete({ where: { id: sub.id } })
    }

    const orphanedPromoCodes = currentData.promoCodes.filter((p: any) => !backupPromoCodeIds.has(p.id))
    for (const pc of orphanedPromoCodes) {
      await db.promoCode.delete({ where: { id: pc.id } })
    }

    const orphanedVWCodes = currentData.virtualWalletCodes.filter((v: any) => !backupVWCodeIds.has(v.id))
    for (const vwc of orphanedVWCodes) {
      await db.virtualWalletCode.delete({ where: { id: vwc.id } })
    }

    const orphanedProducts = currentData.products.filter((p: any) => !backupProductIds.has(p.id))
    for (const product of orphanedProducts) {
      await db.product.delete({ where: { id: product.id } })
    }

    const orphanedUsers = currentData.users.filter((u: any) => !backupUserIds.has(u.id))
    for (const user of orphanedUsers) {
      await db.user.delete({ where: { id: user.id } })
    }

    // Phase 2: Upsert all records from backup
    // Upsert users (including ALL User fields)
    for (const user of backup.data.users) {
      await db.user.upsert({
        where: { id: user.id },
        update: {
          username: user.username,
          password: user.password,
          realName: user.realName ?? null,
          email: user.email ?? null,
          phone: user.phone ?? null,
          membershipLevel: user.membershipLevel,
          points: user.points,
          walletBalance: user.walletBalance,
          checkInStreak: user.checkInStreak,
          lastCheckIn: user.lastCheckIn ?? null,
          isNewUser: user.isNewUser,
          newUserDaysLeft: user.newUserDaysLeft,
          discountUsedWeek: user.discountUsedWeek ?? null,
          discountUsedCount: user.discountUsedCount,
          purchaseDisabled: user.purchaseDisabled,
          inviteCode: user.inviteCode,
          invitedBy: user.invitedBy ?? null,
          emailVerified: user.emailVerified,
          isFrozen: user.isFrozen,
          frozenReason: user.frozenReason ?? null,
          frozenAt: user.frozenAt ? new Date(user.frozenAt) : null,
          isDeveloper: user.isDeveloper,
          isPrimaryDeveloper: user.isPrimaryDeveloper,
          dailyEarnings: user.dailyEarnings,
          dailyEarningsDate: user.dailyEarningsDate ?? null,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
        create: {
          id: user.id,
          username: user.username,
          password: user.password,
          realName: user.realName ?? null,
          email: user.email ?? null,
          phone: user.phone ?? null,
          membershipLevel: user.membershipLevel,
          points: user.points,
          walletBalance: user.walletBalance,
          checkInStreak: user.checkInStreak,
          lastCheckIn: user.lastCheckIn ?? null,
          isNewUser: user.isNewUser,
          newUserDaysLeft: user.newUserDaysLeft,
          discountUsedWeek: user.discountUsedWeek ?? null,
          discountUsedCount: user.discountUsedCount,
          purchaseDisabled: user.purchaseDisabled,
          inviteCode: user.inviteCode,
          invitedBy: user.invitedBy ?? null,
          emailVerified: user.emailVerified,
          isFrozen: user.isFrozen,
          frozenReason: user.frozenReason ?? null,
          frozenAt: user.frozenAt ? new Date(user.frozenAt) : null,
          isDeveloper: user.isDeveloper,
          isPrimaryDeveloper: user.isPrimaryDeveloper,
          dailyEarnings: user.dailyEarnings,
          dailyEarningsDate: user.dailyEarningsDate ?? null,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      })
    }

    // Upsert products
    for (const product of backup.data.products) {
      await db.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
          brand: product.brand,
          isActive: product.isActive,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
        },
        create: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
          brand: product.brand,
          isActive: product.isActive,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
        },
      })
    }

    // Upsert orders
    for (const order of backup.data.orders) {
      await db.order.upsert({
        where: { id: order.id },
        update: {
          orderNumber: order.orderNumber,
          userId: order.userId,
          productId: order.productId,
          quantity: order.quantity,
          totalPrice: order.totalPrice,
          status: order.status,
          paymentMethod: order.paymentMethod,
          deliveryMethod: order.deliveryMethod,
          classGroup: order.classGroup ?? null,
          studentNumber: order.studentNumber ?? null,
          pickupDate: order.pickupDate ?? null,
          pickupTime: order.pickupTime ?? null,
          promoCode: order.promoCode ?? null,
          couponId: order.couponId ?? null,
          discount: order.discount,
          realName: order.realName,
          email: order.email,
          phone: order.phone,
          notes: order.notes ?? null,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        },
        create: {
          id: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          productId: order.productId,
          quantity: order.quantity,
          totalPrice: order.totalPrice,
          status: order.status,
          paymentMethod: order.paymentMethod,
          deliveryMethod: order.deliveryMethod,
          classGroup: order.classGroup ?? null,
          studentNumber: order.studentNumber ?? null,
          pickupDate: order.pickupDate ?? null,
          pickupTime: order.pickupTime ?? null,
          promoCode: order.promoCode ?? null,
          couponId: order.couponId ?? null,
          discount: order.discount,
          realName: order.realName,
          email: order.email,
          phone: order.phone,
          notes: order.notes ?? null,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        },
      })
    }

    // Upsert check-ins
    for (const checkIn of backup.data.checkIns) {
      await db.checkIn.upsert({
        where: { id: checkIn.id },
        update: {
          userId: checkIn.userId,
          day: checkIn.day,
          points: checkIn.points,
          date: checkIn.date,
          purchased: checkIn.purchased,
          createdAt: new Date(checkIn.createdAt),
        },
        create: {
          id: checkIn.id,
          userId: checkIn.userId,
          day: checkIn.day,
          points: checkIn.points,
          date: checkIn.date,
          purchased: checkIn.purchased,
          createdAt: new Date(checkIn.createdAt),
        },
      })
    }

    // Upsert promo codes
    for (const promo of backup.data.promoCodes) {
      await db.promoCode.upsert({
        where: { id: promo.id },
        update: {
          code: promo.code,
          name: promo.name,
          description: promo.description ?? null,
          discount: promo.discount,
          usageCount: promo.usageCount,
          maxUsage: promo.maxUsage,
          isActive: promo.isActive,
          createdAt: new Date(promo.createdAt),
          updatedAt: new Date(promo.updatedAt),
        },
        create: {
          id: promo.id,
          code: promo.code,
          name: promo.name,
          description: promo.description ?? null,
          discount: promo.discount,
          usageCount: promo.usageCount,
          maxUsage: promo.maxUsage,
          isActive: promo.isActive,
          createdAt: new Date(promo.createdAt),
          updatedAt: new Date(promo.updatedAt),
        },
      })
    }

    // Upsert virtual wallet codes
    for (const vwc of backup.data.virtualWalletCodes) {
      await db.virtualWalletCode.upsert({
        where: { id: vwc.id },
        update: {
          code: vwc.code,
          amount: vwc.amount,
          used: vwc.used,
          usedBy: vwc.usedBy ?? null,
          createdAt: new Date(vwc.createdAt),
          usedAt: vwc.usedAt ? new Date(vwc.usedAt) : null,
        },
        create: {
          id: vwc.id,
          code: vwc.code,
          amount: vwc.amount,
          used: vwc.used,
          usedBy: vwc.usedBy ?? null,
          createdAt: new Date(vwc.createdAt),
          usedAt: vwc.usedAt ? new Date(vwc.usedAt) : null,
        },
      })
    }

    // Upsert coupons
    for (const coupon of backup.data.coupons) {
      await db.coupon.upsert({
        where: { id: coupon.id },
        update: {
          userId: coupon.userId,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description ?? null,
          discountPercent: coupon.discountPercent,
          minPurchase: coupon.minPurchase,
          isActive: coupon.isActive,
          usedAt: coupon.usedAt ? new Date(coupon.usedAt) : null,
          expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null,
          createdAt: new Date(coupon.createdAt),
        },
        create: {
          id: coupon.id,
          userId: coupon.userId,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description ?? null,
          discountPercent: coupon.discountPercent,
          minPurchase: coupon.minPurchase,
          isActive: coupon.isActive,
          usedAt: coupon.usedAt ? new Date(coupon.usedAt) : null,
          expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null,
          createdAt: new Date(coupon.createdAt),
        },
      })
    }

    // Upsert subscriptions
    for (const sub of backup.data.subscriptions) {
      await db.subscription.upsert({
        where: { id: sub.id },
        update: {
          userId: sub.userId,
          username: sub.username,
          membershipLevel: sub.membershipLevel,
          createdAt: new Date(sub.createdAt),
        },
        create: {
          id: sub.id,
          userId: sub.userId,
          username: sub.username,
          membershipLevel: sub.membershipLevel,
          createdAt: new Date(sub.createdAt),
        },
      })
    }

    // Upsert invite rewards
    for (const ir of backup.data.inviteRewards) {
      await db.inviteReward.upsert({
        where: { id: ir.id },
        update: {
          inviterId: ir.inviterId,
          inviteeId: ir.inviteeId,
          inviteeName: ir.inviteeName,
          reward: ir.reward,
          walletReward: ir.walletReward,
          createdAt: new Date(ir.createdAt),
        },
        create: {
          id: ir.id,
          inviterId: ir.inviterId,
          inviteeId: ir.inviteeId,
          inviteeName: ir.inviteeName,
          reward: ir.reward,
          walletReward: ir.walletReward,
          createdAt: new Date(ir.createdAt),
        },
      })
    }

    // Upsert email verifications
    for (const ev of backup.data.emailVerifications) {
      await db.emailVerification.upsert({
        where: { id: ev.id },
        update: {
          email: ev.email,
          code: ev.code,
          userId: ev.userId ?? null,
          verified: ev.verified,
          expiresAt: new Date(ev.expiresAt),
          createdAt: new Date(ev.createdAt),
        },
        create: {
          id: ev.id,
          email: ev.email,
          code: ev.code,
          userId: ev.userId ?? null,
          verified: ev.verified,
          expiresAt: new Date(ev.expiresAt),
          createdAt: new Date(ev.createdAt),
        },
      })
    }

    // Set restore notification flag (save to local file for reliable notification)
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const notifyData = {
        lastRestore: new Date().toISOString(),
        message: `Database restored from backup: ${targetKey}`,
        safetyBackupKey: safetyKey,
        restoredFrom: targetKey,
      }
      await fs.writeFile(
        path.join(process.cwd(), '.restore-notify.json'),
        JSON.stringify(notifyData, null, 2)
      )
    } catch {
      // Ignore file write errors
    }

    return NextResponse.json({
      message: 'Restore completed successfully',
      restoredFrom: targetKey,
      safetyBackupKey: safetyKey,
      recordCounts: {
        users: backup.data.users.length,
        orders: backup.data.orders.length,
        products: backup.data.products.length,
        checkIns: backup.data.checkIns.length,
        promoCodes: backup.data.promoCodes.length,
        virtualWalletCodes: backup.data.virtualWalletCodes.length,
        coupons: backup.data.coupons.length,
        subscriptions: backup.data.subscriptions.length,
        inviteRewards: backup.data.inviteRewards.length,
        emailVerifications: backup.data.emailVerifications.length,
      },
      orphanedDeleted: {
        users: orphanedUsers.length,
        orders: orphanedOrders.length,
        products: orphanedProducts.length,
        checkIns: orphanedCheckIns.length,
        promoCodes: orphanedPromoCodes.length,
        virtualWalletCodes: orphanedVWCodes.length,
        coupons: orphanedCoupons.length,
        subscriptions: orphanedSubscriptions.length,
        inviteRewards: orphanedInviteRewards.length,
        emailVerifications: orphanedEmailVerifications.length,
      },
    })
  } catch (error) {
    console.error('Cloud restore failed:', error)
    return NextResponse.json(
      { error: 'Cloud restore failed', details: String(error) },
      { status: 500 }
    )
  }
}
