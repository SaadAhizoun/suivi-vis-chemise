import { useState, useMemo } from 'react';
import { initialArchive, initialLines } from '@/data/mockData';
import { ArchiveRecord, Status, getStatusLabel } from '@/types/maintenance';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Archive, 
  Search, 
  Filter,
  Calendar,
  Eye,
  Download,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { generateMaintenanceReport, generateArchiveReport } from '@/lib/pdfExport';

export default function ArchivePage() {
  const [archives] = useState<ArchiveRecord[]>(initialArchive);
  const [lines] = useState(initialLines);
  
  // Filters
  const [filterLine, setFilterLine] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected record for detail view
  const [selectedRecord, setSelectedRecord] = useState<ArchiveRecord | null>(null);
  
  // Apply filters
  const filteredArchives = useMemo(() => {
    return archives.filter(record => {
      if (filterLine !== 'all' && record.lineId !== filterLine) return false;
      if (filterStatus !== 'all' && record.status !== filterStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!record.lineName.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [archives, filterLine, filterStatus, searchQuery]);
  
  // Statistics
  const stats = useMemo(() => {
    const total = archives.length;
    const ok = archives.filter(r => r.status === 'ok').length;
    const warning = archives.filter(r => r.status === 'a_commander').length;
    const danger = archives.filter(r => r.status === 'a_changer').length;
    return { total, ok, warning, danger };
  }, [archives]);
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
          Archive & Traçabilité
        </h1>
        <p className="text-muted-foreground">
          Historique complet des mesures et décisions • {archives.length} enregistrements
        </p>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="card-industrial p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="card-industrial p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-status-ok/10">
            <Archive className="h-5 w-5 text-status-ok" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">OK</p>
            <p className="text-xl font-bold text-status-ok">{stats.ok}</p>
          </div>
        </div>
        <div className="card-industrial p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-status-warning/10">
            <Archive className="h-5 w-5 text-status-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">À commander</p>
            <p className="text-xl font-bold text-status-warning">{stats.warning}</p>
          </div>
        </div>
        <div className="card-industrial p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-status-danger/10">
            <Archive className="h-5 w-5 text-status-danger" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">À changer</p>
            <p className="text-xl font-bold text-status-danger">{stats.danger}</p>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="card-industrial opacity-0 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Recherche
              </Label>
              <Input
                placeholder="Rechercher une ligne..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Ligne
              </Label>
              <Select value={filterLine} onValueChange={setFilterLine}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les lignes</SelectItem>
                  {lines.map(line => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="a_commander">À commander</SelectItem>
                  <SelectItem value="a_changer">À changer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setFilterLine('all');
                  setFilterStatus('all');
                  setSearchQuery('');
                }}
              >
                Réinitialiser
              </Button>
              <Button 
                className="btn-copper"
                onClick={() => generateArchiveReport(filteredArchives)}
                disabled={filteredArchives.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Archive Table */}
      <Card className="card-industrial overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <CardHeader className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <CardTitle className="text-lg flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Historique des Vérifications
            <span className="ml-2 px-2 py-0.5 bg-primary-foreground/20 rounded-full text-sm">
              {filteredArchives.length} résultats
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Ligne</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Extrudeuse</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Points</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredArchives.map((record, index) => (
                  <tr 
                    key={record.id}
                    className={cn(
                      "transition-colors hover:bg-muted/30 opacity-0 animate-fade-in",
                    )}
                    style={{ animationDelay: `${250 + index * 30}ms` }}
                  >
                    <td className="px-4 py-4">
                      <span className="font-semibold">{record.lineName}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        record.extruderType === 'principale' 
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent/10 text-accent'
                      )}>
                        {record.extruderType === 'principale' ? 'Principale' : 'Secondaire'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(record.dateVerification, 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-sm">
                      {record.measurements.length}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusBadge status={record.status} size="sm" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedRecord(record)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                              <Archive className="h-5 w-5 text-accent" />
                              {record.lineName} — {record.extruderType === 'principale' ? 'Principale' : 'Secondaire'}
                              <StatusBadge status={record.status} size="sm" />
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4 mt-4">
                            {/* Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                              <div>
                                <p className="text-xs text-muted-foreground">Date de vérification</p>
                                <p className="font-semibold">
                                  {format(record.dateVerification, 'dd MMMM yyyy', { locale: fr })}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Formules utilisées</p>
                                <p className="font-mono text-sm">
                                  A={record.formulas.visA}, B={record.formulas.visB}, C={record.formulas.chemiseC}
                                </p>
                              </div>
                            </div>
                            
                            {/* Measurements Table */}
                            <div className="rounded-lg border overflow-hidden">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-muted/50">
                                    <th className="px-3 py-2 text-left text-xs font-semibold">Point</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold">Usure Vis</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold">Usure Chemise</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold">Écart</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold">Statut</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                  {record.wearCalculations.map((calc) => (
                                    <tr key={calc.pointId} className={cn(
                                      calc.status === 'a_changer' && 'bg-status-danger/5',
                                      calc.status === 'a_commander' && 'bg-status-warning/5'
                                    )}>
                                      <td className="px-3 py-2 font-medium text-sm">P{calc.pointId.toString().padStart(2, '0')}</td>
                                      <td className="px-3 py-2 text-center font-mono text-sm">{calc.usureVis.toFixed(3)}</td>
                                      <td className="px-3 py-2 text-center font-mono text-sm">{calc.usureChemise.toFixed(3)}</td>
                                      <td className="px-3 py-2 text-center font-mono text-sm font-bold">
                                        <span className={calc.ecart >= 1 ? 'text-status-danger' : ''}>
                                          {calc.ecart.toFixed(3)}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <StatusBadge status={calc.status} size="sm" showIcon={false} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredArchives.length === 0 && (
            <div className="py-12 text-center">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Aucun enregistrement trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
