export type Region = 'ALL' | 'UK' | 'EUROPE' | 'USA' | 'APAC' | 'LATAM';

export interface RaceEvent {
  id: string;
  city: string;
  date: string;       // Display text
  isoDate: string;    // YYYY-MM-DD.
  type: 'MAJOR' | 'REGIONAL' | 'INTL' | 'CHAMPIONSHIP';
  venue: string;
  region: Region;     // THIS IS CRITICAL FOR FILTERING
}

export const UPCOMING_RACES: RaceEvent[] = [
  // --- NORTH AMERICA (USA/CANADA) ---
  { id: 'phx_26', region: 'USA', city: 'PHOENIX', date: 'JAN 29 - FEB 1', isoDate: '2026-01-29', type: 'MAJOR', venue: 'Convention Center' },
  { id: 'las_26', region: 'USA', city: 'LAS VEGAS', date: 'FEB 20-22', isoDate: '2026-02-20', type: 'MAJOR', venue: 'Convention Center' },
  { id: 'dc_26', region: 'USA', city: 'WASHINGTON DC', date: 'MAR 07-08', isoDate: '2026-03-07', type: 'CHAMPIONSHIP', venue: 'Walter E. Washington' },
  { id: 'hou_26', region: 'USA', city: 'HOUSTON', date: 'MAR 26-29', isoDate: '2026-03-26', type: 'MAJOR', venue: 'George R. Brown CC' },
  { id: 'mia_26', region: 'USA', city: 'MIAMI', date: 'APR 03-05', isoDate: '2026-04-03', type: 'MAJOR', venue: 'Miami Beach CC' },
  { id: 'yow_26', region: 'USA', city: 'OTTAWA', date: 'MAY 15-17', isoDate: '2026-05-15', type: 'INTL', venue: 'EY Centre' },
  { id: 'nyc_26', region: 'USA', city: 'NEW YORK', date: 'MAY 28 - JUN 7', isoDate: '2026-05-28', type: 'MAJOR', venue: 'Pier 76' },

  // --- UK ---
  { id: 'gla_26', region: 'UK', city: 'GLASGOW', date: 'MAR 01', isoDate: '2026-03-01', type: 'REGIONAL', venue: 'SEC Centre' },
  { id: 'ldn_26', region: 'UK', city: 'LONDON', date: 'MAR 24-29', isoDate: '2026-03-24', type: 'MAJOR', venue: 'Olympia London' },
  { id: 'cwl_26', region: 'UK', city: 'CARDIFF', date: 'APR 29 - MAY 4', isoDate: '2026-04-29', type: 'REGIONAL', venue: 'Principality Stadium' },

  // --- EUROPE ---
  { id: 'trn_26', region: 'EUROPE', city: 'TURIN', date: 'JAN 30 - FEB 1', isoDate: '2026-01-30', type: 'INTL', venue: 'Oval Lingotto' },
  { id: 'vie_26', region: 'EUROPE', city: 'VIENNA', date: 'FEB 06-08', isoDate: '2026-02-06', type: 'INTL', venue: 'Messe Wien' },
  { id: 'blb_26', region: 'EUROPE', city: 'BILBAO', date: 'FEB 07-08', isoDate: '2026-02-07', type: 'INTL', venue: 'Exhibition Centre' },
  { id: 'ktw_26', region: 'EUROPE', city: 'KATOWICE', date: 'FEB 21-22', isoDate: '2026-02-21', type: 'INTL', venue: 'MCK' },
  { id: 'kar_26', region: 'EUROPE', city: 'KARLSRUHE', date: 'MAR 07', isoDate: '2026-03-07', type: 'REGIONAL', venue: 'Messe Karlsruhe' },
  { id: 'cph_26', region: 'EUROPE', city: 'COPENHAGEN', date: 'MAR 13-15', isoDate: '2026-03-13', type: 'INTL', venue: 'Bella Center' },
  { id: 'tls_26', region: 'EUROPE', city: 'TOULOUSE', date: 'MAR 19-22', isoDate: '2026-03-19', type: 'INTL', venue: 'MEETT' },
  { id: 'mec_26', region: 'EUROPE', city: 'MECHELEN', date: 'MAR 26-29', isoDate: '2026-03-26', type: 'INTL', venue: 'Nekkerhal' },
  { id: 'bol_26', region: 'EUROPE', city: 'BOLOGNA', date: 'APR 04-06', isoDate: '2026-04-04', type: 'INTL', venue: 'BolognaFiere' },
  { id: 'rot_26', region: 'EUROPE', city: 'ROTTERDAM', date: 'APR 15-19', isoDate: '2026-04-15', type: 'INTL', venue: 'Ahoy Rotterdam' },
  { id: 'waw_26', region: 'EUROPE', city: 'WARSAW', date: 'APR 16-19', isoDate: '2026-04-16', type: 'MAJOR', venue: 'PGE Narodowy' },
  { id: 'mlg_26', region: 'EUROPE', city: 'MALAGA', date: 'APR 16-19', isoDate: '2026-04-16', type: 'INTL', venue: 'FYCMA' },
  { id: 'col_26', region: 'EUROPE', city: 'COLOGNE', date: 'APR 16-19', isoDate: '2026-04-16', type: 'MAJOR', venue: 'Koelnmesse' },
  { id: 'par_26', region: 'EUROPE', city: 'PARIS', date: 'APR 23-26', isoDate: '2026-04-23', type: 'MAJOR', venue: 'Grand Palais' },
  { id: 'hel_26', region: 'EUROPE', city: 'HELSINKI', date: 'MAY 09-10', isoDate: '2026-05-09', type: 'INTL', venue: 'Messukeskus' },
  { id: 'lyn_26', region: 'EUROPE', city: 'LYON', date: 'MAY 20-24', isoDate: '2026-05-20', type: 'INTL', venue: 'Eurexpo' },
  { id: 'rim_26', region: 'EUROPE', city: 'RIMINI', date: 'MAY 28-31', isoDate: '2026-05-28', type: 'INTL', venue: 'Rimini Wellness' },
  { id: 'rix_26', region: 'EUROPE', city: 'RIGA', date: 'MAY 30-31', isoDate: '2026-05-30', type: 'INTL', venue: 'Kipsala Centre' },
  { id: 'wc_26', region: 'EUROPE', city: 'STOCKHOLM (WC)', date: 'JUN 18-21', isoDate: '2026-06-18', type: 'CHAMPIONSHIP', venue: 'Strawberry Arena' },

  // --- APAC & MIDDLE EAST ---
  { id: 'akl_26', region: 'APAC', city: 'AUCKLAND', date: 'JAN 29 - FEB 1', isoDate: '2026-01-29', type: 'INTL', venue: 'Showgrounds' },
  { id: 'osa_26', region: 'APAC', city: 'OSAKA', date: 'JAN 30 - FEB 1', isoDate: '2026-01-30', type: 'INTL', venue: 'INTEX Osaka' },
  { id: 'dub_26', region: 'APAC', city: 'DUBAI', date: 'FEB 14-15', isoDate: '2026-02-14', type: 'INTL', venue: 'World Trade Centre' },
  { id: 'tpe_26', region: 'APAC', city: 'TAIPEI', date: 'FEB 28 - MAR 1', isoDate: '2026-02-28', type: 'INTL', venue: 'Nangang Exhibition' },
  { id: 'bkk_26', region: 'APAC', city: 'BANGKOK', date: 'MAR 20-22', isoDate: '2026-03-20', type: 'INTL', venue: 'QSNCC' },
  { id: 'pek_26', region: 'APAC', city: 'BEIJING', date: 'MAR 21-22', isoDate: '2026-03-21', type: 'INTL', venue: 'National Convention' },
  { id: 'sin_26', region: 'APAC', city: 'SINGAPORE', date: 'APR 03-05', isoDate: '2026-04-03', type: 'INTL', venue: 'National Stadium' },
  { id: 'blr_26', region: 'APAC', city: 'BENGALURU', date: 'APR 11-12', isoDate: '2026-04-11', type: 'INTL', venue: 'BIEC' },
  { id: 'bne_26', region: 'APAC', city: 'BRISBANE', date: 'APR 11-12', isoDate: '2026-04-11', type: 'CHAMPIONSHIP', venue: 'Convention Centre' },
  { id: 'hkg_26', region: 'APAC', city: 'HONG KONG', date: 'MAY 08-10', isoDate: '2026-05-08', type: 'INTL', venue: 'AsiaWorld-Expo' },
  { id: 'icn_26', region: 'APAC', city: 'INCHEON', date: 'MAY 15-17', isoDate: '2026-05-15', type: 'INTL', venue: 'Songdo Convensia' },

  // --- LATAM ---
  { id: 'gdl_26', region: 'LATAM', city: 'GUADALAJARA', date: 'FEB 07-08', isoDate: '2026-02-07', type: 'INTL', venue: 'Expo Guadalajara' },
  { id: 'mty_26', region: 'LATAM', city: 'MONTERREY', date: 'APR 18-19', isoDate: '2026-04-18', type: 'INTL', venue: 'Cintermex' },
  { id: 'pbc_26', region: 'LATAM', city: 'PUEBLA', date: 'COMING SOON', isoDate: '2099-01-01', type: 'INTL', venue: 'TBD' },
  { id: 'bue_26', region: 'LATAM', city: 'BUENOS AIRES', date: 'COMING SOON', isoDate: '2099-01-01', type: 'INTL', venue: 'TBD' },
  { id: 'sao_26', region: 'LATAM', city: 'SAO PAULO', date: 'COMING SOON', isoDate: '2099-01-01', type: 'INTL', venue: 'TBD' },
];