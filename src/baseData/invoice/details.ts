/**
 * @file src/baseData/invoice/details.ts
 * @description Define las interfaces para la sección de detalles de un comprobante.
 * VERSIÓN CORREGIDA: Se estandarizan los nombres de las interfaces al inglés para consistencia.
 */

/**
 * Define la estructura para un campo de información adicional dentro de un detalle.
 */
export interface AdditionalDetail {
  nombre: string;
  valor: string;
}

/**
 * Define la estructura para un impuesto aplicado a un detalle específico de la factura.
 */
export interface Tax {
  codigo: string;
  codigoPorcentaje: string;
  tarifa: number;
  baseImponible: number;
  valor: number;
}

/**
 * Define la estructura completa para un detalle (ítem) de la factura.
 */
export interface Detail {
  codigoPrincipal: string;
  codigoAuxiliar?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  precioSinSubsidio?: number;
  descuento: number;
  precioTotalSinImpuesto: number;
  detallesAdicionales?: AdditionalDetail[];
  impuestos: Tax[];
}