/**
 * @file src/baseData/invoice/invoiceInfo.ts
 * @description Define la interfaz para el bloque <infoFactura>, que contiene los
 * datos del comprador, los totales y las formas de pago.
 */

import { TotalTax } from './taxInfo';

// Códigos de tipo de identificación del comprador según Tabla 6 de la Ficha Técnica SRI 2.31.
export type TipoIdentificacionComprador =
  | '04' // RUC
  | '05' // Cédula
  | '06' // Pasaporte
  | '07' // Consumidor Final
  | '08' // Identificación del Exterior
  | '09' // Identificación del Exterior (NUEVO, si aplica en SRI 2.31)
  // Agrega aquí otros códigos si la ficha técnica 2.31 los incluye
;

// Códigos de formas de pago según Tabla 24 de la Ficha Técnica SRI 2.31.
export type FormaPago =
  | '01' // SIN UTILIZACION DEL SISTEMA FINANCIERO
  | '15' // COMPENSACIÓN DE DEUDAS
  | '16' // TARJETA DE DÉBITO
  | '17' // DINERO ELECTRÓNICO
  | '18' // TARJETA PREPAGO
  | '19' // TARJETA DE CRÉDITO
  | '20' // OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO
  | '21' // ENDOSO DE TÍTULOS
  | '22' // TRANSFERENCIA BANCARIA (si aplica en SRI 2.31)
  | '23' // CHEQUE (si aplica en SRI 2.31)
  | '24' // GIRO (si aplica en SRI 2.31)
  // Agrega aquí otros códigos si la ficha técnica 2.31 los incluye
;

/**
 * Representa una forma de pago específica.
 */
export interface Pago {
  /** Código de la forma de pago. */
  formaPago: FormaPago;
  /** Monto total pagado con esta forma. */
  total: number;
  /** Plazo para el pago (si aplica). */
  plazo?: number;
  /** Unidad de tiempo para el plazo (ej: 'dias'). */
  unidadTiempo?: string;
}

/**
 * Representa el bloque <infoFactura> del XML.
 */
export interface InvoiceInfo {
  /** Fecha de emisión del comprobante (formato dd/mm/aaaa). */
  fechaEmision: string;
  /** Dirección del establecimiento emisor. */
  dirEstablecimiento: string;
  /** Número de resolución de Contribuyente Especial (si aplica). */
  contribuyenteEspecial?: string;
  /** Indica si el emisor está obligado a llevar contabilidad ('SI' o 'NO'). */
  obligadoContabilidad: 'SI' | 'NO';
  /** Tipo de identificación del comprador. */
  tipoIdentificacionComprador: TipoIdentificacionComprador;
  /** Razón social o nombres y apellidos del comprador. */
  razonSocialComprador: string;
  /** Número de identificación del comprador. */
  identificacionComprador: string;
  /** Dirección del comprador (obligatorio para Factura Comercial Negociable). */
  direccionComprador?: string;
  /** Suma de todos los `precioTotalSinImpuesto` de los detalles. */
  totalSinImpuestos: number;
  /** Suma de todos los `descuento` de los detalles. */
  totalDescuento: number;
  /**
   * (Opcional) Suma de los subsidios aplicados.
   * Requerido para facturas con subsidios (Anexo 6).
   */
  totalSubsidio?: number;
  /**
   * (Opcional) Código del documento de reembolso ('41').
   * Requerido para facturas de reembolso (Anexo 5).
   */
  codDocReembolso?: string;
  /** (Opcional) Suma total de los comprobantes de reembolso. */
  totalComprobantesReembolso?: number;
  /** (Opcional) Suma de las bases imponibles de los comprobantes de reembolso. */
  totalBaseImponibleReembolso?: number;
  /** (Opcional) Suma de los impuestos de los comprobantes de reembolso. */
  totalImpuestoReembolso?: number;
  /** Bloque <totalConImpuestos>: Lista con la totalización de cada tipo de impuesto. */
  totalConImpuestos: TotalTax[];
  /** Propina (si aplica). */
  propina: number;
  /** Valor total de la factura. */
  importeTotal: number;
  /** Moneda de la transacción (ej: 'DOLAR'). */
  moneda: string;
  /**
   * (Opcional) Placa del vehículo.
   * Requerido para venta de combustibles (Anexo 12).
   */
  placa?: string;
  /** Bloque <pagos>: Lista de las formas de pago utilizadas. */
  pagos: Pago[];
}
