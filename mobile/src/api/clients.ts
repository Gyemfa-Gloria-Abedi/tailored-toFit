import { apiRequest } from './client';

export type ClientGender =
  | 'MALE'
  | 'FEMALE'
  | 'OTHER';

export type Client = {
  id: string;
  ownerId: string;
  name: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  avatarUrl?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;

  measurements?: Measurement[];
  fitProfiles?: FitProfile[];
};

export type Measurement = {
  id: string;
  clientId: string;
  unit: 'INCH' | 'CM';

  neck?: number | null;
  shoulderWidth?: number | null;
  chest?: number | null;
  waist?: number | null;
  hip?: number | null;
  backLength?: number | null;
  acrossChest?: number | null;
  sleeveLength?: number | null;
  bicep?: number | null;
  wrist?: number | null;

  createdAt: string;
};

export type FitProfile = {
  id: string;
  clientId: string;
  score: number;
  bodyShape: string;
  summary: string;
  strengths: unknown;
  recommendations: unknown;
  generatedAt: string;
};

export type CreateClientData = {
  name: string;
  gender?: ClientGender;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  notes?: string;
  avatarUrl?: string;
};

export async function getClients(
  search?: string
) {
  const query = search
    ? `?search=${encodeURIComponent(search)}`
    : '';

  return apiRequest<{
    clients: Client[];
  }>(
    `/api/clients${query}`
  );
}

export async function getClient(
  id: string
) {
  return apiRequest<{
    client: Client;
  }>(
    `/api/clients/${id}`
  );
}

export async function createClient(
  data: CreateClientData
) {
  return apiRequest<{
    client: Client;
  }>(
    '/api/clients',
    {
      method: 'POST',
      body: data,
    }
  );
}

export async function updateClient(
  id: string,
  data: Partial<CreateClientData>
) {
  return apiRequest<{
    message: string;
  }>(
    `/api/clients/${id}`,
    {
      method: 'PATCH',
      body: data,
    }
  );
}

export async function deleteClient(
  id: string
) {
  return apiRequest<void>(
    `/api/clients/${id}`,
    {
      method: 'DELETE',
    }
  );
}