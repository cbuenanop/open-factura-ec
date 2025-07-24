/**
 * @file tests/main.ts
 * @description Script de prueba de integración de extremo a extremo para la biblioteca OpenFactura.
 * Este script ejecuta el ciclo de vida completo de una factura electrónica:
 * 1. Carga de datos de una factura de ejemplo.
 * 2. Generación del XML y la Clave de Acceso.
 * 3. Firma digital del XML con un certificado de pruebas.
 * 4. Envío del comprobante al Web Service de Recepción del SRI (ambiente de pruebas).
 * 5. Consulta del estado en el Web Service de Autorización del SRI (ambiente de pruebas).
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateInvoiceXML } from '../src/services/generateInvoice';
import { signXML } from '../src/services/signing';
import { sendSignedXml } from '../src/services/reception';
import { checkAuthorization } from '../src/services/authorization';
import { Invoice } from '../src/baseData/invoice/invoice';

// --- CONFIGURACIÓN DE LA PRUEBA ---
// ¡IMPORTANTE! Debes reemplazar estos valores con los tuyos para que la prueba funcione.
// 1. Coloca tu archivo de certificado de pruebas en una carpeta (ej. 'certs') y actualiza la ruta.
const CERTIFICATE_PATH = path.join(__dirname, '..', 'certs', 'certificado_pruebas.p12');
// 2. Escribe la contraseña de tu certificado.
const CERTIFICATE_PASS = 'tu_contraseña_aqui';
// 3. Utiliza el archivo de datos de ejemplo o crea uno propio.
const INVOICE_DATA_PATH = path.join(__dirname, '..', 'src', 'example', 'invoice-input.json');
// ------------------------------------

/**
 * Función principal asíncrona para ejecutar el flujo de prueba completo.
 */
async function runEndToEndTest() {
  console.log('--- INICIO DE LA PRUEBA DE FACTURACIÓN ELECTRÓNICA ---');

  try {
    // PASO 1: Cargar datos de la factura desde el JSON de entrada
    if (!fs.existsSync(INVOICE_DATA_PATH)) {
      throw new Error(`No se encuentra el archivo de datos de la factura en: ${INVOICE_DATA_PATH}`);
    }
    const invoiceData: Invoice = JSON.parse(fs.readFileSync(INVOICE_DATA_PATH, 'utf-8'));
    console.log('[PASO 1] Datos de la factura cargados correctamente.');

    // PASO 2: Generar el XML sin firmar y la clave de acceso
    const { xml, accessKey } = generateInvoiceXML(invoiceData);
    console.log(`[PASO 2] XML generado con Clave de Acceso: ${accessKey}`);
    fs.writeFileSync(path.join(__dirname, 'factura_generada.xml'), xml);

    // PASO 3: Firmar el XML con el certificado digital
    if (!fs.existsSync(CERTIFICATE_PATH)) {
      throw new Error(`No se encuentra el certificado en: ${CERTIFICATE_PATH}. Por favor, configura la ruta y el nombre del archivo correctamente en tests/main.ts`);
    }
    const signedXml = await signXML(xml, CERTIFICATE_PATH, CERTIFICATE_PASS);
    console.log('[PASO 3] XML firmado digitalmente con éxito.');
    fs.writeFileSync(path.join(__dirname, 'factura_firmada.xml'), signedXml);

    // PASO 4: Enviar el comprobante al SRI (Ambiente de Pruebas)
    console.log('[PASO 4] Enviando comprobante al SRI (ambiente de pruebas)...');
    const receptionResponse = await sendSignedXml(signedXml, '1'); // '1' para ambiente de pruebas
    console.log(`[PASO 4] Respuesta de Recepción del SRI: ${receptionResponse.estado}`);

    // PASO 5: Consultar la autorización después de una pausa prudencial
    console.log('[PASO 5] Esperando 3 segundos antes de consultar la autorización...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log(`[PASO 5] Consultando autorización para la clave ${accessKey}...`);
    const authResponse = await checkAuthorization(accessKey, '1'); // '1' para ambiente de pruebas

    console.log('\n----------------------------------------------------');
    console.log('--- RESULTADO FINAL DE LA AUTORIZACIÓN ---');
    console.log(`Estado: ${authResponse.estado}`);
    console.log(`Número de Autorización: ${authResponse.numeroAutorizacion}`);
    console.log(`Fecha y Hora: ${authResponse.fechaAutorizacion}`);
    console.log('----------------------------------------------------');

    if (authResponse.estado === 'AUTORIZADO' && authResponse.comprobante) {
      fs.writeFileSync(path.join(__dirname, 'factura_autorizada.xml'), authResponse.comprobante);
      console.log('✅ ¡ÉXITO! El comprobante fue autorizado por el SRI.');
      console.log('El XML con la autorización ha sido guardado en: tests/factura_autorizada.xml');
    } else {
       // Este caso no debería ocurrir si el manejo de errores es correcto, pero se incluye por seguridad.
      console.error('❌ ERROR: El comprobante no fue autorizado, pero no se lanzó una excepción. Revisar la lógica.');
    }

  } catch (error: any) {
    console.error('\n--- ❌ !!! OCURRIÓ UN ERROR DURANTE EL PROCESO !!! ---');
    console.error(error.message);
    console.error('---------------------------------------------------------');
  } finally {
    console.log('\n--- PRUEBA DE FACTURACIÓN FINALIZADA ---');
  }
}

runEndToEndTest();
