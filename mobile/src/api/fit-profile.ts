export type BodyShape =
  | 'Hourglass'
  | 'Inverted Triangle'
  | 'Triangle'
  | 'Rectangle'
  | 'Oval'
  | 'Incomplete'

export type FitProfile = {
  score: number
  scoreLabel: 'Complete' | 'Good' | 'Partial' | 'Insufficient'
  bodyShape: BodyShape
  shoulderLine: 'Broad' | 'Average' | 'Narrow' | 'Unknown'
  unit: 'INCH' | 'CM'
  ratios: {
    waistToHip: number | null
    chestToHip: number | null
    waistToChest: number | null
    shoulderToChest: number | null
  }
  summary: string
  strengths: string[]
  recommendations: string[]
  avoid: string[]
  missing: string[]
  warnings: string[]
}

export type StyleRecommendation = {
  name: string
  category: string
  garmentType: string
  description: string
  score: number
  reasons: string[]
}

export type FitProfileResponse = {
  clientId: string
  measurementId: string
  measuredAt: string
  profile: FitProfile
  recommendations: StyleRecommendation[]
}

// ↓ Swap these two for whatever ai-designs.ts uses.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000'
import {
  getToken,
} from "../storage/token";


export async function getFitProfile(clientId: string): Promise<FitProfileResponse> {
  const token = await getToken()
  const res = await fetch(`${API_URL}/api/clients/${clientId}/fit-profile`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || 'Unable to load fit profile.')
  return data as FitProfileResponse
}