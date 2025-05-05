"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Trash, Edit } from "lucide-react"

import { AdminDataTable } from "@/components/admin/admin-data-table"
import AdminFormModal from "@/components/admin/admin-form-modal"
import LaborRateForm from "./labor-rate-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { SelectLaborRate } from "@/db/schema"
import { deleteLaborRateAction } from "@/actions/db/labor-rates-actions"

interface LaborRatesManagerProps {
  initialData: SelectLaborRate[]
}

export default function LaborRatesManager({
  initialData
}: LaborRatesManagerProps) {
  const router = useRouter()
  const [data, setData] = React.useState(initialData)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isAlertOpen, setIsAlertOpen] = React.useState(false)
  const [selectedRate, setSelectedRate] =
    React.useState<SelectLaborRate | null>(null)
  const [rateToDelete, setRateToDelete] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const refreshData = () => {
    router.refresh()
  }

  const handleEdit = (rate: SelectLaborRate) => {
    setSelectedRate(rate)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedRate(null)
    setIsModalOpen(true)
  }

  const handleDeleteConfirmation = (id: string) => {
    setRateToDelete(id)
    setIsAlertOpen(true)
  }

  const handleDelete = async () => {
    if (!rateToDelete) return

    setIsLoading(true)
    const result = await deleteLaborRateAction(rateToDelete)
    setIsLoading(false)

    if (result.isSuccess) {
      toast.success(result.message)
      setData(data.filter(r => r.id !== rateToDelete))
      setIsAlertOpen(false)
      setRateToDelete(null)
    } else {
      toast.error(result.message)
    }
  }

  const columns: ColumnDef<SelectLaborRate>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("name")}</div>
      )
    },
    {
      accessorKey: "ratePerHour",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right"
        >
          Rate/Hour ($)
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("ratePerHour"))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD"
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const rate = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(rate)}>
                <Edit className="mr-2 size-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteConfirmation(rate.id)}
                className="text-red-600 focus:text-red-700"
              >
                <Trash className="mr-2 size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Manage Labor Rates</h2>
        <AdminFormModal
          triggerButtonText="Add New Labor Rate"
          dialogTitle="Create New Labor Rate"
          initialOpen={isModalOpen && !selectedRate}
          onOpenChange={open => {
            if (!open) {
              setIsModalOpen(false)
              setSelectedRate(null)
            }
          }}
        >
          {closeModal => (
            <LaborRateForm
              closeModal={closeModal}
              refreshData={refreshData}
              initialData={null}
            />
          )}
        </AdminFormModal>
      </div>

      <AdminDataTable
        columns={columns}
        data={data}
        filterColumnId="name"
        filterPlaceholder="Filter by name..."
      />

      {selectedRate && (
        <AdminFormModal
          triggerButtonText=""
          dialogTitle="Edit Labor Rate"
          initialOpen={isModalOpen && !!selectedRate}
          onOpenChange={open => {
            if (!open) {
              setIsModalOpen(false)
              setSelectedRate(null)
            }
          }}
        >
          {closeModal => (
            <LaborRateForm
              closeModal={closeModal}
              refreshData={refreshData}
              initialData={selectedRate}
            />
          )}
        </AdminFormModal>
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              labor rate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setRateToDelete(null)}
              disabled={isLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
