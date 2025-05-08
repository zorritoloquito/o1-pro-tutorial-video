"use client"

import { useEffect } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  EstimateWithDetails,
  EstimateUpdateData,
  EstimateStatus
} from "@/types"
import { updateEstimateAction } from "@/actions/db/estimates-actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import EstimateLineItemTable, {
  lineItemFormSchema,
  LineItemFormValues
} from "@/components/estimates/estimate-line-item-table"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Decimal } from "decimal.js"

// Schema for the main estimate fields that are editable
const editableEstimateFieldsSchema = z.object({
  overallNotes: z.string().optional().nullable(),
  status: z.enum(["draft", "approved", "sent", "archived"], {
    message: "Invalid status"
  })
})

const estimateEditorFormSchema = z.object({
  estimateData: editableEstimateFieldsSchema,
  lineItems: z
    .array(lineItemFormSchema)
    .min(1, "Estimate must have at least one line item.")
})

export type EstimateEditorFormValues = z.infer<typeof estimateEditorFormSchema>

interface EstimateEditorProps {
  initialEstimate: EstimateWithDetails
  userId: string
}

export default function EstimateEditor({
  initialEstimate,
  userId
}: EstimateEditorProps) {
  const router = useRouter()
  const methods = useForm<EstimateEditorFormValues>({
    resolver: zodResolver(estimateEditorFormSchema),
    defaultValues: {
      estimateData: {
        overallNotes: initialEstimate.overallNotes ?? "",
        status: initialEstimate.status as EstimateStatus
      },
      lineItems: initialEstimate.lineItems.map(item => ({
        id: item.id,
        sortOrder: item.sortOrder,
        description: item.description,
        quantity: parseFloat(item.quantity ?? "0"),
        rate: parseFloat(item.rate ?? "0"),
        total: parseFloat(item.total ?? "0"),
        isTaxable: item.isTaxable ?? false,
        notes: item.notes ?? ""
      })) as LineItemFormValues[]
    }
  })

  const { handleSubmit, control, formState, watch } = methods

  const watchedLineItems = watch("lineItems")
  const overallTotal = (watchedLineItems || [])
    .reduce((sum, item) => {
      return sum.plus(new Decimal(item.total || 0))
    }, new Decimal(0))
    .toFixed(2)

  const onSubmit = async (formData: EstimateEditorFormValues) => {
    if (!initialEstimate.id) {
      toast.error("Estimate ID is missing. Cannot update.")
      return
    }

    const updatePayload: EstimateUpdateData = {
      estimateId: initialEstimate.id,
      userId: userId,
      estimateData: {
        ...formData.estimateData
      },
      lineItems: formData.lineItems.map(item => ({
        sortOrder: item.sortOrder,
        description: item.description,
        quantity: item.quantity.toString(),
        rate: item.rate.toString(),
        total: item.total.toString(),
        isTaxable: item.isTaxable,
        notes: item.notes
      }))
    }

    toast.loading("Saving estimate...")
    try {
      const result = await updateEstimateAction(updatePayload)
      if (result.isSuccess) {
        toast.success(result.message || "Estimate updated successfully!")
      } else {
        toast.error(result.message || "Failed to update estimate.")
      }
    } catch (error) {
      console.error("Update estimate error:", error)
      toast.error("An unexpected error occurred while saving.")
    }
  }

  if (!userId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Authorization Error</AlertTitle>
        <AlertDescription>
          User information is missing. Cannot edit estimate.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>
                    Estimate: {initialEstimate.estimateNumber}
                  </CardTitle>
                  <CardDescription>
                    Client: {initialEstimate.client?.name || "N/A"} | Site:{" "}
                    {initialEstimate.site?.address || "N/A"}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-sm">Total Amount</p>
                  <p className="text-2xl font-semibold">${overallTotal}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={control}
                name="estimateData.status"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          [
                            "draft",
                            "approved",
                            "sent",
                            "archived"
                          ] as EstimateStatus[]
                        ).map(status => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="estimateData.overallNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any overall notes for the estimate..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-6" />

              <div>
                <h3 className="mb-2 text-lg font-medium">Line Items</h3>
                <EstimateLineItemTable name="lineItems" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                disabled={formState.isSubmitting || !formState.isDirty}
              >
                <Save className="mr-2 size-4" />
                {formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </FormProvider>
  )
}
