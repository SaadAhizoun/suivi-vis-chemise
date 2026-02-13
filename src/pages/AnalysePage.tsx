import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { initialLines, defaultFormulas, generateMeasurements } from '@/data/mockData';
import { 
  MeasurementPoint, 
  WearFormulas, 
  ExtruderType,
  calculateWear,
  getOverallStatus,
} from '@/types/maintenance';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp,
  Activity,
  Download,
  Factory,
  Calendar,
  MessageSquare,
  Info
} from 'lucide-react';
import { generateAnalyseReportPremium2Pages } from '@/lib/pdfExport';
import html2canvas from "html2canvas";
import { toast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';


export default function AnalysePage() {
  const [searchParams] = useSearchParams();
  const [lines] = useState(initialLines);
  
  const lineFromUrl = searchParams.get('line');
  const [selectedLine, setSelectedLine] = useState<string>(lineFromUrl || lines[0]?.id || '');
  const [selectedExtruder, setSelectedExtruder] = useState<ExtruderType>('principale');
// ✅ Formules selon le type d’extrudeuse (sans useMemo -> zéro risque de hook error)
const formulas: WearFormulas =
  selectedExtruder === "principale"
    ? { visA: 75, visB: 8.94, chemiseC: 64.66 }
    : { visA: 50, visB: 8.94, chemiseC: 46.18 };
  const [measurements, setMeasurements] = useState<MeasurementPoint[]>([]);
  
  
  // Update selected line from URL parameter
  useEffect(() => {
    if (lineFromUrl && lines.some(l => l.id === lineFromUrl)) {
      setSelectedLine(lineFromUrl);
    }
  }, [lineFromUrl, lines]);

  useEffect(() => {
    if (selectedLine) {
      setMeasurements(generateMeasurements(15));
    }
  }, [selectedLine, selectedExtruder]);
  
  const wearCalculations = useMemo(() => {
    if (measurements.length === 0) return [];
    return calculateWear(measurements, formulas);
  }, [measurements, formulas]);
  
  const overallStatus = useMemo(() => {
    if (wearCalculations.length === 0) return null;
    return getOverallStatus(wearCalculations);
  }, [wearCalculations]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    return wearCalculations.map((calc, index) => ({
      point: `P${(index + 1).toString().padStart(2, '0')}`,
      usureVis: calc.usureVis,
      usureChemise: calc.usureChemise,
      ecart: calc.ecart,
      seuil: 1.0,
    }));
  }, [wearCalculations]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (wearCalculations.length === 0) return null;
    
    const avgUsureVis = wearCalculations.reduce((sum, c) => sum + c.usureVis, 0) / wearCalculations.length;
    const avgUsureChemise = wearCalculations.reduce((sum, c) => sum + c.usureChemise, 0) / wearCalculations.length;
    const avgEcart = wearCalculations.reduce((sum, c) => sum + c.ecart, 0) / wearCalculations.length;
    const maxEcart = Math.max(...wearCalculations.map(c => c.ecart));
    const minEcart = Math.min(...wearCalculations.map(c => c.ecart));
    
    return {
      avgUsureVis: avgUsureVis.toFixed(3),
      avgUsureChemise: avgUsureChemise.toFixed(3),
      avgEcart: avgEcart.toFixed(3),
      maxEcart: maxEcart.toFixed(3),
      minEcart: minEcart.toFixed(3),
    };
  }, [wearCalculations]);
  
  const selectedLineData = lines.find(l => l.id === selectedLine);
  const selectedLineName = selectedLineData?.name || '';
  
  const [isExporting, setIsExporting] = useState(false);

async function captureToPng(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("Graph not found: " + elementId);

  await new Promise(requestAnimationFrame);

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });
  return canvas.toDataURL("image/png");
}
async function loadPngAsDataUrl(path: string) {
  const res = await fetch(path);
  const blob = await res.blob();
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
  
return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
          Analyse
        </h1>
        <p className="text-muted-foreground">
          Visualisation graphique des données d'usure • Unité: <span className="font-semibold text-accent">µm (micromètre)</span>
        </p>
      </div>

      {/* Line Profile Card */}
      {selectedLineData && (
        <Card className="card-industrial opacity-0 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Factory className="h-5 w-5 text-accent" />
              Fiche Ligne - {selectedLineName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Marque</p>
                <p className="font-medium">{selectedLineData.definition?.brand || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vis {selectedExtruder === 'principale' ? 'Principale' : 'Secondaire'}</p>
                <p className="font-medium text-sm">
                  {selectedExtruder === 'principale' 
                    ? selectedLineData.definition?.visPrincipale.reference 
                    : selectedLineData.definition?.visSecondaire.reference || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dimensions</p>
                <p className="font-medium text-sm">
                  {selectedExtruder === 'principale' 
                    ? selectedLineData.definition?.visPrincipale.dimensions 
                    : selectedLineData.definition?.visSecondaire.dimensions || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Dernière Vérif.
                </p>
                <p className="font-medium">
                  {selectedLineData.lastVerificationPrincipale 
                    ? format(selectedLineData.lastVerificationPrincipale, 'dd MMM yyyy', { locale: fr })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Prochaine Vérif.
                </p>
                <p className="font-medium text-accent">
                  {selectedLineData.lastVerificationPrincipale 
                    ? format(addYears(selectedLineData.lastVerificationPrincipale, 1), 'dd MMM yyyy', { locale: fr })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Dernière Remarque
                </p>
                {selectedLineData.remarque ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="font-medium text-sm truncate max-w-[150px] cursor-help">
                        {selectedLineData.remarque}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">{selectedLineData.remarque}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <p className="text-muted-foreground text-sm">—</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Selection Controls */}
      <Card className="card-industrial opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label>Ligne</Label>
              <Select value={selectedLine} onValueChange={setSelectedLine}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une ligne" />
                </SelectTrigger>
                <SelectContent>
                  {lines.map(line => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Type d'Extrudeuse</Label>
              <Select 
                value={selectedExtruder} 
                onValueChange={(v) => setSelectedExtruder(v as ExtruderType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principale">Principale</SelectItem>
                  <SelectItem value="secondaire">Secondaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-end gap-3">
              {overallStatus && (
                <>
                  <span className="text-sm text-muted-foreground">Statut global:</span>
                  <StatusBadge status={overallStatus} size="lg" />
                </>
              )}
              <Button
                onClick={async () => {
  if (!overallStatus || !selectedLineData) return;

  try {
    setIsExporting(true);

    const [chartWearPng, chartEcartPng, logoPng] = await Promise.all([
  captureToPng("chart-wear"),
  captureToPng("chart-ecart"),
  loadPngAsDataUrl("/assets/coficab-logo-color.png"),
]);



    const pointsTotal = wearCalculations.length;
    const pointsNok = wearCalculations.filter(x => x.ecart >= 1).length;
    const ecartMax = Math.max(...wearCalculations.map(x => x.ecart));
    const ecartAvg = wearCalculations.reduce((s, x) => s + x.ecart, 0) / (pointsTotal || 1);

    // ✅ Décision: si 1 point NOK => changer
    const recommendation = pointsNok > 0 ? "changer" : "garder";

    generateAnalyseReportPremium2Pages({
      line: {
        name: selectedLineData.name,
        brand: selectedLineData.definition?.brand || "—",
        screwRef: selectedExtruder === "principale"
          ? (selectedLineData.definition?.visPrincipale.reference || "—")
          : (selectedLineData.definition?.visSecondaire.reference || "—"),
        dimensions: selectedExtruder === "principale"
          ? (selectedLineData.definition?.visPrincipale.dimensions || "—")
          : (selectedLineData.definition?.visSecondaire.dimensions || "—"),
        lastVerification: selectedLineData.lastVerificationPrincipale
          ? format(selectedLineData.lastVerificationPrincipale, "dd MMM yyyy", { locale: fr })
          : "—",
        nextVerification: selectedLineData.lastVerificationPrincipale
          ? format(addYears(selectedLineData.lastVerificationPrincipale, 1), "dd MMM yyyy", { locale: fr })
          : "—",
        remark: selectedLineData.remarque || "",
      },
      extruderLabel: selectedExtruder === "principale" ? "Principale" : "Secondaire",
      date: format(new Date(), "dd/MM/yyyy", { locale: fr }),
      compteur: "—",
      status: overallStatus,
      kpi: {
        ecartAvg,
        ecartMax,
        pointsNok,
        pointsTotal,
      },
      recommendation,
      charts: {
        wearPng: chartWearPng,
        ecartPng: chartEcartPng,
      },
      logoPng,
    });

    toast({ title: "PDF généré", description: "Rapport 2 pages prêt." });
  } catch (e) {
    console.error(e);
    toast({
      title: "Erreur PDF",
      description: "Impossible de générer le rapport.",
      variant: "destructive",
    });
  } finally {
    setIsExporting(false);
  }
}}


                disabled={!overallStatus || isExporting}
                className="btn-copper"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Export..." : "Export PDF"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="card-industrial p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Moy. Usure Vis</p>
            <p className="text-xl font-bold font-mono text-foreground">{stats.avgUsureVis}</p>
          </div>
          <div className="card-industrial p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Moy. Usure Chemise</p>
            <p className="text-xl font-bold font-mono text-foreground">{stats.avgUsureChemise}</p>
          </div>
          <div className="card-industrial p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Écart Moyen</p>
            <p className={cn(
              "text-xl font-bold font-mono",
              parseFloat(stats.avgEcart) >= 1 ? 'text-status-danger' : 'text-status-ok'
            )}>
              {stats.avgEcart}
            </p>
          </div>
          <div className="card-industrial p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Écart Max</p>
            <p className={cn(
              "text-xl font-bold font-mono",
              parseFloat(stats.maxEcart) >= 1 ? 'text-status-danger' : 'text-foreground'
            )}>
              {stats.maxEcart}
            </p>
          </div>
          <div className="card-industrial p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Écart Min</p>
            <p className="text-xl font-bold font-mono text-status-ok">{stats.minEcart}</p>
          </div>
        </div>
      )}
      
      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Wear Comparison Chart */}
        <Card className="card-industrial opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Courbes d'Usure — {selectedLineName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="chart-wear" className="h-80 bg-white rounded-md">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="point" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="usureVis" 
                    name="Usure Vis (µm)"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="usureChemise" 
                    name="Usure Chemise (µm)"
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Écart Chart with Threshold */}
        <Card className="card-industrial opacity-0 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Évolution de l'Écart — Seuil 1.0
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{"< 1.0 → OK | = 1.0 → À commander | > 1.0 → À changer"}</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="chart-ecart" className="h-80 bg-white rounded-md">

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="point" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <ReferenceLine 
                    y={1} 
                    stroke="hsl(var(--status-danger))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ 
                      value: 'Seuil Critique (1.0)', 
                      position: 'right',
                      fill: 'hsl(var(--status-danger))',
                      fontSize: 11
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ecart" 
                    name="Écart"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent) / 0.3)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Data Table */}
      <Card className="card-industrial overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <CardHeader className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Tableau des Mesures — {selectedLineName} ({selectedExtruder === 'principale' ? 'Principale' : 'Secondaire'})
            <span className="text-xs font-normal ml-2 opacity-70">Unité: µm</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Point</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Usure Vis (µm)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Usure Chemise (µm)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-accent uppercase">Écart</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {wearCalculations.map((calc) => (
                  <tr 
                    key={calc.pointId}
                    className={cn(
                      "transition-colors hover:bg-muted/30",
                      calc.status === 'a_changer' && 'bg-status-danger/5',
                      calc.status === 'a_commander' && 'bg-status-warning/5'
                    )}
                  >
                    <td className="px-4 py-3 font-semibold text-sm">
                      Point {calc.pointId.toString().padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm">
                      {calc.usureVis.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm">
                      {calc.usureChemise.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "font-mono text-sm font-bold",
                        calc.ecart >= 1 ? 'text-status-danger' : 'text-foreground'
                      )}>
                        {calc.ecart.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={calc.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
