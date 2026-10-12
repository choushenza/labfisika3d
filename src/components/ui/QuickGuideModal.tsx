import React from 'react';
import { X, MousePointer, RotateCw, ZoomIn, Sliders, Volume2, Award } from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Panduan Laboratorium Fisika 3D</h3>
            <p className="text-xs text-slate-400 mt-0.5">Petunjuk interaksi kanvas 3D dan simulasi parameter</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <RotateCw className="h-5 w-5 text-cyan-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200 block">Rotasi Sudut Pandang 3D</span>
              <p className="text-slate-400 mt-0.5">Klik kiri mouse / sentuh layar lalu seret untuk memutar kanvas 3D ke segala sudut arah.</p>
            </div>
          </div>

          <div className="flex gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <ZoomIn className="h-5 w-5 text-cyan-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200 block">Perbesaran (Zoom In/Out)</span>
              <p className="text-slate-400 mt-0.5">Gunakan scroll roda mouse atau cubit layar sentuh (pinch) untuk mendekatkan detail objek 3D.</p>
            </div>
          </div>

          <div className="flex gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <Sliders className="h-5 w-5 text-cyan-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200 block">Manipulasi Variabel Fisika</span>
              <p className="text-slate-400 mt-0.5">Geser bilah slider di panel kanan untuk mengamati perubahan besaran fisika (sudut, frekuensi, gaya, daya).</p>
            </div>
          </div>

          <div className="flex gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <Volume2 className="h-5 w-5 text-cyan-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200 block">Audio Synthesizer Nyata</span>
              <p className="text-slate-400 mt-0.5">Pada modul gelombang bunyi, klik tombol "Dengarkan Frekuensi" untuk mendengar tinggi nada akustik.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-cyan-950/20 border border-cyan-800/40 p-4 text-xs text-cyan-300">
          <span className="font-semibold block mb-1">Cakupan Topik Utama:</span>
          <ul className="list-disc list-inside space-y-1 text-cyan-200/90">
            <li><strong>Optik:</strong> Pembiasan prisma dispersi pelangi, pensil patah dalam air, periskop ganda 45°, cermin datar/cekung/cembung.</li>
            <li><strong>Akustik:</strong> Gelombang longitudinal kerapatan udara, pemantulan gaung vs gema, panel peredam piramida.</li>
            <li><strong>Gaya:</strong> Garis gaya magnet 3D tolak/tarik, koefisien gaya gesek permukaan (es, kayu, aspal, karet).</li>
            <li><strong>Energi:</strong> Konversi PLTA (air), PLTB (bayu/angin), dan PLTS (sel surya fotovoltaik).</li>
          </ul>
        </div>

        <div className="text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-colors"
          >
            Mengerti & Mulai Eksplorasi
          </button>
        </div>
      </div>
    </div>
  );
};
