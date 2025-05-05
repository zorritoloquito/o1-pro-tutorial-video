"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AdminFormModalProps {
  triggerButtonText: string
  dialogTitle: string
  dialogDescription?: string
  children: (closeModal: () => void) => React.ReactNode // Render prop to pass close function
  initialOpen?: boolean
  triggerButtonVariant?: React.ComponentProps<typeof Button>["variant"]
  triggerButtonSize?: React.ComponentProps<typeof Button>["size"]
  onOpenChange?: (open: boolean) => void // Add onOpenChange prop
  // Add other props like onOpenChange if needed
}

export default function AdminFormModal({
  triggerButtonText,
  dialogTitle,
  dialogDescription,
  children,
  initialOpen = false,
  triggerButtonVariant = "default",
  triggerButtonSize = "sm"
}: AdminFormModalProps) {
  const [isOpen, setIsOpen] = useState(initialOpen)

  const closeModal = () => setIsOpen(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerButtonVariant} size={triggerButtonSize}>
          {triggerButtonText}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        {/* Add sm:max-w-[600px] or other sizes if needed */}
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          {dialogDescription && (
            <DialogDescription>{dialogDescription}</DialogDescription>
          )}
        </DialogHeader>

        {/* Render children function, passing the closeModal function */}
        {children(closeModal)}
      </DialogContent>
    </Dialog>
  )
}
