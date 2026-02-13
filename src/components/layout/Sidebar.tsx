import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  BarChart3, 
  Archive, 
  Settings,
  ChevronLeft,
  Gauge,
  Brain,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { 
    path: '/', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Vue d\'ensemble'
  },
  { 
    path: '/mesures', 
    label: 'Saisie Mesures', 
    icon: ClipboardList,
    description: 'Vis & Chemise (µm)'
  },
  { 
    path: '/analyse', 
    label: 'Analyse', 
    icon: BarChart3,
    description: 'Graphiques & Tableaux'
  },
  { 
    path: '/ia-maintenance', 
    label: 'IA & Maintenance', 
    icon: Brain,
    description: 'Prédictive'
  },
  { 
    path: '/archive', 
    label: 'Archive', 
    icon: Archive,
    description: 'Historique & Traçabilité'
  },
  { 
    path: '/schema-db', 
    label: 'Schéma DB', 
    icon: Database,
    description: 'Structure données'
  },
  { 
    path: '/settings', 
    label: 'Paramètres', 
    icon: Settings,
    description: 'Lignes & Constantes'
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-sidebar z-40",
          "transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="flex justify-end p-2 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={onClose}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    "group hover:bg-sidebar-accent",
                    isActive && "bg-sidebar-accent border-l-4 border-sidebar-primary"
                  )}
                >
                  <Icon 
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive 
                        ? "text-sidebar-primary" 
                        : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                    )} 
                  />
                  <div className="flex flex-col">
                    <span 
                      className={cn(
                        "font-medium text-sm transition-colors",
                        isActive 
                          ? "text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 group-hover:text-sidebar-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="text-xs text-sidebar-foreground/50">
                      {item.description}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
                <Gauge className="h-5 w-5 text-sidebar-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-sidebar-foreground">
                  IP 4.0 System
                </span>
                <span className="text-[10px] text-sidebar-foreground/50">
                  v1.0.0 • COFICAB
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
