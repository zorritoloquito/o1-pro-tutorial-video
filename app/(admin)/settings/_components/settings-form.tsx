"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
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
import { SelectSetting } from "@/db/schema"
import { updateSettingsAction } from "@/actions/db/settings-actions"

// Define the Zod schema for form validation
// Add other fields as they are added to the settings schema
const formSchema = z.object({
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters."
  }),
  companyEmail: z.string().email({
    message: "Please enter a valid email address."
  })
  // Add validation for companyPhone, companyAddress, emailFrom etc. if needed later
})

type SettingsFormValues = z.infer<typeof formSchema>

interface SettingsFormProps {
  initialData: SelectSetting // The current settings data
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: initialData.companyName || "",
      companyEmail: initialData.companyEmail || ""
      // Populate other fields from initialData
    }
  })

  async function onSubmit(values: SettingsFormValues) {
    setIsSubmitting(true)
    const result = await updateSettingsAction(initialData.id, values)

    if (result.isSuccess) {
      toast.success(result.message)
      // Optionally refresh data or redirect
      router.refresh() // Refresh server components on the page
    } else {
      toast.error(result.message)
    }
    setIsSubmitting(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Company Inc." {...field} />
              </FormControl>
              <FormDescription>The legal name of your company.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Email</FormLabel>
              <FormControl>
                <Input placeholder="contact@yourcompany.com" {...field} />
              </FormControl>
              <FormDescription>
                The primary contact email for your company.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Add other form fields here (e.g., phone, address, emailFrom) */}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </Form>
  )
}
