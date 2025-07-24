/**
 * @file src/index.ts
 * @description Punto de entrada principal de la librería OpenFactura.
 * VERSIÓN FINAL: Se corrigen las importaciones y se refina la clase principal.
 */

import { Invoice } from './baseData/invoice/invoice';
import { generateInvoiceXML } from './services/generateInvoice';
import { signXML } from './services/signing'; // CORREGIDO: de signXml a signXML
import { sendSignedXml, ReceptionResponse } from './services/reception';
import { checkAuthorization, Autorizacion } from './services/authorization'; // CORREGIDO: de AuthorizationResponse a Autorizacion
import { Ambiente } from './baseData/invoice/taxInfo';

/**
 * Configuración inicial para la clase OpenFactura.
 */
export interface OpenFacturaConfig {
  /** Ruta al archivo del certificado digital (.p12). */
  p12Path: string;
  /** Contraseña del certificado digital. */
  p12Password: string;
  /** Ambiente de la transacción ('1' para Pruebas, '2' para Producción). */
  ambiente: Ambiente;
}

/**
 * Clase principal que orquesta el proceso de facturación electrónica.
 */
export class OpenFactura {
  private config: OpenFacturaConfig;

  constructor(config: OpenFacturaConfig) {
    if (!config.p12Path || !config.p12Password || !config.ambiente) {
      throw new Error("La configuración debe incluir p12Path, p12Password y ambiente.");
    }
    this.config = config;
  }

  /**
   * Paso 1: Crea el XML, genera la clave de acceso y firma el comprobante.
   *
   * @param invoiceData - El objeto completo de la factura.
   * @param codigoNumerico - Un código aleatorio de 8 dígitos para la clave de acceso.
   * @returns Un objeto con la clave de acceso generada y el XML firmado.
   */
  public async createAndSignInvoice(invoiceData: Invoice, codigoNumerico: string): Promise<{ accessKey: string; signedXml: string }> {
    invoiceData.infoTributaria.ambiente = this.config.ambiente;

    // CORRECCIÓN: Se llama a generateInvoiceXML que ahora devuelve tanto el xml como la clave de acceso.
    // Esto asegura que la clave de acceso siempre sea consistente con el XML generado.
    const { xml: unsignedXml, accessKey } = generateInvoiceXML(invoiceData, codigoNumerico);

    // Se pasa el 'unsignedXml' (string) a la función de firma corregida 'signXML'.
    const signedXml = await signXML(unsignedXml, this.config.p12Path, this.config.p12Password);

    return { accessKey, signedXml };
  }

  /**
   * Paso 2: Envía el XML firmado al SRI.
   *
   * @param signedXml - El XML firmado obtenido del paso anterior.
   * @returns La respuesta del servicio de recepción del SRI.
   */
  public async sendInvoice(signedXml: string): Promise<ReceptionResponse> {
    return await sendSignedXml(signedXml, this.config.ambiente);
  }

  /**
   * Paso 3: Consulta la autorización del comprobante en el SRI.
   *
   * @param accessKey - La clave de acceso del comprobante.
   * @returns La respuesta del servicio de autorización del SRI.
   */
  public async authorizeInvoice(accessKey: string): Promise<Autorizacion> {
    return await checkAuthorization(accessKey, this.config.ambiente);
  }
}

// Exportar todos los tipos de datos para una mejor experiencia de desarrollo.
export * from './baseData/invoice/invoice';
export * from './baseData/invoice/taxInfo';
export * from './baseData/invoice/invoiceInfo';
export * from './baseData/invoice/details';
export * from './baseData/invoice/additionalInfo';
export * from './baseData/invoice/reimbursements';
export * from './baseData/invoice/remissionGuidesSustitutiveInfo';
export * from './baseData/invoice/retentions';
export * from './baseData/invoice/otherThirdPartyValues';
export * from './services/reception';
export * from './services/authorization';
export { generateInvoiceXML } from './services/generateInvoice';
export { signXML } from './services/signing';