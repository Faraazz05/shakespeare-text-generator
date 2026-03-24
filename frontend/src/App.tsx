// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import Index from "@/pages/Index";
import GeneratePage from "@/pages/GeneratePage";
import ExplainPage from "@/pages/ExplainPage";
import ModelsPage from "@/pages/ModelsPage";
import TrainPage from "@/pages/TrainPage";
import ConfigPage from "@/pages/ConfigPage";
import NotFound from "@/pages/NotFound";

// ✅ Matches your actual GitHub repo name
const BASE = import.meta.env.MODE === "production"
  ? "/shakespeare-text-generator"
  : "";

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter basename={BASE}>
        <Navbar />
        <Routes>
          <Route path="/"         element={<Index />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/explain"  element={<ExplainPage />} />
          <Route path="/models"   element={<ModelsPage />} />
          <Route path="/train"    element={<TrainPage />} />
          <Route path="/config"   element={<ConfigPage />} />
          <Route path="*"         element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
