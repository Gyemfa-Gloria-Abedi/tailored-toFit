// api/ai-designs.ts
import { apiRequest } from './client'
import { Measurement } from './clients'

export type AIDesignOptions = {
  imageDataUrl?: string // optional: without a photo the design is shown on a model
  measurement?: Measurement // sent by the screen; the backend uses the latest saved record
  garmentType: string
  style: string
  fabric: string
  colour: string
  occasion: string
  // Optional: a specific recommended style from the fit profile (e.g. "Wrap Dress").
  styleName?: string
  styleDescription?: string
}

export type AIDesign = {
  id: string
  name: string
  garmentType: string
  measurement?: Measurement // the backend doesn't return this, so it's optional
  style: string
  fabric: string
  colour: string
  occasion: string
  imageUrl: string
  imageDataUrl?: string // only returned right after generating, not in the list
  mode?: 'photo' | 'text' // 'text' = photo couldn't be used, design shown on a model
  createdAt: string
}

export type AIDesignResponse = {
  design: AIDesign
}

export async function generateAIDesign(
  clientId: string,
  data: AIDesignOptions,
) {
  return apiRequest<AIDesignResponse>(`/api/clients/${clientId}/ai-designs`, {
    method: 'POST',
    body: data,
  })
}

export async function getAIDesigns(clientId: string) {
  return apiRequest<{ designs: AIDesign[] }>(
    `/api/clients/${clientId}/ai-designs`,
  )
}

// ---------- saved designs (all clients) ----------

export type SavedDesign = Omit<AIDesign, 'measurement' | 'imageDataUrl' | 'mode'> & {
  client: { id: string; name: string }
  designData?: { mode?: 'photo' | 'text'; measurementUnit?: string } | null
  prompt?: string // only returned by getSavedDesign
}

export async function getSavedDesigns(filters: { search?: string; garment?: string } = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.garment) params.set('garment', filters.garment)
  const query = params.toString()
  return apiRequest<{ designs: SavedDesign[] }>(`/api/ai-designs${query ? `?${query}` : ''}`)
}

export async function getSavedDesign(designId: string) {
  return apiRequest<{ design: SavedDesign }>(`/api/ai-designs/${designId}`)
}

export async function deleteSavedDesign(designId: string) {
  return apiRequest<void>(`/api/ai-designs/${designId}`, { method: 'DELETE' })
}
