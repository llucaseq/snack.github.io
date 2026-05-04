import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3'
import { getS3Config } from '@/lib/app-config'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

export const dynamic = 'force-dynamic'

// AES-256-CBC encryption helpers
const algorithm = 'aes-256-cbc'

function encrypt(text: string, key: string): string {
  const iv = randomBytes(16)
  const derivedKey = scryptSync(key, 'salt-member-store', 32)
  const cipher = createCipheriv(algorithm, derivedKey, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(encryptedText: string, key: string): string {
  const [ivHex, encrypted] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const derivedKey = scryptSync(key, 'salt-member-store', 32)
  const decipher = createDecipheriv(algorithm, derivedKey, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// Get or create the encryption key from AppConfig
async function getOrCreateEncryptionKey(): Promise<string> {
  const config = await db.appConfig.findUnique({ where: { key: 'encryption_key' } })
  if (config) {
    return config.value
  }

  // Generate a new random 32-byte hex key
  const newKey = randomBytes(32).toString('hex')
  await db.appConfig.create({
    data: {
      key: 'encryption_key',
      value: newKey,
      encrypted: false,
    },
  })
  return newKey
}

// Create a fresh S3 client for each operation to avoid stale config issues
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

// POST: Sync a single user to S3, or sync-all users
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = body?.action

    // Sync all users
    if (action === 'sync-all') {
      const users = await db.user.findMany()
      const encryptionKey = await getOrCreateEncryptionKey()
      const client = await getS3Client()
      const bucket = await getBucketAsync()
      await ensureBucketExists(client, bucket)

      let syncedCount = 0
      for (const user of users) {
        try {
          // Remove password before encrypting
          const { password: _pwd, ...userData } = user
          const jsonString = JSON.stringify(userData)
          const encryptedData = encrypt(jsonString, encryptionKey)

          await client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: `users/${user.id}.enc`,
              Body: encryptedData,
              ContentType: 'application/octet-stream',
            })
          )
          syncedCount++
        } catch (err) {
          console.error(`Failed to sync user ${user.id}:`, err)
        }
      }

      return NextResponse.json({
        success: true,
        syncedCount,
        totalUsers: users.length,
      })
    }

    // Sync a single user
    const { userId } = body || {}
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const encryptionKey = await getOrCreateEncryptionKey()
    const client = await getS3Client()
    const bucket = await getBucketAsync()
    await ensureBucketExists(client, bucket)

    // Remove password before encrypting
    const { password: _pwd, ...userData } = user
    const jsonString = JSON.stringify(userData)
    const encryptedData = encrypt(jsonString, encryptionKey)

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `users/${userId}.enc`,
        Body: encryptedData,
        ContentType: 'application/octet-stream',
      })
    )

    return NextResponse.json({
      success: true,
      key: `users/${userId}.enc`,
    })
  } catch (error) {
    console.error('Cloud user sync failed:', error)
    return NextResponse.json(
      { error: 'Cloud user sync failed', details: String(error) },
      { status: 500 }
    )
  }
}

// GET: Download and decrypt a user's data from S3
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const encryptionKey = await getOrCreateEncryptionKey()
    const client = await getS3Client()
    const bucket = await getBucketAsync()
    await ensureBucketExists(client, bucket)

    // Download encrypted file from S3
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: `users/${userId}.enc`,
      })
    )

    const encryptedBody = await response.Body?.transformToString()
    if (!encryptedBody) {
      return NextResponse.json(
        { error: 'No data found for this user in S3' },
        { status: 404 }
      )
    }

    // Decrypt the data
    const decryptedJson = decrypt(encryptedBody, encryptionKey)
    const userData = JSON.parse(decryptedJson)

    return NextResponse.json({
      success: true,
      data: userData,
    })
  } catch (error) {
    console.error('Cloud user download failed:', error)
    return NextResponse.json(
      { error: 'Cloud user download failed', details: String(error) },
      { status: 500 }
    )
  }
}
