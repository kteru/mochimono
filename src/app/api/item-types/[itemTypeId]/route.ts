import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemTypeId: string }> }
) {
  const { itemTypeId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const itemType = await prisma.itemType.findFirst({
      where: {
        id: itemTypeId,
        child: {
          user: { email: session.user.email }
        }
      },
      include: {
        child: true
      }
    })

    if (!itemType) {
      return NextResponse.json({ error: 'Item type not found' }, { status: 404 })
    }

    // Check for duplicate name within the same child
    const existingItemType = await prisma.itemType.findFirst({
      where: {
        childId: itemType.childId,
        name: name.trim(),
        id: { not: itemTypeId }
      }
    })

    if (existingItemType) {
      return NextResponse.json({ error: 'Item type name already exists' }, { status: 400 })
    }

    const updatedItemType = await prisma.itemType.update({
      where: { id: itemTypeId },
      data: { name: name.trim() }
    })

    return NextResponse.json(updatedItemType)
  } catch (error) {
    console.error('Error updating item type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemTypeId: string }> }
) {
  const { itemTypeId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const itemType = await prisma.itemType.findFirst({
      where: {
        id: itemTypeId,
        child: {
          user: { email: session.user.email }
        }
      }
    })

    if (!itemType) {
      return NextResponse.json({ error: 'Item type not found' }, { status: 404 })
    }

    await prisma.itemType.delete({
      where: { id: itemTypeId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}