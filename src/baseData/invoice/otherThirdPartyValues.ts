/**
 * @file src/baseData/invoice/otherThirdPartyValues.ts
 * @description Define las interfaces para la sección de "Otros Rubros de Terceros",
 * según el Anexo 8 de la Ficha Técnica del SRI.
 */

/**
 * Representa un rubro individual que corresponde a un valor de un tercero.
 */
export interface Rubro {
  /** Descripción del concepto del rubro. */
  concepto: string;
  /** Valor total del rubro. */
  total: number;
}

/**
 * Contiene la lista de rubros de terceros.
 * Este bloque es requerido para versiones de factura >= 2.0.0.
 */
export interface OtherThirdPartyValues {
  rubro: Rubro[];
}
