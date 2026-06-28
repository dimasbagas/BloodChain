import { createBrowserClient } from "@supabase/ssr"

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const url = rawUrl && isValidUrl(rawUrl) ? rawUrl : "http://localhost:54321"
  const key =
    rawKey && rawKey.length > 20
      ? rawKey
      : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE5ODAwMDAwMDAsImV4cCI6MTk4MDAwMDAwMH0"

  return createBrowserClient(url, key)
}
