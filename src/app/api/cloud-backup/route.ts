import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { createHash } from 'crypto'
import { getS3Config } from '@/lib/app-config'

export const dynamic = 'force-dynamic'

// Create a fresh S3 client for each backup operation to avoid stale config issues
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

function computeDataHash(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const force = body?.force === true

    const client = await getS3Client()
    const bucket = await getBucketAsync()
    await ensureBucketExists(client, bucket)

    // Collect ALL data from DB
    const [
      users,
      orders,
      products,
      checkIns,
      promoCodes,
      virtualWalletCodes,
      coupons,
      subscriptions,
      inviteRewards,
      emailVerifications,
    ] = await Promise.all([
      db.user.findMany(),
      db.order.findMany(),
      db.product.findMany(),
      db.checkIn.findMany(),
      db.promoCode.findMany(),
      db.virtualWalletCode.findMany(),
      db.coupon.findMany(),
      db.subscription.findMany(),
      db.inviteReward.findMany(),
      db.emailVerification.findMany(),
    ])

    const backupData = {
      exportedAt: new Date().toISOString(),
      version: 1,
      data: {
        users,
        orders,
        products,
        checkIns,
        promoCodes,
        virtualWalletCodes,
        coupons,
        subscriptions,
        inviteRewards,
        emailVerifications,
      },
    }

    const jsonString = JSON.stringify(backupData, null, 2)
    const dataHash = computeDataHash(jsonString)

    // Change detection: skip if data hash unchanged (unless force=true)
    if (!force) {
      try {
        const latestResponse = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: 'backups/latest.json',
            MaxKeys: 1,
          })
        )
        const latestObj = latestResponse.Contents?.[0]
        if (latestObj) {
          // Get the latest.json to read the hash
          const { GetObjectCommand } = await import('@aws-sdk/client-s3')
          const latestResult = await client.send(
            new GetObjectCommand({ Bucket: bucket, Key: 'backups/latest.json' })
          )
          const latestBody = await latestResult.Body?.transformToString()
          if (latestBody) {
            const latestInfo = JSON.parse(latestBody)
            if (latestInfo.dataHash === dataHash) {
              return NextResponse.json({
                message: 'No changes detected since last backup. Skipping.',
                dataHash,
                skipped: true,
              })
            }
          }
        }
      } catch {
        // latest.json may not exist yet, proceed with backup
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupKey = `backups/backup-${timestamp}.json`

    // Upload backup JSON to S3
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: backupKey,
        Body: jsonString,
        ContentType: 'application/json',
      })
    )

    // Upload latest.json metadata
    const latestInfo = JSON.stringify({
      dataHash,
      backupKey,
      exportedAt: backupData.exportedAt,
      recordCounts: {
        users: users.length,
        orders: orders.length,
        products: products.length,
        checkIns: checkIns.length,
        promoCodes: promoCodes.length,
        virtualWalletCodes: virtualWalletCodes.length,
        coupons: coupons.length,
        subscriptions: subscriptions.length,
        inviteRewards: inviteRewards.length,
        emailVerifications: emailVerifications.length,
      },
    })

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: 'backups/latest.json',
        Body: latestInfo,
        ContentType: 'application/json',
      })
    )

    // Auto-delete old backups: keep only latest backup + latest.json
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

    // Delete all but the most recent backup
    const oldBackups = backupFiles.slice(1)
    for (const oldBackup of oldBackups) {
      if (oldBackup.Key) {
        await client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: oldBackup.Key })
        )
      }
    }

    return NextResponse.json({
      message: 'Backup completed successfully',
      backupKey,
      dataHash,
      exportedAt: backupData.exportedAt,
      recordCounts: {
        users: users.length,
        orders: orders.length,
        products: products.length,
        checkIns: checkIns.length,
        promoCodes: promoCodes.length,
        virtualWalletCodes: virtualWalletCodes.length,
        coupons: coupons.length,
        subscriptions: subscriptions.length,
        inviteRewards: inviteRewards.length,
        emailVerifications: emailVerifications.length,
      },
      oldBackupsDeleted: oldBackups.length,
    })
  } catch (error) {
    console.error('Cloud backup failed:', error)
    return NextResponse.json(
      { error: 'Cloud backup failed', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const client = await getS3Client()
    const bucket = await getBucketAsync()
    await ensureBucketExists(client, bucket)

    // List backup files from S3
    const listResponse = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'backups/',
      })
    )

    const files = (listResponse.Contents || []).map((obj) => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified?.toISOString(),
    }))

    // Get latest backup info
    let latestInfo = null
    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3')
      const latestResult = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: 'backups/latest.json' })
      )
      const latestBody = await latestResult.Body?.transformToString()
      if (latestBody) {
        latestInfo = JSON.parse(latestBody)
      }
    } catch {
      // latest.json may not exist
    }

    return NextResponse.json({
      files,
      latest: latestInfo,
    })
  } catch (error) {
    console.error('Failed to list backups:', error)
    return NextResponse.json(
      { error: 'Failed to list backups', details: String(error) },
      { status: 500 }
    )
  }
}
