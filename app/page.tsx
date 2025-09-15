"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthService, type AuthUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dashboard } from "@/components/dashboard"
import { SessionManager } from "@/components/session-manager"
import ErrorBoundary from "@/components/error-boundary"
import { DatabaseService } from "@/lib/database"
import { HelpCircle, Eye, EyeOff } from "lucide-react"

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showRegister, setShowRegister] = useState(false)
  const [regUsername, setRegUsername] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirmPassword, setRegConfirmPassword] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regRole, setRegRole] = useState<"manager" | "worker">("worker")
  const [lastToken, setLastToken] = useState<string>("")
  const [confirmToken, setConfirmToken] = useState<string>("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(true)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false)

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Try login, and if it fails, refresh from server and try again
    let loggedInUser = AuthService.login(username, password)
    if (!loggedInUser) {
      const db = DatabaseService.getInstance()
      db.refreshFromServer?.().then(() => {
        const retry = AuthService.login(username, password)
        if (retry) {
          setUser(retry)
          setError("")
        } else {
          setError("Invalid username or password")
        }
      })
      return
    }
    if (loggedInUser) {
      setUser(loggedInUser)
      setError("")
    } else {
      setError("Invalid username or password")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (regPassword !== regConfirmPassword) {
        alert("Passwords do not match")
        return
      }
      const db = DatabaseService.getInstance()
      const req = db.registerUserRequest({ username: regUsername, email: regEmail, phone: regPhone, password: regPassword, requested_role: regRole })
      setLastToken(req.email_token)
      setShowRegister(false)
      const siteUrl = (typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin) : (process.env.NEXT_PUBLIC_SITE_URL || ''))
      const confirmUrl = `${siteUrl}/confirm?token=${req.email_token}`
      let sent = false
      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: regEmail,
            subject: 'Confirm your email - Zanzibar Laptop Shop',
            html: `<p>Hello ${regUsername},</p><p>Please confirm your email by clicking the link below:</p><p><a href="${confirmUrl}">Confirm Email</a></p><p>If the link doesn't work, open ${confirmUrl} or use this token: <strong>${req.email_token}</strong></p>`
          })
        })
        const data = await res.json()
        sent = !!data?.sent
      } catch {}
      if (sent) {
        alert(`Registration submitted. A confirmation email was sent to ${regEmail}.`)
      } else {
        alert(`Registration submitted. Email sending is not configured. Open Zanzibar Shop → Confirm Email page and enter your token to complete verification.`)
      }
      setRegUsername("")
      setRegEmail("")
      setRegPassword("")
      setRegConfirmPassword("")
      setRegPhone("")
      setRegRole("worker")
    } catch (err: any) {
      alert(err?.message || "Registration failed")
    }
  }

  const handleConfirmEmail = (e: React.FormEvent) => {
    e.preventDefault()
    const db = DatabaseService.getInstance()
    const res = db.confirmRegistrationEmail(confirmToken)
    alert(res.message)
    setConfirmToken("")
  }

  const handleLogout = () => {
    AuthService.logout()
    setUser(null)
    setUsername("")
    setPassword("")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return (
      <>
        <ErrorBoundary>
          <Dashboard user={user} onLogout={handleLogout} />
        </ErrorBoundary>
        <SessionManager onSessionExpired={handleLogout} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">Zanzibar Laptop Shop</CardTitle>
          <CardDescription className="text-muted-foreground">Sign in to your account</CardDescription>
          
          {/* Collapsible Help Section */}
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <HelpCircle className="h-4 w-4" />
              {showHelp ? 'Hide Help' : 'Show Help'}
            </Button>
            
            {showHelp && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm animate-in slide-in-from-top-2 duration-200">
                <p className="font-medium text-blue-800 mb-2">📋 Getting Started Instructions:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li><strong>Registration:</strong> Click "Create an account" to register as manager or worker</li>
                  <li><strong>Email Confirmation:</strong> After registration, use the token below to confirm your email</li>
                  <li><strong>Role Permissions:</strong> Admin has full access, Manager has limited access, Worker has basic access</li>
                  <li><strong>Sample Data:</strong> After login, use "Generate Data" button (Admin only) to populate the system</li>
                </ul>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!showRegister ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-background border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="password"
                  type={showLoginPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-background border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background hover:bg-accent"
                  aria-label="Hold to view password"
                  onMouseDown={() => setShowLoginPassword(true)}
                  onMouseUp={() => setShowLoginPassword(false)}
                  onMouseLeave={() => setShowLoginPassword(false)}
                  onTouchStart={() => setShowLoginPassword(true)}
                  onTouchEnd={() => setShowLoginPassword(false)}
                >
                  {showLoginPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">{error}</div>}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Sign In
            </Button>
            <Button type="button" variant="outline" className="w-full mt-2" onClick={() => setShowRegister(true)}>
              Create an account
            </Button>
            <div className="mt-4 space-y-2">
              <Label className="text-foreground">Email confirmation token</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter token"
                  value={confirmToken}
                  onChange={(e) => setConfirmToken(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
                <Button type="button" onClick={handleConfirmEmail} className="bg-secondary hover:bg-secondary/90">
                  Confirm Email
                </Button>
              </div>
              {lastToken && (
                <p className="text-xs text-muted-foreground">Last token (mock email): {lastToken}</p>
              )}
            </div>
          </form>
          ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg_username" className="text-foreground">Username</Label>
              <Input id="reg_username" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg_email" className="text-foreground">Email</Label>
              <Input id="reg_email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg_phone" className="text-foreground">Phone Number</Label>
              <Input id="reg_phone" type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg_password" className="text-foreground">Password</Label>
              <div className="flex gap-2 items-center">
                <Input id="reg_password" type={showRegPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background hover:bg-accent"
                  aria-label="Hold to view password"
                  onMouseDown={() => setShowRegPassword(true)}
                  onMouseUp={() => setShowRegPassword(false)}
                  onMouseLeave={() => setShowRegPassword(false)}
                  onTouchStart={() => setShowRegPassword(true)}
                  onTouchEnd={() => setShowRegPassword(false)}
                >
                  {showRegPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg_password_confirm" className="text-foreground">Confirm Password</Label>
              <div className="flex gap-2 items-center">
                <Input id="reg_password_confirm" type={showRegConfirmPassword ? "text" : "password"} value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required />
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background hover:bg-accent"
                  aria-label="Hold to view password"
                  onMouseDown={() => setShowRegConfirmPassword(true)}
                  onMouseUp={() => setShowRegConfirmPassword(false)}
                  onMouseLeave={() => setShowRegConfirmPassword(false)}
                  onTouchStart={() => setShowRegConfirmPassword(true)}
                  onTouchEnd={() => setShowRegConfirmPassword(false)}
                >
                  {showRegConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Requested Role</Label>
              <select value={regRole} onChange={(e) => setRegRole(e.target.value as any)} className="w-full p-2 border border-border rounded-md bg-background text-foreground">
                <option value="worker">Worker</option>
                <option value="manager">Manager (admin approval required)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Submit Registration</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowRegister(false)}>Back to Login</Button>
            </div>
          </form>
          )}
          
        </CardContent>
      </Card>
    </div>
  )
}
