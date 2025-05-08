"use client"

import { useFieldArray, useFormContext, Controller } from "react-hook-form"
import { z } from "zod"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { Decimal } from "decimal.js"

// Define Zod schema for a single line item for validation within the form
// This should align with the fields you expect in your form data for line items.
// Based on InsertEstimateLineItem and CalculatedLineItem
export const lineItemFormSchema = z.object({
  id: z.string().uuid().optional(), // Present for existing items
  sortOrder: z.number(),
  description: z.string().min(1, "Description is required."),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative."),
  rate: z.coerce.number().min(0, "Rate must be non-negative."),
  total: z.coerce.number(), // Will be calculated
  isTaxable: z.boolean().default(false),
  notes: z.string().optional().nullable()
})

export type LineItemFormValues = z.infer<typeof lineItemFormSchema>

interface EstimateLineItemTableProps {
  name: string // This will be the name of the field array in the parent form, e.g., "lineItems"
  // The parent form (EstimateEditor) will manage the overall estimate data, including line items.
}

export default function EstimateLineItemTable({
  name
}: EstimateLineItemTableProps) {
  const { control, watch, setValue, getValues } = useFormContext() // Get form methods from parent <FormProvider>

  const { fields, append, remove } = useFieldArray({
    control,
    name: name as any, // Type assertion needed due to RHF generic complexity
    keyName: "fieldId" // Use a custom key name to avoid conflict with 'id' from data
  })

  // Watch for changes in quantity or rate to update total
  const watchedFields = watch(name) // Watch the entire array of line items

  useEffect(() => {
    if (Array.isArray(watchedFields)) {
      watchedFields.forEach((field: any, index: number) => {
        const qty = new Decimal(field.quantity || 0)
        const itemRate = new Decimal(field.rate || 0)
        if (!qty.isNaN() && !itemRate.isNaN()) {
          const newTotal = qty.times(itemRate).toFixed(2)
          // Only update if the total is different to avoid infinite loops
          if (new Decimal(field.total || 0).toFixed(2) !== newTotal) {
            setValue(`${name}.${index}.total`, parseFloat(newTotal), {
              shouldValidate: false,
              shouldDirty: true
            })
          }
        }
      })
    }
  }, [watchedFields, name, setValue])

  const addNewLineItem = () => {
    // Get current highest sortOrder and increment
    const currentLineItems = getValues(name) || []
    const maxSortOrder = currentLineItems.reduce(
      (max: number, item: any) => Math.max(max, item.sortOrder || 0),
      0
    )

    append({
      sortOrder: maxSortOrder + 1,
      description: "",
      quantity: 1,
      rate: 0,
      total: 0,
      isTaxable: false,
      notes: ""
    } as LineItemFormValues) // Cast to ensure type correctness
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px] text-right">Qty</TableHead>
              <TableHead className="w-[120px] text-right">Rate</TableHead>
              <TableHead className="w-[120px] text-right">Total</TableHead>
              <TableHead className="w-[150px]">Notes</TableHead>
              <TableHead className="w-[80px] text-center">Taxable</TableHead>
              <TableHead className="w-[80px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.fieldId}>
                <TableCell>
                  <Controller
                    name={`${name}.${index}.sortOrder`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Input
                        {...controllerField}
                        type="number"
                        readOnly
                        className="bg-muted/50"
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    name={`${name}.${index}.description`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Textarea
                        {...controllerField}
                        placeholder="Line item description"
                        className={cn(
                          "min-h-[60px]",
                          fieldState.error && "border-red-500"
                        )}
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    name={`${name}.${index}.quantity`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Input
                        {...controllerField}
                        type="number"
                        step="any"
                        className={cn(
                          "text-right",
                          fieldState.error && "border-red-500"
                        )}
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    name={`${name}.${index}.rate`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Input
                        {...controllerField}
                        type="number"
                        step="any"
                        className={cn(
                          "text-right",
                          fieldState.error && "border-red-500"
                        )}
                      />
                    )}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Controller
                    name={`${name}.${index}.total`}
                    control={control}
                    render={({ field: controllerField }) => (
                      // Make total read-only as it's calculated
                      <Input
                        {...controllerField}
                        type="number"
                        readOnly
                        className="bg-muted/50 text-right"
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    name={`${name}.${index}.notes`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Textarea
                        {...controllerField}
                        placeholder="Notes"
                        className="min-h-[60px]"
                      />
                    )}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Controller
                    name={`${name}.${index}.isTaxable`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Checkbox
                        checked={controllerField.value}
                        onCheckedChange={controllerField.onChange}
                      />
                    )}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addNewLineItem}
        className="mt-4"
      >
        <PlusCircle className="mr-2 size-4" /> Add Line Item
      </Button>
    </div>
  )
}
