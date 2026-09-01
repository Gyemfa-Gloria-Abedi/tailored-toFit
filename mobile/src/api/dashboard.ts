import { apiRequest } from './client';

export type DashboardClient = {
  id: string;
  name: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  updatedAt: string;

  measurements?: Array<{
    id: string;
    createdAt: string;
    unit: 'INCH' | 'CM';
  }>;

  fitProfiles?: Array<{
    id: string;
    score: number;
    bodyShape: string;
    generatedAt: string;
  }>;
};

export type DashboardMeasurement = {
  id: string;
  clientId: string;
  unit: 'INCH' | 'CM';
  createdAt: string;

  client: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
};

export type DashboardResponse = {
  stats: {
    clients: number;
    savedStyles: number;
    recentMeasurements: number;
  };

  recentClients: DashboardClient[];

  latestMeasurements: DashboardMeasurement[];
};

export async function getDashboard(
  token?: string | null
): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>(
    '/api/dashboard',
    {
      token,
    }
  );
}