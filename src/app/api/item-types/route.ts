import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')

    if (!childId) {
      return NextResponse.json({ error: 'childId is required' }, { status: 400 })
    }

    // Verify the child belongs to the current user
    const child = await prisma.child.findFirst({
      where: { 
        id: childId,
        user: { email: session.user.email }
      },
      include: {
        itemTypes: {
          orderBy: [
            { sortOrder: 'asc' },
            { isDefault: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      }
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    return NextResponse.json(child.itemTypes)
  } catch (error) {
    console.error('Error fetching item types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, childId } = await request.json()
    if (!name || !childId) {
      return NextResponse.json({ error: 'Name and childId are required' }, { status: 400 })
    }

    // Verify the child belongs to the current user
    const child = await prisma.child.findFirst({
      where: { 
        id: childId,
        user: { email: session.user.email }
      },
      include: {
        itemTypes: {
          orderBy: { sortOrder: 'desc' },
          take: 1
        }
      }
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const maxSortOrder = child.itemTypes.length > 0 ? child.itemTypes[0].sortOrder : -1

    const itemType = await prisma.itemType.create({
      data: {
        name,
        childId,
        isDefault: false,
        sortOrder: maxSortOrder + 1
      }
    })

    return NextResponse.json(itemType)
  } catch (error) {
    console.error('Error creating item type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}