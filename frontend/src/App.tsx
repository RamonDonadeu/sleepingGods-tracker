import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CampaignProvider } from './context/CampaignContext';
import { CampaignHistoryPage } from './pages/CampaignHistoryPage';
import { GoLocationPage } from './pages/GoLocationPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { KeywordDetailPage } from './pages/KeywordDetailPage';
import { KeywordsPage } from './pages/KeywordsPage';
import { LocationPage } from './pages/LocationPage';
import { SearchPage } from './pages/SearchPage';
import { TotemDetailPage } from './pages/TotemDetailPage';
import { TotemsPage } from './pages/TotemsPage';

export default function App() {
  return (
    <CampaignProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<SearchPage />} />
            <Route path="go/:code" element={<GoLocationPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="keywords" element={<KeywordsPage />} />
            <Route path="keywords/:id" element={<KeywordDetailPage />} />
            <Route path="totems" element={<TotemsPage />} />
            <Route path="totems/:id" element={<TotemDetailPage />} />
            <Route path="locations/:id" element={<LocationPage />} />
            <Route path="campaigns/:id" element={<CampaignHistoryPage />} />
            <Route path="map" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CampaignProvider>
  );
}
