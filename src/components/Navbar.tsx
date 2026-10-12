import React from 'react';
import { MainTab } from '../types/physics';
import { Atom, Compass } from 'lucide-react';

interface NavbarProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenQuickGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickGuide
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Title, one line wordmark */}
        <button
          onClick={() => onSelectTab('optik')}
          className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Atom className="h-5 w-5" />
          </div>
          <span>Fisika 3D Lab</span>
        </button>

        {/* Zone 2: 5 single-line clean text links with subtle active states */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onSelectTab('optik')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'optik' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Gelombang Cahaya
          </button>
          <button
            onClick={() => onSelectTab('bunyi')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'bunyi' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Gelombang Bunyi
          </button>
          <button
            onClick={() => onSelectTab('magnet-gaya')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'magnet-gaya' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Magnet & Gaya
          </button>
          <button
            onClick={() => onSelectTab('energi')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'energi' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Pembangkit Listrik
          </button>
          <button
            onClick={() => onSelectTab('kuis')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'kuis' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Kuis & Evaluasi
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenQuickGuide}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 active:scale-95 transition-all whitespace-nowrap shrink-0"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Panduan Lab</span>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer strip */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-800/80 bg-slate-950 px-4 py-2 text-xs scrollbar-none">
        <div className="flex items-center gap-3 whitespace-nowrap">
          <button
            onClick={() => onSelectTab('optik')}
            className={`py-1 px-2.5 rounded ${currentTab === 'optik' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
          >
            Cahaya
          </button>
          <button
            onClick={() => onSelectTab('bunyi')}
            className={`py-1 px-2.5 rounded ${currentTab === 'bunyi' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
          >
            Bunyi
          </button>
          <button
            onClick={() => onSelectTab('magnet-gaya')}
            className={`py-1 px-2.5 rounded ${currentTab === 'magnet-gaya' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
          >
            Magnet & Gaya
          </button>
          <button
            onClick={() => onSelectTab('energi')}
            className={`py-1 px-2.5 rounded ${currentTab === 'energi' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
          >
            Pembangkit Energi
          </button>
          <button
            onClick={() => onSelectTab('kuis')}
            className={`py-1 px-2.5 rounded ${currentTab === 'kuis' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
          >
            Kuis
          </button>
        </div>
      </div>
    </header>
  );
};
