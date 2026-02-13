import { Menu, Bell, Settings } from 'lucide-react';
import coficabLogo from '@/assets/coficab-logo-white.png';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  
  return (
    <header className="h-16 bg-gradient-to-r from-primary to-secondary border-b border-primary/20 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          <img 
            src={coficabLogo} 
            alt="COFICAB" 
            className="h-8 lg:h-9 object-contain"
          />
          <div className="hidden sm:block border-l border-primary-foreground/30 pl-3">
            <h1 className="text-primary-foreground font-semibold text-sm lg:text-base leading-tight">
              Suivi Vis & Chemise COFICAB
            </h1>
            <p className="text-primary-foreground/70 text-xs">
              IP Department
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-accent rounded-full flex items-center justify-center text-[10px] font-bold text-accent-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-status-danger">Line 03 - À changer</span>
              <span className="text-xs text-muted-foreground">Vis Principale - Écart critique détecté</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-status-warning">Line 07 - À commander</span>
              <span className="text-xs text-muted-foreground">Vis Secondaire - Seuil atteint</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Line 12 - Vérification due</span>
              <span className="text-xs text-muted-foreground">Prochaine vérification dans 7 jours</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => navigate('/parametres')}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
