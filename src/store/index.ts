import { create } from 'zustand';

// Types
export type JobStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface FarmerRequest {
  id: string;
  farmerName: string;
  serviceType: 'Labour' | 'Machinery';
  skillOrMachine: string;
  location: string;
  date: string;
  status: JobStatus;
  assignedProviderId?: string;
}

export interface Provider {
  id: string;
  name: string;
  type: 'Labour' | 'Machinery';
  skills: string[];
  zone: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  rating: number;
}

interface AdminStore {
  // State
  requests: FarmerRequest[];
  providers: Provider[];
  
  // Actions
  assignJob: (requestId: string, providerId: string) => void;
  updateRequestStatus: (requestId: string, status: JobStatus) => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  requests: [],
  providers: [],

  assignJob: (requestId, providerId) => 
    set((state) => ({
      requests: state.requests.map((req) => 
        req.id === requestId 
          ? { ...req, status: 'ASSIGNED', assignedProviderId: providerId }
          : req
      ),
      providers: state.providers.map((prov) =>
        prov.id === providerId
          ? { ...prov, status: 'BUSY' }
          : prov
      )
    })),

  updateRequestStatus: (requestId, status) =>
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === requestId ? { ...req, status } : req
      )
    }))
}));
