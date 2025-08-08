import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_ITEM_TYPES = ['シャツ', '肌着', 'ズボン', '靴下', 'おむつ', 'おしりふき']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        children: {
          include: {
            itemTypes: {
              orderBy: [
                { sortOrder: 'asc' },
                { isDefault: 'desc' },
                { createdAt: 'asc' }
              ]
            },
            childItems: {
              include: {
                itemType: true
              }
            }
          },
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user.children)
  } catch (error) {
    console.error('Error fetching children:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the max sort order for existing children
    const maxSortOrderResult = await prisma.child.findFirst({
      where: { userId: user.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })
    
    const nextSortOrder = maxSortOrderResult ? maxSortOrderResult.sortOrder + 1 : 0

    const child = await prisma.child.create({
      data: {
        name,
        userId: user.id,
        sortOrder: nextSortOrder
      }
    })

    // Create default item types for the new child
    await Promise.all(
      DEFAULT_ITEM_TYPES.map((itemName, index) =>
        prisma.itemType.create({
          data: {
            name: itemName,
            childId: child.id,
            isDefault: true,
            sortOrder: index
          }
        })
      )
    )

    // Fetch the created child with all related data
    const childWithItems = await prisma.child.findUnique({
      where: { id: child.id },
      include: {
        itemTypes: {
          orderBy: [
            { sortOrder: 'asc' },
            { isDefault: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        childItems: {
          include: {
            itemType: true
          }
        }
      }
    })

    return NextResponse.json(childWithItems)
  } catch (error) {
    console.error('Error creating child:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}