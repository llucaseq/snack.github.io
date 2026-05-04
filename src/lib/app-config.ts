import { db } from '@/lib/db'

/**
 * Read app configuration from database (AppConfig table),
 * falling back to environment variables if not found.
 */
export async function getAppConfig(keys: string[]): Promise<Record<string, string>> {
  const configs = await db.appConfig.findMany({
    where: { key: { in: keys } },
  })

  const result: Record<string, string> = {}
  for (const config of configs) {
    result[config.key] = config.value
  }
  return result
}

/**
 * Get S3 configuration from database or env
 */
export async function getS3Config() {
  const config = await getAppConfig([
    's3_endpoint',
    's3_region',
    's3_access_key',
    's3_secret_key',
    's3_bucket',
  ])

  return {
    endpoint: config.s3_endpoint || process.env.S3_ENDPOINT || '',
    region: config.s3_region || process.env.S3_REGION || 'eu-west-3',
    accessKeyId: config.s3_access_key || process.env.S3_ACCESS_KEY || '',
    secretAccessKey: config.s3_secret_key || process.env.S3_SECRET_KEY || '',
    bucket: config.s3_bucket || process.env.S3_BUCKET || 'member-store-backup',
  }
}

/**
 * Get SMTP configuration from database or env
 */
export async function getSmtpConfigFromDb() {
  const config = await getAppConfig([
    'smtp_host',
    'smtp_port',
    'smtp_user',
    'smtp_pass',
    'smtp_from',
  ])

  return {
    host: config.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(config.smtp_port || process.env.SMTP_PORT || 587),
    user: config.smtp_user || process.env.SMTP_USER || '',
    pass: config.smtp_pass || process.env.SMTP_PASS || '',
    from: config.smtp_from || process.env.SMTP_FROM || '',
  }
}
