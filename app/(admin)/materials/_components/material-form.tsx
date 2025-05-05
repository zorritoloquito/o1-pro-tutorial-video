"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SelectMaterial, InsertMaterial } from "@/db/schema"
import {
  createMaterialAction,
  updateMaterialAction
} from "@/actions/db/materials-actions"

// Zod schema for validation
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  unit: z.string().optional(),
  cost: z.coerce
    .number({
      required_error: "Cost is required",
      invalid_type_error: "Cost must be a number"
    })
    .positive({ message: "Cost must be positive." })
})

type MaterialFormValues = z.infer<typeof formSchema>

interface MaterialFormProps {
  initialData?: SelectMaterial | null // For editing existing material
  closeModal: () => void
  refreshData: () => void // Function to trigger data refresh on parent
}

export default function MaterialForm({
  initialData,
  closeModal,
  refreshData
}: MaterialFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!initialData

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      unit: initialData?.unit || undefined,
      cost: initialData?.cost ? parseFloat(initialData.cost) : 0
    }
  })

  async function onSubmit(values: MaterialFormValues) {
    setIsSubmitting(true)
    try {
      const dataToSend = {
        ...values,
        cost: values.cost.toString(),
        unit: values.unit || null
      }

      let result: Awaited<
        ReturnType<typeof createMaterialAction | typeof updateMaterialAction>
      >
      if (isEditing) {
        result = await updateMaterialAction(initialData!.id, dataToSend)
      } else {
        result = await createMaterialAction(dataToSend)
      }

      if (result.isSuccess) {
        toast.success(result.message)
        refreshData()
        closeModal()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("An unexpected error occurred.")
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Plywood 4x8 Sheet" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <FormControl>
                <Input placeholder="e.g., sheet, lb, ft" {...field} />
              </FormControl>
              <FormDescription>The unit of measurement.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost Per Unit ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 25.50"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The cost for one unit of the material.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={closeModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
