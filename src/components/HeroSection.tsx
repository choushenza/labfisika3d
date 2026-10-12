import React from 'react';
import { MainTab } from '../types/physics';
import { Sparkles, ArrowRight, Eye, Volume2, Magnet, Zap } from 'lucide-react';

interface HeroSectionProps {
  onSelectTab: (tab: MainTab) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSelectTab }) => {
  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-radial-[at_top_center] from-slate-900 to-slate-950 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Editorial Text Area */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Fisika Dasar</span>
            <span aria-hidden="true">·</span>
            <span>Simulasi Tiga Dimensi</span>
            <span aria-hidden="true">·</span>
            <span>Kurikulum Sains Terpadu</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance leading-tight">
            Eksplorasi Gelombang, Gaya, & Transformasi Energi
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Pelajari fenomena fisika secara interaktif melalui pemodelan 3D interaktif real-time: dispersi cahaya prisma, perambatan akustik kerapatan udara, fluks magnetik, gesekan kinetis permukaan lintasan, dan mekanisme generator pembangkit energi terbarukan.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSelectTab('optik')}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-cyan-500 active:scale-95 transition-all"
            >
              <span>Mulai dari Gelombang Cahaya</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onSelectTab('kuis')}
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-all"
            >
              Uji Pemahaman Mandiri
            </button>
          </div>
        </div>

        {/* 3 Domain Visual Cards Spotlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Card 1: Optics & Waves */}
          <div
            onClick={() => onSelectTab('optik')}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-all hover:border-cyan-500/50 hover:bg-slate-900/80"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 mb-3.5">
              <img
                src="/src/assets/images/physics_optics_prism_1791818144403.jpg"
                alt="Simulasi prisma dispersi pelangi 3D"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
              <Eye className="h-3.5 w-3.5" />
              <span>Modul 01. Gelombang Cahaya</span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              Prisma, Pensil Air, Periskop & Cermin
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Pembiasan spektrum pelangi Cauchy, periskop dua cermin 45°, serta pembentukan bayangan cermin cekung dan cembung.
            </p>
          </div>

          {/* Card 2: Magnetism & Friction */}
          <div
            onClick={() => onSelectTab('magnet-gaya')}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-all hover:border-cyan-500/50 hover:bg-slate-900/80"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 mb-3.5">
              <img
                src="/src/assets/images/physics_magnet_fields_1791818168637.jpg"
                alt="Simulasi garis gaya magnet 3D"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
              <Magnet className="h-3.5 w-3.5" />
              <span>Modul 02. Gejala Magnet & Gaya Gesek</span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              Fluks Magnetik 3D & Tekstur Permukaan
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Garis gaya kutub senama/tak senama, gaya gesek statis-kinetis balok di atas es, kayu, aspal, dan karet.
            </p>
          </div>

          {/* Card 3: Power Generation */}
          <div
            onClick={() => onSelectTab('energi')}
            className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-all hover:border-cyan-500/50 hover:bg-slate-900/80"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 mb-3.5">
              <img
                src="/src/assets/images/physics_power_turbines_1791818156850.jpg"
                alt="Simulasi pembangkit turbin air dan angin 3D"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
              <Zap className="h-3.5 w-3.5" />
              <span>Modul 03. Pembangkit Listrik (PLTA/PLTB/PLTS)</span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              Mekanisme Turbin, Generator & Surya
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Konversi energi potensial air, energi kinetik angin ke induksi magnetik generator, dan eksitasi elektron sel surya.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
