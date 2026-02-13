import {
  calculateMonthCoverageAny,
  determineMonthCoverageStatus,
  round2,
} from './coverage-any-match.helper';

describe('Coverage ANY Match Helper', () => {
  describe('calculateMonthCoverageAny', () => {
    /**
     * Caso 1: Cobertura 100% (aunque perfiles distintos)
     * Forecast: 2 FTE @ $5000/FTE = $10,000
     * Asignado: 2 FTE (cualquier perfil)
     * Resultado: Cobertura 100%, revenue asignado $10,000, sin staffing $0
     */
    it('caso 1: cobertura 100% - forecast 2 FTE, asignado 2 FTE (perfiles distintos)', () => {
      const result = calculateMonthCoverageAny(
        2, // fteForecast
        2, // fteAssigned (puede ser cualquier perfil)
        10000, // forecastRevenue ($5000 × 2)
      );

      expect(result.fteForecast).toBe(2);
      expect(result.fteAssigned).toBe(2);
      expect(result.coverageRatio).toBe(1); // 100%
      expect(result.forecastRevenue).toBe(10000);
      expect(result.assignedRevenue).toBe(10000); // 100% × $10,000
      expect(result.revenueSinStaffing).toBe(0);
      expect(result.ftesFaltantes).toBe(0);
      expect(result.ftesSobreasignados).toBe(0);
    });

    /**
     * Caso 2: Cobertura parcial 75%
     * Forecast: 2 FTE @ $5000/FTE = $10,000
     * Asignado: 1.5 FTE
     * Resultado: Cobertura 75%, revenue asignado $7,500, sin staffing $2,500
     */
    it('caso 2: cobertura 75% - forecast 2 FTE, asignado 1.5 FTE', () => {
      const result = calculateMonthCoverageAny(
        2, // fteForecast
        1.5, // fteAssigned
        10000, // forecastRevenue
      );

      expect(result.fteForecast).toBe(2);
      expect(result.fteAssigned).toBe(1.5);
      expect(result.coverageRatio).toBe(0.75); // 75%
      expect(result.forecastRevenue).toBe(10000);
      expect(result.assignedRevenue).toBe(7500); // 75% × $10,000
      expect(result.revenueSinStaffing).toBe(2500);
      expect(result.ftesFaltantes).toBe(0.5); // 2 - 1.5
      expect(result.ftesSobreasignados).toBe(0);
    });

    /**
     * Caso 3: Sin forecast pero con asignaciones (sobreasignado)
     * Forecast: 0 FTE
     * Asignado: 2 FTE
     * Resultado: Cobertura n/a (ratio infinito), revenue asignado $0, sobreasignado 2 FTE
     */
    it('caso 3: sin forecast - forecast 0 FTE, asignado 2 FTE', () => {
      const result = calculateMonthCoverageAny(
        0, // fteForecast
        2, // fteAssigned
        0, // forecastRevenue (no hay forecast)
      );

      expect(result.fteForecast).toBe(0);
      expect(result.fteAssigned).toBe(2);
      expect(result.coverageRatio).toBe(0); // No hay forecast, ratio = 0 por definición
      expect(result.forecastRevenue).toBe(0);
      expect(result.assignedRevenue).toBe(0); // No se puede facturar sin forecast
      expect(result.revenueSinStaffing).toBe(0);
      expect(result.ftesFaltantes).toBe(0); // No faltan si no hay forecast
      expect(result.ftesSobreasignados).toBe(2); // 2 - 0
    });

    /**
     * Caso 4: Sobreasignación (más recursos que forecast)
     * Forecast: 2 FTE @ $5000/FTE = $10,000
     * Asignado: 3 FTE
     * Resultado: Cobertura 150%, revenue asignado $10,000 (capped), sobreasignado 1 FTE
     */
    it('caso 4: sobreasignado - forecast 2 FTE, asignado 3 FTE', () => {
      const result = calculateMonthCoverageAny(
        2, // fteForecast
        3, // fteAssigned
        10000, // forecastRevenue
      );

      expect(result.fteForecast).toBe(2);
      expect(result.fteAssigned).toBe(3);
      expect(result.coverageRatio).toBe(1.5); // 150%
      expect(result.forecastRevenue).toBe(10000);
      expect(result.assignedRevenue).toBe(10000); // Capped at 100% × $10,000
      expect(result.revenueSinStaffing).toBe(0);
      expect(result.ftesFaltantes).toBe(0);
      expect(result.ftesSobreasignados).toBe(1); // 3 - 2
    });

    /**
     * Caso 5: Sin cobertura (0 asignados)
     * Forecast: 2 FTE @ $5000/FTE = $10,000
     * Asignado: 0 FTE
     * Resultado: Cobertura 0%, revenue asignado $0, sin staffing $10,000
     */
    it('caso 5: sin cobertura - forecast 2 FTE, asignado 0 FTE', () => {
      const result = calculateMonthCoverageAny(
        2, // fteForecast
        0, // fteAssigned
        10000, // forecastRevenue
      );

      expect(result.fteForecast).toBe(2);
      expect(result.fteAssigned).toBe(0);
      expect(result.coverageRatio).toBe(0); // 0%
      expect(result.forecastRevenue).toBe(10000);
      expect(result.assignedRevenue).toBe(0);
      expect(result.revenueSinStaffing).toBe(10000);
      expect(result.ftesFaltantes).toBe(2);
      expect(result.ftesSobreasignados).toBe(0);
    });
  });

  describe('determineMonthCoverageStatus', () => {
    it('devuelve CUBIERTO cuando coverageRatio = 1 y forecast > 0', () => {
      expect(determineMonthCoverageStatus(2, 1)).toBe('CUBIERTO');
    });

    it('devuelve PARCIAL cuando 0 < coverageRatio < 1 y forecast > 0', () => {
      expect(determineMonthCoverageStatus(2, 0.75)).toBe('PARCIAL');
      expect(determineMonthCoverageStatus(2, 0.5)).toBe('PARCIAL');
      expect(determineMonthCoverageStatus(2, 0.01)).toBe('PARCIAL');
    });

    it('devuelve SIN_ASIGNAR cuando coverageRatio = 0 y forecast > 0', () => {
      expect(determineMonthCoverageStatus(2, 0)).toBe('SIN_ASIGNAR');
    });

    it('devuelve SOBRE_ASIGNADO cuando coverageRatio > 1', () => {
      expect(determineMonthCoverageStatus(2, 1.5)).toBe('SOBRE_ASIGNADO');
      expect(determineMonthCoverageStatus(2, 2)).toBe('SOBRE_ASIGNADO');
    });

    it('devuelve SOBRE_ASIGNADO cuando forecast = 0 y coverageRatio > 0', () => {
      expect(determineMonthCoverageStatus(0, 2)).toBe('SOBRE_ASIGNADO');
    });

    it('devuelve SIN_ASIGNAR cuando forecast = 0 y coverageRatio = 0', () => {
      expect(determineMonthCoverageStatus(0, 0)).toBe('SIN_ASIGNAR');
    });
  });

  describe('round2', () => {
    it('redondea a 2 decimales correctamente', () => {
      expect(round2(1.234)).toBe(1.23);
      expect(round2(1.235)).toBe(1.24);
      expect(round2(1.999)).toBe(2);
      expect(round2(1)).toBe(1);
    });
  });
});
