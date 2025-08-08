'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: React.ReactNode
  className?: string
}

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

interface DialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

interface DialogFooterProps {
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 border border-gray-100',
      className
    )}>
      {children}
    </div>
  )
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h3>
  )
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p className={cn('text-sm text-gray-600 mt-2', className)}>
      {children}
    </p>
  )
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn('flex justify-end space-x-2 mt-6', className)}>
      {children}
    </div>
  )
}