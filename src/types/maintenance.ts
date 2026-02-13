// Core Types for COFMA - Industrial Performance & Digitalization

export type ExtruderType = 'principale' | 'secondaire';

export type Status = 'ok' | 'a_commander' | 'a_changer';
export function getPointStatus(ecart: number): "OK" | "NOK" {
  if (ecart < 1) {
    return "OK";
  }
  return "NOK";
}

export interface MeasurementPoint {
  id: number;
  visValue: number;     // in µm
  chemiseValue: number; // in µm
}

export interface WearFormulas {
  // Vis: Usure = A - B - Mesure
  visA: number;
  visB: number;
  // Chemise: Usure = C - (Mesure / 100)
  chemiseC: number;
}

export interface WearCalculation {
  pointId: number;
  usureVis: number;
  usureChemise: number;
  ecart: number; // Écart = Usure Chemise - Usure Vis
  status: Status;
}

// Extended line definition with manufacturer and vis details
export interface LineDefinition {
  brand: string;           // Manufacturer/Brand
  visPrincipale: {
    dimensions: string;
    reference: string;
  };
  visSecondaire: {
    dimensions: string;
    reference: string;
  };
}

export interface Line {
  id: string;
  name: string; // Line 01, Line 02, etc.
  isActive: boolean;
  definition?: LineDefinition;
  principaleStatus: Status | null;
  secondaireStatus: Status | null;
  principaleCompteur: number | null;
  secondaireCompteur: number | null;
  principaleEcart: number | null;  // For filtering
  secondaireEcart: number | null;  // For filtering
  lastVerificationPrincipale: Date | null;
  lastVerificationSecondaire: Date | null;
  nextVerificationPrincipale: Date | null;
  nextVerificationSecondaire: Date | null;
  remarque: string;
}

export interface ArchiveRecord {
  id: string;
  lineId: string;
  lineName: string;
  lineDefinition?: LineDefinition;
  extruderType: ExtruderType;
  status: Status;
  dateSaisie: Date;
  dateVerification: Date;
  datePrevisionnelleIntervention: Date | null;
  compteur: number;
  maxEcart: number;
  measurements: MeasurementPoint[];
  wearCalculations: WearCalculation[];
  formulas: WearFormulas;
  remarque: string;
  createdAt: Date;       // System timestamp
  createdBy?: string;    // Who created this record
}

// Dashboard statistics
export interface DashboardStats {
  totalLines: number;
  linesOk: number;
  linesToOrder: number;
  linesToChange: number;
  pendingVerifications: number;
}

// Remarque / Note for dashboard
export interface Remarque {
  id: string;
  lineId: string;
  lineName: string;
  date: Date;
  text: string;
  author?: string;
}

// Utility functions
export function getStatusLabel(status: Status): string {
  switch (status) {
    case 'ok':
      return 'OK';
    case 'a_commander':
      return 'À commander';
    case 'a_changer':
      return 'À changer';
  }
}

/**
 * Calculate status based on Écart value
 * Écart < 1.0 → OK
 * Écart = 1.0 → À commander
 * Écart > 1.0 → À changer
 */
export function calculateStatus(ecart: number): Status {
  if (ecart < 1.0) return 'ok';
  if (ecart === 1.0) return 'a_commander';
  return 'a_changer';
}

/**
 * Calculate wear values from measurements (all in µm)
 * Usure Vis = A - B - Mesure_Point
 * Usure Chemise = C - (Mesure_Chemise / 100)
 * Écart = Usure Chemise - Usure Vis
 */
export function calculateWear(
  measurements: MeasurementPoint[],
  formulas: WearFormulas
): WearCalculation[] {
  return measurements.map((m) => {
    const usureVis = formulas.visA - formulas.visB - m.visValue;
    const usureChemise = formulas.chemiseC - (m.chemiseValue / 100);
    // ÉCART = Usure Chemise - Usure Vis (as per specification)
    const ecart = usureChemise - usureVis;
    const status = calculateStatus(ecart);
    
    return {
      pointId: m.id,
      usureVis: Math.round(usureVis * 1000) / 1000,
      usureChemise: Math.round(usureChemise * 1000) / 1000,
      ecart: Math.round(ecart * 1000) / 1000,
      status,
    };
  });
}

export function getOverallStatus(calculations: WearCalculation[]): Status {
  if (calculations.some(c => c.status === 'a_changer')) return 'a_changer';
  if (calculations.some(c => c.status === 'a_commander')) return 'a_commander';
  return 'ok';
}

export function getMaxEcart(calculations: WearCalculation[]): number {
  if (calculations.length === 0) return 0;
  return Math.max(...calculations.map(c => c.ecart));
}

export function generateLineId(lineNumber: number): string {
  return `line-${lineNumber.toString().padStart(2, '0')}`;
}

export function generateLineName(lineNumber: number): string {
  return `Line ${lineNumber.toString().padStart(2, '0')}`;
}
