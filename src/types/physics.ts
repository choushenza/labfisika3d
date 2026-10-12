export type MainTab = 'optik' | 'bunyi' | 'magnet-gaya' | 'energi' | 'kuis';

export type OpticsMode = 'prisma' | 'pensil-air' | 'periskop' | 'cermin';
export type MirrorType = 'datar' | 'cekung' | 'cembung';

export type SoundMode = 'longitudinal' | 'pemantulan' | 'peredam';

export type MagnetGayaMode = 'medan-magnet' | 'gaya-gesek';
export type MagnetPolarity = 'berlawanan' | 'sejenis'; // tarik-menarik vs tolak-menolak

export type SurfaceType = 'es' | 'kayu' | 'aspal' | 'karet';

export type PowerPlantType = 'plta' | 'pltb' | 'plts';

export interface SurfaceProps {
  name: string;
  label: string;
  mu_s: number;
  mu_k: number;
  color: string;
  desc: string;
}

export interface QuizQuestion {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
