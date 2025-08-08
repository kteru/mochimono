import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { childId, itemTypeId, quantity } = await request.json()
    
    if (!childId || !itemTypeId || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId: user.id
      }
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const itemType = await prisma.itemType.findFirst({
      where: {
        id: itemTypeId,
        childId: childId
      }
    })

    if (!itemType) {
      return NextResponse.json({ error: 'Item type not found' }, { status: 404 })
    }

    const childItem = await prisma.childItem.upsert({
      where: {
        childId_itemTypeId: {
          childId,
          itemTypeId
        }
      },
      update: {
        quantity: Math.max(0, quantity)
      },
      create: {
        childId,
        itemTypeId,
        quantity: Math.max(0, quantity)
      },
      include: {
        itemType: true
      }
    })

    return NextResponse.json(childItem)
  } catch (error) {
    console.error('Error updating child item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}