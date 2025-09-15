import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "db.json")

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {}
}

function defaultState() {
  return {
    laptops: [],
    customers: [],
    users: [],
    registrationRequests: [],
    sales: [],
    installments: [],
    repairs: [],
    auditLogs: [],
    backups: [],
  }
}

export async function GET() {
  try {
    await ensureDir()
    const data = await fs.readFile(DATA_FILE, "utf8")
    return new NextResponse(data, {
      headers: { "content-type": "application/json" },
      status: 200,
    })
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      // If file doesn't exist, create with default state
      const initial = JSON.stringify(defaultState(), null, 2)
      await ensureDir()
      await fs.writeFile(DATA_FILE, initial, "utf8")
      return new NextResponse(initial, {
        headers: { "content-type": "application/json" },
        status: 200,
      })
    }
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await ensureDir()
    await fs.writeFile(DATA_FILE, JSON.stringify(body ?? defaultState(), null, 2), "utf8")
    return NextResponse.json({ saved: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
  }
}


