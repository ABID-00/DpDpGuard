'use client'

import { useEffect, useState } from 'react'

type Check = { control: string; passed: boolean }
type AssetScore = {
  assetId: string
  name: string
  type: string
  reported: boolean
  score: number | null
  lastCheckIn: string | null
  checks: Check[]
}
type ScoringData = { organizationScore: number | null; assets: AssetScore[] }

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || ''

const formatIST = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : 'Never'

export default function Dashboard() {
  const [data, setData] = useState<ScoringData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/api/scoring`, { headers: { Authorization: `Bearer ${TOKEN}` } })
      .then(async res => {
        const body = await res.json()
        if (!res.ok || !body.success) throw new Error(body.error || `HTTP ${res.status}`)
        setData(body.data)
      })
      .catch(e => setError(e.message))
  }, [])

  if (error) return <p className="p-6 text-red-600">Could not load scoring: {error}</p>
  if (!data) return <p className="p-6">Loading...</p>

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Compliance scoring</h1>
        <p className="mt-4 text-5xl font-bold">
          {data.organizationScore === null ? '—' : `${data.organizationScore}%`}
        </p>
      </header>

      {data.assets.length === 0 && <p>No agents have reported yet.</p>}

      {data.assets.map(a => (
        <section key={a.assetId} className="rounded border p-4">
                    <div className="flex justify-between">
            <div>
              <h2 className="font-semibold">{a.name}</h2>
              <p className="text-sm text-gray-500">Last check-in: {formatIST(a.lastCheckIn)} IST</p>
            </div>
            <span>{a.reported ? `${a.score}%` : 'No data yet'}</span>
          </div>
          {a.reported && (
            <ul className="mt-3 space-y-1">
              {a.checks.map(c => (
                <li key={c.control} className="flex justify-between text-sm">
                  <span>{c.control}</span>
                  <span className={c.passed ? 'text-green-700' : 'text-red-600'}>
                    {c.passed ? 'Pass' : 'Potential gap'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  )
}