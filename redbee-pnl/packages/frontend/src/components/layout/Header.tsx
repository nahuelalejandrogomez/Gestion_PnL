import { Menu } from 'lucide-react';
import logo from '@/assets/REDBEE-MARCA.png';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-4 gap-4">
      <button
        onClick={onToggleSidebar}
        className="p-2 hover:bg-muted rounded-md lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <img src={logo} alt="Redbee" className="h-6 w-auto" />
        <span className="text-muted-foreground text-sm">P&L Manager</span>
      </div>
    </header>
  );
}
