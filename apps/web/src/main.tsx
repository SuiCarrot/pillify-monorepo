import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { bootstrapApp, startLifecycleReconciliation } from './composition';
import { AppRoutes } from './routes';
import './index.css';

function Root() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    void (async () => {
      try {
        await bootstrapApp();
        unsubscribe = startLifecycleReconciliation();
        setReady(true);
      } catch (error) {
        setBootError(error instanceof Error ? error.message : 'Falha ao iniciar o app');
      }
    })();
    return () => unsubscribe();
  }, []);

  if (bootError) {
    return (
      <main className="flex min-h-full items-center justify-center px-6 text-center">
        <p role="alert">{bootError}</p>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="flex min-h-full items-center justify-center px-6 text-slate-500">
        Carregando Pillify…
      </main>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
