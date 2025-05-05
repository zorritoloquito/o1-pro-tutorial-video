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
import { SelectLaborRate, InsertLaborRate } from "@/db/schema"
import {
  createLaborRateAction,
  updateLaborRateAction
} from "@/actions/db/labor-rates-actions"

// Zod schema for validation
const formSchema = z.object({
  laborType: z
    .string()
    .min(2, { message: "Labor type must be at least 2 characters." }),
  ratePerHour: z.coerce // Use coerce for string input
    .number({
      required_error: "Hourly rate is required",
      invalid_type_error: "Hourly rate must be a number"
    })
    .positive({ message: "Hourly rate must be positive." })
})

type LaborRateFormValues = z.infer<typeof formSchema>

interface LaborRateFormProps {
  initialData?: SelectLaborRate | null
  closeModal: () => void
  refreshData: () => void
}

export default function LaborRateForm({
  initialData,
  closeModal,
  refreshData
}: LaborRateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!initialData

  const form = useForm<LaborRateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      laborType: initialData?.laborType || "",
      ratePerHour: initialData?.ratePerHour
        ? parseFloat(initialData.ratePerHour)
        : 0
    }
  })

  async function onSubmit(values: LaborRateFormValues) {
    setIsSubmitting(true)
    try {
      const dataToSend = {
        ...values,
        ratePerHour: values.ratePerHour.toString()
      }

      let result: Awaited<
        ReturnType<typeof createLaborRateAction | typeof updateLaborRateAction>
      >
      if (isEditing) {
        result = await updateLaborRateAction(initialData!.id, dataToSend)
      } else {
        result = await createLaborRateAction(dataToSend)
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
          name="laborType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Labor Type Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Carpenter, Electrician" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for the labor category.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ratePerHour"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 75.00"
                  {...field}
                />
              </FormControl>
              <FormDescription>The cost of labor per hour.</FormDescription>
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
