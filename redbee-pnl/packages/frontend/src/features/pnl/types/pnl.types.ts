export interface AsignacionDetalle {
  recursoId: string;
  recursoNombre: string;
  perfilNombre: string;
  porcentajeAsignacion: number;
  tipoTiempo: string;
  rolEnProyecto: string | null;
  costoMensualRecurso: number;
  monedaCosto: string;
  horasMes: number;
  costoAsignacion: number;
  ftes: number;
}

export interface PnlResult {
  proyectoId: string;
  proyectoNombre: string;
  anio: number;
  mes: number;
  horasBaseMes: number;
  revenue: number;
  costosDirectos: number;
  ftes: number;
  margen: number | null;
  margenPorcentaje: number | null;
  requiresTarifarios: boolean;
  revenueWarning: string;
  detalle: AsignacionDetalle[];
}
