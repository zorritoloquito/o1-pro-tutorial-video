// seed.ts
import { db } from '@/db/db'; // Adjust path
import { materialsTable, laborRatesTable } from '@/db/schema'; // Adjust path
import { Decimal } from 'decimal.js';

async function seed() {
  console.log('Seeding database...');

  // --- Materials ---
  const materialsToSeed = [
    // Pipes (ensure type='Pipe')
    { name: '2" Pipe', type: 'Pipe', price: '11.08', unit: 'ft', lookupData: { gpmMin: 55, gpmMax: 70, frictionLoss: 0.01 }, description: '2" Schedule 40 PVC Pipe' },
    { name: '2.5" Pipe', type: 'Pipe', price: '11.08', unit: 'ft', lookupData: { gpmMin: 71, gpmMax: 110, frictionLoss: 0.075 }, description: '2.5" Schedule 40 PVC Pipe' },
    // ... other pipes

    // Motors (ensure type='Motor')
    { name: '5 HP Motor', type: 'Motor', price: '2581.86', unit: 'each', lookupData: { hpMin: 3.5, hpMax: 5.5 }, description: '4" Grundfos 5 HP motor' },
    { name: '7.5 HP Motor', type: 'Motor', price: '3301.72', unit: 'each', lookupData: { hpMin: 5.51, hpMax: 7.75 }, description: '6" Grundfos 7.5 HP motor' },
    // ... other motors

    // Wires (ensure type='Wire')
    { name: '#14', type: 'Wire', price: '2.13', unit: 'ft', description: '#14 FJ wire' },
    { name: '#12', type: 'Wire', price: '2.88', unit: 'ft', description: '#12 FJ wire' },
    // ... other wires

    // Fixed Items
    { name: 'Concrete Pad', type: 'Concrete', price: '900.00', unit: 'each', description: 'Standard concrete pad for well head' },
    { name: 'Sounding Tube', type: 'SoundingTube', price: '1.00', unit: 'ft', description: '1" PVC Sounding Tube' },

    // Bundles (ensure type='Bundle')
    { name: 'Bundle A', type: 'Bundle', price: '1700.00', unit: 'each', description: 'Submersible bundle A – sub discharge head. Duct tape, electrical splice connections, tape kit, etc.' },
    { name: 'Bundle B', type: 'Bundle', price: '1450.00', unit: 'each', description: 'Submersible bundle B – well plate. Duct tape, electrical splice connections, tape kit, etc.' },
    { name: 'Bundle C', type: 'Bundle', price: '700.00', unit: 'each', description: 'Submersible bundle C – reuse discharge head. Duct tape, electrical splice connections, tape kit, etc.' },
  ];

  // Clear existing materials to avoid duplicates if re-running (or use upsert)
  // await db.delete(materialsTable);
  // Consider upsert or more sophisticated seeding if data might change
  for (const mat of materialsToSeed) {
     await db.insert(materialsTable).values(mat).onConflictDoNothing(); // Or onConflictDoUpdate
  }
  console.log('Materials seeded.');

  // --- Labor Rates ---
  const laborRatesToSeed = [
    { laborType: 'Prep Job Labor', ratePerHour: '175.00', description: 'Labor for job preparation' },
    { laborType: 'Install Submersible Labor', ratePerHour: '395.00', description: 'Labor for installing submersible pump' },
    { laborType: 'Ag Sub Pump Startup Labor', ratePerHour: '175.00', description: 'Labor for agricultural submersible pump startup' },
  ];
  // await db.delete(laborRatesTable);
  for (const rate of laborRatesToSeed) {
    await db.insert(laborRatesTable).values(rate).onConflictDoNothing();
  }
  console.log('Labor rates seeded.');

  console.log('Database seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});