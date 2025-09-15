import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json()
    const apiKey = process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY
    const from = process.env.MAIL_FROM || 'onboarding@resend.dev'

    if (!to || !subject || !html) {
      return NextResponse.json({ ok: false, error: 'Missing to/subject/html' }, { status: 400 })
    }

    if (!apiKey) {
      // Dev fallback: pretend success but report not sent
      return NextResponse.json({ ok: true, sent: false, message: 'Email not sent (missing RESEND_API_KEY). Dev fallback.' })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: data?.message || 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, sent: true, providerResponse: data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}


