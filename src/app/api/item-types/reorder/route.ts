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

    const { itemTypeIds, childId } = await request.json()
    if (!Array.isArray(itemTypeIds) || !childId) {
      return NextResponse.json({ error: 'itemTypeIds (array) and childId are required' }, { status: 400 })
    }

    // Verify the child belongs to the current user
    const child = await prisma.child.findFirst({
      where: { 
        id: childId,
        user: { email: session.user.email }
      }
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // Update sort order for each item type
    await Promise.all(
      itemTypeIds.map((itemTypeId: string, index: number) =>
        prisma.itemType.update({
          where: {
            id: itemTypeId,
            childId: childId // Ensure item type belongs to this child
          },
          data: {
            sortOrder: index
          }
        })
      )
    )

    // Return updated item types for this child
    const updatedItemTypes = await prisma.itemType.findMany({
      where: { childId },
      orderBy: [
        { sortOrder: 'asc' },
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json(updatedItemTypes)
  } catch (error) {
    console.error('Error reordering item types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}