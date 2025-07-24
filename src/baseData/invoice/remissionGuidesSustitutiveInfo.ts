/**
 * @file src/baseData/invoice/remissionGuidesSustitutiveInfo.ts
 * @description Define las interfaces para la información de una factura que sustituye a una guía de remisión,
 * según el Anexo 9 de la Ficha Técnica del SRI.
 */

/**
 * Representa un destino dentro de la guía de remisión sustitutiva.
 */
export interface Destino {
  /** Motivo del traslado de la mercadería. */
  motivoTraslado: string;
  /** Documento aduanero único (si aplica). */
  docAduaneroUnico?: string;
  /** Código del establecimiento de destino. */
  codEstabDestino: string;
  /** Ruta del traslado. */
  ruta: string;
}

/**
 * Contiene toda la información de la guía de remisión que es sustituida por la factura.
 * Este bloque es requerido para versiones de factura >= 2.0.0.
 */
export interface RemissionGuideSustitutiveInfo {
  /** Dirección del punto de partida de la mercadería. */
  dirPartida: string;
  /** Dirección del destinatario final. */
  dirDestinatario: string;
  /** Fecha de inicio del transporte (formato dd/mm/aaaa). */
  fechaIniTransporte: string;
  /** Fecha de fin del transporte (formato dd/mm/aaaa). */
  fechaFinTransporte: string;
  /** Razón social o nombres y apellidos del transportista. */
  razonSocialTransportista: string;
  /** Tipo de identificación del transportista (RUC, Cédula, etc.). */
  tipoIdentificacionTransportista: string;
  /** Número de identificación del transportista. */
  rucTransportista: string;
  /** Placa del vehículo de transporte. */
  placa: string;
  /** Lista de destinos. */
  destinos: {
    destino: Destino[];
  };
}
