// Create a test that replicates the exact frontend request

// Simulate frontend data
const employee_id = 37;
const year = 2025;
const selectedBenefits = [1, 4]; // IDs from available benefits
const availableBenefits = [
  { id: 1, name: "Vacation Leave Monetization", estimated_amount: 5000 },
  { id: 4, name: "13th Month Pay", estimated_amount: 10000 }
];

// Replicate frontend logic from BenefitsWorkflow.tsx:181-184
const selections = selectedBenefits.map(benefitId => {
  const benefit = availableBenefits.find(b => b.id === benefitId);
  return {
    benefit_type_id: benefitId,
    selected_amount: benefit?.estimated_amount || 0
  };
});

const payload = {
  employee_id,
  year,
  selections
};

console.log("🚀 TEST PAYLOAD SENT BY FRONTEND:");
console.log(JSON.stringify(payload, null, 2));

// Expected format:
console.log("\n📋 EXPECTED BACKEND ACCEPTS:");
console.log("{ employee_id: number, year: number, selections: [{ benefit_type_id: number, selected_amount: number }] }");

// Test what gets sent
if (selections && selections.length > 0) {
  console.log("\n✅ PAYLOAD VALIDATION:");
  console.log(`- employee_id: ${employee_id} (type: ${typeof employee_id})`);
  console.log(`- year: ${year} (type: ${typeof year})`);
  console.log(`- selections length: ${selections.length}`);

  console.log("Selections array:");
  selections.forEach((selection, index) => {
    console.log(`  [${index}]: benefit_type_id: ${selection.benefit_type_id}, selected_amount: ${selection.selected_amount}`);
  });
} else {
  console.log("\n❌ PAYLOAD INVALID: selections array is empty or undefined");
}

console.log("\n🧪 FRONTEND LOGIC TESTED");
