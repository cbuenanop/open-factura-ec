/**
 * @file src/services/reception.ts
 * @description Servicio para enviar un comprobante electrónico firmado al Web Service de Recepción del SRI.
 */

import axios from 'axios';
import { DOMParser } from 'xmldom';
import { Ambiente } from '../baseData/invoice/taxInfo';

const receptionEndpoints = {
  pruebas: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
  produccion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl'
};

export interface SriError {
  identificador: string | null;
  mensaje: string | null;
  informacionAdicional?: string | null;
  tipo: string | null;
}

export interface ReceptionResponse {
  estado: 'RECIBIDA' | 'DEVUELTA';
}

/**
 * Envía un comprobante electrónico firmado al Web Service de Recepción del SRI.
 *
 * @param signedXml El string del XML del comprobante ya firmado digitalmente.
 * @param ambiente El ambiente de destino para la solicitud ('1' para pruebas, '2' para producción).
 * @returns Una promesa que se resuelve con un objeto `ReceptionResponse`.
 * @throws Un error si el comprobante es 'DEVUELTA' o si ocurre un problema de comunicación.
 */
export async function sendSignedXml(signedXml: string, ambiente: Ambiente): Promise<ReceptionResponse> {
  const endpoint = ambiente === '1' ? receptionEndpoints.pruebas : receptionEndpoints.produccion;
  const xmlBase64 = Buffer.from(signedXml).toString('base64');

  const soapEnvelope = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
      <soapenv:Header/>
      <soapenv:Body>
        <ec:validarComprobante>
          <xml>${xmlBase64}</xml>
        </ec:validarComprobante>
      </soapenv:Body>
    </soapenv:Envelope>
  `;

  try {
    const response = await axios.post(endpoint, soapEnvelope, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8', 'SOAPAction': '' }
    });

    const doc = new DOMParser().parseFromString(response.data, 'text/xml');
    const estadoNode = doc.getElementsByTagName('estado')[0];

    if (!estadoNode) {
      throw new Error('Respuesta inválida del SRI (Recepción): No se encontró el campo "estado".');
    }

    const estado = estadoNode.textContent as 'RECIBIDA' | 'DEVUELTA';

    if (estado === 'DEVUELTA') {
      const mensajesNodes = doc.getElementsByTagName('mensaje');
      const errores: SriError[] = Array.from(mensajesNodes).map(node => ({
        identificador: node.getElementsByTagName('identificador')[0]?.textContent || null,
        mensaje: node.getElementsByTagName('mensaje')[0]?.textContent || null,
        informacionAdicional: node.getElementsByTagName('informacionAdicional')[0]?.textContent || null,
        tipo: node.getElementsByTagName('tipo')[0]?.textContent || null,
      }));
      
      const errorDetails = errores.map(e => `  - [${e.identificador}] ${e.mensaje} ${e.informacionAdicional || ''}`).join('\n');
      throw new Error(`El SRI devolvió el comprobante con los siguientes errores:\n${errorDetails}`);
    }

    return { estado };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const faultString = error.response?.data?.match(/<faultstring>(.*?)<\/faultstring>/)?.[1];
      const detail = faultString ? `\nDetalle del SRI: ${faultString}` : '';
      throw new Error(`Error en la comunicación con el SRI (Recepción): ${error.message}${detail}`);
    }
    // Re-lanzar el error si ya es descriptivo (ej. el de 'DEVUELTA') o uno inesperado
    throw error;
  }
}
