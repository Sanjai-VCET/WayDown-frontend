// main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import "bootstrap/dist/css/bootstrap.min.css";
import "leaflet/dist/leaflet.css";

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  persistQueryClient,
} from '@tanstack/react-query-persist-client';
import {
  createSyncStoragePersister,
} from '@tanstack/query-sync-storage-persister';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// ✅ LocalStorage persister setup
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

// ✅ QueryClient setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// 💾 Enable persistent caching
persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 24,
});

createRoot(document.getElementById('root')).render(
//  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  //</StrictMode>
);
