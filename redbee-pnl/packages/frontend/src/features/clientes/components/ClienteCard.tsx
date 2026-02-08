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
      className={`border-slate-200 shadow-sm rounded-xl overflow-hidden transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3 bg-white">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-semibold text-slate-900 leading-tight">
            {cliente.nombre}
          </CardTitle>
          <ClienteBadge estado={cliente.estado} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2.5 text-slate-600">
            <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">{cliente.razonSocial}</span>
          </div>
          {cliente._count && (
            <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500">
                <FolderKanban className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{cliente._count.proyectos}</span>
                <span className="text-slate-400">proyectos</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{cliente._count.contratos}</span>
                <span className="text-slate-400">contratos</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
