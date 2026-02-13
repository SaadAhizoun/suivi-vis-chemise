import { Line, Status } from '@/types/maintenance';
import { StatusBadge, StatusDot } from '@/components/ui/status-badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface LineStatusGridProps {
  lines: Line[];
}

export function LineStatusGrid({ lines }: LineStatusGridProps) {
  const navigate = useNavigate();
  
  return (
    <div className="card-industrial overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '400ms' }}>
      <div className="bg-gradient-to-r from-primary to-secondary px-5 py-4">
        <h3 className="text-lg font-semibold text-primary-foreground">
          État des Lignes
        </h3>
        <p className="text-primary-foreground/70 text-sm">
          Supervision temps réel des 16 lignes de production
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ligne
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Principale
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Secondaire
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Dernière Vérif.
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Prochaine Vérif.
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {lines.map((line, index) => (
              <tr 
                key={line.id}
                className={cn(
                  "transition-colors hover:bg-muted/30 opacity-0 animate-fade-in",
                )}
                style={{ animationDelay: `${500 + index * 50}ms` }}
              >
                <td className="px-4 py-4">
                  <span className="font-semibold text-foreground">
                    {line.name}
                  </span>
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
                  {line.nextVerificationPrincipale ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-accent" />
                      <span className="text-foreground">
                        {format(line.nextVerificationPrincipale, 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => navigate(`/mesures?line=${line.id}`)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Détails
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
