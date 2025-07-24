/**
 * @file src/baseData/invoice/retentions.ts
 * @description Define las interfaces para el bloque <retenciones> que puede ser incluido
 * dentro de una factura para casos especiales como retenciones presuntivas (ej. venta de combustibles),
 * según la Ficha Técnica del SRI (Anexo 3, versión 1.1.0).
 */

/**
 * Código del impuesto a retener dentro de una factura.
 * Según la Ficha Técnica, para retenciones presuntivas en facturas de combustibles, se usa el código '4'.
 */
export type RetentionCodeInInvoice = '4'; // Agrega otros códigos si la ficha técnica 2.31 los incluye
// Ejemplo de códigos de porcentaje: '327' para 2 por mil, etc. Documentar aquí si es necesario

/**
 * Representa una retención individual dentro del bloque <retenciones> de una factura.
 */
export interface RetentionInInvoice {
  /** Código del impuesto a retener. */
  codigo: RetentionCodeInInvoice;
  /** Código del porcentaje de retención (ej: '327' para 2 por mil). */
  codigoPorcentaje: string;
  /** El valor porcentual de la retención (ej: 0.20). */
  tarifa: number;
  /** Monto de la retención calculada. */
  valor: number;
}
