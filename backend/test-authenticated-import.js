// Test import with proper authentication and detailed error handling
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function testAuthenticatedImport() {
  console.log("🔐 Testing authenticated import functionality...\n");

  const baseURL = "http://10.0.0.73:3000/api";

  // Create axios instance with cookie jar
  const api = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 30000,
  });

  try {
    // Step 1: Login
    console.log("1️⃣ Logging in...");
    const loginResponse = await api.post("/auth/login", {
      username: "admin",
      password: "Admin@123",
    });

    console.log("✅ Login successful");
    console.log(`   • Status: ${loginResponse.status}`);
    console.log(`   • User: ${loginResponse.data.user?.username}`);
    console.log(`   • Role: ${loginResponse.data.user?.role}`);

    // Extract cookies for subsequent requests
    const cookies = loginResponse.headers["set-cookie"];
    const cookieHeader = cookies ? cookies.join("; ") : "";

    // Step 2: Test template download
    console.log("\n2️⃣ Testing template download...");
    try {
      const templateResponse = await api.get("/import/employees/template", {
        headers: {
          Cookie: cookieHeader,
        },
        responseType: "arraybuffer",
      });

      console.log("✅ Template download successful");
      console.log(`   • Status: ${templateResponse.status}`);
      console.log(
        `   • Content-Type: ${templateResponse.headers["content-type"]}`
      );
      console.log(`   • Size: ${templateResponse.data.length} bytes`);

      // Save template for verification
      const templatePath = path.join(__dirname, "downloaded_template.xlsx");
      fs.writeFileSync(templatePath, templateResponse.data);
      console.log(`   • Saved to: ${templatePath}`);
    } catch (error) {
      console.log("❌ Template download failed");
      console.log(`   • Status: ${error.response?.status}`);
      console.log(
        `   • Error: ${error.response?.data?.message || error.message}`
      );
    }

    // Step 3: Test import preview
    console.log("\n3️⃣ Testing import preview...");

    const sampleFile = path.join(__dirname, "employee_import_minimal.xlsx");

    if (!fs.existsSync(sampleFile)) {
      console.log("❌ Sample file not found. Creating it...");
      // Create minimal sample if it doesn't exist
      const { createMinimalSample } = require("./create-minimal-sample");
      createMinimalSample();
    }

    // Create form data
    const form = new FormData();
    form.append("excel_file", fs.createReadStream(sampleFile), {
      filename: "employee_import_minimal.xlsx",
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    try {
      const previewResponse = await api.post(
        "/import/employees/preview",
        form,
        {
          headers: {
            ...form.getHeaders(),
            Cookie: cookieHeader,
          },
        }
      );

      console.log("✅ Import preview successful!");
      console.log(`   • Status: ${previewResponse.status}`);

      const data = previewResponse.data.data;
      console.log(`   • Total rows: ${data.totalRows}`);
      console.log(`   • Valid rows: ${data.validRows}`);
      console.log(`   • Invalid rows: ${data.invalidRows}`);
      console.log(`   • Validation errors: ${data.validationErrors.length}`);

      if (data.validationErrors.length > 0) {
        console.log("   • Errors:");
        data.validationErrors.slice(0, 3).forEach((error) => {
          console.log(`     - ${error}`);
        });
        if (data.validationErrors.length > 3) {
          console.log(`     ... and ${data.validationErrors.length - 3} more`);
        }
      }

      // Show field mapping
      console.log("   • Field mapping:");
      Object.entries(data.fieldMapping)
        .slice(0, 6)
        .forEach(([field, column]) => {
          console.log(`     - ${field} <- "${column}"`);
        });

      // Show sample data
      if (data.previewData.length > 0) {
        console.log("   • Sample employees:");
        data.previewData.slice(0, 2).forEach((item) => {
          const emp = item.data;
          console.log(
            `     - ${emp.first_name} ${emp.last_name} (${emp.employee_number})`
          );
        });
      }

      return true;
    } catch (error) {
      console.log("❌ Import preview failed");
      console.log(`   • Status: ${error.response?.status}`);
      console.log(
        `   • Error: ${error.response?.data?.message || error.message}`
      );

      if (error.response?.data) {
        console.log(
          "   • Response data:",
          JSON.stringify(error.response.data, null, 2)
        );
      }

      return false;
    }
  } catch (error) {
    console.log("❌ Authentication failed");
    console.log(`   • Status: ${error.response?.status}`);
    console.log(
      `   • Error: ${error.response?.data?.message || error.message}`
    );
    return false;
  }
}

// Test file upload without authentication to see the exact error
async function testFileUploadDirect() {
  console.log("\n🔍 Testing file upload directly (to see exact error)...\n");

  const sampleFile = path.join(__dirname, "employee_import_minimal.xlsx");

  if (!fs.existsSync(sampleFile)) {
    console.log("❌ Sample file not found");
    return;
  }

  const form = new FormData();
  form.append("excel_file", fs.createReadStream(sampleFile), {
    filename: "employee_import_minimal.xlsx",
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  try {
    const response = await axios.post(
      "http://10.0.0.73:3000/api/import/employees/preview",
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 30000,
      }
    );

    console.log("✅ Direct upload successful (unexpected!)");
    console.log(`   • Status: ${response.status}`);
  } catch (error) {
    console.log("❌ Direct upload failed (expected)");
    console.log(`   • Status: ${error.response?.status}`);
    console.log(
      `   • Error: ${error.response?.data?.message || error.message}`
    );

    if (error.response?.status === 401) {
      console.log("   • This confirms authentication is required");
    }
  }
}

async function runTests() {
  console.log("🚀 Starting comprehensive import tests...\n");

  const success = await testAuthenticatedImport();
  await testFileUploadDirect();

  console.log("\n" + "=".repeat(60));
  if (success) {
    console.log("🎉 Import functionality is working correctly!");
    console.log("📤 You can now use the frontend to import employees");
  } else {
    console.log("⚠️  Import functionality needs attention");
    console.log("📋 Check the error details above");
  }

  console.log("\n📋 Frontend Usage:");
  console.log("1. Navigate to: http://10.0.0.73:5173");
  console.log("2. Login with: admin / Admin@123");
  console.log("3. Go to: Admin → Import Employees");
  console.log("4. Upload: employee_import_minimal.xlsx");
}

runTests().catch(console.error);
