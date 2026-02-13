import { Line, Status } from '@/types/maintenance';
import { AlertTriangle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AlertsPanelProps {
  lines: Line[];
}

interface Alert {
  id: string;
  lineName: string;
  type: 'danger' | 'warning' | 'upcoming';
  extruder: string;
  message: string;
  date?: Date;
}

export function AlertsPanel({ lines }: AlertsPanelProps) {
  const navigate = useNavigate();
  
  // Generate alerts from lines
  const alerts: Alert[] = [];
  
  lines.forEach(line => {
    if (line.principaleStatus === 'a_changer') {
      alerts.push({
        id: `${line.id}-p-danger`,
        lineName: line.name,
        type: 'danger',
        extruder: 'Principale',
        message: 'Changement requis - Écart critique détecté',
      });
    }
    if (line.secondaireStatus === 'a_changer') {
      alerts.push({
        id: `${line.id}-s-danger`,
        lineName: line.name,
        type: 'danger',
        extruder: 'Secondaire',
        message: 'Changement requis - Écart critique détecté',
      });
    }
    if (line.principaleStatus === 'a_commander') {
      alerts.push({
        id: `${line.id}-p-warning`,
        lineName: line.name,
        type: 'warning',
        extruder: 'Principale',
        message: 'Pièce à commander - Seuil atteint',
      });
    }
    if (line.secondaireStatus === 'a_commander') {
      alerts.push({
        id: `${line.id}-s-warning`,
        lineName: line.name,
        type: 'warning',
        extruder: 'Secondaire',
        message: 'Pièce à commander - Seuil atteint',
      });
    }
    
    // Check upcoming verifications
    if (line.nextVerificationPrincipale) {
      const daysUntil = differenceInDays(line.nextVerificationPrincipale, new Date());
      if (daysUntil >= 0 && daysUntil <= 30) {
        alerts.push({
          id: `${line.id}-p-upcoming`,
          lineName: line.name,
          type: 'upcoming',
          extruder: 'Principale',
          message: `Vérification dans ${daysUntil} jours`,
          date: line.nextVerificationPrincipale,
        });
      }
    }
  });
  
  // Sort by priority
  const sortedAlerts = alerts.sort((a, b) => {
    const priority = { danger: 0, warning: 1, upcoming: 2 };
    return priority[a.type] - priority[b.type];
  }).slice(0, 8);
  
  const alertStyles = {
    danger: {
      bg: 'bg-status-danger/10 border-status-danger/30',
      icon: XCircle,
      iconColor: 'text-status-danger',
    },
    warning: {
      bg: 'bg-status-warning/10 border-status-warning/30',
      icon: AlertTriangle,
      iconColor: 'text-status-warning',
    },
    upcoming: {
      bg: 'bg-primary/5 border-primary/20',
      icon: Clock,
      iconColor: 'text-primary',
    },
  };
  
  return (
    <div className="card-industrial overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
      <div className="bg-gradient-to-r from-accent to-coficab-copper-light px-5 py-4">
        <h3 className="text-lg font-semibold text-accent-foreground">
          Alertes & Notifications
        </h3>
        <p className="text-accent-foreground/70 text-sm">
          {alerts.length} alertes actives
        </p>
      </div>
      
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune alerte active</p>
          </div>
        ) : (
          sortedAlerts.map((alert, index) => {
            const style = alertStyles[alert.type];
            const Icon = style.icon;
            
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:scale-[1.01]",
                  style.bg,
                  "opacity-0 animate-fade-in"
                )}
                style={{ animationDelay: `${400 + index * 100}ms` }}
                onClick={() => navigate(`/mesures?line=${alert.lineName.toLowerCase().replace(' ', '-')}`)}
              >
                <div className={cn("p-2 rounded-lg bg-card", style.iconColor)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground">
                      {alert.lineName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {alert.extruder}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {alert.message}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
