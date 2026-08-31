import { NavLink, Outlet } from 'react-router-dom';
import { useCampaign } from '../context/CampaignContext';
import { parseCampaignPlayers } from '../types';

const navItems = [
  { to: '/', label: 'Buscar', shortLabel: 'Buscar', icon: '🔍', end: true },
  { to: '/campaigns', label: 'Campañas', shortLabel: 'Runs', icon: '⚓' },
  { to: '/keywords', label: 'Palabras', shortLabel: 'Keys', icon: '🔑' },
  { to: '/totems', label: 'Tótems', shortLabel: 'Tótems', icon: '🗿' },
];

export function Layout() {
  const { activeCampaign } = useCampaign();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            SG
          </span>
          <div className="brand-text">
            <p className="brand-title">Sleeping Gods</p>
            <p className="brand-subtitle">Campaign Tracker</p>
          </div>
        </div>

        {activeCampaign && (
          <div className="active-campaign" title={activeCampaign.name}>
            <span className="label">Activa</span>
            <strong className="active-campaign-name">{activeCampaign.name}</strong>
            {parseCampaignPlayers(activeCampaign).length > 0 && (
              <span className="active-campaign-players">
                {parseCampaignPlayers(activeCampaign).join(', ')}
              </span>
            )}
          </div>
        )}
      </header>

      <nav className="app-nav desktop-nav" aria-label="Navegación principal">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navegación móvil">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'bottom-nav-link active' : 'bottom-nav-link'
            }
          >
            <span className="bottom-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="bottom-nav-label">{item.shortLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
