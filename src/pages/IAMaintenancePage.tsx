import { useState, useMemo } from 'react';
import { initialLines, initialArchive, defaultFormulas } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  Brain, 
  TrendingUp, 
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  BarChart3,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// Simple linear regression for trend prediction
function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  
  const sumX = data.reduce((sum, d) => sum + d.x, 0);
  const sumY = data.reduce((sum, d) => sum + d.y, 0);
  const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
  const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
}

export default function IAMaintenancePage() {
  const [lines] = useState(initialLines.filter(l => l.isActive));
  const [archiveRecords] = useState(initialArchive);
  const [selectedLine, setSelectedLine] = useState<string>(lines[0]?.id || '');
  
  // Get historical data for selected line
  const lineHistory = useMemo(() => {
    return archiveRecords
      .filter(r => r.lineId === selectedLine)
      .sort((a, b) => a.dateVerification.getTime() - b.dateVerification.getTime());
  }, [archiveRecords, selectedLine]);
  
  // Calculate trend data for chart
  const trendData = useMemo(() => {
    if (lineHistory.length === 0) return [];
    
    return lineHistory.map((record, index) => ({
      date: format(record.dateVerification, 'MMM yyyy', { locale: fr }),
      ecart: record.maxEcart,
      compteur: record.compteur,
      index,
    }));
  }, [lineHistory]);
  
  // Predict when écart will cross thresholds
  const predictions = useMemo(() => {
    if (lineHistory.length < 2) return null;
    
    // Prepare data for regression (x = days since first record, y = écart)
    const firstDate = lineHistory[0].dateVerification.getTime();
    const regressionData = lineHistory.map(record => ({
      x: (record.dateVerification.getTime() - firstDate) / (1000 * 60 * 60 * 24), // days
      y: record.maxEcart,
    }));
    
    const { slope, intercept } = linearRegression(regressionData);
    
    // Calculate current trend
    const currentEcart = lineHistory[lineHistory.length - 1].maxEcart;
    const lastDate = lineHistory[lineHistory.length - 1].dateVerification;
    
    // Predict days until thresholds
    const daysTo1_0 = slope > 0 ? (1.0 - currentEcart) / slope : null;
    const daysTo1_1 = slope > 0 ? (1.1 - currentEcart) / slope : null;
    
    // Wear rate per 1000 hours (based on compteur progression)
    const compteurDiff = lineHistory.length > 1 
      ? lineHistory[lineHistory.length - 1].compteur - lineHistory[0].compteur 
      : 0;
    const ecartDiff = currentEcart - lineHistory[0].maxEcart;
    const wearRatePer1000h = compteurDiff > 0 ? (ecartDiff / compteurDiff) * 1000 : 0;
    
    return {
      slope,
      intercept,
      currentEcart,
      wearRatePer1000h,
      daysTo1_0: daysTo1_0 !== null && daysTo1_0 > 0 ? Math.round(daysTo1_0) : null,
      daysTo1_1: daysTo1_1 !== null && daysTo1_1 > 0 ? Math.round(daysTo1_1) : null,
      dateCommander: daysTo1_0 !== null && daysTo1_0 > 0 ? addDays(lastDate, daysTo1_0) : null,
      dateChanger: daysTo1_1 !== null && daysTo1_1 > 0 ? addDays(lastDate, daysTo1_1) : null,
      trendDirection: slope > 0.001 ? 'increasing' : slope < -0.001 ? 'decreasing' : 'stable',
    };
  }, [lineHistory]);
  
  // Generate recommendations
  const recommendations = useMemo(() => {
    if (!predictions) return [];
    
    const recs: { priority: 'high' | 'medium' | 'low'; title: string; description: string }[] = [];
    
    if (predictions.currentEcart >= 1.0) {
      recs.push({
        priority: 'high',
        title: 'Intervention immédiate requise',
        description: `L'écart actuel (${predictions.currentEcart.toFixed(2)}) dépasse le seuil critique. Planifier le remplacement.`,
      });
    } else if (predictions.daysTo1_0 !== null && predictions.daysTo1_0 < 30) {
      recs.push({
        priority: 'high',
        title: 'Commander les pièces de rechange',
        description: `Seuil "À commander" prévu dans ${predictions.daysTo1_0} jours. Anticiper la commande.`,
      });
    } else if (predictions.daysTo1_0 !== null && predictions.daysTo1_0 < 90) {
      recs.push({
        priority: 'medium',
        title: 'Planifier la maintenance préventive',
        description: `Seuil prévu dans ~${Math.round(predictions.daysTo1_0 / 30)} mois. Inclure dans le planning.`,
      });
    }
    
    if (predictions.wearRatePer1000h > 0.1) {
      recs.push({
        priority: 'medium',
        title: 'Taux d\'usure élevé détecté',
        description: `Usure de ${predictions.wearRatePer1000h.toFixed(3)} par 1000h. Vérifier les conditions de production.`,
      });
    }
    
    if (predictions.trendDirection === 'stable') {
      recs.push({
        priority: 'low',
        title: 'Tendance stable',
        description: 'L\'usure est stable. Maintenir la surveillance régulière.',
      });
    }
    
    if (recs.length === 0) {
      recs.push({
        priority: 'low',
        title: 'Aucune action immédiate',
        description: 'Les indicateurs sont dans les normes. Continuer la surveillance.',
      });
    }
    
    return recs;
  }, [predictions]);
  
  const selectedLineName = lines.find(l => l.id === selectedLine)?.name || '';
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
          <Brain className="h-8 w-8 text-accent" />
          IA & Maintenance Prédictive
        </h1>
        <p className="text-muted-foreground">
          Analyse des tendances d'usure • Prédictions • Recommandations automatiques
        </p>
      </div>
      
      {/* Line Selection */}
      <Card className="card-industrial opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label>Ligne à analyser</Label>
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
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{lineHistory.length} enregistrements historiques</span>
              {predictions && (
                <StatusBadge 
                  status={
                    predictions.currentEcart >= 1.0 ? 'a_changer' : 
                    predictions.currentEcart >= 0.9 ? 'a_commander' : 'ok'
                  } 
                  size="sm" 
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Prediction Cards */}
      {predictions && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="card-industrial p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Écart Actuel</span>
            </div>
            <p className={cn(
              "text-2xl font-bold font-mono",
              predictions.currentEcart >= 1.0 ? 'text-status-danger' : 
              predictions.currentEcart >= 0.9 ? 'text-status-warning' : 'text-status-ok'
            )}>
              {predictions.currentEcart.toFixed(3)}
            </p>
          </div>
          
          <div className="card-industrial p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Taux d'Usure</span>
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">
              {predictions.wearRatePer1000h.toFixed(4)}
            </p>
            <p className="text-xs text-muted-foreground">par 1000h</p>
          </div>
          
          <div className="card-industrial p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-status-warning" />
              <span className="text-xs text-muted-foreground">Date "À Commander"</span>
            </div>
            {predictions.dateCommander ? (
              <>
                <p className="text-lg font-bold text-status-warning">
                  {format(predictions.dateCommander, 'dd MMM yyyy', { locale: fr })}
                </p>
                <p className="text-xs text-muted-foreground">dans ~{predictions.daysTo1_0} jours</p>
              </>
            ) : (
              <p className="text-lg font-semibold text-muted-foreground">—</p>
            )}
          </div>
          
          <div className="card-industrial p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-status-danger" />
              <span className="text-xs text-muted-foreground">Date "À Changer"</span>
            </div>
            {predictions.dateChanger ? (
              <>
                <p className="text-lg font-bold text-status-danger">
                  {format(predictions.dateChanger, 'dd MMM yyyy', { locale: fr })}
                </p>
                <p className="text-xs text-muted-foreground">dans ~{predictions.daysTo1_1} jours</p>
              </>
            ) : (
              <p className="text-lg font-semibold text-muted-foreground">—</p>
            )}
          </div>
        </div>
      )}
      
      {/* Charts and Recommendations */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="xl:col-span-2 card-industrial opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              Évolution de l'Écart — {selectedLineName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <ReferenceLine 
                      y={1.0} 
                      stroke="hsl(var(--status-warning))" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{ 
                        value: 'Seuil Commander', 
                        position: 'right',
                        fill: 'hsl(var(--status-warning))',
                        fontSize: 10
                      }}
                    />
                    <ReferenceLine 
                      y={1.1} 
                      stroke="hsl(var(--status-danger))" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{ 
                        value: 'Seuil Changer', 
                        position: 'right',
                        fill: 'hsl(var(--status-danger))',
                        fontSize: 10
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ecart" 
                      name="Écart Max"
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Aucune donnée historique disponible pour cette ligne
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recommendations Panel */}
        <Card className="card-industrial opacity-0 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Actions Suggérées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, index) => (
              <div 
                key={index}
                className={cn(
                  "p-3 rounded-lg border",
                  rec.priority === 'high' && "bg-status-danger/5 border-status-danger/30",
                  rec.priority === 'medium' && "bg-status-warning/5 border-status-warning/30",
                  rec.priority === 'low' && "bg-muted/50 border-border"
                )}
              >
                <div className="flex items-start gap-2">
                  {rec.priority === 'high' && <AlertTriangle className="h-4 w-4 text-status-danger mt-0.5" />}
                  {rec.priority === 'medium' && <Wrench className="h-4 w-4 text-status-warning mt-0.5" />}
                  {rec.priority === 'low' && <CheckCircle2 className="h-4 w-4 text-status-ok mt-0.5" />}
                  <div>
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      {/* Historical Data Table */}
      {lineHistory.length > 0 && (
        <Card className="card-industrial overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
            <CardTitle className="text-lg">
              Historique des Mesures — {selectedLineName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Compteur</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-accent uppercase">Écart Max</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {lineHistory.slice().reverse().map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        {format(record.dateVerification, 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {record.extruderType === 'principale' ? 'Principale' : 'Secondaire'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-sm">
                        {record.compteur}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "font-mono text-sm font-bold",
                          record.maxEcart >= 1.0 ? 'text-status-danger' : 'text-foreground'
                        )}>
                          {record.maxEcart.toFixed(3)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={record.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
