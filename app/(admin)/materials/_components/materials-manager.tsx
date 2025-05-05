"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Trash, Edit } from "lucide-react"

import { AdminDataTable } from "@/components/admin/admin-data-table"
import AdminFormModal from "@/components/admin/admin-form-modal"
import MaterialForm from "./material-form"
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
import { SelectMaterial } from "@/db/schema"
import { deleteMaterialAction } from "@/actions/db/materials-actions"

interface MaterialsManagerProps {
  initialData: SelectMaterial[]
}

export default function MaterialsManager({
  initialData
}: MaterialsManagerProps) {
  const router = useRouter()
  const [data, setData] = React.useState(initialData)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isAlertOpen, setIsAlertOpen] = React.useState(false)
  const [selectedMaterial, setSelectedMaterial] =
    React.useState<SelectMaterial | null>(null)
  const [materialToDelete, setMaterialToDelete] = React.useState<string | null>(
    null
  )
  const [isLoading, setIsLoading] = React.useState(false)

  // Function to refresh data (passed to the form)
  const refreshData = () => {
    router.refresh() // Triggers server-side refetch on the parent page
    // Optionally, update local state optimistically or after fetch
  }

  // Handle opening the modal for editing
  const handleEdit = (material: SelectMaterial) => {
    setSelectedMaterial(material)
    setIsModalOpen(true)
  }

  // Handle opening the modal for creating
  const handleCreate = () => {
    setSelectedMaterial(null) // Ensure no initial data for create form
    setIsModalOpen(true)
  }

  // Handle opening the delete confirmation dialog
  const handleDeleteConfirmation = (id: string) => {
    setMaterialToDelete(id)
    setIsAlertOpen(true)
  }

  // Handle the actual deletion
  const handleDelete = async () => {
    if (!materialToDelete) return

    setIsLoading(true)
    const result = await deleteMaterialAction(materialToDelete)
    setIsLoading(false)

    if (result.isSuccess) {
      toast.success(result.message)
      setData(data.filter(m => m.id !== materialToDelete)) // Update local state
      setIsAlertOpen(false)
      setMaterialToDelete(null)
      // refreshData() // Can also use router.refresh() here
    } else {
      toast.error(result.message)
    }
  }

  // Define columns for the data table
  const columns: ColumnDef<SelectMaterial>[] = [
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
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => <div>{row.getValue("unit")}</div>
    },
    {
      accessorKey: "costPerUnit",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right"
        >
          Cost/Unit ($)
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("costPerUnit"))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD"
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      }
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const material = row.original
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
              <DropdownMenuItem onClick={() => handleEdit(material)}>
                <Edit className="mr-2 size-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteConfirmation(material.id)}
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

  // Update local data when initialData changes (e.g., after router.refresh)
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Manage Materials</h2>
        {/* Use AdminFormModal for Creating */}
        <AdminFormModal
          triggerButtonText="Add New Material"
          dialogTitle="Create New Material"
          initialOpen={isModalOpen && !selectedMaterial} // Open if creating
          onOpenChange={open => {
            if (!open) {
              setIsModalOpen(false)
              setSelectedMaterial(null) // Reset selection on close
            }
          }}
        >
          {closeModal => (
            <MaterialForm
              closeModal={closeModal}
              refreshData={refreshData}
              initialData={null} // Pass null for create mode
            />
          )}
        </AdminFormModal>
      </div>

      <AdminDataTable
        columns={columns}
        data={data}
        filterColumnId="name" // Filter by material name
        filterPlaceholder="Filter by name..."
      />

      {/* Modal for Editing (conditionally rendered or controlled inside) */}
      {selectedMaterial && (
        <AdminFormModal
          triggerButtonText="" // No trigger needed, controlled externally
          dialogTitle="Edit Material"
          initialOpen={isModalOpen && !!selectedMaterial} // Open if editing
          onOpenChange={open => {
            if (!open) {
              setIsModalOpen(false)
              setSelectedMaterial(null) // Reset selection on close
            }
          }}
        >
          {closeModal => (
            <MaterialForm
              closeModal={closeModal}
              refreshData={refreshData}
              initialData={selectedMaterial} // Pass selected material for editing
            />
          )}
        </AdminFormModal>
      )}

      {/* Alert Dialog for Deletion Confirmation */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              material. Make sure it is not used in any existing estimates
              before deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setMaterialToDelete(null)}
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
