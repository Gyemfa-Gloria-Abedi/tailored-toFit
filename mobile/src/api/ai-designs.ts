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
