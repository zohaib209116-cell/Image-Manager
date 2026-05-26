import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Bookings from "@/pages/Bookings";
import Menu from "@/pages/Menu";
import Tables from "@/pages/Tables";
import Profile from "@/pages/Profile";
import Analytics from "@/pages/Analytics";
import Notifications from "@/pages/Notifications";
import Staff from "@/pages/Staff";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient();

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        <ProtectedLayout>
          <Dashboard />
        </ProtectedLayout>
      </Route>
      
      <Route path="/bookings">
        <ProtectedLayout>
          <Bookings />
        </ProtectedLayout>
      </Route>
      
      <Route path="/menu">
        <ProtectedLayout>
          <Menu />
        </ProtectedLayout>
      </Route>
      
      <Route path="/tables">
        <ProtectedLayout>
          <Tables />
        </ProtectedLayout>
      </Route>
      
      <Route path="/profile">
        <ProtectedLayout>
          <Profile />
        </ProtectedLayout>
      </Route>
      
      <Route path="/analytics">
        <ProtectedLayout>
          <Analytics />
        </ProtectedLayout>
      </Route>
      
      <Route path="/notifications">
        <ProtectedLayout>
          <Notifications />
        </ProtectedLayout>
      </Route>
      
      <Route path="/staff">
        <ProtectedLayout>
          <Staff />
        </ProtectedLayout>
      </Route>
      
      <Route path="/settings">
        <ProtectedLayout>
          <Settings />
        </ProtectedLayout>
      </Route>

      <Route>
        <ProtectedLayout>
          <NotFound />
        </ProtectedLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
