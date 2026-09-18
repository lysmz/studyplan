import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { AppLayout } from '@/components/layout';

// Pages
import NotFound from '@/pages/not-found';
import Login from '@/pages/login';
import Register from '@/pages/register';
import Dashboard from '@/pages/dashboard';
import Kalender from '@/pages/kalender';
import Noten from '@/pages/noten';
import Stundenplan from '@/pages/stundenplan';
import Studie from '@/pages/studie';
import Gruppen from '@/pages/gruppen';
import GruppenDetail from '@/pages/gruppen-detail';
import Einladung from '@/pages/einladung';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'UNAUTHENTICATED'
        ) {
          return false
        }
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/kalender">
        <AppLayout>
          <Kalender />
        </AppLayout>
      </Route>
      <Route path="/noten">
        <AppLayout>
          <Noten />
        </AppLayout>
      </Route>
      <Route path="/stundenplan">
        <AppLayout>
          <Stundenplan />
        </AppLayout>
      </Route>
      <Route path="/studie">
        <AppLayout>
          <Studie />
        </AppLayout>
      </Route>
      <Route path="/gruppen">
        <AppLayout><Gruppen /></AppLayout>
      </Route>
      <Route path="/gruppen/:id">
        <AppLayout><GruppenDetail /></AppLayout>
      </Route>
      <Route path="/einladung/:token" component={Einladung} />
      <Route path="/">
        <AppLayout><Dashboard /></AppLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter hook={useHashLocation}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
