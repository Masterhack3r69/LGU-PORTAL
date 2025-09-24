const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const certDir = path.join(__dirname, "certs");

// Create certs directory if it doesn't exist
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const keyPath = path.join(certDir, "key.pem");
const certPath = path.join(certDir, "cert.pem");

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log("✅ SSL certificates already exist");
  process.exit(0);
}

try {
  console.log("🔐 Generating self-signed SSL certificate for intranet...");

  // Generate private key and certificate
  const command = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=10.0.0.73"`;

  execSync(command, { stdio: "inherit" });

  console.log("✅ SSL certificate generated successfully!");
  console.log(`📁 Certificate: ${certPath}`);
  console.log(`🔑 Private Key: ${keyPath}`);
  console.log("");
  console.log(
    "⚠️  Note: This is a self-signed certificate. Browsers will show a security warning."
  );
  console.log('   Click "Advanced" and "Proceed to 10.0.0.73" to continue.');
} catch (error) {
  console.error("❌ Failed to generate certificate:", error.message);
  console.log("");
  console.log("💡 Alternative: You can run the frontend without HTTPS using:");
  console.log("   npm run dev:intranet");
  console.log("");
  console.log("   Or install OpenSSL and try again:");
  console.log(
    "   - Windows: Download from https://slproweb.com/products/Win32OpenSSL.html"
  );
  console.log("   - Or use Git Bash which includes OpenSSL");
}
