import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
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
    return NextResponse.json({ error: "Failed to load MySQL data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const state = await request.json()
    // naive sync: replace main tables with incoming state
    // transaction to clear and reinsert
    await prisma.$transaction(async (tx) => {
      // order matters due to FKs
      await tx.auditLog.deleteMany()
      await tx.installment.deleteMany()
      await tx.sale.deleteMany()
      await tx.repair.deleteMany()
      await tx.laptop.deleteMany()
      await tx.customer.deleteMany()
      await tx.registrationRequest.deleteMany()
      await tx.user.deleteMany()

      if (state.users?.length) await tx.user.createMany({ data: state.users })
      if (state.customers?.length) await tx.customer.createMany({ data: state.customers })
      if (state.laptops?.length) await tx.laptop.createMany({ data: state.laptops })
      if (state.sales?.length) await tx.sale.createMany({ data: state.sales })
      if (state.installments?.length) await tx.installment.createMany({ data: state.installments })
      if (state.repairs?.length) await tx.repair.createMany({ data: state.repairs })
      if (state.registrationRequests?.length) await tx.registrationRequest.createMany({ data: state.registrationRequests })
      if (state.auditLogs?.length) await tx.auditLog.createMany({ data: state.auditLogs })
    })
    return NextResponse.json({ saved: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to save MySQL data" }, { status: 500 })
  }
}


