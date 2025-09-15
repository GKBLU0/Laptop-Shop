"use client"

import { useEffect, useState } from "react"
import { AuthService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"

interface SessionManagerProps {
  onSessionExpired: () => void
}

export function SessionManager({ onSessionExpired }: SessionManagerProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    const checkSession = () => {
      if (!AuthService.isSessionValid()) {
        onSessionExpired()
        return
      }

      // Show warning 15 minutes before expiration
      const sessionData = localStorage.getItem("laptop_shop_session")
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData)
          const now = Date.now()
          const sessionAge = now - session.timestamp
          const timeUntilExpiry = 8 * 60 * 60 * 1000 - sessionAge // 8 hours - current age
          const warningThreshold = 15 * 60 * 1000 // 15 minutes

          if (timeUntilExpiry <= warningThreshold && timeUntilExpiry > 0) {
            setShowWarning(true)
            setTimeLeft(Math.floor(timeUntilExpiry / 1000 / 60)) // minutes
          } else {
            setShowWarning(false)
          }
        } catch {
          onSessionExpired()
        }
      }
    }

    // Check session every minute
    const interval = setInterval(checkSession, 60000)
    checkSession() // Initial check

    return () => clearInterval(interval)
  }, [onSessionExpired])

  const handleExtendSession = () => {
    AuthService.refreshSession()
    setShowWarning(false)
  }

  if (!showWarning) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="w-80 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800 text-sm">
            <Clock className="h-4 w-4" />
            Session Expiring Soon
          </CardTitle>
          <CardDescription className="text-blue-700">Your session will expire in {timeLeft} minutes</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button size="sm" onClick={handleExtendSession} className="flex-1">
              Extend Session
            </Button>
            <Button size="sm" variant="outline" onClick={onSessionExpired} className="flex-1 bg-transparent">
              Logout Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
