import { useState, useMemo, useEffect } from "react";
import { initialLines, defaultFormulas, generateMeasurements } from "@/data/mockData";
import {
  MeasurementPoint,
  WearFormulas,
  ExtruderType,
  calculateWear,
  getOverallStatus,
} from "@/types/maintenance";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Save,
  RefreshCw,
  Settings2,
  Calculator,
  Calendar,
  Clock,
  MessageSquare,
  Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function MesuresPage() {
  const [lines] = useState(initialLines.filter((l) => l.isActive));
  const [selectedLine, setSelectedLine] = useState<string>("");
  const [selectedExtruder, setSelectedExtruder] = useState<ExtruderType>("principale");
  const [measurements, setMeasurements] = useState<MeasurementPoint[]>([]);
  const [formulas, setFormulas] = useState<WearFormulas>(defaultFormulas);
  const [showFormulas, setShowFormulas] = useState(false);

  // New fields: Date, Compteur, Remarque
  const [dateSaisie, setDateSaisie] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [compteur, setCompteur] = useState<string>("");
  const [remarque, setRemarque] = useState<string>("");

  // Draft inputs (phone friendly)
  const [draftVis, setDraftVis] = useState<Record<number, string>>({});
  const [draftChemise, setDraftChemise] = useState<Record<number, string>>({});

  const normalizeNumber = (raw: string) => raw.replace(",", ".").trim();

  const commitMeasurement = (
    pointId: number,
    field: "visValue" | "chemiseValue",
    raw: string
  ) => {
    const v = normalizeNumber(raw);

    if (v === "") {
      setMeasurements((prev) =>
        prev.map((m) => (m.id === pointId ? { ...m, [field]: 0 } : m))
      );
      return;
    }

    const num = Number(v);
    if (Number.isNaN(num)) return;

    setMeasurements((prev) =>
      prev.map((m) => (m.id === pointId ? { ...m, [field]: num } : m))
    );
  };

  useEffect(() => {
    if (selectedLine) {
      const ms = generateMeasurements(15);
      setMeasurements(ms);

      setDraftVis(Object.fromEntries(ms.map((p) => [p.id, String(p.visValue ?? "")])));
      setDraftChemise(Object.fromEntries(ms.map((p) => [p.id, String(p.chemiseValue ?? "")])));

      setCompteur("");
      setRemarque("");
    }
  }, [selectedLine, selectedExtruder]);

  // ✅ Formules selon extrudeuse
  const activeFormulas = useMemo(() => {
    if (selectedExtruder === "principale") {
      return { visA: 75, visB: 8.94, chemiseC: 64.66 };
    }
    return { visA: 50, visB: 8.94, chemiseC: 46.18 };
  }, [selectedExtruder]);

  const wearCalculations = useMemo(() => {
    if (measurements.length === 0) return [];
    return calculateWear(measurements, activeFormulas);
  }, [measurements, activeFormulas]);

  const overallStatus = useMemo(() => {
    if (wearCalculations.length === 0) return null;
    return getOverallStatus(wearCalculations);
  }, [wearCalculations]);

  const handleFormulaChange = (field: keyof WearFormulas, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormulas((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleSave = () => {
    if (!compteur) {
      toast({
        title: "Erreur",
        description: "Le compteur est obligatoire",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Mesures enregistrées",
      description: `${selectedLineName} - ${dateSaisie}`,
    });
  };

  const selectedLineName = lines.find((l) => l.id === selectedLine)?.name || "";
  const selectedLineData = lines.find((l) => l.id === selectedLine);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">Saisie des Mesures</h1>
        <p className="text-muted-foreground">
          Mesures Vis & Chemise simultanées • Unité:{" "}
          <span className="font-semibold text-accent">µm (micromètre)</span>
        </p>
      </div>

      {/* Selection Controls */}
      <Card className="card-industrial opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-accent" />
            Nouvelle Saisie
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Ligne *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Sélectionnez la ligne de production à mesurer</p>
                  </TooltipContent>
                </Tooltip>
              </Label>

              <Select value={selectedLine} onValueChange={setSelectedLine}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une ligne" />
                </SelectTrigger>
                <SelectContent>
                  {lines.map((line) => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Type d'Extrudeuse *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Principale = extrudeuse principale
                      <br />
                      Secondaire = extrudeuse auxiliaire
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>

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

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de Saisie *
              </Label>
              <Input type="date" value={dateSaisie} onChange={(e) => setDateSaisie(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Compteur *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Valeur du compteur machine au moment de la mesure</p>
                  </TooltipContent>
                </Tooltip>
              </Label>

              <Input
                type="number"
                placeholder="Ex: 4500"
                value={compteur}
                onChange={(e) => setCompteur(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Remarque
              </Label>
              <Textarea
                placeholder="Observations, notes, anomalies détectées..."
                value={remarque}
                onChange={(e) => setRemarque(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => setShowFormulas(!showFormulas)} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                {showFormulas ? "Masquer" : "Paramètres"} Formules
              </Button>
            </div>
          </div>

          {/* Formula Parameters */}
          {showFormulas && (
            <div className="p-4 bg-muted/50 rounded-lg border border-border/50 animate-fade-in">
              <h4 className="font-semibold mb-4 text-sm flex items-center gap-2">
                Paramètres des Formules d'Usure
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Usure Vis = A - B - Mesure (µm)</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">A</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formulas.visA}
                        onChange={(e) => handleFormulaChange("visA", e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">B</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formulas.visB}
                        onChange={(e) => handleFormulaChange("visB", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Usure Chemise = C - (Mesure/100) (µm)</Label>
                  <div>
                    <Label className="text-xs">C</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formulas.chemiseC}
                      onChange={(e) => handleFormulaChange("chemiseC", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" size="sm" onClick={() => setFormulas(defaultFormulas)} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Measurements */}
      {selectedLine && measurements.length > 0 && (
        <Card className="card-industrial opacity-0 animate-fade-in overflow-hidden" style={{ animationDelay: "200ms" }}>
          <CardHeader className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-lg">
                  {selectedLineName} — Extrudeuse {selectedExtruder === "principale" ? "Principale" : "Secondaire"}
                </CardTitle>
                <p className="text-primary-foreground/70 text-sm mt-1">
                  {measurements.length} points • {dateSaisie} • Compteur: {compteur || "Non renseigné"}
                </p>
                {selectedLineData?.definition && (
                  <p className="text-primary-foreground/60 text-xs mt-1">
                    {selectedLineData.definition.brand} •{" "}
                    {selectedExtruder === "principale"
                      ? selectedLineData.definition.visPrincipale.reference
                      : selectedLineData.definition.visSecondaire.reference}
                  </p>
                )}
              </div>

              {overallStatus && <StatusBadge status={overallStatus} size="lg" />}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* ✅ MOBILE (cards) */}
            <div className="block md:hidden">
              <div className="space-y-3 p-4">
                {measurements.map((point, index) => {
                  const calc = wearCalculations[index];
                  const isBad = (calc?.ecart ?? 0) >= 1;

                  return (
                    <div
                      key={point.id}
                      className={cn(
                        "rounded-xl border p-4 bg-card shadow-sm",
                        isBad && "border-status-danger/40 bg-status-danger/5"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold">
                          Point {point.id.toString().padStart(2, "0")}
                        </div>

                        {calc && (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                              isBad
                                ? "bg-status-danger text-status-danger-foreground"
                                : "bg-status-ok text-status-ok-foreground"
                            )}
                          >
                            {isBad ? "NOK" : "OK"}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Mesure Vis (µm)</div>
                          <Input
                            inputMode="decimal"
                            placeholder="Ex: 61,76"
                            value={draftVis[point.id] ?? ""}
                            onChange={(e) =>
                              setDraftVis((prev) => ({ ...prev, [point.id]: e.target.value }))
                            }
                            onBlur={() =>
                              commitMeasurement(point.id, "visValue", draftVis[point.id] ?? "")
                            }
                            className="h-12 text-center text-base"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Mesure Chemise (µm)</div>
                          <Input
                            inputMode="numeric"
                            placeholder="Ex: 6071"
                            value={draftChemise[point.id] ?? ""}
                            onChange={(e) =>
                              setDraftChemise((prev) => ({ ...prev, [point.id]: e.target.value }))
                            }
                            onBlur={() =>
                              commitMeasurement(point.id, "chemiseValue", draftChemise[point.id] ?? "")
                            }
                            className="h-12 text-center text-base"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                        <div className="rounded-lg bg-muted/40 p-2 text-center">
                          <div className="text-[11px] text-muted-foreground">Usure Vis</div>
                          <div className="font-mono font-semibold">
                            {calc ? calc.usureVis.toFixed(3) : "—"}
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-2 text-center">
                          <div className="text-[11px] text-muted-foreground">Usure Chemise</div>
                          <div className="font-mono font-semibold">
                            {calc ? calc.usureChemise.toFixed(3) : "—"}
                          </div>
                        </div>
                        <div className={cn("rounded-lg p-2 text-center", isBad ? "bg-status-danger/10" : "bg-muted/40")}>
                          <div className="text-[11px] text-muted-foreground">Écart</div>
                          <div className={cn("font-mono font-bold", isBad ? "text-status-danger" : "")}>
                            {calc ? calc.ecart.toFixed(3) : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ✅ DESKTOP (table) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Point</th>

                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 mx-auto">
                          Mesure Vis (µm) <Info className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Relevé au comparateur en micromètres (µm)</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 mx-auto">
                          Mesure Chemise (µm) <Info className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Relevé au comparateur en micromètres (µm)</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold text-primary uppercase bg-primary/5">Usure Vis</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-primary uppercase bg-primary/5">Usure Chemise</th>

                    <th className="px-4 py-3 text-center text-xs font-semibold text-accent uppercase bg-accent/5">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 mx-auto">
                          Écart <Info className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">Écart = Usure Chemise - Usure Vis</p>
                          <p className="text-xs mt-1">{"< 1.0 → OK | = 1.0 → À commander | > 1.0 → À changer"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Statut</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/50">
                  {measurements.map((point, index) => {
                    const calc = wearCalculations[index];

                    return (
                      <tr
                        key={point.id}
                        className={cn("transition-colors hover:bg-muted/30", calc?.ecart >= 1 && "bg-status-danger/5")}
                      >
                        <td className="px-4 py-3">
                          <span className="font-semibold text-sm">
                            Point {point.id.toString().padStart(2, "0")}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <Input
                            inputMode="decimal"
                            placeholder="Ex: 61,76"
                            value={draftVis[point.id] ?? ""}
                            onChange={(e) => setDraftVis((prev) => ({ ...prev, [point.id]: e.target.value }))}
                            onBlur={() => commitMeasurement(point.id, "visValue", draftVis[point.id] ?? "")}
                            className="w-24 mx-auto text-center"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <Input
                            inputMode="numeric"
                            placeholder="Ex: 6071"
                            value={draftChemise[point.id] ?? ""}
                            onChange={(e) => setDraftChemise((prev) => ({ ...prev, [point.id]: e.target.value }))}
                            onBlur={() => commitMeasurement(point.id, "chemiseValue", draftChemise[point.id] ?? "")}
                            className="w-24 mx-auto text-center"
                          />
                        </td>

                        <td className="px-4 py-3 text-center bg-primary/5">
                          <span className="font-mono text-sm font-medium">{calc?.usureVis.toFixed(3)}</span>
                        </td>

                        <td className="px-4 py-3 text-center bg-primary/5">
                          <span className="font-mono text-sm font-medium">{calc?.usureChemise.toFixed(3)}</span>
                        </td>

                        <td className="px-4 py-3 text-center bg-accent/5">
                          <span
                            className={cn(
                              "font-mono text-sm font-bold",
                              calc?.ecart && calc.ecart >= 1 ? "text-status-danger" : "text-foreground"
                            )}
                          >
                            {calc?.ecart.toFixed(3)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          {calc && (
                            <span
                              className={cn(
                                "inline-flex items-center font-medium rounded-full whitespace-nowrap px-2 py-0.5 text-xs",
                                calc.ecart < 1
                                  ? "bg-status-ok text-status-ok-foreground"
                                  : "bg-status-danger text-status-danger-foreground"
                              )}
                            >
                              {calc.ecart < 1 ? "OK" : "NOK"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Actions (sticky on mobile) */}
            <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-3 md:static sticky bottom-0 z-10 bg-background/95 backdrop-blur">
              <Button variant="outline" onClick={() => setMeasurements(generateMeasurements(15))}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Nouvelles Mesures
              </Button>

              <Button onClick={handleSave} className="btn-copper">
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedLine && (
        <div className="card-industrial p-12 text-center opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <Settings2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">Sélectionnez une ligne</h3>
          <p className="text-muted-foreground text-sm">
            Choisissez une ligne et un type d'extrudeuse pour commencer la saisie des mesures
          </p>
        </div>
      )}
    </div>
  );
}
