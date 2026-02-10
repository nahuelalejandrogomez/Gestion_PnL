export type NivelPerfil = 'JR' | 'SSR' | 'SR' | 'LEAD' | 'MANAGER';

export interface Perfil {
  id: string;
  nombre: string;
  categoria: string;
  nivel: NivelPerfil | null;
  estado: 'ACTIVO' | 'INACTIVO';
  descripcion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PerfilesResponse {
  data: Perfil[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreatePerfilDto {
  nombre: string;
  categoria: string;
  nivel?: NivelPerfil;
  estado?: 'ACTIVO' | 'INACTIVO';
  descripcion?: string;
}

export interface UpdatePerfilDto {
  nombre?: string;
  categoria?: string;
  nivel?: NivelPerfil;
  estado?: 'ACTIVO' | 'INACTIVO';
  descripcion?: string;
}
