/**
 * @file src/baseData/invoice/taxInfo.ts
 * @description Define las interfaces para la información tributaria y los totales de impuestos.
 * VERSIÓN CORREGIDA: Se añade la interfaz 'TotalTax' que faltaba para resolver el error de compilación.
 */

// Tipos para los códigos de ambiente y tipo de emisión según Tablas 4 y 2 de la Ficha Técnica.
export type Ambiente = '1' | '2'; // 1 = Pruebas, 2 = Producción
export type TipoEmision = '1'; // 1 = Emisión Normal (única para Offline)

// Códigos de tipo de comprobante según Tabla 1 de la Ficha Técnica SRI 2.31.
export type TipoComprobante =
  | '01' // Factura
  | '03' // Liquidación de compra
  | '04' // Nota de crédito
  | '05' // Nota de débito
  | '06' // Guía de remisión
  | '07' // Comprobante de retención
  // Agrega aquí otros códigos si la ficha técnica 2.31 los incluye
;

// Códigos de impuestos según Tablas 18, 19, 20 de la Ficha Técnica SRI 2.31.
// Ejemplo:
// '2' = IVA, '3' = ICE, '5' = IRBPNR
// Códigos de porcentaje: '0', '2', '3', '6', '7', '8', '9', '10', '12', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '30', '35', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'

/**
 * Representa el bloque <infoTributaria> del XML.
 * Contiene la información fiscal del emisor del comprobante.
 */
export interface TaxInfo {
  /** Ambiente de la transacción (Pruebas o Producción). */
  ambiente: Ambiente;
  /** Tipo de emisión del comprobante. */
  tipoEmision: TipoEmision;
  /** Razón social del emisor. */
  razonSocial: string;
  /** Nombre comercial del emisor (opcional). */
  nombreComercial?: string;
  /** Número de RUC del emisor (13 dígitos). */
  ruc: string;
  /** Clave de acceso del comprobante (49 dígitos). */
  claveAcceso: string;
  /** Código del tipo de documento (ej: '01' para factura). */
  codDoc: string;
  /** Código del establecimiento (ej: '001'). */
  estab: string;
  /** Código del punto de emisión (ej: '001'). */
  ptoEmi: string;
  /** Número secuencial del comprobante (9 dígitos). */
  secuencial: string;
  /** Dirección de la matriz del emisor. */
  dirMatriz: string;
  /**
   * (Opcional) Número de resolución de Agente de Retención.
   * Requerido según Anexo 21.
   */
  agenteRetencion?: string;
  /**
   * (Opcional) Leyenda para contribuyentes en Régimen RIMPE.
   * Requerido según Anexo 22.
   * Usar "CONTRIBUYENTE RÉGIMEN RIMPE" o "CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE".
   */
  contribuyenteRimpe?: string;
}

/**
 * Define la estructura para el desglose de un total de impuesto en la cabecera de la factura.
 * Representa un nodo <totalImpuesto> dentro de <totalConImpuestos>.
 */
export interface TotalTax {
  codigo: string;
  codigoPorcentaje: string;
  baseImponible: number;
  valor: number;
}