import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "db.json")

export async function GET() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf8")
    return new NextResponse(content, {
      headers: {
        "content-type": "application/json",
        "content-disposition": `attachment; filename="zanzibar-backup-${Date.now()}.json"`,
      },
      status: 200,
    })
  } catch (err) {
    return NextResponse.json({ error: "Backup file not found" }, { status: 404 })
  }
}


