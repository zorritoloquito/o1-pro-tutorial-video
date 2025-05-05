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
import { SelectEquipment, InsertEquipment } from "@/db/schema"
import {
  createEquipmentAction,
  updateEquipmentAction
} from "@/actions/db/equipment-actions"

// Zod schema for validation
const formSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    rate: z.coerce // Use coerce for string input, matching numeric DB type
      .number({
        invalid_type_error: "Rate must be a number"
        // Making rate optional based on schema `rate: numeric("rate", ...)` which isn't notNull
      })
      .positive({ message: "Rate must be positive if provided." })
      .optional(), // Rate is nullable in schema
    rateUnit: z.string().max(50).optional() // rateUnit is nullable in schema
  })
  .superRefine((data, ctx) => {
    // Use superRefine on the object
    if (data.rate !== undefined && data.rate !== null && !data.rateUnit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rate unit is required if rate is provided",
        path: ["rateUnit"]
      })
    }
  })

type EquipmentFormValues = z.infer<typeof formSchema>

interface EquipmentFormProps {
  initialData?: SelectEquipment | null
  closeModal: () => void
  refreshData: () => void
}

export default function EquipmentForm({
  initialData,
  closeModal,
  refreshData
}: EquipmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!initialData

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      // Drizzle numeric maps to string, coerce back to number for form input type=number
      rate: initialData?.rate ? parseFloat(initialData.rate) : undefined,
      rateUnit: initialData?.rateUnit || undefined
    }
  })

  async function onSubmit(values: EquipmentFormValues) {
    setIsSubmitting(true)
    try {
      // Convert rate back to string for Drizzle numeric type before sending to action
      const dataToSend = {
        ...values,
        rate: values.rate?.toString() // Convert rate number back to string for DB
      }

      // Separate create and update calls
      let result: Awaited<
        ReturnType<typeof createEquipmentAction | typeof updateEquipmentAction>
      >
      if (isEditing) {
        result = await updateEquipmentAction(initialData!.id, dataToSend) // Call update directly
      } else {
        result = await createEquipmentAction(dataToSend) // Call create directly
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
              <FormLabel>Equipment Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Excavator, Scissor Lift" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate ($)</FormLabel>
              <FormControl>
                {/* Keep type="number" for better UX, value conversion handled */}
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 500.00"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The cost rate for the equipment (e.g., per day, per hour).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rateUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate Unit</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., day, hour, job"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                The unit corresponding to the rate (required if rate is set).
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
