'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Stack, Paper, Button, Modal, TextInput, Group, ActionIcon, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus, IconUser } from '@tabler/icons-react'
import { ChildCard } from '@/components/child-card'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ItemType {
  id: string
  name: string
  isDefault: boolean
  sortOrder: number
}

interface ChildItem {
  id: string
  quantity: number
  itemType: ItemType
}

interface Child {
  id: string
  name: string
  sortOrder: number
  itemTypes: ItemType[]
  childItems: ChildItem[]
}

interface SortableChildCardProps {
  child: Child
  onDeleteChild: (childId: string) => void
  onUpdateChildItem: (childId: string, itemTypeId: string, quantity: number) => void
  onDeleteItemType: (childId: string, itemTypeId: string) => void
  onAddItemType: (childId: string, itemType: ItemType) => void
  onReorderItemTypes: (childId: string, itemTypes: ItemType[]) => void
  onUpdateChild: (child: Child) => void
  feedbackStates: Map<string, 'idle' | 'success' | 'error'>
}

function SortableChildCard(props: SortableChildCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.child.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ChildCard
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  )
}

export function ChildrenManager() {
  const [children, setChildren] = useState<Child[]>([])
  const [newChildName, setNewChildName] = useState('')
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [loading, setLoading] = useState(true)
  const [opened, { open, close }] = useDisclosure(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Ref for debouncing
  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

  // Feedback state for API success/error
  const [feedbackStates, setFeedbackStates] = useState<Map<string, 'idle' | 'success' | 'error'>>(new Map())
  const feedbackTimeouts = useRef<Record<string, NodeJS.Timeout>>({})
  // Store original quantities before changes for error recovery
  const originalQuantities = useRef<Record<string, number>>({})

  useEffect(() => {
    fetchData()
  }, [])

  // Clean up timers when component unmounts
  useEffect(() => {
    const timeouts = debounceTimeouts.current
    const feedbackTimers = feedbackTimeouts.current
    return () => {
      Object.values(timeouts).forEach(timeout => {
        clearTimeout(timeout)
      })
      Object.values(feedbackTimers).forEach(timeout => {
        clearTimeout(timeout)
      })
    }
  }, [])

  const fetchData = async () => {
    try {
      const childrenRes = await fetch('/api/children')
      
      if (childrenRes.ok) {
        const childrenData = await childrenRes.json()
        setChildren(childrenData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addChild = async () => {
    if (!newChildName.trim()) return

    setIsAddingChild(true)
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChildName })
      })

      if (res.ok) {
        const child = await res.json()
        setChildren(prev => [...prev, child])
        setNewChildName('')
        close()
      }
    } catch (error) {
      console.error('Error adding child:', error)
    } finally {
      setIsAddingChild(false)
    }
  }

  const deleteChild = async (childId: string) => {
    try {
      const res = await fetch(`/api/children/${childId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setChildren(prev => prev.filter(child => child.id !== childId))
      }
    } catch (error) {
      console.error('Error deleting child:', error)
    }
  }

  // Helper function to set feedback state and auto-reset after 1 second
  const setFeedbackState = useCallback((key: string, state: 'success' | 'error') => {
    setFeedbackStates(prev => new Map(prev).set(key, state))
    
    // Clear existing timer for this item
    if (feedbackTimeouts.current[key]) {
      clearTimeout(feedbackTimeouts.current[key])
    }
    
    // Reset to idle after 0.5 second
    feedbackTimeouts.current[key] = setTimeout(() => {
      setFeedbackStates(prev => new Map(prev).set(key, 'idle'))
      delete feedbackTimeouts.current[key]
    }, 500)
  }, [setFeedbackStates])

  // Actual function to call API
  const updateChildItemAPI = useCallback(async (childId: string, itemTypeId: string, quantity: number) => {
    const key = `${childId}-${itemTypeId}`
    
    try {
      const res = await fetch('/api/child-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, itemTypeId, quantity })
      })

      if (res.ok) {
        const updatedItem = await res.json()
        console.log('Quantity updated in database:', { childId, itemTypeId, quantity })
        // Set success feedback
        setFeedbackState(key, 'success')
      } else {
        throw new Error('API request failed')
      }
    } catch (error) {
      console.error('Error updating child item:', error)
      // Set error feedback and revert UI state
      setFeedbackState(key, 'error')
      
      // Revert the UI back to original quantity
      const originalQuantity = originalQuantities.current[key] || 0
      
      // Revert UI state
      setChildren(prev => prev.map(child => {
        if (child.id === childId) {
          const existingItemIndex = child.childItems.findIndex(
            item => item.itemType.id === itemTypeId
          )
          
          if (existingItemIndex >= 0) {
            const updatedChildItems = [...child.childItems]
            updatedChildItems[existingItemIndex] = {
              ...updatedChildItems[existingItemIndex],
              quantity: originalQuantity
            }
            return { ...child, childItems: updatedChildItems }
          }
        }
        return child
      }))
      
      // Clean up original quantity reference
      delete originalQuantities.current[key]
    }
  }, [setFeedbackState, setChildren])

  // updateChildItem function with debounce
  const updateChildItem = useCallback((childId: string, itemTypeId: string, quantity: number) => {
    const key = `${childId}-${itemTypeId}`
    
    // Store original quantity before making changes (only if not already stored)
    if (!originalQuantities.current[key]) {
      const currentChild = children.find(c => c.id === childId)
      if (currentChild) {
        const currentItem = currentChild.childItems.find(item => item.itemType.id === itemTypeId)
        originalQuantities.current[key] = currentItem?.quantity || 0
      }
    }
    
    // Update UI immediately
    setChildren(prev => prev.map(child => {
      if (child.id === childId) {
        const existingItemIndex = child.childItems.findIndex(
          item => item.itemType.id === itemTypeId
        )
        
        if (existingItemIndex >= 0) {
          const updatedChildItems = [...child.childItems]
          updatedChildItems[existingItemIndex] = {
            ...updatedChildItems[existingItemIndex],
            quantity
          }
          return { ...child, childItems: updatedChildItems }
        } else {
          // Create new item
          const newItem = {
            id: `temp-${Date.now()}`,
            quantity,
            itemType: child.itemTypes.find(it => it.id === itemTypeId)!
          }
          return {
            ...child,
            childItems: [...child.childItems, newItem]
          }
        }
      }
      return child
    }))

    // Clear existing timer
    if (debounceTimeouts.current[key]) {
      clearTimeout(debounceTimeouts.current[key])
    }

    // Call API after 1 second
    debounceTimeouts.current[key] = setTimeout(() => {
      updateChildItemAPI(childId, itemTypeId, quantity)
      delete debounceTimeouts.current[key]
      // Clean up original quantity on successful API call timing
      delete originalQuantities.current[key]
    }, 1000)
  }, [children, updateChildItemAPI])

  const deleteItemType = async (childId: string, itemTypeId: string) => {
    try {
      const res = await fetch(`/api/item-types/${itemTypeId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        // Remove item type from the target child
        setChildren(prev => prev.map(child => {
          if (child.id === childId) {
            return {
              ...child,
              itemTypes: child.itemTypes.filter(itemType => itemType.id !== itemTypeId),
              childItems: child.childItems.filter(item => item.itemType.id !== itemTypeId)
            }
          }
          return child
        }))
      }
    } catch (error) {
      console.error('Error deleting item type:', error)
    }
  }

  const addItemType = (childId: string, itemType: ItemType) => {
    setChildren(prev => prev.map(child => {
      if (child.id === childId) {
        return {
          ...child,
          itemTypes: [...child.itemTypes, itemType]
        }
      }
      return child
    }))
  }

  const reorderItemTypes = (childId: string, reorderedItemTypes: ItemType[]) => {
    setChildren(prev => prev.map(child => {
      if (child.id === childId) {
        return {
          ...child,
          itemTypes: reorderedItemTypes
        }
      }
      return child
    }))
  }

  const updateChild = (updatedChild: Child) => {
    setChildren(prev => prev.map(child => 
      child.id === updatedChild.id ? updatedChild : child
    ))
  }

  const handleChildrenDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = children.findIndex(child => child.id === active.id)
      const newIndex = children.findIndex(child => child.id === over?.id)
      
      const newChildren = arrayMove(children, oldIndex, newIndex)
      setChildren(newChildren)

      // Save the new order to the database
      try {
        const childIds = newChildren.map(child => child.id)
        await fetch('/api/children/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childIds })
        })
      } catch (error) {
        console.error('Error saving children order:', error)
      }
    }
  }

  if (loading) {
    return (
      <Stack align="center" gap="md">
        <Text>読み込み中...</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="sm">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleChildrenDragEnd}
      >
        <SortableContext
          items={children.map(child => child.id)}
          strategy={verticalListSortingStrategy}
        >
          {children.map(child => (
            <SortableChildCard
              key={child.id}
              child={child}
              onDeleteChild={deleteChild}
              onUpdateChildItem={updateChildItem}
              onDeleteItemType={deleteItemType}
              onAddItemType={addItemType}
              onReorderItemTypes={reorderItemTypes}
              onUpdateChild={updateChild}
              feedbackStates={feedbackStates}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Paper className="card-container" p="md" radius="lg" shadow="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <IconUser size={18} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Text fw={500} c="blue.6" size="sm">子供を追加</Text>
          </Group>
          <ActionIcon
            onClick={open}
            size="md"
            radius="xl"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            }}
          >
            <IconPlus size={16} />
          </ActionIcon>
        </Group>
      </Paper>

      <Modal opened={opened} onClose={close} title="新しい子供を追加" centered>
        <Stack gap="md">
          <TextInput
            placeholder="子供の名前を入力..."
            value={newChildName}
            onChange={(event) => setNewChildName(event.currentTarget.value)}
            onKeyPress={(event) => event.key === 'Enter' && addChild()}
            data-autofocus
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={close}>
              キャンセル
            </Button>
            <Button
              onClick={addChild}
              loading={isAddingChild}
              disabled={!newChildName.trim()}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              }}
            >
              追加
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}