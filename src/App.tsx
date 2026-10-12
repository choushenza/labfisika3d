import React, { useState } from 'react';
import { MainTab } from './types/physics';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { OpticsSimulation } from './components/simulations/OpticsSimulation';
import { SoundSimulation } from './components/simulations/SoundSimulation';
import { MagnetismFrictionSimulation } from './components/simulations/MagnetismFrictionSimulation';
import { PowerPlantSimulation } from './components/simulations/PowerPlantSimulation';
import { QuizLab } from './components/simulations/QuizLab';
import { QuickGuideModal } from './components/ui/QuickGuideModal';
import { Eye, Volume2, Magnet, Zap, Award, Sparkles } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<MainTab>('optik');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickGuide={() => setIsGuideOpen(true)}
      />

      {/* Hero Presentation */}
      <HeroSection onSelectTab={setCurrentTab} />

      {/* Main Simulation Workspace Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Workspace Section Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase font-mono">
              Laboratorium Aktif
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-medium text-slate-300">
              {currentTab === 'optik' && 'Sifat Gelombang Cahaya & Optika'}
              {currentTab === 'bunyi' && 'Gelombang Bunyi & Akustik Ruang'}
              {currentTab === 'magnet-gaya' && 'Kemagnetan 3D & Dinamika Gaya Gesek'}
              {currentTab === 'energi' && 'Pembangkit Listrik & Transformasi Energi'}
              {currentTab === 'kuis' && 'Kuis Evaluasi Pemahaman Sains'}
            </span>
          </div>

          {/* Quick Segmented Navigation Tabs */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setCurrentTab('optik')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-all ${
                currentTab === 'optik' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Cahaya</span>
            </button>
            <button
              onClick={() => setCurrentTab('bunyi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-all ${
                currentTab === 'bunyi' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Bunyi</span>
            </button>
            <button
              onClick={() => setCurrentTab('magnet-gaya')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-all ${
                currentTab === 'magnet-gaya' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Magnet className="h-3.5 w-3.5" />
              <span>Magnet & Gaya</span>
            </button>
            <button
              onClick={() => setCurrentTab('energi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-all ${
                currentTab === 'energi' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Pembangkit</span>
            </button>
            <button
              onClick={() => setCurrentTab('kuis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-all ${
                currentTab === 'kuis' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Kuis</span>
            </button>
          </div>
        </div>

        {/* Active Simulation View */}
        <section className="w-full">
          {currentTab === 'optik' && <OpticsSimulation />}
          {currentTab === 'bunyi' && <SoundSimulation />}
          {currentTab === 'magnet-gaya' && <MagnetismFrictionSimulation />}
          {currentTab === 'energi' && <PowerPlantSimulation />}
          {currentTab === 'kuis' && <QuizLab />}
        </section>
      </main>

      {/* Quiet Academic Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-12 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Fisika 3D Lab</span>
            <span aria-hidden="true">·</span>
            <span>Materi Fisika Dasar: Gelombang, Gaya & Energi</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Panduan Eksperimen
            </button>
            <button
              onClick={() => setCurrentTab('kuis')}
              className="hover:text-slate-300 transition-colors"
            >
              Uji Kompetensi
            </button>
          </div>
        </div>
      </footer>

      {/* Guide Modal */}
      <QuickGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
