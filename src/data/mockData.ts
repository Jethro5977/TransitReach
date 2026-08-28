import {
  Hospital,
  GraduationCap,
  ShoppingBag,
  Building2,
  Stethoscope,
  Pill,
  Trees,
  Banknote,
  ShieldCheck,
  Baby,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

export type ServiceCategory =
  | 'hospital'
  | 'clinic'
  | 'pharmacy'
  | 'school'
  | 'market'
  | 'govt'
  | 'park'
  | 'bank'
  | 'police'
  | 'childcare'
  | 'food';

export interface ServiceCategoryMeta {
  id: ServiceCategory;
  label: string;
  icon: LucideIcon;
  color: string;
  colorLight: string;
}

export const CATEGORY_META: Record<ServiceCategory, ServiceCategoryMeta> = {
  hospital:   { id: 'hospital',  label: 'Hospitals',      icon: Hospital,       color: '#e11d48', colorLight: '#ffe4e6' },
  clinic:     { id: 'clinic',    label: 'Clinics',         icon: Stethoscope,    color: '#0ea5e9', colorLight: '#e0f2fe' },
  pharmacy:   { id: 'pharmacy',  label: 'Pharmacies',     icon: Pill,           color: '#8b5cf6', colorLight: '#ede9fe' },
  school:     { id: 'school',    label: 'Schools',        icon: GraduationCap,  color: '#f59e0b', colorLight: '#fef3c7' },
  market:     { id: 'market',    label: 'Markets',         icon: ShoppingBag,    color: '#10b981', colorLight: '#d1fae5' },
  govt:       { id: 'govt',      label: 'Government',     icon: Building2,      color: '#6366f1', colorLight: '#e0e7ff' },
  park:       { id: 'park',      label: 'Parks',           icon: Trees,          color: '#22c55e', colorLight: '#dcfce7' },
  bank:       { id: 'bank',      label: 'Banks & ATMs',    icon: Banknote,       color: '#14b8a6', colorLight: '#ccfbf1' },
  police:     { id: 'police',    label: 'Police',          icon: ShieldCheck,    color: '#3b82f6', colorLight: '#dbeafe' },
  childcare:  { id: 'childcare', label: 'Childcare',       icon: Baby,           color: '#ec4899', colorLight: '#fce7f3' },
  food:       { id: 'food',       label: 'Food & Meals',    icon: Utensils,       color: '#f97316', colorLight: '#ffedd5' },
};

export const CATEGORY_ORDER: ServiceCategory[] = [
  'hospital', 'clinic', 'pharmacy', 'school', 'market', 'govt', 'park', 'bank', 'police', 'childcare', 'food',
];

export interface MapPoint {
  x: number;
  y: number;
}

export interface ServiceLocation {
  id: string;
  name: string;
  category: ServiceCategory;
  pos: MapPoint;
  address: string;
  hours: string;
  rating: number;
  walkMin: number;
  transitMin: number;
  accessible: boolean;
  waitingMin: number;
}

export interface TransitLine {
  id: string;
  name: string;
  color: string;
  type: 'bus' | 'lrt' | 'brt' | 'mrt';
  path: MapPoint[];
  stops: TransitStop[];
  frequency: number;
}

export interface TransitStop {
  id: string;
  name: string;
  pos: MapPoint;
  lines: string[];
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'area' | 'station' | 'landmark';
  pos: MapPoint;
  subtitle: string;
}

export interface AreaProfile {
  id: string;
  name: string;
  pos: MapPoint;
  radius: number;
  typology: 'urban-core' | 'suburban' | 'transit-oriented' | 'peri-urban' | 'rural';
  population: number;
  density: number;
  scores: {
    walkability: number;
    transit: number;
    serviceAccess: number;
    roadConnectivity: number;
    affordability: number;
  };
  features: { label: string; value: number }[];
  similarAreas: string[];
}

export interface ScenarioRoute {
  id: string;
  name: string;
  type: 'proposed' | 'suspended';
  color: string;
  path: MapPoint[];
  stops: { name: string; pos: MapPoint }[];
}

// Map coordinate space: 0..1000 x 0..700
export const MAP_W = 1000;
export const MAP_H = 700;

// City center reference
export const CITY_CENTER: MapPoint = { x: 500, y: 360 };

// ---- Water bodies (river + lake) ----
export const RIVER_PATH: MapPoint[] = [
  { x: -20, y: 120 }, { x: 180, y: 160 }, { x: 320, y: 140 }, { x: 420, y: 200 },
  { x: 480, y: 260 }, { x: 520, y: 340 }, { x: 560, y: 420 }, { x: 620, y: 480 },
  { x: 720, y: 500 }, { x: 840, y: 520 }, { x: 1020, y: 540 },
];

export const LAKE_POINTS: MapPoint[] = [
  { x: 820, y: 180 }, { x: 880, y: 170 }, { x: 930, y: 200 }, { x: 950, y: 250 },
  { x: 920, y: 290 }, { x: 860, y: 300 }, { x: 810, y: 260 }, { x: 800, y: 210 },
];

// ---- Transit lines ----
export const TRANSIT_LINES: TransitLine[] = [
  {
    id: 'lrt-kelana',
    name: 'Kelana Jaya Line (LRT)',
    color: '#e11d48',
    type: 'lrt',
    frequency: 4,
    path: [
      { x: 80, y: 580 }, { x: 180, y: 540 }, { x: 280, y: 500 }, { x: 380, y: 460 },
      { x: 460, y: 420 }, { x: 500, y: 360 }, { x: 540, y: 300 }, { x: 600, y: 240 },
      { x: 680, y: 200 }, { x: 760, y: 180 }, { x: 840, y: 160 },
    ],
    stops: [
      { id: 's1',  name: 'Subang Jaya',  pos: { x: 80,  y: 580 }, lines: ['lrt-kelana'] },
      { id: 's2',  name: 'SS15',         pos: { x: 180, y: 540 }, lines: ['lrt-kelana'] },
      { id: 's3',  name: 'SS18',         pos: { x: 280, y: 500 }, lines: ['lrt-kelana'] },
      { id: 's4',  name: 'Glenmarie',    pos: { x: 380, y: 460 }, lines: ['lrt-kelana'] },
      { id: 's5',  name: 'Ara Damansara',pos: { x: 460, y: 420 }, lines: ['lrt-kelana'] },
      { id: 's6',  name: 'Dataran',      pos: { x: 500, y: 360 }, lines: ['lrt-kelana', 'brt-sunway'] },
      { id: 's7',  name: 'Mentari',      pos: { x: 540, y: 300 }, lines: ['lrt-kelana'] },
      { id: 's8',  name: 'Bandar Utama', pos: { x: 600, y: 240 }, lines: ['lrt-kelana'] },
      { id: 's9',  name: 'TTDI',         pos: { x: 680, y: 200 }, lines: ['lrt-kelana'] },
      { id: 's10', name: 'Surian',       pos: { x: 760, y: 180 }, lines: ['lrt-kelana'] },
      { id: 's11', name: 'Kota',         pos: { x: 840, y: 160 }, lines: ['lrt-kelana'] },
    ],
  },
  {
    id: 'brt-sunway',
    name: 'Sunway BRT',
    color: '#2563eb',
    type: 'brt',
    frequency: 3,
    path: [
      { x: 300, y: 620 }, { x: 380, y: 560 }, { x: 440, y: 500 }, { x: 500, y: 360 },
      { x: 560, y: 300 }, { x: 640, y: 260 }, { x: 720, y: 240 },
    ],
    stops: [
      { id: 'b1', name: 'USJ 7',     pos: { x: 300, y: 620 }, lines: ['brt-sunway'] },
      { id: 'b2', name: 'USJ 8',     pos: { x: 380, y: 560 }, lines: ['brt-sunway'] },
      { id: 'b3', name: 'Sunway',    pos: { x: 440, y: 500 }, lines: ['brt-sunway'] },
      { id: 's6', name: 'Dataran',   pos: { x: 500, y: 360 }, lines: ['lrt-kelana', 'brt-sunway'] },
      { id: 'b5', name: 'Mentari 2', pos: { x: 560, y: 300 }, lines: ['brt-sunway'] },
      { id: 'b6', name: 'BU3',       pos: { x: 640, y: 260 }, lines: ['brt-sunway'] },
      { id: 'b7', name: 'BU4',       pos: { x: 720, y: 240 }, lines: ['brt-sunway'] },
    ],
  },
  {
    id: 'mrt-sbp',
    name: 'SBP MRT Line',
    color: '#7c3aed',
    type: 'mrt',
    frequency: 5,
    path: [
      { x: 120, y: 100 }, { x: 240, y: 120 }, { x: 360, y: 180 }, { x: 460, y: 240 },
      { x: 540, y: 300 }, { x: 620, y: 360 }, { x: 720, y: 420 }, { x: 820, y: 460 }, { x: 920, y: 480 },
    ],
    stops: [
      { id: 'm1', name: 'Damansara', pos: { x: 120, y: 100 }, lines: ['mrt-sbp'] },
      { id: 'm2', name: 'Sri',       pos: { x: 240, y: 120 }, lines: ['mrt-sbp'] },
      { id: 'm3', name: 'PJD',       pos: { x: 360, y: 180 }, lines: ['mrt-sbp'] },
      { id: 'm4', name: 'Bandar',    pos: { x: 460, y: 240 }, lines: ['mrt-sbp'] },
      { id: 'm5', name: 'Surian 2',  pos: { x: 540, y: 300 }, lines: ['mrt-sbp'] },
      { id: 'm6', name: 'Central',   pos: { x: 620, y: 360 }, lines: ['mrt-sbp'] },
      { id: 'm7', name: 'Tropicana', pos: { x: 720, y: 420 }, lines: ['mrt-sbp'] },
      { id: 'm8', name: 'SP',        pos: { x: 820, y: 460 }, lines: ['mrt-sbp'] },
      { id: 'm9', name: 'Cyber',     pos: { x: 920, y: 480 }, lines: ['mrt-sbp'] },
    ],
  },
  {
    id: 'bus-222',
    name: 'Bus 222',
    color: '#f59e0b',
    type: 'bus',
    frequency: 8,
    path: [
      { x: 60, y: 300 }, { x: 160, y: 280 }, { x: 260, y: 320 }, { x: 360, y: 340 },
      { x: 460, y: 360 }, { x: 560, y: 380 }, { x: 660, y: 400 }, { x: 760, y: 420 }, { x: 860, y: 440 },
    ],
    stops: [
      { id: 'u1', name: 'Old Town', pos: { x: 60,  y: 300 }, lines: ['bus-222'] },
      { id: 'u2', name: 'Section 14', pos: { x: 160, y: 280 }, lines: ['bus-222'] },
      { id: 'u3', name: 'Section 17', pos: { x: 260, y: 320 }, lines: ['bus-222'] },
      { id: 'u4', name: 'Section 19', pos: { x: 360, y: 340 }, lines: ['bus-222'] },
      { id: 'u5', name: 'Section 20', pos: { x: 460, y: 360 }, lines: ['bus-222'] },
      { id: 'u6', name: 'Section 21', pos: { x: 560, y: 380 }, lines: ['bus-222'] },
      { id: 'u7', name: 'Section 22', pos: { x: 660, y: 400 }, lines: ['bus-222'] },
      { id: 'u8', name: 'Section 23', pos: { x: 760, y: 420 }, lines: ['bus-222'] },
      { id: 'u9', name: 'Section 24', pos: { x: 860, y: 440 }, lines: ['bus-222'] },
    ],
  },
];

// ---- Service locations ----
function svc(
  id: string, name: string, category: ServiceCategory, x: number, y: number,
  walkMin: number, transitMin: number, accessible: boolean, waitingMin: number, rating: number,
  address: string, hours: string,
): ServiceLocation {
  return { id, name, category, pos: { x, y }, walkMin, transitMin, accessible, waitingMin, rating, address, hours };
}

export const SERVICES: ServiceLocation[] = [
  svc('h1',  'Subang Medical Centre',     'hospital',  420, 380, 8,  12, true,  35, 4.3, 'Jalan SS12, Subang Jaya',        '24/7'),
  svc('h2',  'Bandar Utama Hospital',     'hospital',  620, 230, 14, 22, true,  50, 4.1, '1 Lebuh Bandar Utama',            '24/7'),
  svc('h3',  'Ara Damansara Hospital',    'hospital',  440, 440, 18, 28, false, 65, 3.8, 'Jalan PJU 1a',                    '6am–10pm'),
  svc('c1',  'Klinik SS15',               'clinic',    200, 530, 5,  8,  true,  15, 4.5, 'SS15/4, Subang Jaya',             '8am–9pm'),
  svc('c2',  'Klinik Mentari',            'clinic',    560, 300, 6,  10, true,  20, 4.2, 'Jalan PJS 8/5',                   '8am–10pm'),
  svc('c3',  'Klinik TTDI',               'clinic',    680, 200, 10, 15, true,  25, 4.4, 'Jalan Wan Kadir, TTDI',           '9am–9pm'),
  svc('c4',  'Klinik PJD',                'clinic',    360, 180, 12, 18, false, 30, 3.9, 'Jalan PJU 1/45',                  '9am–8pm'),
  svc('c5',  'Klinik Section 17',         'clinic',    260, 320, 7,  11, true,  18, 4.0, 'Jalan 17/1A',                     '8am–9pm'),
  svc('p1',  'Pharmacy SS15',             'pharmacy',  190, 535, 5,  7,  true,  5,  4.6, 'SS15/4B',                         '8am–11pm'),
  svc('p2',  'Pharmacy Mentari',          'pharmacy',  570, 295, 6,  9,  true,  8,  4.3, 'Jalan PJS 8/2',                   '8am–10pm'),
  svc('p3',  'Pharmacy BU',               'pharmacy',  610, 235, 14, 20, true,  12, 4.1, 'BU4, Bandar Utama',               '8am–11pm'),
  svc('p4',  'Pharmacy Section 14',        'pharmacy',  165, 275, 8,  12, true,  10, 4.2, 'Jalan 14/20',                     '8am–10pm'),
  svc('p5',  'Pharmacy Ara',              'pharmacy',  450, 435, 17, 25, false, 15, 3.7, 'Jalan PJU 1a/3',                  '9am–9pm'),
  svc('sc1', 'SMK SS19',                  'school',    280, 490, 9,  14, true,  0,  4.0, 'Jalan SS19/1',                    '7am–3pm'),
  svc('sc2', 'SMK Bandar Utama',           'school',    640, 250, 12, 18, true,  0,  3.9, 'Jalan BU 3/1',                    '7am–3pm'),
  svc('sc3', 'SK Subang Jaya',             'school',    150, 560, 7,  10, true,  0,  4.2, 'Jalan SS12/1',                    '7am–3pm'),
  svc('sc4', 'SK TTDI',                    'school',    700, 190, 11, 16, true,  0,  4.1, 'Jalan Burhanuddin Helmi',         '7am–3pm'),
  svc('sc5', 'SMK Section 17',             'school',    240, 330, 8,  12, true,  0,  3.8, 'Jalan 17/2',                      '7am–3pm'),
  svc('sc6', 'SK PJD',                     'school',    380, 160, 14, 20, false, 0,  3.7, 'Jalan PJU 1/41',                  '7am–3pm'),
  svc('m1',  'SS15 Market',                'market',    210, 525, 5,  8,  true,  0,  4.4, 'SS15/4A',                         '6am–10pm'),
  svc('m2',  'Bandar Utama Mall',          'market',    590, 245, 13, 19, true,  0,  4.5, '1 Lebuh Bandar Utama',            '10am–10pm'),
  svc('m3',  'Section 14 Market',          'market',    170, 280, 7,  11, true,  0,  4.0, 'Jalan 14/22',                     '6am–10pm'),
  svc('m4',  'TTDI Market',                'market',    690, 205, 10, 15, true,  0,  4.2, 'Jalan Wan Kadir 3',               '7am–10pm'),
  svc('m5',  'Ara Market',                 'market',    455, 430, 16, 24, false, 0,  3.6, 'Jalan PJU 1a/1',                  '7am–9pm'),
  svc('g1',  'JPJ Subang',                 'govt',      340, 460, 11, 16, true,  45, 3.5, 'Jalan Persiaran',                 '8am–5pm'),
  svc('g2',  'MBPJ City Hall',             'govt',      520, 360, 3,  5,  true,  60, 3.3, 'Jalan Yong Shuk Lin',             '8am–5pm'),
  svc('g3',  'Immigration PJD',            'govt',      400, 200, 13, 19, false, 55, 3.4, 'Jalan PJU 1/47',                  '8am–5pm'),
  svc('pk1','Subang Ria Park',             'park',      300, 580, 8,  12, true,  0,  4.6, 'Jalan SS13/1K',                   '6am–10pm'),
  svc('pk2','BU Central Park',             'park',      660, 270, 13, 19, true,  0,  4.5, 'Jalan BU 7/1',                    '6am–10pm'),
  svc('pk3','Section 17 Park',            'park',      230, 310, 7,  10, true,  0,  4.3, 'Jalan 17/14',                     '6am–10pm'),
  svc('pk4','TTDI Park',                   'park',      710, 185, 11, 16, true,  0,  4.4, 'Jalan Leong Yew Koh',             '6am–10pm'),
  svc('bk1','Maybank SS15',                'bank',      195, 530, 5,  7,  true,  10, 4.0, 'SS15/4C',                         '9am–4pm'),
  svc('bk2','CIMB Bandar Utama',           'bank',      605, 240, 13, 19, true,  12, 4.1, 'BU4 Ground Floor',                '9am–4pm'),
  svc('bk3','RHB Section 14',              'bank',      168, 278, 7,  11, true,  8,  3.9, 'Jalan 14/21',                     '9am–4pm'),
  svc('bk4','Public Bank TTDI',            'bank',      685, 200, 10, 15, true,  9,  4.0, 'Jalan Wan Kadir 5',               '9am–4pm'),
  svc('pc1','IPD Subang Jaya',             'police',    310, 510, 9,  13, true,  5,  4.2, 'Jalan USJ 1/1',                   '24/7'),
  svc('pc2','IPD Petaling Jaya',           'police',    490, 350, 4,  6,  true,  5,  4.3, 'Jalan Utara A',                   '24/7'),
  svc('pc3','IPD TTDI',                    'police',    675, 195, 11, 16, true,  5,  4.1, 'Jalan Burhanuddin Helmi 2',       '24/7'),
  svc('cc1','Taska Bonda',                 'childcare', 225, 515, 6,  9,  true,  0,  4.3, 'SS15/3B',                         '7am–7pm'),
  svc('cc2','Taska BU',                    'childcare', 615, 255, 13, 19, true,  0,  4.2, 'BU3/2',                           '7am–7pm'),
  svc('cc3','Taska Section 17',            'childcare', 255, 315, 8,  12, true,  0,  4.0, 'Jalan 17/8',                      '7am–7pm'),
  svc('f1', 'Restoran SS15',               'food',      205, 528, 5,  7,  true,  5,  4.4, 'SS15/4D',                         '7am–11pm'),
  svc('f2', 'Food Court BU',               'food',      595, 248, 13, 19, true, 8,  4.3, 'BU4 Level 2',                     '8am–10pm'),
  svc('f3', 'Mamak Section 14',             'food',      172, 282, 7,  11, true, 5,  4.5, 'Jalan 14/23',                     '24/7'),
  svc('f4', 'TTDI Food Street',            'food',      692, 202, 10, 15, true, 8,  4.6, 'Jalan Wan Kadir 7',               '7am–1am'),
  svc('f5', 'Ara Food Court',              'food',      458, 432, 16, 24, false, 12, 3.8, 'Jalan PJU 1a/5',                  '8am–10pm'),
];

// ---- Search results ----
export const SEARCH_RESULTS: SearchResult[] = [
  { id: 'sr1', name: 'Bandar Utama',       type: 'area',     pos: { x: 620, y: 240 }, subtitle: 'Petaling Jaya · 4.2 km²' },
  { id: 'sr2', name: 'Subang Jaya SS15',   type: 'area',     pos: { x: 200, y: 530 }, subtitle: 'Subang Jaya · 3.8 km²' },
  { id: 'sr3', name: 'TTDI',               type: 'area',     pos: { x: 680, y: 200 }, subtitle: 'Kuala Lumpur · 5.1 km²' },
  { id: 'sr4', name: 'Section 17',         type: 'area',     pos: { x: 250, y: 320 }, subtitle: 'Petaling Jaya · 2.9 km²' },
  { id: 'sr5', name: 'Ara Damansara',      type: 'area',     pos: { x: 450, y: 430 }, subtitle: 'Petaling Jaya · 3.2 km²' },
  { id: 'sr6', name: 'Dataran Station',    type: 'station',  pos: { x: 500, y: 360 }, subtitle: 'LRT Kelana · BRT Sunway' },
  { id: 'sr7', name: 'MBPJ City Hall',     type: 'landmark', pos: { x: 520, y: 360 }, subtitle: 'Government office' },
  { id: 'sr8', name: 'Bandar Utama Mall',  type: 'landmark', pos: { x: 590, y: 245 }, subtitle: 'Shopping centre' },
];

// ---- Area profiles ----
export const AREA_PROFILES: AreaProfile[] = [
  {
    id: 'a1', name: 'Bandar Utama', pos: { x: 620, y: 240 }, radius: 45,
    typology: 'transit-oriented', population: 42000, density: 9300,
    scores: { walkability: 72, transit: 85, serviceAccess: 78, roadConnectivity: 80, affordability: 45 },
    features: [
      { label: 'Street density', value: 82 },
      { label: 'Junction density', value: 75 },
      { label: 'Land-use mix', value: 68 },
      { label: 'Pedestrian infrastructure', value: 70 },
      { label: 'Transit stop density', value: 88 },
    ],
    similarAreas: ['a2', 'a3'],
  },
  {
    id: 'a2', name: 'TTDI', pos: { x: 680, y: 200 }, radius: 40,
    typology: 'urban-core', population: 38000, density: 8800,
    scores: { walkability: 78, transit: 80, serviceAccess: 82, roadConnectivity: 76, affordability: 42 },
    features: [
      { label: 'Street density', value: 85 },
      { label: 'Junction density', value: 80 },
      { label: 'Land-use mix', value: 74 },
      { label: 'Pedestrian infrastructure', value: 76 },
      { label: 'Transit stop density', value: 82 },
    ],
    similarAreas: ['a1', 'a4'],
  },
  {
    id: 'a3', name: 'Subang Jaya SS15', pos: { x: 200, y: 530 }, radius: 42,
    typology: 'transit-oriented', population: 35000, density: 7900,
    scores: { walkability: 70, transit: 82, serviceAccess: 75, roadConnectivity: 78, affordability: 52 },
    features: [
      { label: 'Street density', value: 78 },
      { label: 'Junction density', value: 72 },
      { label: 'Land-use mix', value: 70 },
      { label: 'Pedestrian infrastructure', value: 65 },
      { label: 'Transit stop density', value: 85 },
    ],
    similarAreas: ['a1', 'a5'],
  },
  {
    id: 'a4', name: 'Section 17', pos: { x: 250, y: 320 }, radius: 38,
    typology: 'urban-core', population: 28000, density: 7200,
    scores: { walkability: 76, transit: 72, serviceAccess: 80, roadConnectivity: 74, affordability: 55 },
    features: [
      { label: 'Street density', value: 80 },
      { label: 'Junction density', value: 78 },
      { label: 'Land-use mix', value: 76 },
      { label: 'Pedestrian infrastructure', value: 72 },
      { label: 'Transit stop density', value: 70 },
    ],
    similarAreas: ['a2', 'a3'],
  },
  {
    id: 'a5', name: 'Ara Damansara', pos: { x: 450, y: 430 }, radius: 44,
    typology: 'suburban', population: 22000, density: 5100,
    scores: { walkability: 52, transit: 58, serviceAccess: 48, roadConnectivity: 65, affordability: 62 },
    features: [
      { label: 'Street density', value: 55 },
      { label: 'Junction density', value: 50 },
      { label: 'Land-use mix', value: 42 },
      { label: 'Pedestrian infrastructure', value: 48 },
      { label: 'Transit stop density', value: 60 },
    ],
    similarAreas: ['a3', 'a6'],
  },
  {
    id: 'a6', name: 'PJD Outskirts', pos: { x: 380, y: 180 }, radius: 50,
    typology: 'peri-urban', population: 15000, density: 3200,
    scores: { walkability: 38, transit: 42, serviceAccess: 35, roadConnectivity: 50, affordability: 70 },
    features: [
      { label: 'Street density', value: 40 },
      { label: 'Junction density', value: 35 },
      { label: 'Land-use mix', value: 30 },
      { label: 'Pedestrian infrastructure', value: 32 },
      { label: 'Transit stop density', value: 45 },
    ],
    similarAreas: ['a5'],
  },
];

// ---- Scenario routes ----
export const SCENARIO_ROUTES: ScenarioRoute[] = [
  {
    id: 'sc-proposed-1',
    name: 'Proposed Feeder Route A',
    type: 'proposed',
    color: '#14b8a6',
    path: [
      { x: 200, y: 530 }, { x: 280, y: 490 }, { x: 360, y: 440 }, { x: 440, y: 400 },
      { x: 480, y: 360 }, { x: 460, y: 300 }, { x: 420, y: 240 }, { x: 380, y: 180 },
    ],
    stops: [
      { name: 'SS15', pos: { x: 200, y: 530 } },
      { name: 'SS19', pos: { x: 280, y: 490 } },
      { name: 'Glenmarie', pos: { x: 360, y: 440 } },
      { name: 'Ara', pos: { x: 440, y: 400 } },
      { name: 'Dataran', pos: { x: 480, y: 360 } },
      { name: 'Mentari', pos: { x: 460, y: 300 } },
      { name: 'Bandar', pos: { x: 420, y: 240 } },
      { name: 'PJD', pos: { x: 380, y: 180 } },
    ],
  },
  {
    id: 'sc-suspended-1',
    name: 'Suspend Bus 222 (Section 17–24)',
    type: 'suspended',
    color: '#f43f5e',
    path: [
      { x: 260, y: 320 }, { x: 360, y: 340 }, { x: 460, y: 360 }, { x: 560, y: 380 }, { x: 660, y: 400 },
    ],
    stops: [
      { name: 'Section 17', pos: { x: 260, y: 320 } },
      { name: 'Section 19', pos: { x: 360, y: 340 } },
      { name: 'Section 20', pos: { x: 460, y: 360 } },
      { name: 'Section 21', pos: { x: 560, y: 380 } },
      { name: 'Section 22', pos: { x: 660, y: 400 } },
    ],
  },
];

// ---- Methodology steps ----
export interface MethodologyStep {
  id: string;
  title: string;
  icon: string;
  description: string;
  details: string[];
}

export const METHODOLOGY_STEPS: MethodologyStep[] = [
  {
    id: 'step1',
    title: 'Stop Identification',
    icon: 'MapPin',
    description: 'Locate all walkable transit stops within a 400m catchment of the origin point.',
    details: [
      '400m walkable radius (≈5 min walk)',
      'Snapped to OSM pedestrian network',
      'Includes bus, LRT, BRT, MRT stops',
    ],
  },
  {
    id: 'step2',
    title: 'Schedule-Based Reach',
    icon: 'Clock',
    description: 'Query GTFS timetable to find services reachable within the time budget.',
    details: [
      'Per-departure vehicle boarding',
      'Headway-aware waiting times',
      'Maximum 2 transfers',
    ],
  },
  {
    id: 'step3',
    title: 'Egress Walk',
    icon: 'Footprints',
    description: 'From each alighting stop, walk 400m to compute the final accessible area.',
    details: [
      'Network-constrained walking',
      'Penalised crossings & slopes',
      'Produces reachable polygon',
    ],
  },
  {
    id: 'step4',
    title: 'Service Matching',
    icon: 'Building2',
    description: 'Overlay essential-service locations against the reachable polygon.',
    details: [
      '11 service categories',
      'Opening-hours awareness',
      'Accessibility flag per facility',
    ],
  },
  {
    id: 'step5',
    title: 'Confidence Scoring',
    icon: 'Gauge',
    description: 'Estimate data confidence from schedule age, OSM freshness, and GPS trace density.',
    details: [
      'A–E confidence grade',
      'Schedule staleness penalty',
      'OSM contributor recency',
    ],
  },
];

// ---- Road network (simplified for map rendering) ----
export interface RoadSegment {
  points: MapPoint[];
  class: 'highway' | 'arterial' | 'local';
}

export const ROAD_NETWORK: RoadSegment[] = [
  // Highways
  { points: [{ x: -20, y: 360 }, { x: 1020, y: 360 }], class: 'highway' },
  { points: [{ x: 500, y: -20 }, { x: 500, y: 720 }], class: 'highway' },
  // Arterials
  { points: [{ x: -20, y: 200 }, { x: 1020, y: 200 }], class: 'arterial' },
  { points: [{ x: -20, y: 500 }, { x: 1020, y: 500 }], class: 'arterial' },
  { points: [{ x: 250, y: -20 }, { x: 250, y: 720 }], class: 'arterial' },
  { points: [{ x: 700, y: -20 }, { x: 700, y: 720 }], class: 'arterial' },
  // Locals
  { points: [{ x: 100, y: 100 }, { x: 900, y: 100 }], class: 'local' },
  { points: [{ x: 100, y: 620 }, { x: 900, y: 620 }], class: 'local' },
  { points: [{ x: 100, y: -20 }, { x: 100, y: 720 }], class: 'local' },
  { points: [{ x: 900, y: -20 }, { x: 900, y: 720 }], class: 'local' },
  { points: [{ x: 380, y: 100 }, { x: 380, y: 620 }], class: 'local' },
  { points: [{ x: 600, y: 100 }, { x: 600, y: 620 }], class: 'local' },
  { points: [{ x: 820, y: 100 }, { x: 820, y: 620 }], class: 'local' },
  { points: [{ x: 160, y: 200 }, { x: 160, y: 500 }], class: 'local' },
];
