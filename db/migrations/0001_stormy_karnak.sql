ALTER TABLE "estimate_line_items" RENAME COLUMN "line_total" TO "total";--> statement-breakpoint
ALTER TABLE "estimate_line_items" RENAME COLUMN "unit_price" TO "is_taxable";--> statement-breakpoint
DROP INDEX "line_item_estimate_id_idx";--> statement-breakpoint
ALTER TABLE "estimate_line_items" ALTER COLUMN "quantity" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "estimate_line_items" ALTER COLUMN "quantity" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "estimate_line_items" ALTER COLUMN "sort_order" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "estimate_line_items" ADD COLUMN "rate" numeric(10, 2) DEFAULT '0' NOT NULL;