"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AuthService, type AuthUser } from "@/lib/auth"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "admin" | "manager" | "worker"
  requiredPermission?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, requiredRole, requiredPermission, fallback }: ProtectedRouteProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      fallback || (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>You must be logged in to access this resource.</CardDescription>
          </CardHeader>
        </Card>
      )
    )
  }

  if (requiredRole && !AuthService.hasPermission(requiredRole)) {
    return (
      fallback || (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Insufficient Permissions
            </CardTitle>
            <CardDescription>You need {requiredRole} role or higher to access this resource.</CardDescription>
          </CardHeader>
        </Card>
      )
    )
  }

  if (requiredPermission && !AuthService.canAccess(requiredPermission)) {
    return (
      fallback || (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Access Restricted
            </CardTitle>
            <CardDescription>You don't have permission to access this feature.</CardDescription>
          </CardHeader>
        </Card>
      )
    )
  }

  return <>{children}</>
}
