export interface Perfil {
  id: string;
  nombre: string;
  categoria: string;
  nivel: string | null;
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
