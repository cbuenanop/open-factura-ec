/**
 * @file src/services/signing.ts
 * @description Módulo para firmar un documento XML con un certificado digital P12,
 * cumpliendo con el estándar XAdES-BES requerido por el SRI de Ecuador.
 */

import { SignedXml, Application } from 'xadesjs';
import { DOMParser } from 'xmldom';
import { Crypto } from '@peculiar/webcrypto';
import * as fs from 'fs';
import * as forge from 'node-forge';

/**
 * Firma un documento XML utilizando un certificado digital en formato P12/PFX.
 * La firma generada cumple con el estándar XAdES-BES requerido por el SRI.
 *
 * @param xmlToSign El string del XML del comprobante electrónico a firmar.
 * @param certificatePath La ruta al archivo del certificado digital en formato .p12 o .pfx.
 * @param certificatePassword La contraseña para acceder al certificado digital.
 * @returns Una promesa que se resuelve con el string del XML firmado digitalmente.
 * @throws Un error si la ruta del certificado es inválida, la contraseña es incorrecta,
 * o si ocurre cualquier otro problema durante el proceso de firma.
 */
export async function signXML(
  xmlToSign: string,
  certificatePath: string,
  certificatePassword: string
): Promise<string> {
  if (!fs.existsSync(certificatePath)) {
    throw new Error(`El archivo del certificado no se encontró en la ruta: ${certificatePath}`);
  }

  try {
    // 1. Leer y parsear el .p12 con node-forge
    const p12Buffer = fs.readFileSync(certificatePath);
    const p12Der = forge.util.createBuffer(p12Buffer.toString('binary'));
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certificatePassword);

    // 2. Extraer clave privada y certificado SOLO de los bags PKCS#8 y certBag
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

    const certBagArray = certBags[forge.pki.oids.certBag];
    const keyBagArray = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

    if (!certBagArray || certBagArray.length === 0) {
      throw new Error('No se encontró un certificado digital en el archivo P12.');
    }
    if (!keyBagArray || keyBagArray.length === 0) {
      throw new Error('No se encontró una clave privada en formato PKCS#8 en el archivo P12. Si su certificado es antiguo, conviértalo a PKCS#8 usando OpenSSL.');
    }

    const certificateObj = certBagArray[0].cert;
    let privateKeyObj = keyBagArray[0].key;
    // Log para inspeccionar el tipo y contenido de la clave privada
    console.log('DEBUG typeof privateKeyObj:', typeof privateKeyObj);
    console.log('DEBUG privateKeyObj:', privateKeyObj);
    if (!privateKeyObj) {
      // Intentar extraer la clave de keyBag (PKCS#1) como fallback
      const altKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
      const altKeyBagArray = altKeyBags[forge.pki.oids.keyBag];
      if (altKeyBagArray && altKeyBagArray.length > 0) {
        privateKeyObj = altKeyBagArray[0].key;
        console.log('DEBUG Fallback keyBag[0].key:', privateKeyObj);
      }
    }
    if (!certificateObj) throw new Error('No se pudo extraer el certificado del bag.');
    if (!privateKeyObj) throw new Error('No se pudo extraer la clave privada del bag ni del fallback.');

    // 3. Convertir el objeto key a PKCS#8 DER y luego a Uint8Array (flujo robusto)
    const rsaAsn1 = forge.pki.privateKeyToAsn1(privateKeyObj);
    const pkcs8Asn1 = forge.pki.wrapRsaPrivateKey(rsaAsn1);
    const pkcs8DerBytes = forge.asn1.toDer(pkcs8Asn1).getBytes();
    const privateKeyUint8 = binaryStringToUint8Array(pkcs8DerBytes);
    // 4. Importar la clave privada a WebCrypto
    const crypto = new Crypto();
    Application.setEngine('NodeJS', crypto);
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyUint8,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: 'SHA-256' }
      },
      false,
      ['sign']
    );

    // 5. Parsear el XML a firmar
    const doc = new DOMParser().parseFromString(xmlToSign, 'text/xml');

    // 4. Codificar el certificado en DER y luego a base64 puro
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificateObj)).getBytes();
    const certBase64 = Buffer.from(certDer, 'binary').toString('base64');

    // 6. Firmar usando SignedXml (XAdES-BES)
    const signedXml = new SignedXml();
    await signedXml.Sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      privateKey,
      doc,
      {
        references: [
          {
            hash: 'SHA-256',
            transforms: ['enveloped', 'c14n'],
            uri: '#comprobante'
          }
        ],
        x509: [certBase64]
      }
    );

    // 7. Obtener el nodo de la firma y añadirlo al documento original
    const signatureNode = signedXml.GetXml();
    if (!signatureNode) throw new Error('No se pudo obtener el nodo de la firma.');
    doc.documentElement.appendChild(signatureNode);
    // 8. Serializar y devolver el documento XML firmado completo
    return doc.toString();
  } catch (error: any) {
    if (error.message && error.message.toLowerCase().includes('mac verify')) {
      throw new Error('La contraseña del certificado es incorrecta o el archivo P12 está dañado.');
    }
    console.error('Ocurrió un error inesperado durante la firma del XML:', error);
    throw new Error(`Fallo en el proceso de firma: ${error.message}`);
  }
}

// Convierte un string binario a Uint8Array
function binaryStringToUint8Array(binary: string): Uint8Array {
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
