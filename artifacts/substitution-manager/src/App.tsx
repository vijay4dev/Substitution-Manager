import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { AuthProvider, ProtectedRoute } from '@/lib/auth';

import Login from '@/pages/login';
import AbsentTeacher from '@/pages/absent-teacher';
import ImportTimetable from '@/pages/import';
import PrintView from '@/pages/print';
import Reports from '@/pages/reports';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        {() => <ProtectedRoute component={AbsentTeacher} />}
      </Route>
      
      <Route path="/import">
        {() => <ProtectedRoute component={ImportTimetable} />}
      </Route>
      
      <Route path="/print">
        {() => <ProtectedRoute component={PrintView} />}
      </Route>
      
      <Route path="/absent-teacher">
        {() => <ProtectedRoute component={AbsentTeacher} />}
      </Route>

      <Route path="/reports">
        {() => <ProtectedRoute component={Reports} />}
      </Route>

      <Route>
        <div className="flex h-[100dvh] items-center justify-center bg-background text-foreground">
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold mb-2">404</h1>
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
