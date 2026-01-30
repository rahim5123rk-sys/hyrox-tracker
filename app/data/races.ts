export type Region = 'ALL' | 'UK' | 'EUROPE' | 'USA' | 'APAC' | 'LATAM';

export interface RaceEvent {
  id: string;
  city: string;
  date: string;       // Display text
  isoDate: string;    // YYYY-MM-DD
  type: 'MAJOR' | 'REGIONAL' | 'INTL' | 'CHAMPIONSHIP';
  venue: string;
  region: Region;
  url: string;        // <--- THIS WAS MISSING
}

export const UPCOMING_RACES: RaceEvent[] = [
  // --- NORTH AMERICA (USA/CANADA) ---
  { 
    id: 'phx_26', 
    region: 'USA', 
    city: 'PHOENIX', 
    date: 'JAN 29 - FEB 1', 
    isoDate: '2026-01-29', 
    type: 'MAJOR', 
    venue: 'Convention Center',
    url: 'https://hyrox.com/event/hyrox-phoenix/'
  },
  { 
    id: 'las_26', 
    region: 'USA', 
    city: 'LAS VEGAS', 
    date: 'FEB 20-22', 
    isoDate: '2026-02-20', 
    type: 'MAJOR', 
    venue: 'Convention Center',
    url: 'https://hyrox.com/event/hyrox-las-vegas/'
  },
  { 
    id: 'dc_26', 
    region: 'USA', 
    city: 'WASHINGTON DC', 
    date: 'MAR 07-08', 
    isoDate: '2026-03-07', 
    type: 'CHAMPIONSHIP', 
    venue: 'Walter E. Washington',
    url: 'https://hyrox.com/event/hyrox-washington-d-c/' 
  },
  { 
    id: 'hou_26', 
    region: 'USA', 
    city: 'HOUSTON', 
    date: 'MAR 26-29', 
    isoDate: '2026-03-26', 
    type: 'MAJOR', 
    venue: 'George R. Brown CC',
    url: 'https://hyrox.com/event/hyrox-houston/'
  },
  { 
    id: 'mia_26', 
    region: 'USA', 
    city: 'MIAMI', 
    date: 'APR 03-05', 
    isoDate: '2026-04-03', 
    type: 'MAJOR', 
    venue: 'Miami Beach CC',
    url: 'https://hyrox.com/event/hyrox-miami/'
  },
  { 
    id: 'yow_26', 
    region: 'USA', 
    city: 'OTTAWA', 
    date: 'MAY 15-17', 
    isoDate: '2026-05-15', 
    type: 'INTL', 
    venue: 'EY Centre',
    url: 'https://hyrox.com/event/hyrox-ottawa/'
  },
  { 
    id: 'nyc_26', 
    region: 'USA', 
    city: 'NEW YORK', 
    date: 'MAY 28 - JUN 7', 
    isoDate: '2026-05-28', 
    type: 'MAJOR', 
    venue: 'Pier 76',
    url: 'https://hyrox.com/event/hyrox-new-york-city/'
  },

  // --- UK ---
  { 
    id: 'gla_26', 
    region: 'UK', 
    city: 'GLASGOW', 
    date: 'MAR 11-15', 
    isoDate: '2026-03-11', 
    type: 'REGIONAL', 
    venue: 'SEC Centre',
    url: 'https://hyrox.com/event/hyrox-glasgow/'
  },
  { 
    id: 'ldn_26', 
    region: 'UK', 
    city: 'LONDON', 
    date: 'MAR 24-29', 
    isoDate: '2026-03-24', 
    type: 'MAJOR', 
    venue: 'Olympia London',
    url: 'https://hyrox.com/event/hyrox-london-olympia/'
  },
  { 
    id: 'cwl_26', 
    region: 'UK', 
    city: 'CARDIFF', 
    date: 'APR 29 - MAY 4', 
    isoDate: '2026-04-29', 
    type: 'REGIONAL', 
    venue: 'Principality Stadium',
    url: 'https://hyrox.com/event/hyrox-cardiff/'
  },

  // --- EUROPE ---
  { 
    id: 'trn_26', 
    region: 'EUROPE', 
    city: 'TURIN', 
    date: 'JAN 30 - FEB 1', 
    isoDate: '2026-01-30', 
    type: 'INTL', 
    venue: 'Oval Lingotto',
    url: 'https://hyrox.com/event/hyrox-turin/'
  },
  { 
    id: 'vie_26', 
    region: 'EUROPE', 
    city: 'VIENNA', 
    date: 'FEB 06-08', 
    isoDate: '2026-02-06', 
    type: 'INTL', 
    venue: 'Messe Wien',
    url: 'https://hyrox.com/event/hyrox-vienna/'
  },
  { 
    id: 'blb_26', 
    region: 'EUROPE', 
    city: 'BILBAO', 
    date: 'FEB 07-08', 
    isoDate: '2026-02-07', 
    type: 'INTL', 
    venue: 'Exhibition Centre',
    url: 'https://hyrox.com/event/hyrox-bilbao/'
  },
  { 
    id: 'ktw_26', 
    region: 'EUROPE', 
    city: 'KATOWICE', 
    date: 'FEB 21-22', 
    isoDate: '2026-02-21', 
    type: 'INTL', 
    venue: 'MCK',
    url: 'https://hyrox.com/event/hyrox-katowice/'
  },
  { 
    id: 'kar_26', 
    region: 'EUROPE', 
    city: 'KARLSRUHE', 
    date: 'MAR 07', 
    isoDate: '2026-03-07', 
    type: 'REGIONAL', 
    venue: 'Messe Karlsruhe',
    url: 'https://hyrox.com/event/hyrox-karlsruhe/'
  },
  { 
    id: 'cph_26', 
    region: 'EUROPE', 
    city: 'COPENHAGEN', 
    date: 'MAR 13-15', 
    isoDate: '2026-03-13', 
    type: 'INTL', 
    venue: 'Bella Center',
    url: 'https://hyrox.com/event/hyrox-copenhagen/'
  },
  { 
    id: 'tls_26', 
    region: 'EUROPE', 
    city: 'TOULOUSE', 
    date: 'MAR 19-22', 
    isoDate: '2026-03-19', 
    type: 'INTL', 
    venue: 'MEETT',
    url: 'https://hyrox.com/event/hyrox-toulouse/'
  },
  { 
    id: 'mec_26', 
    region: 'EUROPE', 
    city: 'MECHELEN', 
    date: 'MAR 26-29', 
    isoDate: '2026-03-26', 
    type: 'INTL', 
    venue: 'Nekkerhal',
    url: 'https://hyrox.com/event/hyrox-mechelen/'
  },
  { 
    id: 'bol_26', 
    region: 'EUROPE', 
    city: 'BOLOGNA', 
    date: 'APR 04-06', 
    isoDate: '2026-04-04', 
    type: 'INTL', 
    venue: 'BolognaFiere',
    url: 'https://hyrox.com/event/hyrox-bologna/'
  },
  { 
    id: 'rot_26', 
    region: 'EUROPE', 
    city: 'ROTTERDAM', 
    date: 'APR 15-19', 
    isoDate: '2026-04-15', 
    type: 'INTL', 
    venue: 'Ahoy Rotterdam',
    url: 'https://hyrox.com/event/hyrox-rotterdam/'
  },
  { 
    id: 'waw_26', 
    region: 'EUROPE', 
    city: 'WARSAW', 
    date: 'APR 16-19', 
    isoDate: '2026-04-16', 
    type: 'MAJOR', 
    venue: 'PGE Narodowy',
    url: 'https://hyrox.com/event/hyrox-warsaw/'
  },
  { 
    id: 'mlg_26', 
    region: 'EUROPE', 
    city: 'MALAGA', 
    date: 'APR 16-19', 
    isoDate: '2026-04-16', 
    type: 'INTL', 
    venue: 'FYCMA',
    url: 'https://hyrox.com/event/hyrox-malaga/'
  },
  { 
    id: 'col_26', 
    region: 'EUROPE', 
    city: 'COLOGNE', 
    date: 'APR 16-19', 
    isoDate: '2026-04-16', 
    type: 'MAJOR', 
    venue: 'Koelnmesse',
    url: 'https://hyrox.com/event/hyrox-cologne/'
  },
  { 
    id: 'par_26', 
    region: 'EUROPE', 
    city: 'PARIS', 
    date: 'APR 23-26', 
    isoDate: '2026-04-23', 
    type: 'MAJOR', 
    venue: 'Grand Palais',
    url: 'https://hyrox.com/event/hyrox-paris/'
  },
  { 
    id: 'hel_26', 
    region: 'EUROPE', 
    city: 'HELSINKI', 
    date: 'MAY 09-10', 
    isoDate: '2026-05-09', 
    type: 'INTL', 
    venue: 'Messukeskus',
    url: 'https://hyrox.com/event/hyrox-helsinki/'
  },
  { 
    id: 'lyn_26', 
    region: 'EUROPE', 
    city: 'LYON', 
    date: 'MAY 20-24', 
    isoDate: '2026-05-20', 
    type: 'INTL', 
    venue: 'Eurexpo',
    url: 'https://hyrox.com/event/hyrox-lyon/'
  },
  { 
    id: 'rim_26', 
    region: 'EUROPE', 
    city: 'RIMINI', 
    date: 'MAY 28-31', 
    isoDate: '2026-05-28', 
    type: 'INTL', 
    venue: 'Rimini Wellness',
    url: 'https://hyrox.com/event/hyrox-rimini/'
  },
  { 
    id: 'rix_26', 
    region: 'EUROPE', 
    city: 'RIGA', 
    date: 'MAY 30-31', 
    isoDate: '2026-05-30', 
    type: 'INTL', 
    venue: 'Kipsala Centre',
    url: 'https://hyrox.com/event/hyrox-riga/'
  },
  { 
    id: 'wc_26', 
    region: 'EUROPE', 
    city: 'STOCKHOLM (WC)', 
    date: 'JUN 18-21', 
    isoDate: '2026-06-18', 
    type: 'CHAMPIONSHIP', 
    venue: 'Strawberry Arena',
    url: 'https://hyrox.com/event/world-championships-stockholm/'
  },

  // --- APAC & MIDDLE EAST ---
  { 
    id: 'akl_26', 
    region: 'APAC', 
    city: 'AUCKLAND', 
    date: 'JAN 29 - FEB 1', 
    isoDate: '2026-01-29', 
    type: 'INTL', 
    venue: 'Showgrounds',
    url: 'https://hyrox.com/event/hyrox-auckland/'
  },
  { 
    id: 'osa_26', 
    region: 'APAC', 
    city: 'OSAKA', 
    date: 'JAN 30 - FEB 1', 
    isoDate: '2026-01-30', 
    type: 'INTL', 
    venue: 'INTEX Osaka',
    url: 'https://hyrox.com/event/hyrox-osaka/'
  },
  { 
    id: 'dub_26', 
    region: 'APAC', 
    city: 'DUBAI', 
    date: 'FEB 14-15', 
    isoDate: '2026-02-14', 
    type: 'INTL', 
    venue: 'World Trade Centre',
    url: 'https://hyrox.com/event/hyrox-dubai/'
  },
  { 
    id: 'tpe_26', 
    region: 'APAC', 
    city: 'TAIPEI', 
    date: 'FEB 28 - MAR 1', 
    isoDate: '2026-02-28', 
    type: 'INTL', 
    venue: 'Nangang Exhibition',
    url: 'https://hyrox.com/event/hyrox-taipei/'
  },
  { 
    id: 'bkk_26', 
    region: 'APAC', 
    city: 'BANGKOK', 
    date: 'MAR 20-22', 
    isoDate: '2026-03-20', 
    type: 'INTL', 
    venue: 'QSNCC',
    url: 'https://hyrox.com/event/hyrox-bangkok/'
  },
  { 
    id: 'pek_26', 
    region: 'APAC', 
    city: 'BEIJING', 
    date: 'MAR 21-22', 
    isoDate: '2026-03-21', 
    type: 'INTL', 
    venue: 'National Convention',
    url: 'https://hyrox.com/event/hyrox-beijing/'
  },
  { 
    id: 'sin_26', 
    region: 'APAC', 
    city: 'SINGAPORE', 
    date: 'APR 03-05', 
    isoDate: '2026-04-03', 
    type: 'INTL', 
    venue: 'National Stadium',
    url: 'https://hyrox.com/event/hyrox-singapore/'
  },
  { 
    id: 'blr_26', 
    region: 'APAC', 
    city: 'BENGALURU', 
    date: 'APR 11-12', 
    isoDate: '2026-04-11', 
    type: 'INTL', 
    venue: 'BIEC',
    url: 'https://hyrox.com/event/hyrox-bengaluru/'
  },
  { 
    id: 'bne_26', 
    region: 'APAC', 
    city: 'BRISBANE', 
    date: 'APR 11-12', 
    isoDate: '2026-04-11', 
    type: 'CHAMPIONSHIP', 
    venue: 'Convention Centre',
    url: 'https://hyrox.com/event/hyrox-brisbane/'
  },
  { 
    id: 'hkg_26', 
    region: 'APAC', 
    city: 'HONG KONG', 
    date: 'MAY 08-10', 
    isoDate: '2026-05-08', 
    type: 'INTL', 
    venue: 'AsiaWorld-Expo',
    url: 'https://hyrox.com/event/hyrox-hong-kong/'
  },
  { 
    id: 'icn_26', 
    region: 'APAC', 
    city: 'INCHEON', 
    date: 'MAY 15-17', 
    isoDate: '2026-05-15', 
    type: 'INTL', 
    venue: 'Songdo Convensia',
    url: 'https://hyrox.com/event/hyrox-incheon/'
  },

  // --- LATAM ---
  { 
    id: 'gdl_26', 
    region: 'LATAM', 
    city: 'GUADALAJARA', 
    date: 'FEB 07-08', 
    isoDate: '2026-02-07', 
    type: 'INTL', 
    venue: 'Expo Guadalajara',
    url: 'https://hyrox.com/event/hyrox-guadalajara/'
  },
  { 
    id: 'mty_26', 
    region: 'LATAM', 
    city: 'MONTERREY', 
    date: 'APR 18-19', 
    isoDate: '2026-04-18', 
    type: 'INTL', 
    venue: 'Cintermex',
    url: 'https://hyrox.com/event/hyrox-monterrey/'
  },
  { 
    id: 'pbc_26', 
    region: 'LATAM', 
    city: 'PUEBLA', 
    date: 'COMING SOON', 
    isoDate: '2099-01-01', 
    type: 'INTL', 
    venue: 'TBD',
    url: 'https://hyrox.com/find-my-race/'
  },
  { 
    id: 'bue_26', 
    region: 'LATAM', 
    city: 'BUENOS AIRES', 
    date: 'COMING SOON', 
    isoDate: '2099-01-01', 
    type: 'INTL', 
    venue: 'TBD',
    url: 'https://hyrox.com/find-my-race/'
  },
  { 
    id: 'sao_26', 
    region: 'LATAM', 
    city: 'SAO PAULO', 
    date: 'COMING SOON', 
    isoDate: '2099-01-01', 
    type: 'INTL', 
    venue: 'TBD',
    url: 'https://hyrox.com/find-my-race/'
  },
];