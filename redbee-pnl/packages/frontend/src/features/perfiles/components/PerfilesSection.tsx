import { useState } from 'react';
import { Plus, Edit, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePerfiles, usePerfilMutations } from '../hooks/usePerfiles';
import { PerfilFormDialog } from './PerfilFormDialog';
import type { Perfil, CreatePerfilDto, UpdatePerfilDto } from '../types/perfil.types';

const NIVEL_LABELS: Record<string, string> = {
  JR: 'Junior',
  SSR: 'Semi Senior',
  SR: 'Senior',
  LEAD: 'Lead',
  MANAGER: 'Manager',
};

export function PerfilesSection() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = usePerfiles({ page, limit });
  const { createPerfil, updatePerfil } = usePerfilMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPerfil, setSelectedPerfil] = useState<Perfil | null>(null);

  const perfiles = data?.data || [];
  const pagination = data?.pagination;

  const handleCreate = () => {
    setSelectedPerfil(null);
    setDialogOpen(true);
  };

  const handleEdit = (perfil: Perfil) => {
    setSelectedPerfil(perfil);
    setDialogOpen(true);
  };

  const handleSubmit = (dto: CreatePerfilDto | UpdatePerfilDto) => {
    if (selectedPerfil) {
      updatePerfil.mutate(
        { id: selectedPerfil.id, dto },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createPerfil.mutate(dto as CreatePerfilDto, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const canPrevPage = pagination && page > 1;
  const canNextPage = pagination && page < pagination.totalPages;

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-stone-800">Perfiles</CardTitle>
            <CardDescription className="text-stone-500">
              Gestiona los perfiles de recursos disponibles en el sistema.
            </CardDescription>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-stone-800 hover:bg-stone-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Perfil
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        ) : perfiles.length === 0 ? (
          <p className="text-center text-stone-500 py-8">
            No hay perfiles registrados. Agrega el primero.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="border border-stone-200 rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Nombre</TableHead>
                    <TableHead className="w-[20%]">Categoría</TableHead>
                    <TableHead className="w-[15%]">Nivel</TableHead>
                    <TableHead className="w-[15%]">Estado</TableHead>
                    <TableHead className="w-[20%] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfiles.map((perfil) => (
                    <TableRow key={perfil.id}>
                      <TableCell className="font-medium text-stone-800">
                        {perfil.nombre}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {perfil.categoria}
                      </TableCell>
                      <TableCell>
                        {perfil.nivel ? (
                          <span className="text-sm text-stone-600">
                            {NIVEL_LABELS[perfil.nivel] || perfil.nivel}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={perfil.estado === 'ACTIVO' ? 'default' : 'outline'}
                          className={
                            perfil.estado === 'ACTIVO'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'text-stone-500 border-stone-300'
                          }
                        >
                          {perfil.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(perfil)}
                          className="text-stone-600 hover:text-stone-800"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-500">
                  Página {pagination.page} de {pagination.totalPages} ({pagination.total} perfiles)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={!canPrevPage}
                    className="border-stone-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!canNextPage}
                    className="border-stone-200"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <PerfilFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        perfil={selectedPerfil}
        onSubmit={handleSubmit}
        isLoading={createPerfil.isPending || updatePerfil.isPending}
      />
    </Card>
  );
}
