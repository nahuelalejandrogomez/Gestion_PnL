export interface ClientePresupuesto {
  id: string;
  nombre: string;
  moneda: string;
  estado: string;
  meses?: ClientePresupuestoMes[];
  totalAnual?: number;
}

export interface ClientePresupuestoMes {
  id: string;
  year: number;
  month: number;
  amount: number;
}

export interface AplicarClientePresupuestoDto {
  clientePresupuestoId: string;
  fromMonth?: number;
}
