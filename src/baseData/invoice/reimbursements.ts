/**
 * @file src/baseData/invoice/reimbursements.ts
 * @description Define las interfaces para el bloque <reembolsos>, utilizado en facturas de reembolso de gastos
 * según el Anexo 5 de la Ficha Técnica del SRI.
 */

/**
 * Representa el detalle de un impuesto dentro de un comprobante de reembolso.
 */
interface DetalleImpuestoReembolso {
  /** Código del impuesto (IVA, ICE, etc.). */
  codigo: string;
  /** Código del porcentaje del impuesto. */
  codigoPorcentaje: string;
  /** Tarifa del impuesto. */
  tarifa: number;
  /** Base imponible para el cálculo del impuesto del reembolso. */
  baseImponibleReembolso: number;
  /** Valor del impuesto del reembolso. */
  impuestoReembolso: number;
}

// Códigos de país de pago al proveedor según Tabla 25 SRI 2.31 (ejemplo: 'ECU' para Ecuador, 'COL' para Colombia, etc.)
export type CodigoPaisSRI = 'ECU' | 'COL' | 'PER' | 'USA' | 'ESP' | string; // Completar según tabla oficial

// Códigos de tipo de proveedor según Tabla 26 SRI 2.31
export type TipoProveedorReembolso = '01' | '02'; // 01 = Relacionado, 02 = No relacionado

// Códigos de tipo de comprobante de reembolso según Catálogo ATS SRI 2.31
export type TipoComprobanteReembolso = '01' | '02' | '03' | '04' | '05' | '06' | '07'; // Completar según catálogo ATS

/**
 * Representa el detalle de un comprobante de reembolso.
 */
export interface ReimbursementDetail {
  /** Tipo de identificación del proveedor del reembolso. */
  tipoIdentificacionProveedorReembolso: string;
  /** Número de identificación del proveedor del reembolso. */
  identificacionProveedorReembolso: string;
  /** Código del país de pago al proveedor (Tabla 25). */
  codPaisPagoProveedorReembolso: CodigoPaisSRI;
  /** Tipo de proveedor (Tabla 26). */
  tipoProveedorReembolso: TipoProveedorReembolso;
  /** Código del tipo de comprobante de reembolso (Catálogo ATS). */
  codDocReembolso: TipoComprobanteReembolso;
  /** Establecimiento del documento de reembolso. */
  estabDocReembolso: string;
  /** Punto de emisión del documento de reembolso. */
  ptoEmiDocReembolso: string;
  /** Secuencial del documento de reembolso. */
  secuencialDocReembolso: string;
  /** Fecha de emisión del documento de reembolso (dd/mm/aaaa). */
  fechaEmisionDocReembolso: string;
  /** Número de autorización del documento de reembolso. */
  numeroautorizacionDocReemb: string;
  /** Detalle de los impuestos del comprobante de reembolso. */
  detalleImpuestos: {
    detalleImpuesto: DetalleImpuestoReembolso[];
  };
}
