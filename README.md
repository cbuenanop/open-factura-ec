# Open Factura EC

Librería para la generación, firma digital y envío de comprobantes electrónicos válidos ante el SRI de Ecuador.

## Características principales
- Compatible con la ficha técnica SRI 2.31 (abril 2025)
- Generación de XML de comprobantes electrónicos (factura, nota de crédito, etc.)
- Firma digital XAdES-BES (enveloped) usando certificados .p12
- Validación automática de estructura, catálogos y campos obligatorios
- Comunicación con los servicios de recepción y autorización del SRI
- Pruebas automáticas de extremo a extremo

---

## 📦 Instalación

```bash
npm install open-factura-ec
```

---

## Requisitos
- Node.js >= 16
- Certificado digital en formato .p12 (PKCS#12) válido para el SRI
- Dependencias instaladas (`npm install`)

## Ejemplo de uso básico
```js
const { generateInvoiceXML, signXML } = require('open-factura-ec');
const fs = require('fs');

// 1. Cargar los datos de la factura (ver src/example/invoice-input.json)
const invoiceData = require('./src/example/invoice-input.json');

// 2. Generar el XML y la clave de acceso
const { xml, accessKey } = generateInvoiceXML(invoiceData, '12345678');

// 3. Firmar el XML
const signedXml = await signXML(xml, './certs/certificado_pruebas.p12', 'tu_contraseña');

// 4. Guardar el XML firmado
fs.writeFileSync('factura_firmada.xml', signedXml);
```

## Pruebas automáticas
Ejecuta:
```sh
npm test
```
Esto compila la librería, ejecuta el flujo completo y valida la autorización ante el SRI (ambiente de pruebas).

## Certificados
- El certificado debe ser .p12 válido, emitido por una autoridad reconocida (ej. Security Data).
- No es necesario convertir manualmente la clave si el certificado es moderno y compatible con el SRI.

## Notas
- El comprobante debe tener datos válidos (RUC, cédula, etc.) para ser autorizado por el SRI.
- Si el emisor no es agente de retención, no incluyas el campo `<agenteRetencion>`.

## Licencia
MIT
