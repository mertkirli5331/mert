/**
 * 2D Excavator Game Constants and Level Configurations
 */

export interface LevelConfig2D {
  id: number;
  title: string;
  subtitle: string;
  theme: 'quarry' | 'magma' | 'citadel';
  worldWidth: number; // in pixels
  description: string;
  skyGradient: [string, string];
  mountainColor: string;
  groundColor: string;
  rockColor: string;
  hazardColor: string;
  princessAtEnd?: boolean;
  targetScore: number;
  dangerLevel: number;
}

export const LEVELS_2D: LevelConfig2D[] = [
  {
    id: 1,
    title: 'Bölüm 1: Taş Kanyonu',
    subtitle: 'Kaya Yıkımı ve Dağ Geçidi Açma',
    theme: 'quarry',
    worldWidth: 4600,
    description: 'Dev kayalar kanyon yolunu kapattı! Ekskavatörün kepçesiyle kayaları parçala, taş yığınlarını temizle ve dağ köprüsüne ulaş.',
    skyGradient: ['#f59e0b', '#d97706'],
    mountainColor: '#78350f',
    groundColor: '#92400e',
    rockColor: '#713f12',
    hazardColor: '#d97706',
    targetScore: 1200,
    dangerLevel: 1,
  },
  {
    id: 2,
    title: 'Bölüm 2: Lav Boğazı',
    subtitle: 'Ateş Geçidi ve Bazalt Barikatlar',
    theme: 'magma',
    worldWidth: 5800,
    description: 'Yol daralıyor ve yerin altından erimiş lavlar yükseliyor! Sertleşmiş volkanik bazalt bloklarını ve tahta köprüleri yıkıp kaleye doğru ilerle.',
    skyGradient: ['#450a0a', '#7f1d1d'],
    mountainColor: '#260505',
    groundColor: '#180404',
    rockColor: '#2b1010',
    hazardColor: '#ef4444',
    targetScore: 2500,
    dangerLevel: 2,
  },
  {
    id: 3,
    title: 'Bölüm 3: Ejder Kalesi & Prenses Kurtarma',
    subtitle: 'Demir Kapıları Kır, Prensesi Özgür Bırak!',
    theme: 'citadel',
    worldWidth: 6800,
    description: 'Karanlık kale surlarına ulaştın! Büyülü demir kapıları ve muhafız kulelerini yerle bir et. Zindanın sonundaki altın kafesi kır ve Prensesi kurtar!',
    skyGradient: ['#0f172a', '#1e1b4b'],
    mountainColor: '#090d16',
    groundColor: '#0f172a',
    rockColor: '#1e293b',
    hazardColor: '#8b5cf6',
    princessAtEnd: true,
    targetScore: 4500,
    dangerLevel: 3,
  },
];

export interface Obstacle2D {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'sand_mountain' | 'boulder' | 'rock_wall' | 'iron_gate' | 'princess_cage' | 'lava_pit';
  maxHp: number;
  hp: number;
  sandVolume?: number; // 0 to 100%
  destroyed: boolean;
  scoreValue: number;
  name: string;
  color?: string;
}

export interface LevelConfig {
  id: number;
  title: string;
  subtitle: string;
  theme: 'quarry' | 'magma' | 'citadel';
  trackLength: number;
  description: string;
  fogColor: string;
  skyColor: string;
  ambientColor: string;
  keyLightColor: string;
  groundColor: string;
  cliffColor: string;
  princessAtEnd?: boolean;
  targetScore: number;
  obstacleDensity: number;
  dangerLevel: number;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: 'Bölüm 1: Taş Kanyonu',
    subtitle: 'Kaya Yıkımı ve Dağ Geçidi Açma',
    theme: 'quarry',
    trackLength: 180,
    description: 'Dev kayalar kanyon yolunu kapattı! Ekskavatörün kepçesiyle kayaları parçala.',
    fogColor: '#bfa181',
    skyColor: '#d69e6e',
    ambientColor: '#7a5a40',
    keyLightColor: '#ffeed6',
    groundColor: '#785b3b',
    cliffColor: '#523d24',
    targetScore: 1200,
    obstacleDensity: 1.0,
    dangerLevel: 1,
  },
  {
    id: 2,
    title: 'Bölüm 2: Lav Boğazı',
    subtitle: 'Ateş Geçidi ve Bazalt Barikatlar',
    theme: 'magma',
    trackLength: 230,
    description: 'Yol daralıyor ve yerin altından erimiş lavlar yükseliyor!',
    fogColor: '#2b0f0b',
    skyColor: '#4d120a',
    ambientColor: '#551810',
    keyLightColor: '#ff6622',
    groundColor: '#1a1415',
    cliffColor: '#2d1810',
    targetScore: 2500,
    obstacleDensity: 1.4,
    dangerLevel: 2,
  },
  {
    id: 3,
    title: 'Bölüm 3: Ejder Kalesi & Prenses Kurtarma',
    subtitle: 'Demir Kapıları Kır, Prensesi Özgür Bırak!',
    theme: 'citadel',
    trackLength: 280,
    description: 'Karanlık kale surlarına ulaştın! Prensesi kurtar!',
    fogColor: '#101426',
    skyColor: '#17223b',
    ambientColor: '#202a48',
    keyLightColor: '#6da0ff',
    groundColor: '#1e2430',
    cliffColor: '#121720',
    princessAtEnd: true,
    targetScore: 4500,
    obstacleDensity: 1.8,
    dangerLevel: 3,
  },
];

export interface ObstacleData {
  id: number;
  x: number;
  y: number;
  z: number;
  type: 'boulder' | 'rock_wall' | 'iron_gate' | 'lava_crystal' | 'princess_cage' | 'fuel_canister';
  maxHp: number;
  hp: number;
  scale: number;
  destroyed: boolean;
  scoreValue: number;
  color?: number;
}

