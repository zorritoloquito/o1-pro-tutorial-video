"use client"

import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import type { SelectClient, SelectEstimate, SelectSite } from "@/db/schema"

// Define a more specific type for the estimates passed to this table
// This reflects that getEstimatesByUserIdAction includes client and site data
export type EstimateWithClientAndSite = SelectEstimate & {
  client: SelectClient | null
  site: SelectSite | null
}

interface EstimatesListTableProps {
  estimates: EstimateWithClientAndSite[]
  totalCount: number
  // Props for pagination can be added later if needed:
  // currentPage: number;
  // itemsPerPage: number;
  // onPageChange: (page: number) => void;
}

export default function EstimatesListTable({
  estimates,
  totalCount
}: EstimatesListTableProps) {
  if (estimates.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground text-lg">
          You haven&apos;t created any estimates yet.
        </p>
        <Button asChild className="mt-4">
          <Link href="/estimates/create">Create Your First Estimate</Link>
        </Button>
      </div>
    )
  }

  const formatDate = (dateString: Date | string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  const formatCurrency = (amount: string | number | null) => {
    if (amount === null || amount === undefined) return "N/A"
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD" // Adjust currency as needed
    }).format(numAmount)
  }

  return (
    <>
      {/* We can display totalCount if needed, e.g., for pagination info */}
      {/* <p className="text-sm text-muted-foreground mb-2">Total Estimates: {totalCount}</p> */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Estimate #</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Site Address</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimates.map(estimate => (
              <TableRow key={estimate.id}>
                <TableCell className="font-medium">
                  {estimate.estimateNumber || "N/A"}
                </TableCell>
                <TableCell>{formatDate(estimate.createdAt)}</TableCell>
                <TableCell>{estimate.client?.name || "N/A"}</TableCell>
                <TableCell>{estimate.site?.address || "N/A"}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(estimate.totalAmount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      estimate.status === "draft" ? "outline" : "default"
                    }
                  >
                    {estimate.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/estimates/${estimate.id}`}>
                      <Eye className="mr-2 size-4" /> View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Pagination controls can be added here later */}
    </>
  )
}
