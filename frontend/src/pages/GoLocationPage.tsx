import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { findLocationByNumber } from '../api/locations';
import { useCampaign } from '../context/CampaignContext';

export function GoLocationPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { activeCampaign } = useCampaign();

  useEffect(() => {
    if (!code) return;

    findLocationByNumber(decodeURIComponent(code))
      .then((location) => navigate(`/locations/${location.id}`, { replace: true }))
      .catch(() => navigate('/', { replace: true }));
  }, [code, navigate]);

  if (!activeCampaign) {
    return <p className="muted">Selecciona una campaña activa.</p>;
  }

  return <p className="muted">Abriendo #{code ? decodeURIComponent(code) : '...'}...</p>;
}
