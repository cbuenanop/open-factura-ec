/**
 * @file src/baseData/invoice/additionalInfo.ts
 * @description Define la interfaz para el bloque <infoAdicional>, que permite
 * añadir campos personalizados a la factura.
 */

/**
 * Representa un campo de información adicional.
 */
export interface CampoAdicional {
  /** Atributo 'nombre' del campo. */
  nombre: string;
  /** Valor del campo. */
  valor: string;
}

/**
 * Contiene la lista de campos adicionales.
 */
export interface AdditionalInfo {
  campos: CampoAdicional[];
}
