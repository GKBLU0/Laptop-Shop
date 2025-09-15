"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatabaseService } from "@/lib/database"

export default function ConfirmPage() {
  const params = useSearchParams()
  const token = params.get("token") || ""
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Missing token")
      return
    }
    const db = DatabaseService.getInstance()
    const res = db.confirmRegistrationEmail(token)
    setStatus(res.success ? "ok" : "error")
    setMessage(res.message)
  }, [token])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle>Email Confirmation</CardTitle>
          <CardDescription>Validate your email address to proceed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={status === "ok" ? "text-green-700" : "text-red-700"}>{message}</div>
          <a href="/" className="inline-block mt-4">
            <Button>Back to Login</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}


