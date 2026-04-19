import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "./components/LoadingScreen";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import ChatPage from "./pages/Chat/Chat";
import ResumeAnalyzerPage from "./pages/ResumeAnalyzer/ResumeAnalyzer";
import VoiceToolsPage from "./pages/VoiceTools/VoiceTools";
import SummarizerPage from "./pages/Summarizer/Summarizer";
import ImageDetectorPage from "./pages/ImageDetector/ImageDetector";
import ImageGeneratorPage from "./pages/ImageGenerator/ImageGenerator";
import CodeExplainerPage from "./pages/CodeExplainer/CodeExplainer";
import GrammarCheckerPage from "./pages/GrammarChecker/GrammarChecker";
import LoginPage from "./pages/Auth/Login/Login";
import RegisterPage from "./pages/Auth/Register/Register";
import ProfilePage from "./pages/Profile/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

function AnimatedRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="resume-analyzer" element={<ResumeAnalyzerPage />} />
        <Route path="voice-tools" element={<VoiceToolsPage />} />
        <Route path="summarizer" element={<SummarizerPage />} />
        <Route path="image-detector" element={<ImageDetectorPage />} />
        <Route path="image-generator" element={<ImageGeneratorPage />} />
        <Route path="code-explainer" element={<CodeExplainerPage />} />
        <Route path="grammar-checker" element={<GrammarCheckerPage />} />
        <Route path="profile" element={<ProfilePage />} />

        <Route path="*" element={
          <div className="flex h-full items-center justify-center text-white">
            <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
          </div>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            background: 'rgba(11, 7, 38, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '1rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />
      <AnimatePresence mode="wait">
        <AnimatedRoutes key="routes" />
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;
