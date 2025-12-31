import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { I18nProvider } from './i18n';
import './styles/index.css';

// Determine basename based on current URL path
// When accessed via proxy at /内网/, use that as basename
// When accessed directly (dev mode at port 5174), use no basename
const getBasename = (): string | undefined => {
  // Check if we're being accessed via /内网/ path (proxy or production)
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    // Match /内网, /intranet, or URL-encoded versions
    const match = path.match(/^(\/(?:%E5%86%85%E7%BD%91|内网|intranet))/i);
    if (match) {
      return match[1];
    }
  }
  // Fall back to Vite's BASE_URL for embedded builds
  if (import.meta.env.BASE_URL && import.meta.env.BASE_URL !== '/') {
    return import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;
  }
  return undefined;
};

const basename = getBasename();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <I18nProvider>
        <SearchProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SearchProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
);
