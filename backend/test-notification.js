// Test script to verify notification system
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const notificationService = require("./services/notificationService");

async function testNotification() {
  try {
    console.log("=== Testing Notification System ===");

    // Test 1: Get admin users
    console.log("\n1. Getting admin users...");
    const adminUsers = await notificationService.getAdminUsers();
    console.log("Admin users found:", adminUsers);

    if (adminUsers.length === 0) {
      console.log("WARNING: No admin users found!");
      return;
    }

    // Test 2: Create a test notification
    console.log("\n2. Creating test notification...");
    const testNotification = {
      user_id: adminUsers[0].id,
      type: "document_approval_request",
      title: "Test Document Approval Request",
      message: "This is a test notification to verify the system works.",
      priority: "HIGH",
      reference_type: "employee_document",
      reference_id: 1,
      metadata: {
        test: true,
        employee_name: "Test Employee",
        document_type: "Test Document",
      },
    };

    console.log("Notification data:", testNotification);
    const result = await notificationService.createNotification(
      testNotification
    );
    console.log("Notification created successfully:", result);

    // Test 3: Get unread count
    console.log("\n3. Getting unread count...");
    const unreadCount = await notificationService.getUnreadCount(
      adminUsers[0].id
    );
    console.log("Unread count for admin:", unreadCount);

    console.log("\n=== Test Completed Successfully ===");
    process.exit(0);
  } catch (error) {
    console.error("\n=== Test Failed ===");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

testNotification();
