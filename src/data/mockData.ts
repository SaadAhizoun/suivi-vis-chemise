import { 
  Line, 
  ArchiveRecord, 
  WearFormulas, 
  Status, 
  MeasurementPoint, 
  Remarque,
  LineDefinition,
  calculateWear, 
  getOverallStatus,
  getMaxEcart,
  generateLineId,
  generateLineName
} from '@/types/maintenance';
import { addYears, subDays, subMonths, addMonths } from 'date-fns';

// Default formulas - editable in settings
export const defaultFormulas: WearFormulas = {
  visA: 75,
  visB: 8.94,
  chemiseC: 61.09,
};

// Sample line definitions
const sampleDefinitions: LineDefinition[] = [
  { brand: 'Maillefer', visPrincipale: { dimensions: 'Ø60 x 25D', reference: 'VIS-ML-60-25' }, visSecondaire: { dimensions: 'Ø45 x 20D', reference: 'VIS-ML-45-20' } },
  { brand: 'Rosendahl', visPrincipale: { dimensions: 'Ø90 x 30D', reference: 'VIS-RS-90-30' }, visSecondaire: { dimensions: 'Ø60 x 24D', reference: 'VIS-RS-60-24' } },
  { brand: 'Nokia-Maillefer', visPrincipale: { dimensions: 'Ø75 x 28D', reference: 'VIS-NM-75-28' }, visSecondaire: { dimensions: 'Ø50 x 22D', reference: 'VIS-NM-50-22' } },
  { brand: 'Samp', visPrincipale: { dimensions: 'Ø80 x 26D', reference: 'VIS-SP-80-26' }, visSecondaire: { dimensions: 'Ø55 x 21D', reference: 'VIS-SP-55-21' } },
];

export const defaultFormulaSettings = {
  visB: 8.94,
  principale: { visA: 75, chemiseC: 64.66 },
  secondaire: { visA: 50, chemiseC: 46.18 },
};


// Generate lines (default 16)
export function generateLines(count: number = 16): Line[] {
  const lines: Line[] = [];
  const statuses: (Status | null)[] = ['ok', 'a_commander', 'a_changer', null];
  const ecarts = [0.5, 0.8, 1.0, 1.2, 1.5, 0.3, 0.9, 1.1];
  const remarks = [
    'RAS - Fonctionnement normal',
    'Vibrations légères détectées',
    'Prochaine maintenance planifiée',
    'Pièce de rechange commandée',
    '',
    'Observation: usure accélérée',
  ];
  
  for (let i = 1; i <= count; i++) {
    const randomIndex = Math.floor(Math.random() * statuses.length);
    const principaleStatus = i <= 14 ? statuses[randomIndex % 3] as Status : null;
    const secondaireStatus = i <= 14 ? statuses[(randomIndex + 1) % 3] as Status : null;
    
    const lastVerifP = principaleStatus ? subDays(new Date(), Math.floor(Math.random() * 180)) : null;
    const lastVerifS = secondaireStatus ? subDays(new Date(), Math.floor(Math.random() * 180)) : null;
    
    const principaleEcart = principaleStatus ? ecarts[i % ecarts.length] : null;
    const secondaireEcart = secondaireStatus ? ecarts[(i + 3) % ecarts.length] : null;
    
    lines.push({
      id: generateLineId(i),
      name: generateLineName(i),
      isActive: i <= 14,
      definition: i <= 12 ? sampleDefinitions[i % sampleDefinitions.length] : undefined,
      principaleStatus,
      secondaireStatus,
      principaleCompteur: principaleStatus ? Math.floor(1000 + Math.random() * 9000) : null,
      secondaireCompteur: secondaireStatus ? Math.floor(1000 + Math.random() * 9000) : null,
      principaleEcart,
      secondaireEcart,
      lastVerificationPrincipale: lastVerifP,
      lastVerificationSecondaire: lastVerifS,
      nextVerificationPrincipale: lastVerifP ? addYears(lastVerifP, 1) : null,
      nextVerificationSecondaire: lastVerifS ? addYears(lastVerifS, 1) : null,
      remarque: remarks[Math.floor(Math.random() * remarks.length)],
    });
  }
  
  return lines;
}

// Generate sample measurements (all in µm)
export function generateMeasurements(points: number = 15): MeasurementPoint[] {
  return Array.from({ length: points }, (_, i) => ({
    id: i + 1,
    visValue: 58 + Math.random() * 8, // Random between 58-66 µm
    chemiseValue: 5500 + Math.random() * 600, // Random between 5500-6100 µm
  }));
}

// Generate archive records
export function generateArchiveRecords(): ArchiveRecord[] {
  const records: ArchiveRecord[] = [];
  const lines = generateLines();
  const remarks = [
    'Mesures conformes aux spécifications',
    'Usure normale constatée',
    'Pièces à commander pour prochaine intervention',
    'Remplacement effectué',
    'Contrôle de routine',
    '',
  ];
  
  lines.slice(0, 10).forEach((line) => {
    // Generate 3 historical records per line
    for (let j = 0; j < 3; j++) {
      const measurements = generateMeasurements(15);
      const wearCalculations = calculateWear(measurements, defaultFormulas);
      const status = getOverallStatus(wearCalculations);
      const maxEcart = getMaxEcart(wearCalculations);
      const dateVerification = subMonths(new Date(), j * 4);
      
      records.push({
        id: `archive-${line.id}-${j}`,
        lineId: line.id,
        lineName: line.name,
        lineDefinition: line.definition,
        extruderType: j % 2 === 0 ? 'principale' : 'secondaire',
        status,
        dateSaisie: subDays(dateVerification, 1),
        dateVerification,
        datePrevisionnelleIntervention: status !== 'ok' ? addMonths(dateVerification, status === 'a_changer' ? 1 : 3) : null,
        compteur: Math.floor(1000 + Math.random() * 9000),
        maxEcart,
        measurements,
        wearCalculations,
        formulas: defaultFormulas,
        remarque: remarks[Math.floor(Math.random() * remarks.length)],
        createdAt: dateVerification,
        createdBy: 'Système',
      });
    }
  });
  
  return records.sort((a, b) => b.dateVerification.getTime() - a.dateVerification.getTime());
}

// Generate remarques for dashboard
export function generateRemarques(): Remarque[] {
  const lines = generateLines();
  return [
    {
      id: 'rem-1',
      lineId: lines[0].id,
      lineName: lines[0].name,
      date: subDays(new Date(), 2),
      text: 'Vibrations anormales détectées sur vis principale. Surveillance renforcée recommandée.',
      author: 'M. Dupont',
    },
    {
      id: 'rem-2',
      lineId: lines[2].id,
      lineName: lines[2].name,
      date: subDays(new Date(), 5),
      text: 'Pièce de rechange commandée - livraison prévue semaine 12.',
      author: 'Mme Martin',
    },
    {
      id: 'rem-3',
      lineId: lines[4].id,
      lineName: lines[4].name,
      date: subDays(new Date(), 1),
      text: 'Maintenance préventive effectuée. RAS.',
      author: 'M. Bernard',
    },
  ];
}

// Initial state
export const initialLines = generateLines();
export const initialArchive = generateArchiveRecords();
export const initialRemarques = generateRemarques();
