"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SelectClient } from "@/db/schema"
import { createEstimateAction } from "@/actions/db/estimates-actions"
import { EstimateSaveData } from "@/types"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const estimateFormSchema = z.object({
  customerId: z.string().uuid({ message: "Please select a client." }),
  siteAddressLine1: z.string().min(1, "Site address is required.").max(255),
  siteAddressLine2: z.string().max(255).optional().nullable(),
  siteCity: z.string().max(100).optional().nullable(),
  siteState: z.string().max(50).optional().nullable(),
  siteZip: z.string().max(20).optional().nullable(),
  siteCoordinates: z.string().max(100).optional().nullable(), // Consider a more specific validation if needed
  intendedUse: z.string().max(500).optional().nullable(),
  gpm: z.coerce
    .number()
    .positive({ message: "GPM must be a positive number." }),
  pumpSetting: z.coerce
    .number()
    .positive({ message: "Pump setting must be a positive number." }),
  pumpingWaterLevel: z.coerce
    .number()
    .positive({ message: "Pumping water level must be a positive number." }),
  pressurePsi: z.coerce
    .number()
    .positive({ message: "Pressure PSI must be a positive number." }),
  voltage: z.enum(["240", "480"], {
    message: "Please select a valid voltage."
  }),
  prepTimeHours: z.coerce
    .number()
    .min(0, { message: "Prep time cannot be negative." }),
  installTimeHours: z.coerce
    .number()
    .min(0, { message: "Install time cannot be negative." }),
  startTimeHours: z.coerce
    .number()
    .min(0, { message: "Start time cannot be negative." }),
  dischargePackage: z.enum(["A", "B", "C"], {
    message: "Please select a discharge package."
  }),
  notes: z.string().max(1000).optional().nullable()
})

type EstimateFormValues = z.infer<typeof estimateFormSchema>

interface EstimateFormProps {
  clients: SelectClient[]
  userId: string
}

export default function EstimateForm({ clients, userId }: EstimateFormProps) {
  const router = useRouter()
  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      customerId: "",
      siteAddressLine1: "",
      siteAddressLine2: "",
      siteCity: "",
      siteState: "",
      siteZip: "",
      siteCoordinates: "",
      intendedUse: "",
      gpm: 0,
      pumpSetting: 0,
      pumpingWaterLevel: 0,
      pressurePsi: 0,
      voltage: undefined, // No default, user must select
      prepTimeHours: 0,
      installTimeHours: 0,
      startTimeHours: 0,
      dischargePackage: undefined, // No default, user must select
      notes: ""
    }
  })

  const onSubmit = async (values: EstimateFormValues) => {
    const dataForAction: EstimateSaveData = {
      ...values,
      voltage: Number(values.voltage) as 240 | 480,
      userId: userId
    }

    try {
      toast.loading("Creating estimate...")
      const result = await createEstimateAction(dataForAction)

      if (result.isSuccess && result.data?.estimateId) {
        toast.success(result.message)
        router.push(`/estimates/${result.data.estimateId}`)
      } else {
        toast.error(result.message || "Failed to create estimate.")
      }
    } catch (error) {
      toast.error("An unexpected error occurred.")
      console.error("Estimate creation error:", error)
    } finally {
      // toast.dismiss() // or let sonner auto-dismiss
    }
  }

  return (
    <Card className="mx-auto my-8 max-w-4xl">
      <CardHeader>
        <CardTitle>Create New Estimate</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardTitle className="pt-4 text-lg">Site Information</CardTitle>
            <FormField
              control={form.control}
              name="siteAddressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Address Line 1 *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="siteAddressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Address Line 2</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Apt, Suite, Unit"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="siteCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Anytown"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="siteState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., CA"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="siteZip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP/Postal Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 90210"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="siteCoordinates"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Coordinates (Lat, Long)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 34.0522, -118.2437"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Helps with mapping or future location-based
                    features.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="intendedUse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intended Use of Water</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Agricultural irrigation, domestic household use, livestock watering"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardTitle className="pt-4 text-lg">
              System Parameters & Configuration
            </CardTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="gpm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flow Rate (GPM) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pumpSetting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pump Setting (PS) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pumpingWaterLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pumping Water Level (PWL) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 150" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pressurePsi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Pressure (PSI) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="voltage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voltage *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select voltage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="240">240V</SelectItem>
                        <SelectItem value="480">480V</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dischargePackage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discharge Package *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select package" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">Package A</SelectItem>
                        <SelectItem value="B">Package B</SelectItem>
                        <SelectItem value="C">Package C</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <CardTitle className="pt-4 text-lg">
              Time Estimates (Hours)
            </CardTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="prepTimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prep Time (Hours) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="installTimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Install Time (Hours) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 8" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startup Time (Hours) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any overall notes for the estimate..."
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating..." : "Create Estimate"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
