import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useRecursoSearch } from '../hooks/usePlanner';

interface ResourceComboboxProps {
  assignedRecursoIds: Set<string>;
  onSelect: (recursoId: string) => void;
  isLoading?: boolean;
}

export function ResourceCombobox({ assignedRecursoIds, onSelect, isLoading }: ResourceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isFetching } = useRecursoSearch(search);

  const recursos = (data?.data || []).filter((r) => !assignedRecursoIds.has(r.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          className="bg-stone-800 hover:bg-stone-700 text-white"
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar recurso
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nombre, apellido, perfil..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {search.length < 2 ? (
              <div className="py-6 text-center text-sm text-stone-500">
                <Search className="mx-auto h-5 w-5 mb-2 text-stone-400" />
                Escribí al menos 2 caracteres
              </div>
            ) : isFetching ? (
              <div className="py-6 text-center text-sm text-stone-500">
                Buscando...
              </div>
            ) : recursos.length === 0 ? (
              <CommandEmpty>No se encontraron recursos</CommandEmpty>
            ) : (
              <CommandGroup>
                {recursos.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={r.id}
                    onSelect={() => {
                      onSelect(r.id);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="cursor-pointer"
                  >
                    <div>
                      <span className="font-medium text-stone-800">
                        {r.apellido}, {r.nombre}
                      </span>
                      {r.perfil && (
                        <span className="text-stone-500 ml-2 text-xs">
                          {r.perfil.nombre}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
