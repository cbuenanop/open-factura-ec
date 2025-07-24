/**
 * @file src/baseData/invoice/invoice.ts
 * @description Define la estructura principal completa de una factura electrónica, soportando múltiples versiones
 * del esquema del SRI y los nuevos campos requeridos por la normativa.
 */

import { AdditionalInfo } from './additionalInfo';
import { Detail } from './details';
import { InvoiceInfo } from './invoiceInfo';
import { OtherThirdPartyValues } from './otherThirdPartyValues';
import { ReimbursementDetail } from './reimbursements';
import { RemissionGuideSustitutiveInfo } from './remissionGuidesSustitutiveInfo';
import { RetentionInInvoice } from './retentions'; // <--- IMPORTADO
import { TaxInfo } from './taxInfo';

// Definimos las versiones de esquema de factura soportadas según la Ficha Técnica.
export type InvoiceVersion = '1.0.0' | '1.1.0' | '2.0.0' | '2.1.0';

/**
 * Representa el objeto completo de una factura electrónica.
 * Esta estructura está diseñada para ser completa y flexible, cubriendo todos los
 * escenarios descritos en la Ficha Técnica del SRI.
 */
export interface Invoice {
  /**
   * Versión del formato del comprobante electrónico. Determina los campos y estructura del XML.
   * - '1.0.0': Versión base.
   * - '1.1.0': Admite hasta 6 decimales en cantidad y precio unitario.
   * - '2.0.0': Introduce campos para "Rubros de Terceros" y "Factura Sustitutiva".
   * - '2.1.0': Admite 6 decimales y los nuevos campos de la v2.0.0.
   */
  version: InvoiceVersion;

  /** Bloque <infoTributaria>: Información tributaria del emisor. */
  infoTributaria: TaxInfo;

  /** Bloque <infoFactura>: Información específica de la factura (fechas, comprador, totales). */
  infoFactura: InvoiceInfo;

  /** Bloque <detalles>: Lista de detalles (productos o servicios) de la factura. */
  detalles: Detail[];

  /**
   * (Opcional) Bloque <retenciones>: Información sobre retenciones presuntivas aplicadas en la misma factura.
   * Requerido para casos especiales como la venta de combustibles (Anexo 3).
   */
  retenciones?: {
    retencion: RetentionInInvoice[];
  };

  /** Bloque <reembolsos>: Información sobre reembolsos de gastos (si aplica, Anexo 5). */
  reembolsos?: {
    reembolsoDetalle: ReimbursementDetail[];
  };

  /** Bloque <infoSustitutivaGuiaRemision>: Información para facturas que sustituyen a una guía de remisión (versiones >= 2.0.0, Anexo 9). */
  infoSustitutivaGuiaRemision?: RemissionGuideSustitutiveInfo;

  /** Bloque <otrosRubrosTerceros>: Rubros correspondientes a valores de terceros (versiones >= 2.0.0, Anexo 8). */
  otrosRubrosTerceros?: OtherThirdPartyValues;

  /** Bloque <infoAdicional>: Campos adicionales para información extra en la factura. */
  infoAdicional?: AdditionalInfo;
}
