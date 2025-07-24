/**
 * @file src/services/authorization.ts
 * @description Módulo para consultar el estado de autorización de un comprobante en el Web Service del SRI.
 * Construye la solicitud SOAP, la envía y parsea la respuesta para obtener el estado final
 * del comprobante ('AUTORIZADO' o 'NO AUTORIZADO').
 */

import axios from 'axios';
import { DOMParser } from 'xmldom';
import { Ambiente } from '../baseData/invoice/taxInfo';
import { SriError } from './reception'; // Reutilizamos la interfaz de error

// Endpoints del SRI según la Ficha Técnica (Sección 7.2)
const authorizationEndpoints = {
  pruebas: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
  produccion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
};

/**
 * Define la estructura de la respuesta de autorización del SRI para un comprobante.
 */
export interface Autorizacion {
  estado: 'AUTORIZADO' | 'NO AUTORIZADO';
  numeroAutorizacion: string | null;
  fechaAutorizacion: string | null;
  ambiente: string | null;
  comprobante: string | null; // El XML completo con la autorización incrustada
  mensajes?: SriError[];
}

/**
 * Consulta el estado de autorización de un comprobante electrónico en el SRI.
 *
 * @param accessKey La clave de acceso de 49 dígitos del comprobante a consultar.
 * @param ambiente El ambiente donde se realizó la emisión ('1' para pruebas, '2' para producción).
 * @returns Una promesa que se resuelve con la información de la autorización del SRI.
 * @throws Un error descriptivo si el estado es 'NO AUTORIZADO', si el comprobante no se encuentra, o si ocurre un problema de comunicación.
 */
export async function checkAuthorization(accessKey: string, ambiente: Ambiente): Promise<Autorizacion> {
  const endpoint = ambiente === '1' ? authorizationEndpoints.pruebas : authorizationEndpoints.produccion;

  const soapEnvelope = `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
      <soap:Header/>
      <soap:Body>
        <ec:autorizacionComprobante>
          <claveAccesoComprobante>${accessKey}</claveAccesoComprobante>
        </ec:autorizacionComprobante>
      </soap:Body>
    </soap:Envelope>
  `;

  try {
    const response = await axios.post(endpoint, soapEnvelope, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8', 'SOAPAction': '' }
    });

    // Parsear la respuesta SOAP usando xmldom
    const doc = new DOMParser().parseFromString(response.data, 'text/xml');
    const autorizacionNode = doc.getElementsByTagName('autorizacion')[0];

    // Manejo de caso donde el comprobante aún no se procesa
    if (!autorizacionNode) {
      const nroComprobantes = doc.getElementsByTagName('numeroComprobantes')[0]?.textContent;
      if (nroComprobantes === '0') {
        throw new Error(`El comprobante con clave ${accessKey} aún no ha sido procesado por el SRI. Intente de nuevo más tarde.`);
      }
      throw new Error('Respuesta inválida del SRI (Autorización): No se encontró el nodo "autorizacion".');
    }

    const estado = autorizacionNode.getElementsByTagName('estado')[0]?.textContent as 'AUTORIZADO' | 'NO AUTORIZADO';
    
    const mensajesNodes = autorizacionNode.getElementsByTagName('mensaje');
    const mensajes: SriError[] = Array.from(mensajesNodes).map(node => ({
        identificador: node.getElementsByTagName('identificador')[0]?.textContent || null,
        mensaje: node.getElementsByTagName('mensaje')[0]?.textContent || null,
        informacionAdicional: node.getElementsByTagName('informacionAdicional')[0]?.textContent || null,
        tipo: node.getElementsByTagName('tipo')[0]?.textContent || null,
    }));

    // Si el estado es NO AUTORIZADO, se lanza un error con los detalles
    if (estado === 'NO AUTORIZADO') {
      const errorDetails = mensajes.map(e => `  - [${e.identificador}] ${e.mensaje} ${e.informacionAdicional || ''}`).join('\n');
      throw new Error(`El SRI no autorizó el comprobante con clave ${accessKey}:\n${errorDetails}`);
    }

    // Construcción del objeto de respuesta exitosa
    return {
        estado,
        numeroAutorizacion: autorizacionNode.getElementsByTagName('numeroAutorizacion')[0]?.textContent || null,
        fechaAutorizacion: autorizacionNode.getElementsByTagName('fechaAutorizacion')[0]?.textContent || null,
        ambiente: autorizacionNode.getElementsByTagName('ambiente')[0]?.textContent || null,
        comprobante: autorizacionNode.getElementsByTagName('comprobante')[0]?.textContent || null,
        mensajes
    };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const faultString = error.response?.data?.match(/<faultstring>(.*?)<\/faultstring>/)?.[1];
      const detail = faultString ? `\nDetalle del SRI: ${faultString}` : '';
      throw new Error(`Error en la comunicación con el SRI (Autorización): ${error.message}${detail}`);
    }
    // Re-lanzar el error si ya es descriptivo (ej. el de 'NO AUTORIZADO') o uno inesperado
    throw error;
  }
}
