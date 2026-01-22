import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function GET() {
  try {
    // Check environment variables
    const envStatus = {
      AWS_REGION: !!process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
      AWS_S3_BUCKET: !!process.env.AWS_S3_BUCKET,
    }

    const missingVars = Object.entries(envStatus)
      .filter(([_, exists]) => !exists)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required environment variables',
          missingVariables: missingVars,
          envStatus,
        },
        { status: 500 }
      )
    }

    // Try to initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    // Try to generate a presigned URL
    const testKey = `test/${Date.now()}-test.txt`
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: testKey,
      ContentType: 'text/plain',
    })

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60, // 1 minute for testing
    })

    return NextResponse.json({
      status: 'success',
      message: 'S3 is properly configured',
      envStatus,
      testPresignedUrl: uploadUrl.substring(0, 100) + '...', // Truncate for security
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        error: String(error),
      },
      { status: 500 }
    )
  }
}
