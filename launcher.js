const { spawn, exec } = require("child_process")
const path = require("path")

console.log("🚀 Starting Zanzibar Laptop Shop...")

// Function to open browser
function openBrowser(url) {
  const start = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open"
  exec(`${start} ${url}`)
}

// Start the Next.js development server
const devProcess = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  cwd: __dirname,
})

// Wait for server to start, then open browser
setTimeout(() => {
  console.log("🌐 Opening browser...")
  openBrowser("http://localhost:3000")
}, 3000)

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down Zanzibar Laptop Shop...")
  devProcess.kill("SIGINT")
  process.exit(0)
})

process.on("SIGTERM", () => {
  devProcess.kill("SIGTERM")
  process.exit(0)
})

devProcess.on("close", (code) => {
  console.log(`Development server exited with code ${code}`)
  process.exit(code)
})
