import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'mochimono'
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: 'Service unavailable' },
      { status: 503 }
    )
  }
}