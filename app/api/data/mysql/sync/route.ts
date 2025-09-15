import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST() {
  try {
    // Rebuild a single JSON snapshot from DB
    const [laptops, customers, users, registrationRequests, sales, installments, repairs, auditLogs] = await Promise.all([
      prisma.laptop.findMany(),
      prisma.customer.findMany(),
      prisma.user.findMany(),
      prisma.registrationRequest.findMany(),
      prisma.sale.findMany(),
      prisma.installment.findMany(),
      prisma.repair.findMany(),
      prisma.auditLog.findMany(),
    ])
    return NextResponse.json({ laptops, customers, users, registrationRequests, sales, installments, repairs, auditLogs })
  } catch (e) {
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 })
  }
}


