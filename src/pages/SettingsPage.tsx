import { useState } from 'react';
import { defaultFormulas, initialLines } from '@/data/mockData';
import { Line, WearFormulas, LineDefinition } from '@/types/maintenance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Plus,
  Trash2,
  Calculator,
  Save,
  RefreshCw,
  Factory,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function SettingsPage() {
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [formulas, setFormulas] = useState<WearFormulas>(defaultFormulas);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // New line form state (TEXT)
  const [newLineName, setNewLineName] = useState<string>(''); // ex: "22" or "batterie" or "ligne silicone"
  const [newLineBrand, setNewLineBrand] = useState<string>('');
  const [newVisPDimensions, setNewVisPDimensions] = useState<string>('');
  const [newVisPReference, setNewVisPReference] = useState<string>('');
  const [newVisSDimensions, setNewVisSDimensions] = useState<string>('');
  const [newVisSReference, setNewVisSReference] = useState<string>('');

  // Helper: clean text to generate stable id (handles spaces + accents)
  const slugify = (input: string) => {
    return input
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')   // remove accents
      .replace(/[^a-z0-9]+/g, '_')       // anything non-alphanumeric -> _
      .replace(/^_+|_+$/g, '');          // trim underscores
  };

  const makeLineIdFromName = (name: string) => `line_${slugify(name)}`;

  const formatDisplayName = (raw: string) => {
    const t = raw.trim();
    if (!t) return '';
    // If user already wrote "ligne ...", keep it as is
    if (t.toLowerCase().startsWith('ligne ')) return t;
    // Otherwise prefix "Ligne "
    return `Ligne ${t}`;
  };

  const handleFormulaChange = (field: keyof WearFormulas, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormulas(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSaveFormulas = () => {
    toast({
      title: "Constantes enregistrées",
      description: `A=${formulas.visA}, B=${formulas.visB}, C=${formulas.chemiseC}`,
    });
  };

  const handleResetFormulas = () => {
    setFormulas(defaultFormulas);
    toast({
      title: "Constantes réinitialisées",
      description: "Valeurs par défaut restaurées",
    });
  };

  const handleToggleLine = (lineId: string) => {
    setLines(prev => prev.map(line =>
      line.id === lineId ? { ...line, isActive: !line.isActive } : line
    ));
    const line = lines.find(l => l.id === lineId);
    toast({
      title: line?.isActive ? "Ligne désactivée" : "Ligne activée",
      description: line?.name,
    });
  };

  const resetAddForm = () => {
    setNewLineName('');
    setNewLineBrand('');
    setNewVisPDimensions('');
    setNewVisPReference('');
    setNewVisSDimensions('');
    setNewVisSReference('');
  };

  const handleAddLine = () => {
    const rawName = newLineName.trim();

    if (!rawName) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom de ligne (ex: silicone, batterie, 22...)",
        variant: "destructive",
      });
      return;
    }

    const lineId = makeLineIdFromName(rawName);

    if (lines.some(l => l.id === lineId)) {
      toast({
        title: "Erreur",
        description: "Cette ligne existe déjà",
        variant: "destructive",
      });
      return;
    }

    const definition: LineDefinition | undefined = newLineBrand ? {
      brand: newLineBrand,
      visPrincipale: {
        dimensions: newVisPDimensions,
        reference: newVisPReference,
      },
      visSecondaire: {
        dimensions: newVisSDimensions,
        reference: newVisSReference,
      },
    } : undefined;

    const newLine: Line = {
      id: lineId,
      name: formatDisplayName(rawName),
      isActive: true,
      definition,
      principaleStatus: null,
      secondaireStatus: null,
      principaleCompteur: null,
      secondaireCompteur: null,
      principaleEcart: null,
      secondaireEcart: null,
      lastVerificationPrincipale: null,
      lastVerificationSecondaire: null,
      nextVerificationPrincipale: null,
      nextVerificationSecondaire: null,
      remarque: '',
    };

    setLines(prev => [...prev, newLine].sort((a, b) => a.name.localeCompare(b.name)));
    resetAddForm();
    setIsAddDialogOpen(false);
    toast({
      title: "Ligne ajoutée",
      description: newLine.name,
    });
  };

  const handleRemoveLine = (lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    setLines(prev => prev.filter(l => l.id !== lineId));
    toast({
      title: "Ligne supprimée",
      description: line?.name,
    });
  };

  const activeLines = lines.filter(l => l.isActive).length;
  const inactiveLines = lines.filter(l => !l.isActive).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
          Paramètres & Gestion
        </h1>
        <p className="text-muted-foreground">
          Configuration des lignes, constantes de calcul et administration système
        </p>
      </div>

      {/* Formula Constants */}
      <Card className="card-industrial opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-accent" />
            Constantes de Calcul (Formules d'Usure)
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Formules :</p>
                <p className="text-xs">Usure Vis = A - B - Mesure (µm)</p>
                <p className="text-xs">Usure Chemise = C - (Mesure/100) (µm)</p>
                <p className="text-xs mt-1 text-accent">Écart = Usure Chemise - Usure Vis</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Constante A (Vis)</Label>
              <Input
                type="number"
                step="0.01"
                value={formulas.visA}
                onChange={(e) => handleFormulaChange('visA', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Défaut: 75</p>
            </div>
            <div className="space-y-2">
              <Label>Constante B (Vis)</Label>
              <Input
                type="number"
                step="0.01"
                value={formulas.visB}
                onChange={(e) => handleFormulaChange('visB', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Défaut: 8.94</p>
            </div>
            <div className="space-y-2">
              <Label>Constante C (Chemise)</Label>
              <Input
                type="number"
                step="0.01"
                value={formulas.chemiseC}
                onChange={(e) => handleFormulaChange('chemiseC', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Défaut: 61.09</p>
            </div>
            <div className="flex flex-col justify-end gap-2">
              <Button onClick={handleSaveFormulas} className="btn-copper">
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
              <Button variant="outline" onClick={handleResetFormulas}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Formula Preview */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-sm font-medium mb-2">Aperçu des formules actuelles :</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="font-mono bg-card p-2 rounded">
                Usure Vis = {formulas.visA} - {formulas.visB} - Mesure
              </div>
              <div className="font-mono bg-card p-2 rounded">
                Usure Chemise = {formulas.chemiseC} - (Mesure/100)
              </div>
              <div className="font-mono bg-card p-2 rounded text-accent font-semibold">
                Écart = Usure Chemise - Usure Vis
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Management */}
      <Card className="card-industrial opacity-0 animate-fade-in overflow-hidden" style={{ animationDelay: '200ms' }}>
        <CardHeader className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Gestion des Lignes de Production
              </CardTitle>
              <p className="text-primary-foreground/70 text-sm mt-1">
                {activeLines} actives • {inactiveLines} inactives • {lines.length} total
              </p>
            </div>

            <Dialog
              open={isAddDialogOpen}
              onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetAddForm(); }}
            >
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Ajouter une nouvelle ligne</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nom de ligne *</Label>
                    <Input
                      type="text"
                      placeholder="Ex: silicone, batterie, ligne 22, 22..."
                      value={newLineName}
                      onChange={(e) => setNewLineName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Sera affiché comme : {newLineName.trim() ? formatDisplayName(newLineName) : 'Ligne XX'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Marque / Fabricant</Label>
                    <Input
                      placeholder="Ex: Maillefer, Rosendahl..."
                      value={newLineBrand}
                      onChange={(e) => setNewLineBrand(e.target.value)}
                    />
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                    <p className="font-medium text-sm">Vis Principale</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Dimensions</Label>
                        <Input
                          placeholder="Ex: Ø60 x 25D"
                          value={newVisPDimensions}
                          onChange={(e) => setNewVisPDimensions(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Référence</Label>
                        <Input
                          placeholder="Ex: VIS-ML-60-25"
                          value={newVisPReference}
                          onChange={(e) => setNewVisPReference(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                    <p className="font-medium text-sm">Vis Secondaire</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Dimensions</Label>
                        <Input
                          placeholder="Ex: Ø45 x 20D"
                          value={newVisSDimensions}
                          onChange={(e) => setNewVisSDimensions(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Référence</Label>
                        <Input
                          placeholder="Ex: VIS-ML-45-20"
                          value={newVisSReference}
                          onChange={(e) => setNewVisSReference(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddLine} className="btn-copper">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Ligne
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">
                    Marque
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                    Principale
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                    Secondaire
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/50">
                {lines.map((line, index) => (
                  <tr
                    key={line.id}
                    className={cn(
                      "transition-colors hover:bg-muted/30 opacity-0 animate-fade-in",
                      !line.isActive && "opacity-60 bg-muted/20"
                    )}
                    style={{ animationDelay: `${300 + index * 30}ms` }}
                  >
                    <td className="px-4 py-4">
                      <span className={cn(
                        "font-semibold",
                        !line.isActive && "text-muted-foreground"
                      )}>
                        {line.name}
                      </span>
                    </td>

                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {line.definition?.brand || '—'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={line.isActive}
                          onCheckedChange={() => handleToggleLine(line.id)}
                        />
                        <span className={cn(
                          "text-xs font-medium",
                          line.isActive ? "text-status-ok" : "text-muted-foreground"
                        )}>
                          {line.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      {line.principaleStatus ? (
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          line.principaleStatus === 'ok' && "bg-status-ok/10 text-status-ok",
                          line.principaleStatus === 'a_commander' && "bg-status-warning/10 text-status-warning",
                          line.principaleStatus === 'a_changer' && "bg-status-danger/10 text-status-danger",
                        )}>
                          {line.principaleStatus === 'ok' ? 'OK' :
                            line.principaleStatus === 'a_commander' ? 'À cmd' : 'À chg'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {line.secondaireStatus ? (
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          line.secondaireStatus === 'ok' && "bg-status-ok/10 text-status-ok",
                          line.secondaireStatus === 'a_commander' && "bg-status-warning/10 text-status-warning",
                          line.secondaireStatus === 'a_changer' && "bg-status-danger/10 text-status-danger",
                        )}>
                          {line.secondaireStatus === 'ok' ? 'OK' :
                            line.secondaireStatus === 'a_commander' ? 'À cmd' : 'À chg'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-status-danger hover:text-status-danger">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer {line.name} ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Toutes les données associées à cette ligne seront perdues.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveLine(line.id)}
                              className="bg-status-danger hover:bg-status-danger/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="card-industrial opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            Informations Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Version</p>
              <p className="font-mono font-semibold">1.0.0</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Application</p>
              <p className="font-mono font-semibold text-accent">COFMA</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Lignes Configurées</p>
              <p className="font-mono font-semibold">{lines.length}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Points de Mesure</p>
              <p className="font-mono font-semibold">15 minimum</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}