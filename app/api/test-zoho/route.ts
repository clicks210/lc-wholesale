import { NextResponse } from 'next/server'
import { getZohoAccessToken } from '@/lib/zoho'

export async function GET() {
  try {
    const accessToken = await getZohoAccessToken()

    if (!accessToken) {
      throw new Error('Zoho access token was not returned')
    }

    return NextResponse.json({
      success: true,
      tokenPreview: `${accessToken.slice(0, 12)}...`,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Zoho test failed',
      },
      { status: 500 }
    )
  }
}