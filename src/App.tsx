import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AuthProvider } from '@/contexts';
import { router } from '@/routes';
import { initMigrationCheck } from '@/utils/azureMigration';
import { DEPLOYMENT_VERSION, BACKEND_URL } from '@/config/deployment';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Run migration check on app startup
  useEffect(() => {
    initMigrationCheck();
    console.log('?? App deployment:', DEPLOYMENT_VERSION);
    console.log('?? Backend:', BACKEND_URL);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
