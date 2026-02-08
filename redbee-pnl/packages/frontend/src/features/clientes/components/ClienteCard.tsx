import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FileText, FolderKanban } from 'lucide-react';
import { ClienteBadge } from './ClienteBadge';
import type { Cliente } from '../types/cliente.types';

interface ClienteCardProps {
  cliente: Cliente;
  onClick?: () => void;
}

export function ClienteCard({ cliente, onClick }: ClienteCardProps) {
  return (
    <Card
      className={`transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{cliente.nombre}</CardTitle>
          <ClienteBadge estado={cliente.estado} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{cliente.razonSocial}</span>
          </div>
          <div className="flex items-center gap-4">
            {cliente._count && (
              <>
                <div className="flex items-center gap-1">
                  <FolderKanban className="h-4 w-4" />
                  <span>{cliente._count.proyectos} proyectos</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{cliente._count.contratos} contratos</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
