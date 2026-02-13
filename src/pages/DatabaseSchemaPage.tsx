import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Copy, 
  Check,
  Table,
  Key,
  Link2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const dbSchema = {
  tables: [
    {
      name: 'lines',
      description: 'Lignes de production',
      fields: [
        { name: 'id', type: 'UUID', primary: true, description: 'Identifiant unique' },
        { name: 'name', type: 'VARCHAR(50)', description: 'Nom de la ligne (Line 01-16)' },
        { name: 'is_active', type: 'BOOLEAN', description: 'Ligne active/inactive' },
        { name: 'brand', type: 'VARCHAR(100)', description: 'Marque/Fabricant' },
        { name: 'vis_principale_dimensions', type: 'VARCHAR(50)', description: 'Dimensions vis principale' },
        { name: 'vis_principale_reference', type: 'VARCHAR(50)', description: 'Référence vis principale' },
        { name: 'vis_secondaire_dimensions', type: 'VARCHAR(50)', description: 'Dimensions vis secondaire' },
        { name: 'vis_secondaire_reference', type: 'VARCHAR(50)', description: 'Référence vis secondaire' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Date de création' },
        { name: 'updated_at', type: 'TIMESTAMP', description: 'Date de mise à jour' },
      ]
    },
    {
      name: 'measurements',
      description: 'Enregistrements des mesures',
      fields: [
        { name: 'id', type: 'UUID', primary: true, description: 'Identifiant unique' },
        { name: 'line_id', type: 'UUID', foreign: 'lines.id', description: 'Référence ligne' },
        { name: 'extruder_type', type: 'ENUM', description: 'principale | secondaire' },
        { name: 'date_saisie', type: 'DATE', description: 'Date de saisie' },
        { name: 'compteur', type: 'INTEGER', description: 'Valeur compteur machine' },
        { name: 'remarque', type: 'TEXT', description: 'Remarques/observations' },
        { name: 'mesures_vis_um', type: 'JSONB', description: 'Mesures vis en µm (array)' },
        { name: 'mesures_chemise_um', type: 'JSONB', description: 'Mesures chemise en µm (array)' },
        { name: 'ecart_max', type: 'DECIMAL(6,3)', description: 'Écart maximal calculé' },
        { name: 'status', type: 'ENUM', description: 'ok | a_commander | a_changer' },
        { name: 'formulas_a', type: 'DECIMAL(6,2)', description: 'Constante A utilisée' },
        { name: 'formulas_b', type: 'DECIMAL(6,2)', description: 'Constante B utilisée' },
        { name: 'formulas_c', type: 'DECIMAL(6,2)', description: 'Constante C utilisée' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Date de création' },
        { name: 'created_by', type: 'VARCHAR(100)', description: 'Utilisateur' },
      ]
    },
    {
      name: 'alerts',
      description: 'Alertes et notifications',
      fields: [
        { name: 'id', type: 'UUID', primary: true, description: 'Identifiant unique' },
        { name: 'line_id', type: 'UUID', foreign: 'lines.id', description: 'Référence ligne' },
        { name: 'measurement_id', type: 'UUID', foreign: 'measurements.id', description: 'Référence mesure' },
        { name: 'type', type: 'ENUM', description: 'threshold_warning | threshold_critical | verification_due' },
        { name: 'message', type: 'TEXT', description: 'Message d\'alerte' },
        { name: 'is_read', type: 'BOOLEAN', description: 'Lu/Non lu' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Date de création' },
      ]
    },
    {
      name: 'formulas_config',
      description: 'Configuration des formules de calcul',
      fields: [
        { name: 'id', type: 'UUID', primary: true, description: 'Identifiant unique' },
        { name: 'vis_a', type: 'DECIMAL(6,2)', description: 'Constante A (défaut: 75)' },
        { name: 'vis_b', type: 'DECIMAL(6,2)', description: 'Constante B (défaut: 8.94)' },
        { name: 'chemise_c', type: 'DECIMAL(6,2)', description: 'Constante C (défaut: 61.09)' },
        { name: 'is_active', type: 'BOOLEAN', description: 'Configuration active' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Date de création' },
        { name: 'updated_at', type: 'TIMESTAMP', description: 'Date de mise à jour' },
      ]
    },
  ]
};

const sqlSchema = `-- COFICAB IP Maintenance Database Schema
-- Generated for Suivi Vis & Chemise application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Lines table
CREATE TABLE lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  brand VARCHAR(100),
  vis_principale_dimensions VARCHAR(50),
  vis_principale_reference VARCHAR(50),
  vis_secondaire_dimensions VARCHAR(50),
  vis_secondaire_reference VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extruder type enum
CREATE TYPE extruder_type AS ENUM ('principale', 'secondaire');

-- Status enum
CREATE TYPE measurement_status AS ENUM ('ok', 'a_commander', 'a_changer');

-- Measurements table
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_id UUID NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
  extruder_type extruder_type NOT NULL,
  date_saisie DATE NOT NULL,
  compteur INTEGER NOT NULL,
  remarque TEXT,
  mesures_vis_um JSONB NOT NULL,
  mesures_chemise_um JSONB NOT NULL,
  ecart_max DECIMAL(6,3),
  status measurement_status NOT NULL,
  formulas_a DECIMAL(6,2) DEFAULT 75,
  formulas_b DECIMAL(6,2) DEFAULT 8.94,
  formulas_c DECIMAL(6,2) DEFAULT 61.09,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100)
);

-- Alert type enum
CREATE TYPE alert_type AS ENUM ('threshold_warning', 'threshold_critical', 'verification_due');

-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_id UUID NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
  measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
  type alert_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Formulas configuration table
CREATE TABLE formulas_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vis_a DECIMAL(6,2) DEFAULT 75,
  vis_b DECIMAL(6,2) DEFAULT 8.94,
  chemise_c DECIMAL(6,2) DEFAULT 61.09,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_measurements_line_id ON measurements(line_id);
CREATE INDEX idx_measurements_date ON measurements(date_saisie);
CREATE INDEX idx_measurements_status ON measurements(status);
CREATE INDEX idx_alerts_line_id ON alerts(line_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);

-- Initial data: Insert 16 lines
INSERT INTO lines (name, is_active) VALUES
  ('Line 01', true), ('Line 02', true), ('Line 03', true), ('Line 04', true),
  ('Line 05', true), ('Line 06', true), ('Line 07', true), ('Line 08', true),
  ('Line 09', true), ('Line 10', true), ('Line 11', true), ('Line 12', true),
  ('Line 13', true), ('Line 14', true), ('Line 15', false), ('Line 16', false);

-- Insert default formulas config
INSERT INTO formulas_config (vis_a, vis_b, chemise_c, is_active) 
VALUES (75, 8.94, 61.09, true);
`;

const jsonSchema = JSON.stringify(dbSchema, null, 2);

export default function DatabaseSchemaPage() {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  
  const copyToClipboard = async (text: string, type: 'sql' | 'json') => {
    await navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
    toast({
      title: "Copié !",
      description: `Schéma ${type.toUpperCase()} copié dans le presse-papiers`,
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
          <Database className="h-8 w-8 text-accent" />
          Schéma Base de Données
        </h1>
        <p className="text-muted-foreground">
          Structure des tables • Export SQL/JSON • Documentation technique
        </p>
      </div>
      
      {/* Schema Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
        {dbSchema.tables.map((table, index) => (
          <Card key={table.name} className="card-industrial">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Table className="h-4 w-4 text-accent" />
                {table.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">{table.description}</p>
              <p className="text-lg font-bold text-foreground">{table.fields.length} champs</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Detailed Schema */}
      <Card className="card-industrial overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <CardHeader className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <CardTitle className="text-lg">Structure des Tables</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dbSchema.tables.map((table) => (
            <div key={table.name} className="border-b border-border last:border-b-0">
              <div className="px-4 py-3 bg-muted/30">
                <h3 className="font-semibold flex items-center gap-2">
                  <Table className="h-4 w-4 text-accent" />
                  {table.name}
                  <span className="text-xs text-muted-foreground font-normal">— {table.description}</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Champ</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">Clé</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {table.fields.map((field) => (
                      <tr key={field.name} className="hover:bg-muted/20">
                        <td className="px-4 py-2 font-mono text-sm">{field.name}</td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">{field.type}</td>
                        <td className="px-4 py-2 text-center">
                          {field.primary && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 text-accent text-xs">
                              <Key className="h-3 w-3" /> PK
                            </span>
                          )}
                          {field.foreign && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                              <Link2 className="h-3 w-3" /> FK
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Export Section */}
      <Card className="card-industrial opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Copy className="h-5 w-5 text-accent" />
            Export du Schéma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sql">
            <TabsList className="mb-4">
              <TabsTrigger value="sql">SQL (PostgreSQL)</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sql">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => copyToClipboard(sqlSchema, 'sql')}
                >
                  {copiedSql ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedSql ? 'Copié !' : 'Copier'}
                </Button>
                <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-xs font-mono max-h-96">
                  {sqlSchema}
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="json">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => copyToClipboard(jsonSchema, 'json')}
                >
                  {copiedJson ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedJson ? 'Copié !' : 'Copier'}
                </Button>
                <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-xs font-mono max-h-96">
                  {jsonSchema}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
