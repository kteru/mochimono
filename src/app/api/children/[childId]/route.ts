import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params
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

    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId: user.id
      }
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const updatedChild = await prisma.child.update({
      where: { id: childId },
      data: { name: name.trim() },
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

    return NextResponse.json(updatedChild)
  } catch (error) {
    console.error('Error updating child:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params
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

    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        userId: user.id
      }
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    await prisma.child.delete({
      where: { id: childId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting child:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}