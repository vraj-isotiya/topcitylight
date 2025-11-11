import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useCRMSettings } from "./hooks/useCRMSettings";
import { RouteProtection } from "./components/RouteProtection";
import { InitializeApp } from "./components/InitializeApp";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Emails from "./pages/Emails";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  useCRMSettings();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <RouteProtection>
              <Layout>
                <Dashboard />
              </Layout>
            </RouteProtection>
          }
        />
        <Route
          path="/customers"
          element={
            <RouteProtection>
              <Layout>
                <Customers />
              </Layout>
            </RouteProtection>
          }
        />
        <Route
          path="/emails"
          element={
            <RouteProtection>
              <Layout>
                <Emails />
              </Layout>
            </RouteProtection>
          }
        />
        <Route
          path="/products"
          element={
            <RouteProtection>
              <Layout>
                <Products />
              </Layout>
            </RouteProtection>
          }
        />
        <Route
          path="/reports"
          element={
            <RouteProtection>
              <Layout>
                <Reports />
              </Layout>
            </RouteProtection>
          }
        />
        <Route
          path="/settings"
          element={
            <RouteProtection>
              <Layout>
                <Settings />
              </Layout>
            </RouteProtection>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InitializeApp>
          <AppContent />
        </InitializeApp>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
