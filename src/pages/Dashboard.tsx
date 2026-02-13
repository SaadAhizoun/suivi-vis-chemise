import { useState, useMemo } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { initialLines } from '@/data/mockData';
import { Line, Status } from '@/types/maintenance';
import { StatusBadge } from '@/components/ui/status-badge';
import { format, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Factory, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Calendar,
  BarChart3,
  Info,
  List,
  MessageSquare,
  X,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

type StatusFilter = 'all' | 'ok' | 'a_commander' | 'a_changer';

export default function Dashboard() {
  const [lines, setLines] = useState(initialLines);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [lineInfoModal, setLineInfoModal] = useState<Line | null>(null);
  const [remarqueModal, setRemarqueModal] = useState<Line | null>(null);
  const [remarqueText, setRemarqueText] = useState('');
  const navigate = useNavigate();
  
  const stats = useMemo(() => {
    let ok = 0, warning = 0, danger = 0;
    
    lines.forEach(line => {
      if (line.principaleStatus === 'ok') ok++;
      if (line.secondaireStatus === 'ok') ok++;
      if (line.principaleStatus === 'a_commander') warning++;
      if (line.secondaireStatus === 'a_commander') warning++;
      if (line.principaleStatus === 'a_changer') danger++;
      if (line.secondaireStatus === 'a_changer') danger++;
    });
    
    return { ok, warning, danger, total: lines.length };
  }, [lines]);

  // Filter lines based on status
  const filteredLines = useMemo(() => {
    if (statusFilter === 'all') return lines.filter(l => l.isActive);
    return lines.filter(l => {
      if (!l.isActive) return false;
      return l.principaleStatus === statusFilter || l.secondaireStatus === statusFilter;
    });
  }, [lines, statusFilter]);

  const handleKPIClick = (filter: StatusFilter) => {
    setStatusFilter(prev => prev === filter ? 'all' : filter);
  };

  const openLineInfo = (line: Line) => {
    setLineInfoModal(line);
  };

  const openRemarqueModal = (line: Line) => {
    setRemarqueModal(line);
    setRemarqueText(line.remarque || '');
  };

  const saveRemarque = () => {
    if (remarqueModal) {
      setLines(prev => prev.map(l => 
        l.id === remarqueModal.id ? { ...l, remarque: remarqueText } : l
      ));
      toast({
        title: "Remarque enregistrée",
        description: remarqueModal.name,
      });
      setRemarqueModal(null);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Supervision globale du parc • {lines.filter(l => l.isActive).length} lignes actives
        </p>
      </div>
      
      {/* KPI Cards - Clickable filters with Global */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div 
          onClick={() => setStatusFilter('all')}
          className={cn("cursor-pointer transition-all", statusFilter === 'all' && "ring-2 ring-primary ring-offset-2 rounded-xl")}
        >
          <KPICard
            title="Global"
            value={stats.total}
            subtitle="Toutes les lignes"
            icon={List}
            variant="primary"
            delay={50}
          />
        </div>
        <KPICard
          title="Lignes de Production"
          value={stats.total}
          subtitle="Lignes surveillées"
          icon={Factory}
          variant="default"
          delay={100}
        />
        <div 
          onClick={() => handleKPIClick('ok')}
          className={cn("cursor-pointer transition-all", statusFilter === 'ok' && "ring-2 ring-status-ok ring-offset-2 rounded-xl")}
        >
          <KPICard
            title="Statut OK"
            value={stats.ok}
            subtitle="Écart < 1.0 • Cliquez pour filtrer"
            icon={CheckCircle2}
            variant="success"
            delay={150}
          />
        </div>
        <div 
          onClick={() => handleKPIClick('a_commander')}
          className={cn("cursor-pointer transition-all", statusFilter === 'a_commander' && "ring-2 ring-status-warning ring-offset-2 rounded-xl")}
        >
          <KPICard
            title="À Commander"
            value={stats.warning}
            subtitle="Écart = 1.0 • Cliquez pour filtrer"
            icon={AlertTriangle}
            variant="warning"
            delay={200}
          />
        </div>
        <div 
          onClick={() => handleKPIClick('a_changer')}
          className={cn("cursor-pointer transition-all", statusFilter === 'a_changer' && "ring-2 ring-status-danger ring-offset-2 rounded-xl")}
        >
          <KPICard
            title="À Changer"
            value={stats.danger}
            subtitle="Écart > 1.0 • Cliquez pour filtrer"
            icon={XCircle}
            variant="danger"
            delay={250}
          />
        </div>
      </div>

      {/* Filter indicator with clear button */}
      {statusFilter !== 'all' && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Filtre actif:</span>
          <StatusBadge status={statusFilter} size="sm" />
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>
            <X className="h-4 w-4 mr-1" />
            Effacer le filtre
          </Button>
        </div>
      )}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {/* Line Status Table */}
          <div className="card-industrial overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="bg-gradient-to-r from-primary to-secondary px-5 py-4">
              <h3 className="text-lg font-semibold text-primary-foreground">
                État des Lignes
              </h3>
              <p className="text-primary-foreground/70 text-sm">
                {filteredLines.length} lignes affichées
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Ligne</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Principale</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Secondaire</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Dernière Vérif.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Prochaine Vérif.</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Remarque</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Info</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredLines.map((line, index) => (
                    <tr 
                      key={line.id}
                      className="transition-colors hover:bg-muted/30 opacity-0 animate-fade-in"
                      style={{ animationDelay: `${500 + index * 50}ms` }}
                    >
                      <td className="px-4 py-4">
                        <span className="font-semibold text-foreground">{line.name}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {line.principaleStatus ? (
                          <StatusBadge status={line.principaleStatus} size="sm" />
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {line.secondaireStatus ? (
                          <StatusBadge status={line.secondaireStatus} size="sm" />
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        {line.lastVerificationPrincipale ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(line.lastVerificationPrincipale, 'dd MMM yyyy', { locale: fr })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        {line.lastVerificationPrincipale ? (
                          <div className="flex items-center gap-2 text-sm text-accent font-medium">
                            <Calendar className="h-4 w-4" />
                            {format(addYears(line.lastVerificationPrincipale, 1), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {line.remarque ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 cursor-help">
                                  <Info className="h-4 w-4 text-accent" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">{line.remarque}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openRemarqueModal(line)}
                          >
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openLineInfo(line)}
                        >
                          <Info className="h-4 w-4 text-primary" />
                        </Button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/analyse?line=${line.id}`)}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Voir Analyse
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div>
          <AlertsPanel lines={filteredLines} />
        </div>
      </div>

      {/* Line Info Modal */}
      <Dialog open={!!lineInfoModal} onOpenChange={() => setLineInfoModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-accent" />
              Fiche Ligne - {lineInfoModal?.name}
            </DialogTitle>
          </DialogHeader>
          {lineInfoModal && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Marque</p>
                  <p className="font-medium">{lineInfoModal.definition?.brand || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <p className="font-medium">{lineInfoModal.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              
              {lineInfoModal.definition && (
                <>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm mb-2">Vis Principale</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Dimensions</p>
                        <p>{lineInfoModal.definition.visPrincipale.dimensions || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Référence</p>
                        <p>{lineInfoModal.definition.visPrincipale.reference || '—'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm mb-2">Vis Secondaire</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Dimensions</p>
                        <p>{lineInfoModal.definition.visSecondaire.dimensions || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Référence</p>
                        <p>{lineInfoModal.definition.visSecondaire.reference || '—'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Dernière Vérification</p>
                  <p className="font-medium">
                    {lineInfoModal.lastVerificationPrincipale 
                      ? format(lineInfoModal.lastVerificationPrincipale, 'dd MMM yyyy', { locale: fr })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prochaine Vérification</p>
                  <p className="font-medium text-accent">
                    {lineInfoModal.lastVerificationPrincipale 
                      ? format(addYears(lineInfoModal.lastVerificationPrincipale, 1), 'dd MMM yyyy', { locale: fr })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remarque Modal */}
      <Dialog open={!!remarqueModal} onOpenChange={() => setRemarqueModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              Remarque - {remarqueModal?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Saisir une remarque..."
              value={remarqueText}
              onChange={(e) => setRemarqueText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarqueModal(null)}>
              Annuler
            </Button>
            <Button onClick={saveRemarque} className="btn-copper">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
