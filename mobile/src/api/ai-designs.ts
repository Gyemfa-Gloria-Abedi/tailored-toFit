import { apiRequest } from './client';

export type AIDesignOptions = {
  imageDataUrl: string;
  garmentType: string;
  style: string;
  fabric: string;
  colour: string;
  occasion: string;
};

export type AIDesignResponse = {
  design: {
    id: string;
    name: string;
    garmentType: string;
    style: string;
    fabric: string;
    colour: string;
    occasion: string;
    imageUrl: string;
    imageDataUrl: string;
    createdAt: string;
  };
};

export async function generateAIDesign(clientId: string, data: AIDesignOptions) {
  return apiRequest<AIDesignResponse>(`/api/clients/${clientId}/ai-designs`, {
    method: 'POST',
    body: data,
  });
}

export async function getAIDesigns(clientId: string) {
  return apiRequest<{ designs: AIDesignResponse['design'][] }>(
    `/api/clients/${clientId}/ai-designs`,
  );
}
