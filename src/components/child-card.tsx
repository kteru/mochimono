'use client'

import { useState } from 'react'
import { Stack, Paper, Group, Text, ActionIcon, TextInput, Button, Modal, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { IconTrash, IconPlus, IconMinus, IconX, IconGripVertical, IconUser, IconEdit, IconGripHorizontal } from '@tabler/icons-react'
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
} from '@dnd-kit/sortable'
import {
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

interface ChildCardProps {
  child: Child
  dragHandleProps?: any
  isDragging?: boolean
  onDeleteChild: (childId: string) => void
  onUpdateChildItem: (childId: string, itemTypeId: string, quantity: number) => void
  onDeleteItemType: (childId: string, itemTypeId: string) => void
  onAddItemType: (childId: string, itemType: ItemType) => void
  onReorderItemTypes: (childId: string, itemTypes: ItemType[]) => void
  onUpdateChild: (child: Child) => void
  feedbackStates: Map<string, 'idle' | 'success' | 'error'>
}

interface SortableItemProps {
  itemType: ItemType
  quantity: number
  childId: string
  editMode: boolean
  onUpdateChildItem: (childId: string, itemTypeId: string, quantity: number) => void
  onDeleteItemType: (itemType: ItemType) => void
  onUpdateItemType: (itemType: ItemType) => void
  feedbackState: 'idle' | 'success' | 'error'
}

function SortableItem({ 
  itemType, 
  quantity, 
  childId,
  editMode,
  onUpdateChildItem, 
  onDeleteItemType,
  onUpdateItemType,
  feedbackState
}: SortableItemProps) {
  const [isEditingItemName, setIsEditingItemName] = useState(false)
  const [tempItemName, setTempItemName] = useState(itemType.name)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemType.id })

  // Get border color based on feedback state
  const getBorderColor = (state: 'idle' | 'success' | 'error') => {
    switch (state) {
      case 'success':
        return 'var(--mantine-color-green-5)'
      case 'error':
        return 'var(--mantine-color-red-5)'
      default:
        return 'rgba(233, 236, 239, 0.8)'
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: `${transition}, border-color 150ms ease-in-out`,
    opacity: isDragging ? 0.5 : 1,
    borderColor: getBorderColor(feedbackState),
  }

  const handleSaveItemName = async () => {
    if (!tempItemName.trim() || tempItemName.trim() === itemType.name) {
      setTempItemName(itemType.name)
      setIsEditingItemName(false)
      return
    }

    try {
      const res = await fetch(`/api/item-types/${itemType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempItemName.trim() })
      })

      if (res.ok) {
        const updatedItemType = await res.json()
        onUpdateItemType(updatedItemType)
        setIsEditingItemName(false)
      } else {
        // Reset to original name on error
        setTempItemName(itemType.name)
        setIsEditingItemName(false)
      }
    } catch (error) {
      console.error('Error updating item type name:', error)
      setTempItemName(itemType.name)
      setIsEditingItemName(false)
    }
  }

  const handleCancelItemNameEdit = () => {
    setTempItemName(itemType.name)
    setIsEditingItemName(false)
  }

  const handleItemNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveItemName()
    } else if (e.key === 'Escape') {
      handleCancelItemNameEdit()
    }
  }

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      className="item-row"
      p="4px 8px"
      radius="xs"
      shadow={isDragging ? "md" : "xs"}
    >
      <Group justify="space-between" align="center" gap="xs">
        <Group gap="4px" align="center">
          {editMode && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="xs"
              style={{ cursor: 'grab' }}
              {...attributes}
              {...listeners}
            >
              <IconGripVertical size={14} />
            </ActionIcon>
          )}
          {editMode && (
            <ActionIcon
              variant="outline"
              size="xs"
              radius="xl"
              color="red"
              onClick={() => onDeleteItemType(itemType)}
            >
              <IconMinus size={12} />
            </ActionIcon>
          )}
          {isEditingItemName ? (
            <TextInput
              value={tempItemName}
              onChange={(e) => setTempItemName(e.currentTarget.value)}
              onKeyDown={handleItemNameKeyDown}
              onBlur={handleSaveItemName}
              size="xs"
              variant="unstyled"
              fw={600}
              style={{
                color: 'var(--mantine-color-dark-8)',
                minWidth: '60px'
              }}
              autoFocus
              data-autofocus
            />
          ) : (
            <Text 
              fw={600} 
              c="dark.8" 
              size="xs"
              style={{ cursor: !editMode ? 'pointer' : 'default' }}
              onClick={() => !editMode && setIsEditingItemName(true)}
            >
              {itemType.name}
            </Text>
          )}
        </Group>
        
        {!editMode && (
          <Group gap="4px" align="center">
            <ActionIcon
              variant="outline"
              size="sm"
              radius="xl"
              color="blue"
              onClick={() => onUpdateChildItem(childId, itemType.id, quantity - 1)}
              disabled={quantity <= 0}
            >
              <IconMinus size={14} />
            </ActionIcon>
            
            <Paper
              bg={quantity === 0 ? "gray.2" : "blue.1"}
              c={quantity === 0 ? "gray.6" : "blue.8"}
              fw={700}
              ta="center"
              w={28}
              h={28}
              radius="xl"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text size="xs">{quantity}</Text>
            </Paper>
            
            <ActionIcon
              variant="outline"
              size="sm"
              radius="xl"
              color="blue"
              onClick={() => onUpdateChildItem(childId, itemType.id, quantity + 1)}
            >
              <IconPlus size={14} />
            </ActionIcon>
          </Group>
        )}
      </Group>
    </Paper>
  )
}

export function ChildCard({
  child,
  dragHandleProps,
  isDragging,
  onDeleteChild,
  onUpdateChildItem,
  onDeleteItemType,
  onAddItemType,
  onReorderItemTypes,
  onUpdateChild,
  feedbackStates,
}: ChildCardProps) {
  const [newItemName, setNewItemName] = useState('')
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [addItemOpened, { open: openAddItem, close: closeAddItem }] = useDisclosure(false)
  const [editMode, setEditMode] = useState(false)
  const [isEditingChildName, setIsEditingChildName] = useState(false)
  const [tempChildName, setTempChildName] = useState(child.name)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getItemQuantity = (itemTypeId: string) => {
    const item = child.childItems.find(item => item.itemType.id === itemTypeId)
    return item?.quantity || 0
  }

  const addCustomItem = async () => {
    if (!newItemName.trim()) return

    setIsAddingItem(true)
    try {
      const res = await fetch('/api/item-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName, childId: child.id })
      })

      if (res.ok) {
        const itemType = await res.json()
        onAddItemType(child.id, itemType)
        setNewItemName('')
        closeAddItem()
      }
    } catch (error) {
      console.error('Error adding custom item:', error)
    } finally {
      setIsAddingItem(false)
    }
  }

  const handleDeleteItemType = (itemType: ItemType) => {
    modals.openConfirmModal({
      title: '持ち物項目を削除',
      children: <Text>「{itemType.name}」を削除しますか？この操作は取り消せません。</Text>,
      labels: { confirm: '削除', cancel: 'キャンセル' },
      confirmProps: { color: 'red' },
      onCancel: () => {},
      onConfirm: () => onDeleteItemType(child.id, itemType.id),
    })
  }

  const handleDeleteChild = () => {
    modals.openConfirmModal({
      title: '子供を削除',
      children: <Text>「{child.name}」を削除しますか？この操作は取り消せません。</Text>,
      labels: { confirm: '削除', cancel: 'キャンセル' },
      confirmProps: { color: 'red' },
      onCancel: () => {},
      onConfirm: () => onDeleteChild(child.id),
    })
  }

  const handleSaveChildName = async () => {
    if (!tempChildName.trim() || tempChildName.trim() === child.name) {
      setTempChildName(child.name)
      setIsEditingChildName(false)
      return
    }

    try {
      const res = await fetch(`/api/children/${child.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempChildName.trim() })
      })

      if (res.ok) {
        const updatedChild = await res.json()
        onUpdateChild(updatedChild)
        setIsEditingChildName(false)
      } else {
        // Reset to original name on error
        setTempChildName(child.name)
        setIsEditingChildName(false)
      }
    } catch (error) {
      console.error('Error updating child name:', error)
      setTempChildName(child.name)
      setIsEditingChildName(false)
    }
  }

  const handleCancelChildNameEdit = () => {
    setTempChildName(child.name)
    setIsEditingChildName(false)
  }

  const handleChildNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveChildName()
    } else if (e.key === 'Escape') {
      handleCancelChildNameEdit()
    }
  }

  const handleUpdateItemType = (updatedItemType: ItemType) => {
    // Update the local state to reflect the name change
    const updatedChild = {
      ...child,
      itemTypes: child.itemTypes.map(itemType => 
        itemType.id === updatedItemType.id ? updatedItemType : itemType
      )
    }
    onUpdateChild(updatedChild)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = child.itemTypes.findIndex(item => item.id === active.id)
      const newIndex = child.itemTypes.findIndex(item => item.id === over?.id)
      
      const newItemTypes = arrayMove(child.itemTypes, oldIndex, newIndex)
      onReorderItemTypes(child.id, newItemTypes)

      // Save the new order to the database
      try {
        const itemTypeIds = newItemTypes.map(item => item.id)
        await fetch('/api/item-types/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemTypeIds, childId: child.id })
        })
      } catch (error) {
        console.error('Error saving item order:', error)
      }
    }
  }

  return (
    <>
      <Paper 
        className="card-container" 
        p="md" 
        radius="lg" 
        shadow={isDragging ? "md" : "sm"}
        style={{ 
          transition: 'box-shadow 200ms ease',
          transform: isDragging ? 'scale(1.02)' : 'scale(1)'
        }}
      >
        <Stack gap="sm">
          {/* Header */}
          <Group justify="space-between" align="center">
            <Group gap="sm" align="center">
              {dragHandleProps && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  style={{ cursor: 'grab' }}
                  {...dragHandleProps}
                >
                  <IconGripHorizontal size={16} />
                </ActionIcon>
              )}
              <Text size="lg">👶</Text>
              {isEditingChildName ? (
                <TextInput
                  value={tempChildName}
                  onChange={(e) => setTempChildName(e.currentTarget.value)}
                  onKeyDown={handleChildNameKeyDown}
                  onBlur={handleSaveChildName}
                  size="xs"
                  variant="unstyled"
                  fw={600}
                  style={{
                    fontSize: '1.125rem',
                    color: 'var(--mantine-color-dark-8)',
                    minWidth: '100px'
                  }}
                  autoFocus
                  data-autofocus
                />
              ) : (
                <Title 
                  order={3} 
                  size="h4" 
                  c="dark.8"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsEditingChildName(true)}
                >
                  {child.name}
                </Title>
              )}
            </Group>
            <Group gap="xs">
              {editMode && (
                <ActionIcon
                  variant="outline"
                  color="red"
                  size="md"
                  radius="xl"
                  onClick={handleDeleteChild}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              )}
              <Button
                variant={editMode ? "filled" : "subtle"}
                size="compact-xs"
                radius="lg"
                color={editMode ? "blue" : "gray"}
                onClick={() => setEditMode(!editMode)}
                leftSection={<IconEdit size={12} />}
              >
                {editMode ? "完了" : "編集"}
              </Button>
            </Group>
          </Group>

          {/* Items list with drag and drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Stack gap="2px">
              <SortableContext 
                items={child.itemTypes.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {child.itemTypes.map(itemType => {
                  const quantity = getItemQuantity(itemType.id)
                  const feedbackKey = `${child.id}-${itemType.id}`
                  const feedbackState = feedbackStates.get(feedbackKey) || 'idle'
                  return (
                    <SortableItem
                      key={itemType.id}
                      itemType={itemType}
                      quantity={quantity}
                      childId={child.id}
                      editMode={editMode}
                      onUpdateChildItem={onUpdateChildItem}
                      onDeleteItemType={handleDeleteItemType}
                      onUpdateItemType={handleUpdateItemType}
                      feedbackState={feedbackState}
                    />
                  )
                })}
              </SortableContext>
            </Stack>
          </DndContext>

          {/* Add item section */}
          <Paper
            p="sm"
            radius="md"
            style={{
              borderTop: '1px solid var(--mantine-color-blue-1)',
              background: 'rgba(59, 130, 246, 0.05)',
            }}
          >
            <Group justify="space-between" align="center">
              <Group gap="xs" align="center">
                <IconPlus size={14} style={{ color: 'var(--mantine-color-blue-6)' }} />
                <Text fw={500} c="blue.6" size="xs">新しい項目を追加</Text>
              </Group>
              <ActionIcon
                onClick={openAddItem}
                size="sm"
                radius="lg"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                }}
              >
                <IconPlus size={14} />
              </ActionIcon>
            </Group>
          </Paper>
        </Stack>
      </Paper>

      {/* Add Item Modal */}
      <Modal opened={addItemOpened} onClose={closeAddItem} title="新しい項目を追加" centered>
        <Stack gap="md">
          <TextInput
            placeholder="項目名を入力..."
            value={newItemName}
            onChange={(event) => setNewItemName(event.currentTarget.value)}
            onKeyPress={(event) => event.key === 'Enter' && addCustomItem()}
            data-autofocus
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={closeAddItem}>
              キャンセル
            </Button>
            <Button
              onClick={addCustomItem}
              loading={isAddingItem}
              disabled={!newItemName.trim()}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              }}
            >
              追加
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
