import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import MesuresPage from "./pages/MesuresPage";
import AnalysePage from "./pages/AnalysePage";
import ArchivePage from "./pages/ArchivePage";
import SettingsPage from "./pages/SettingsPage";
import IAMaintenancePage from "./pages/IAMaintenancePage";
import DatabaseSchemaPage from "./pages/DatabaseSchemaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mesures" element={<MesuresPage />} />
            <Route path="/analyse" element={<AnalysePage />} />
            <Route path="/ia-maintenance" element={<IAMaintenancePage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/schema-db" element={<DatabaseSchemaPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
