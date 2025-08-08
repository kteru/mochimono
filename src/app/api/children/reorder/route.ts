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

    const { childIds } = await request.json()
    if (!Array.isArray(childIds)) {
      return NextResponse.json({ error: 'childIds must be an array' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update sort order for each child
    await Promise.all(
      childIds.map((childId: string, index: number) =>
        prisma.child.update({
          where: {
            id: childId,
            userId: user.id // Ensure user owns this child
          },
          data: {
            sortOrder: index
          }
        })
      )
    )

    // Return updated children
    const updatedChildren = await prisma.child.findMany({
      where: { userId: user.id },
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
    })

    return NextResponse.json(updatedChildren)
  } catch (error) {
    console.error('Error reordering children:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}