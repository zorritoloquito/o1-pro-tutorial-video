"use server" // Needs access to DB actions

import { db } from "@/db/db"
import {
  SelectLaborRate,
  SelectMaterial,
  materialsTable,
  laborRatesTable,
  CalculatedLineItem // Assuming this is defined and exported from @/db/schema
} from "@/db/schema"
import {
  ActionState, // Assuming ActionState is globally available or defined elsewhere
  EstimateInputData,
  CalculationResult
} from "@/types"
import { eq, and, gte, lte, or } from "drizzle-orm"
import { Decimal } from "decimal.js" // Use a decimal library for precision

// --- Helper Function for Safe Decimal Calculation ---
function calculateTotal(
  qty: number | string | Decimal,
  rate: number | string | Decimal
): string {
  try {
    const quantity = new Decimal(qty)
    const unitRate = new Decimal(rate)
    if (quantity.isNaN() || unitRate.isNaN()) {
      return "0.00"
    }
    return quantity.times(unitRate).toFixed(2)
  } catch (e) {
    console.error("Error calculating total:", e)
    return "0.00"
  }
}

// --- Main Calculation Function ---
export async function calculateEstimateLineItems(
  inputs: EstimateInputData
): Promise<ActionState<CalculationResult>> {
  try {
    // 1. Fetch necessary data from DB
    // Assuming 'isActive' field exists on both tables
    const allMaterials = await db.query.materials.findMany({
      where: eq(materialsTable.isActive, true)
    })
    const allLaborRates = await db.query.laborRates.findMany({
      where: eq(laborRatesTable.isActive, true)
    })

    // --- Data Mapping/Lookup Objects ---
    // Assuming 'type' field exists on materialsTable
    const materialsByType = allMaterials.reduce(
      (acc, m) => {
        ;(acc[m.type] = acc[m.type] || []).push(m)
        return acc
      },
      {} as Record<SelectMaterial["type"], SelectMaterial[]>
    )

    // Assuming 'name' field exists and is unique identifier for lookup on laborRatesTable
    const laborRatesByName = allLaborRates.reduce(
      (acc, r) => {
        acc[r.name] = r // Assuming unique names like 'Prep Job Labor'
        return acc
      },
      {} as Record<string, SelectLaborRate>
    )

    // --- Step 2: Calculate TDH ---
    // 2a. Find Pipe Size
    const pipes = materialsByType["Pipe"] || []
    // Assuming 'lookupData' field exists and has gpmMin/gpmMax
    const selectedPipe = pipes.find(p => {
      const lookup = p.lookupData as { gpmMin?: number; gpmMax?: number }
      return (
        lookup?.gpmMin != null &&
        lookup?.gpmMax != null &&
        inputs.gpm >= lookup.gpmMin &&
        inputs.gpm <= lookup.gpmMax
      )
    })

    if (!selectedPipe) {
      return {
        isSuccess: false,
        message: `Calculation Error: No active pipe material found for GPM ${inputs.gpm}`
      }
    }
    // Assuming 'lookupData' has frictionLoss and 'price' exists
    const pipeFL = new Decimal(
      (selectedPipe.lookupData as { frictionLoss?: number })?.frictionLoss ?? 0
    )
    const pipeSizeName = selectedPipe.name // e.g., '3" Pipe'
    const pipeSalesPrice = new Decimal(selectedPipe.price)

    // 2b. Calculate TFL (Total Friction Loss)
    const tfl = pipeFL
      .times(inputs.pumpSetting)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP) // Round to nearest integer

    // 2c. Convert PSI to Feet
    const pressureInFeet = new Decimal(inputs.pressurePsi)
      .times(2.3)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP) // Round to nearest integer

    // 2d. Calculate TDH
    const tdh = new Decimal(inputs.pumpingWaterLevel)
      .plus(tfl)
      .plus(pressureInFeet)
    // Use the potentially non-integer value for HP calc.
    const tdhFinal = tdh.toNumber()

    // --- Step 3: Choose Submersible Motor ---
    // 3a. Calculate Horsepower
    // horsepower = (GPM * TDH * 0.746) / (0.70 * 3960)
    const numerator = new Decimal(inputs.gpm).times(tdhFinal).times(0.746)
    const denominator = new Decimal(0.7).times(3960)
    if (denominator.isZero()) {
      return {
        isSuccess: false,
        message: `Calculation Error: Denominator is zero during HP calculation.`
      }
    }
    const calculatedHp = numerator.dividedBy(denominator) // Keep precision

    // 3b. Find Motor based on HP Range
    const motors = materialsByType["Motor"] || []
    // Assuming 'lookupData' has hpMin/hpMax
    const selectedMotor = motors.find(m => {
      const lookup = m.lookupData as { hpMin?: number; hpMax?: number }
      // Use Decimal for comparison to avoid floating point issues
      return (
        lookup?.hpMin != null &&
        lookup?.hpMax != null &&
        calculatedHp.greaterThan(lookup.hpMin) &&
        calculatedHp.lessThanOrEqualTo(lookup.hpMax)
      )
    })

    if (!selectedMotor) {
      return {
        isSuccess: false,
        message: `Calculation Error: No active motor material found for calculated HP ${calculatedHp.toFixed(2)}`
      }
    }
    // Assuming 'name', 'description', 'price' fields exist
    const motorHpName = selectedMotor.name // e.g., '30 HP Motor'
    const motorDescription = selectedMotor.description ?? motorHpName // e.g., '6" Grundfos 30 HP motor'
    const motorSalesPrice = new Decimal(selectedMotor.price)

    // --- Step 4: Choose Wire Size ---
    const motorHpValue = parseFloat(motorHpName.split(" ")[0]) // Extract numeric HP value (e.g., 30)
    let wireSizeName = "" // e.g., '#6'

    // --- !! Wire Size Chart Logic (Hardcoded as required) !! ---
    const ps = inputs.pumpSetting

    if (inputs.voltage === 480) {
      if (motorHpValue <= 5) {
        wireSizeName = ps <= 590 ? "#14" : "#12"
      } else if (motorHpValue <= 7.5) {
        wireSizeName = ps <= 420 ? "#14" : ps <= 680 ? "#12" : "#10"
      } else if (motorHpValue <= 10) {
        wireSizeName = ps <= 310 ? "#14" : ps <= 500 ? "#12" : "#10"
      } else if (motorHpValue <= 15) {
        wireSizeName = ps <= 240 ? "#10" : "#8" // Assumes range covers up to 850 based on chart format
      } else if (motorHpValue <= 20) {
        wireSizeName = ps <= 410 ? "#10" : "#8" // Assumes range covers up to 650
      } else if (motorHpValue <= 25) {
        wireSizeName = ps <= 530 ? "#8" : "#6" // Assumes range covers up to 830
      } else if (motorHpValue <= 30) {
        wireSizeName = ps <= 430 ? "#8" : "#6" // Assumes range covers up to 680
      } else if (motorHpValue <= 40) {
        wireSizeName = ps <= 790 ? "#4" : "#2" // Assumes range covers up to 1210
      } else if (motorHpValue <= 50) {
        wireSizeName = ps <= 640 ? "#4" : "#2" // Assumes range covers up to 980
      } else if (motorHpValue <= 60) {
        wireSizeName = "#2" // Assumes only one range up to 830
      } else if (motorHpValue <= 75) {
        wireSizeName = "#1" // Assumes only one range up to 840
      }
      // Add #100, #150 if motors exist for them
      // else if (motorHpValue <= 100) { wireSizeName = ps <= 940 ? '2/0' : '??'; } // Need ranges/sizes for 100HP+
      // else if (motorHpValue <= 150) { wireSizeName = ps <= 1050 ? '250 MCM' : '??'; }
      else {
        /* Handle unknown HP for 480V */
      }
    } else if (inputs.voltage === 240) {
      if (motorHpValue <= 5) {
        wireSizeName =
          ps <= 230 ? "#12" : ps <= 370 ? "#10" : ps <= 590 ? "#8" : "#6" // Covers up to 920ft
      } else if (motorHpValue <= 7.5) {
        wireSizeName = ps <= 260 ? "#10" : ps <= 420 ? "#8" : "#6" // Covers up to 650ft
      } else if (motorHpValue <= 10) {
        wireSizeName =
          ps <= 310 ? "#8" : ps <= 490 ? "#6" : ps <= 760 ? "#4" : "#3" // Covers up to 950ft
      } else if (motorHpValue <= 15) {
        wireSizeName =
          ps <= 330 ? "#6" : ps <= 520 ? "#4" : ps <= 650 ? "#3" : "#2" // Covers up to 800ft
      } else if (motorHpValue <= 20) {
        wireSizeName = ps <= 400 ? "#4" : ps <= 500 ? "#3" : "#2" // Covers up to 610ft
      } else if (motorHpValue <= 25) {
        wireSizeName = ps <= 320 ? "#4" : ps <= 400 ? "#3" : "#2" // Covers up to 500ft
      } else if (motorHpValue <= 30) {
        wireSizeName = ps <= 330 ? "#3" : ps <= 410 ? "#2" : "#1" // Covers up to 510ft
      } else {
        /* Handle unknown HP for 240V */
      }
    }

    if (!wireSizeName) {
      return {
        isSuccess: false,
        message: `Calculation Error: Could not determine wire size for ${motorHpValue} HP, ${ps} ft PS, ${inputs.voltage}V`
      }
    }

    // Find the wire material record based on the determined size name
    const wires = materialsByType["Wire"] || []
    const selectedWire = wires.find(w => w.name === wireSizeName) // Match '#6' etc.

    if (!selectedWire) {
      return {
        isSuccess: false,
        message: `Calculation Error: No active wire material found for determined size ${wireSizeName}`
      }
    }
    // Assuming 'description' and 'price' fields exist
    const wireDescription =
      selectedWire.description ?? `${wireSizeName} FJ wire`
    const wireSalesPrice = new Decimal(selectedWire.price)
    const wireQuantity = new Decimal(inputs.pumpSetting).plus(20) // PS + 20 feet

    // --- Step 5: Create Line Item Estimate ---
    const lineItems: CalculationResult = []

    // --- Helper to find fixed materials/labor rates ---
    const findMaterial = (
      type: SelectMaterial["type"],
      name?: string
    ): SelectMaterial | undefined => {
      const items = materialsByType[type] || []
      return name ? items.find(m => m.name === name) : items[0] // Assume one if name not specified (e.g., Concrete)
    }
    const findLaborRate = (name: string): SelectLaborRate | undefined =>
      laborRatesByName[name]

    // --- Get Fixed Prices/Rates (handle missing data) ---
    // Assuming 'price' and 'rate' fields exist
    const concretePadPrice = new Decimal(
      findMaterial("Concrete", "Concrete Pad")?.price ?? "900"
    ) // Default if not in DB
    const soundingTubePrice = new Decimal(
      findMaterial("SoundingTube", "Sounding Tube")?.price ?? "1"
    ) // Default if not in DB

    const prepLaborRate = new Decimal(
      findLaborRate("Prep Job Labor")?.rate ?? "175"
    ) // Default if not in DB
    const installLaborRate = new Decimal(
      findLaborRate("Install Submersible Labor")?.rate ?? "395"
    ) // Default if not in DB
    const startupLaborRate = new Decimal(
      findLaborRate("Ag Sub Pump Startup Labor")?.rate ?? "175"
    ) // Default if not in DB

    let bundleDescription = ""
    let bundlePrice = new Decimal(0)
    const bundleMaterialName = `Bundle ${inputs.dischargePackage}` // e.g., 'Bundle A'
    const selectedBundle = findMaterial("Bundle", bundleMaterialName)

    if (!selectedBundle) {
      console.warn(
        `Warning: Material for ${bundleMaterialName} not found. Using default price/description.`
      )
      // Provide defaults or handle error based on policy
      if (inputs.dischargePackage === "A") {
        bundlePrice = new Decimal("1700")
        bundleDescription =
          "Submersible bundle A – sub discharge head. Duct tape, electrical splice connections, tape kit, etc."
      } else if (inputs.dischargePackage === "B") {
        bundlePrice = new Decimal("1450")
        bundleDescription =
          "Submersible bundle B – well plate. Duct tape, electrical splice connections, tape kit, etc."
      } else {
        // Package C
        bundlePrice = new Decimal("700")
        bundleDescription =
          "Submersible bundle C – reuse discharge head. Duct tape, electrical splice connections, tape kit, etc."
      }
    } else {
      bundlePrice = new Decimal(selectedBundle.price)
      bundleDescription = selectedBundle.description ?? bundleMaterialName // Use DB description or default
    }

    // --- Assemble the 11 Line Items ---
    // Assuming CalculatedLineItem has { sortOrder, description, quantity, rate, total, notes?, isTaxable? }

    // 1. Job Description Line (no $, handled by main estimate record usually)
    lineItems.push({
      sortOrder: 1,
      description: `${motorHpName.replace(" Motor", "")}) ${inputs.voltage}V submersible pump capable of ${inputs.gpm} GPM at ${inputs.pressurePsi} psi, ${tdh.toFixed(0)} TDH set at ${inputs.pumpSetting} ft`,
      quantity: "1", // Or 0 if preferred
      rate: "0.00",
      total: "0.00"
      // isTaxable: false, // Example
      // notes: "" // Example
    })

    // 2. Concrete Pad
    lineItems.push({
      sortOrder: 2,
      description: "Concrete pad",
      quantity: "1",
      rate: concretePadPrice.toFixed(2),
      total: calculateTotal(1, concretePadPrice)
    })

    // 3. Labor to prep job
    lineItems.push({
      sortOrder: 3,
      description: "Labor to prep job",
      quantity: inputs.prepTimeHours.toString(),
      rate: prepLaborRate.toFixed(2),
      total: calculateTotal(inputs.prepTimeHours, prepLaborRate)
    })

    // 4. Labor to install submersible pump
    lineItems.push({
      sortOrder: 4,
      description: "Labor to install submersible pump",
      quantity: inputs.installTimeHours.toString(),
      rate: installLaborRate.toFixed(2),
      total: calculateTotal(inputs.installTimeHours, installLaborRate)
    })

    // 5. Submersible motor HP
    lineItems.push({
      sortOrder: 5,
      description: motorHpName, // e.g., "25 HP submersible motor" (Name from DB includes "Motor")
      quantity: "1",
      rate: motorSalesPrice.toFixed(2),
      total: calculateTotal(1, motorSalesPrice)
    })

    // 6. Description of submersible pump (Pump itself - assumed $0 based on logic)
    lineItems.push({
      sortOrder: 6,
      description: `${motorHpName.replace(" Motor", "")} submersible pump`, // e.g., "25 HP submersible pump"
      quantity: "1",
      rate: "0.00", // As per Step 5 item 6
      total: "0.00"
    })

    // 7. Pipe
    lineItems.push({
      sortOrder: 7,
      description: pipeSizeName, // e.g., "3\" pipe"
      quantity: inputs.pumpSetting.toString(),
      rate: pipeSalesPrice.toFixed(2),
      total: calculateTotal(inputs.pumpSetting, pipeSalesPrice)
    })

    // 8. Wire Size
    lineItems.push({
      sortOrder: 8,
      description: wireDescription, // e.g., "#4 FJ wire"
      quantity: wireQuantity.toString(), // PS + 20
      rate: wireSalesPrice.toFixed(2),
      total: calculateTotal(wireQuantity, wireSalesPrice)
    })

    // 9. Sounding tube
    lineItems.push({
      sortOrder: 9,
      description: "Sounding tube",
      quantity: inputs.pumpSetting.toString(),
      rate: soundingTubePrice.toFixed(2),
      total: calculateTotal(inputs.pumpSetting, soundingTubePrice)
    })

    // 10. Submersible bundle
    lineItems.push({
      sortOrder: 10,
      description: bundleDescription, // Set based on package A, B, or C
      quantity: "1",
      rate: bundlePrice.toFixed(2),
      total: calculateTotal(1, bundlePrice)
    })

    // 11. Ag sub pump startup
    lineItems.push({
      sortOrder: 11,
      description: "Ag sub pump startup",
      quantity: inputs.startTimeHours.toString(),
      rate: startupLaborRate.toFixed(2),
      total: calculateTotal(inputs.startTimeHours, startupLaborRate)
    })

    return {
      isSuccess: true,
      message: "Estimate calculated successfully",
      data: lineItems
    }
  } catch (error: any) {
    console.error("Error calculating estimate line items:", error)
    return {
      isSuccess: false,
      message: `Failed to calculate estimate: ${error.message}`
    }
  }
}
