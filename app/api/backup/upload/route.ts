import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { PrismaClient } from "@prisma/client"

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "db.json")

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {}
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const text = await file.text()
    const parsed = JSON.parse(text)

    await ensureDir()
    await fs.writeFile(DATA_FILE, JSON.stringify(parsed, null, 2), "utf8")
    // Also replace MySQL data using a transaction
    const prisma = new PrismaClient()
    try {
      await prisma.$transaction(async (tx) => {
        await tx.auditLog.deleteMany()
        await tx.installment.deleteMany()
        await tx.sale.deleteMany()
        await tx.repair.deleteMany()
        await tx.laptop.deleteMany()
        await tx.customer.deleteMany()
        await tx.registrationRequest.deleteMany()
        await tx.user.deleteMany()

        if (parsed.users?.length) await tx.user.createMany({ data: parsed.users })
        if (parsed.customers?.length) await tx.customer.createMany({ data: parsed.customers })
        if (parsed.laptops?.length) await tx.laptop.createMany({ data: parsed.laptops })
        if (parsed.sales?.length) await tx.sale.createMany({ data: parsed.sales })
        if (parsed.installments?.length) await tx.installment.createMany({ data: parsed.installments })
        if (parsed.repairs?.length) await tx.repair.createMany({ data: parsed.repairs })
        if (parsed.registrationRequests?.length) await tx.registrationRequest.createMany({ data: parsed.registrationRequests })
        if (parsed.auditLogs?.length) await tx.auditLog.createMany({ data: parsed.auditLogs })
      })
    } finally {
      await prisma.$disconnect()
    }

    return NextResponse.json({ uploaded: true, appliedToMySQL: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to upload backup" }, { status: 500 })
  }
}


