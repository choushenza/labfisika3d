import React, { useState } from 'react';
import { QuizQuestion } from '../../types/physics';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, XCircle, RotateCcw, ArrowRight, HelpCircle } from 'lucide-react';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    category: 'Gelombang Cahaya',
    question: 'Saat berkas cahaya putih melewati prisma kaca segitiga, warna cahaya manakah yang mengalami sudut deviasi pembiasan paling besar?',
    options: [
      'Warna Merah karena memiliki panjang gelombang paling panjang',
      'Warna Kuning karena frekuensinya berada tepat di tengah spektrum tampak',
      'Warna Ungu karena memiliki frekuensi tertinggi dan kecepatan terendah di dalam kaca',
      'Semua warna dibiaskan sama karena prisma terbuat dari bahan kaca homogen'
    ],
    correctIndex: 2,
    explanation: 'Berdasarkan persamaan Cauchy n(λ) = A + B/λ², cahaya ungu memiliki panjang gelombang terpendek (~400 nm) dan frekuensi tertinggi, sehingga mengalami indeks bias terbesar dan dibelokkan (deviasi) paling tajam.'
  },
  {
    id: 2,
    category: 'Gelombang Cahaya',
    question: 'Mengapa sebuah pensil lurus tampak patah dan posisinya terangkat saat dicelupkan sebagian ke dalam gelas berisi air?',
    options: [
      'Cahaya mengalami pemantulan sempurna di dalam air',
      'Berkas cahaya dari pensil dibiaskan menjauhi garis normal saat keluar dari air ke udara',
      'Permukaan kaca gelas menyerap semua gelombang cahaya berwarna kuning',
      'Densitas air yang berat menekan pensil secara fisik hingga membengkok'
    ],
    correctIndex: 1,
    explanation: 'Sesuai Hukum Snellius, cahaya merambat dari medium lebih rapat (air n=1.33) ke medium kurang rapat (udara n=1.0) dibiaskan menjauhi garis normal. Titik temu perpanjangan sinar semu di mata pengamat membuat bagian bawah pensil tampak lebih dangkal dan terangkat.'
  },
  {
    id: 3,
    category: 'Alat Optik: Periskop',
    question: 'Bagaimana susunan cermin di dalam periskop sederhana agar pengamat di kapal selam dapat melihat objek di atas permukaan air laut?',
    options: [
      'Satu cermin cekung di atas dan satu cermin cembung di bawah dipasang vertikal 90°',
      'Dua cermin datar disusun sejajar miring 45° menghadap satu sama lain di ujung tabung',
      'Tiga cermin datar disusun membentuk segitiga prisma di tengah tabung',
      'Dua cermin cembung dipasang saling membelakangi 180°'
    ],
    correctIndex: 1,
    explanation: 'Periskop memanfaatkan hukum pemantulan cahaya (sudut datang = sudut pantul). Dua cermin datar dipasang miring 45° sehingga sinar horizontal dibelokkan 90° ke bawah oleh cermin pertama, lalu dibelokkan 90° kembali menjadi horizontal oleh cermin kedua menuju mata pengamat.'
  },
  {
    id: 4,
    category: 'Gelombang Bunyi',
    question: 'Pada gelombang bunyi longitudinal di udara, apa yang dimaksud dengan daerah kerapatan (compression)?',
    options: [
      'Daerah di mana partikel udara diam tanpa mengalami getaran sama sekali',
      'Daerah di mana molekul udara tertekan saling mendekat sehingga kerapatan dan tekanan udara meningkat',
      'Daerah di mana molekul udara saling menjauh dan tekanan udara berada pada titik minimum',
      'Daerah di mana gelombang bunyi dipantulkan 100% oleh peredam suara'
    ],
    correctIndex: 1,
    explanation: 'Gelombang bunyi merambat sebagai gelombang tekanan. Saat diafragma speaker mendorong udara ke depan, molekul udara berkerumun membentuk daerah bertekanan tinggi (kerapatan). Saat diafragma menarik ke belakang, terbentuk daerah renggangan.'
  },
  {
    id: 5,
    category: 'Akustik & Pemantulan',
    question: 'Apa perbedaan mendasar antara Gaung (kerdam) dan Gema (echo)?',
    options: [
      'Gaung hanya terjadi di luar ruangan, sedangkan gema selalu terjadi di dalam gua tertutup',
      'Gaung terdengar setelah bunyi asli selesai, sedangkan gema terdengar sebelum bunyi asli keluar',
      'Gaung terjadi jika dinding pemantul dekat (< 17 m) sehingga bunyi pantul bertumpuk dengan bunyi asli, sedangkan gema terjadi jika pemantul jauh sehingga pantulan terdengar terpisah',
      'Gaung selalu memiliki frekuensi ultrasonik, sedangkan gema memiliki frekuensi infrasonik'
    ],
    correctIndex: 2,
    explanation: 'Kecepatan bunyi di udara ~340 m/s. Jika jarak dinding pantul ≥ 17 m, waktu tempuh bolak-balik bunyi adalah 2×17/340 = 0.1 detik. Waktu jeda 0.1 s ini cukup bagi otak manusia untuk membedakan bunyi asli dan bunyi pantul (Gema). Jika kurang dari 17 m, bunyi pantul bertumpuk merusak kejelasan kata (Gaung).'
  },
  {
    id: 6,
    category: 'Medan Magnet',
    question: 'Jika dua batang magnet dengan kutub Utara (N) didekatkan satu sama lain, bagaimana pola garis gaya magnet dan interaksinya?',
    options: [
      'Garis gaya magnet menyambung lurus dari kutub utara pertama ke kutub utara kedua (tarik-menarik)',
      'Garis gaya magnet saling tolak dan melengkung menjauh membentuk titik netral di tengah (tolak-menolak)',
      'Medan magnet kedua batang magnet langsung hilang menjadi nol secara permanen',
      'Kutub utara otomatis berubah kutub menjadi kutub selatan dalam hitungan detik'
    ],
    correctIndex: 1,
    explanation: 'Kutub senama (Utara-Utara atau Selatan-Selatan) tolak-menolak. Garis-garis medan magnet tidak pernah saling berpotongan, melainkan membelok saling menjauh, menghasilkan gaya tolak elektromagnetik dan zona medan bernilai nol (neutral point).'
  },
  {
    id: 7,
    category: 'Gaya Gesek',
    question: 'Sebuah balok bermassa 10 kg berada di atas lantai kayu dengan koefisien gesek statis μs = 0.40 dan kinetis μk = 0.30 (g = 9.8 m/s²). Jika balok ditarik gaya F = 25 N, apa yang terjadi pada balok?',
    options: [
      'Balok bergerak dipercepat karena gaya dorong F > 0',
      'Balok tetap diam karena gaya F (25 N) lebih kecil dari gaya gesek statis maksimum fs_max (39.2 N)',
      'Balok meluncur langsung dengan gaya gesek kinetis sebesar 29.4 N',
      'Gaya normal balok berkurang hingga balok terangkat ke udara'
    ],
    correctIndex: 1,
    explanation: 'Gaya normal N = m·g = 10 × 9.8 = 98 N. Gaya gesek statis maksimum fs_max = μs · N = 0.40 × 98 = 39.2 N. Karena gaya penarik F = 25 N < fs_max (39.2 N), gaya gesek statis yang timbul menyeimbangkan gaya tarik (fs = 25 N) dan balok tetap diam!'
  },
  {
    id: 8,
    category: 'Transformasi Energi',
    question: 'Pada Pembangkit Listrik Tenaga Bayu / Kincir Angin (PLTB), jika kecepatan angin bertiup meningkat 2 kali lipat dari kecepatan semula, bagaimana pengaruhnya terhadap daya listrik yang dihasilkan?',
    options: [
      'Daya listrik meningkat 2 kali lipat secara proporsional',
      'Daya listrik meningkat 4 kali lipat sebanding dengan kuadrat kecepatan',
      'Daya listrik meningkat hingga 8 kali lipat karena daya berbanding lurus dengan pangkat tiga kecepatan angin (v³)',
      'Daya listrik konstan karena turbin memiliki batas efisiensi Betz yang membatasi putaran'
    ],
    correctIndex: 2,
    explanation: 'Berdasarkan persamaan daya kincir angin P = 1/2 · ρ · A · v³ · Cp, energi kinetik aliran angin per detik berbanding lurus dengan massa udara (ρ·A·v) dikali kuadrat kecepatan (v²), menghasilkan ketergantungan pangkat tiga (v³). Peningkatan kecepatan 2x lipat akan melipatgandakan potensi daya hingga 2³ = 8 kali lipat!'
  }
];

export const QuizLab: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const currentQ = QUESTIONS[currentIdx];
  const userChoice = selectedAnswers[currentQ.id];
  const hasAnsweredCurrent = userChoice !== undefined;

  const totalScore = QUESTIONS.reduce((acc, q) => {
    return acc + (selectedAnswers[q.id] === q.correctIndex ? 100 / QUESTIONS.length : 0);
  }, 0);

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIdx
    }));
  };

  const handleNext = () => {
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsSubmitted(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setIsSubmitted(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Evaluation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div>
          <span className="text-xs text-cyan-400 font-semibold tracking-wide uppercase">
            Evaluasi Pemahaman Materi
          </span>
          <h2 className="text-xl font-bold text-white">Kuis Fisika 3D: Gelombang, Gaya & Energi</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Uji pemahaman konsep ilmiah yang telah kamu amati di laboratorium simulasi 3D.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Progres Pengerjaan</span>
            <span className="font-mono text-sm font-bold text-cyan-400">
              {Object.keys(selectedAnswers).length} / {QUESTIONS.length} Soal
            </span>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Mulai Ulang</span>
          </button>
        </div>
      </div>

      {!isSubmitted ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm space-y-6">
          {/* Question Meta */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs text-slate-400">
            <span className="font-medium text-cyan-400">
              Pertanyaan {currentIdx + 1} dari {QUESTIONS.length} · {currentQ.category}
            </span>
            <span className="font-mono text-slate-500">Bobot: 12.5 Poin</span>
          </div>

          {/* Question Text */}
          <h3 className="text-base sm:text-lg font-semibold text-slate-100 leading-relaxed">
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = userChoice === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200 shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950'
                        : 'border border-slate-700 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-relaxed pt-0.5">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-colors"
            >
              Sebelumnya
            </button>

            <button
              onClick={handleNext}
              disabled={!hasAnsweredCurrent}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <span>{currentIdx === QUESTIONS.length - 1 ? 'Selesaikan Kuis' : 'Berikutnya'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Result & Explanations Card */
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center backdrop-blur-md space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Award className="h-8 w-8" />
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Hasil Pencapaian Sains
              </span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                Skor Anda: <span className="text-cyan-400 font-mono">{totalScore}</span> / 100
              </h3>
              <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
                {totalScore >= 80
                  ? 'Luar biasa! Kamu memahami prinsip optik, akustik gelombang, gaya gesek, dan pembangkit listrik dengan sangat matang.'
                  : totalScore >= 60
                  ? 'Bagus! Sebagian besar konsep fisika telah kamu kuasai. Cek pembahasan di bawah untuk memperdalam materi yang keliru.'
                  : 'Tetap semangat! Kembali ke laboratorium simulasi 3D untuk melihat langsung proses fisikanya lalu coba kuis ini kembali.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md"
              >
                Coba Kuis Kembali
              </button>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-300">Pembahasan & Analisis Ilmiah</h4>

            {QUESTIONS.map((q, idx) => {
              const isCorrect = selectedAnswers[q.id] === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-slate-200">
                        {idx + 1}. {q.category}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                        isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {isCorrect ? '+12.5 Poin' : '0 Poin'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{q.question}</p>

                  <div className="text-xs space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400">
                      Jawaban Anda:{' '}
                      <span className={isCorrect ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                        {selectedAnswers[q.id] !== undefined ? q.options[selectedAnswers[q.id]] : 'Tidak dijawab'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div className="text-emerald-400">
                        Kunci Jawaban Benar: {q.options[q.correctIndex]}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-cyan-300/90 leading-relaxed bg-cyan-950/20 p-2.5 rounded-lg border border-cyan-800/30">
                    <span className="font-semibold">Penjelasan Konsep:</span> {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
