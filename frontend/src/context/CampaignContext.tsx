import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Campaign } from '../types';
import { getCampaigns } from '../api/campaigns';

interface CampaignContextValue {
  campaigns: Campaign[];
  activeCampaign: Campaign | null;
  activeCampaignId: string | null;
  loading: boolean;
  error: string | null;
  setActiveCampaignId: (id: string | null) => void;
  refreshCampaigns: () => Promise<void>;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

const STORAGE_KEY = 'sleeping-gods-active-campaign';

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignId, setActiveCampaignIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCampaigns();
  }, [refreshCampaigns]);

  const setActiveCampaignId = useCallback((id: string | null) => {
    setActiveCampaignIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const activeCampaign = useMemo(
    () => campaigns.find((c) => c.id === activeCampaignId) ?? null,
    [campaigns, activeCampaignId],
  );

  const value = useMemo(
    () => ({
      campaigns,
      activeCampaign,
      activeCampaignId,
      loading,
      error,
      setActiveCampaignId,
      refreshCampaigns,
    }),
    [
      campaigns,
      activeCampaign,
      activeCampaignId,
      loading,
      error,
      setActiveCampaignId,
      refreshCampaigns,
    ],
  );

  return (
    <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within CampaignProvider');
  }
  return context;
}
