/**
 * @file src/services/generateInvoice.ts
 * @description Servicio para generar el archivo XML de una factura electrónica y su clave de acceso.
 * VERSIÓN DEFINITIVA: Esta función ahora genera la clave de acceso para garantizar la consistencia del documento.
 */

import { create } from 'xmlbuilder2';
import { Invoice } from '../baseData/invoice/invoice';
import { AdditionalDetail } from '../baseData/invoice/details';
import { getAccessKey } from '../utils/utils';

/**
 * Función auxiliar para añadir detalles adicionales a un nodo XML si existen.
 * @param parentNode El nodo XML padre (ej: 'detalle').
 * @param additionalDetails El array de detalles adicionales.
 */
function addAdditionalDetails(parentNode: any, additionalDetails: AdditionalDetail[] | undefined) {
  if (additionalDetails && additionalDetails.length > 0) {
    const detallesAdicionalesNode = parentNode.ele('detallesAdicionales');
    additionalDetails.forEach((detail) => {
      detallesAdicionalesNode.ele('detAdicional', { nombre: detail.nombre, valor: detail.valor });
    });
  }
}

/**
 * Genera una representación XML completa y funcional de la factura electrónica.
 * Esta función también genera la clave de acceso para asegurar la integridad del comprobante.
 *
 * @param invoice El objeto de la factura que contiene todos los datos.
 * @param codigoNumerico Un código de 8 dígitos, potestad del emisor, para la clave de acceso. (Obligatorio, string de 8 dígitos)
 * @returns Un objeto con el XML de la factura y la clave de acceso generada.
 */
export function generateInvoiceXML(invoice: Invoice, codigoNumerico: string): { xml: string; accessKey: string } {
  // VALIDACIÓN DEL CÓDIGO NUMÉRICO
  if (!codigoNumerico || typeof codigoNumerico !== 'string' || !/^[0-9]{8}$/.test(codigoNumerico)) {
    throw new Error('El código numérico debe ser un string de 8 dígitos numéricos. Ejemplo: "12345678"');
  }
  // VALIDACIONES SRI 2.31
  // 1. Validar presencia de campos obligatorios
  if (!invoice.infoTributaria || !invoice.infoFactura || !invoice.detalles || invoice.detalles.length === 0) {
    throw new Error('Faltan bloques obligatorios: infoTributaria, infoFactura o detalles.');
  }
  // 2. Validar totales
  const sumaPagos = invoice.infoFactura.pagos.reduce((acc, pago) => acc + pago.total, 0);
  if (Math.abs(sumaPagos - invoice.infoFactura.importeTotal) > 0.01) {
    throw new Error('La suma de los pagos no coincide con el importe total de la factura.');
  }
  const sumaDetalles = invoice.detalles.reduce((acc, det) => acc + det.precioTotalSinImpuesto, 0);
  if (Math.abs(sumaDetalles - invoice.infoFactura.totalSinImpuestos) > 0.01) {
    throw new Error('La suma de los precios totales sin impuesto de los detalles no coincide con el totalSinImpuestos.');
  }
  // 3. Validar campos opcionales según contexto
  if (invoice.infoFactura.placa && invoice.infoTributaria.codDoc !== '01') {
    throw new Error('El campo placa solo debe usarse en facturas de combustibles (codDoc = 01).');
  }
  if (invoice.reembolsos && !invoice.infoFactura.codDocReembolso) {
    throw new Error('Si hay reembolsos, debe estar presente codDocReembolso en infoFactura.');
  }
  if (invoice.infoSustitutivaGuiaRemision && !['2.0.0', '2.1.0'].includes(invoice.version)) {
    throw new Error('El bloque infoSustitutivaGuiaRemision solo es válido para versiones >= 2.0.0.');
  }
  if (invoice.otrosRubrosTerceros && !['2.0.0', '2.1.0'].includes(invoice.version)) {
    throw new Error('El bloque otrosRubrosTerceros solo es válido para versiones >= 2.0.0.');
  }

  // 1. Generar la Clave de Acceso internamente para garantizar consistencia
  const accessKey = getAccessKey({
    date: invoice.infoFactura.fechaEmision,
    voucherType: invoice.infoTributaria.codDoc,
    ruc: invoice.infoTributaria.ruc,
    environment: invoice.infoTributaria.ambiente,
    series: `${invoice.infoTributaria.estab}${invoice.infoTributaria.ptoEmi}`,
    sequence: invoice.infoTributaria.secuencial,
    numericCode: codigoNumerico,
    emissionType: invoice.infoTributaria.tipoEmision,
  });

  // 2. Construir el XML
  const xml = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('factura', { id: 'comprobante', version: invoice.version });

  // Bloque <infoTributaria>
  const infoTributaria = xml.ele('infoTributaria');
  infoTributaria.ele('ambiente').txt(invoice.infoTributaria.ambiente);
  infoTributaria.ele('tipoEmision').txt(invoice.infoTributaria.tipoEmision);
  infoTributaria.ele('razonSocial').txt(invoice.infoTributaria.razonSocial);
  if (invoice.infoTributaria.nombreComercial) {
    infoTributaria.ele('nombreComercial').txt(invoice.infoTributaria.nombreComercial);
  }
  infoTributaria.ele('ruc').txt(invoice.infoTributaria.ruc);
  infoTributaria.ele('claveAcceso').txt(accessKey); // Usar la clave generada
  infoTributaria.ele('codDoc').txt(invoice.infoTributaria.codDoc);
  infoTributaria.ele('estab').txt(invoice.infoTributaria.estab);
  infoTributaria.ele('ptoEmi').txt(invoice.infoTributaria.ptoEmi);
  infoTributaria.ele('secuencial').txt(invoice.infoTributaria.secuencial);
  infoTributaria.ele('dirMatriz').txt(invoice.infoTributaria.dirMatriz);
  if (invoice.infoTributaria.agenteRetencion) {
    infoTributaria.ele('agenteRetencion').txt(invoice.infoTributaria.agenteRetencion);
  }
  if (invoice.infoTributaria.contribuyenteRimpe) {
    infoTributaria.ele('contribuyenteRimpe').txt(invoice.infoTributaria.contribuyenteRimpe);
  }

  // Bloque <infoFactura>
  const infoFactura = xml.ele('infoFactura');
  infoFactura.ele('fechaEmision').txt(invoice.infoFactura.fechaEmision);
  infoFactura.ele('dirEstablecimiento').txt(invoice.infoFactura.dirEstablecimiento);
  if (invoice.infoFactura.contribuyenteEspecial) {
    infoFactura.ele('contribuyenteEspecial').txt(invoice.infoFactura.contribuyenteEspecial);
  }
  infoFactura.ele('obligadoContabilidad').txt(invoice.infoFactura.obligadoContabilidad);
  infoFactura.ele('tipoIdentificacionComprador').txt(invoice.infoFactura.tipoIdentificacionComprador);
  infoFactura.ele('razonSocialComprador').txt(invoice.infoFactura.razonSocialComprador);
  infoFactura.ele('identificacionComprador').txt(invoice.infoFactura.identificacionComprador);
  if (invoice.infoFactura.direccionComprador) {
    infoFactura.ele('direccionComprador').txt(invoice.infoFactura.direccionComprador);
  }
  infoFactura.ele('totalSinImpuestos').txt(invoice.infoFactura.totalSinImpuestos.toFixed(2));
  infoFactura.ele('totalDescuento').txt(invoice.infoFactura.totalDescuento.toFixed(2));
  
  const totalConImpuestos = infoFactura.ele('totalConImpuestos');
  invoice.infoFactura.totalConImpuestos.forEach((tax) => {
    const totalImpuesto = totalConImpuestos.ele('totalImpuesto');
    totalImpuesto.ele('codigo').txt(tax.codigo);
    totalImpuesto.ele('codigoPorcentaje').txt(tax.codigoPorcentaje);
    totalImpuesto.ele('baseImponible').txt(tax.baseImponible.toFixed(2));
    totalImpuesto.ele('valor').txt(tax.valor.toFixed(2));
  });
  
  infoFactura.ele('propina').txt(invoice.infoFactura.propina.toFixed(2));
  infoFactura.ele('importeTotal').txt(invoice.infoFactura.importeTotal.toFixed(2));
  infoFactura.ele('moneda').txt(invoice.infoFactura.moneda);
  
  const pagos = infoFactura.ele('pagos');
  invoice.infoFactura.pagos.forEach((pago) => {
    const pagoNode = pagos.ele('pago');
    pagoNode.ele('formaPago').txt(pago.formaPago);
    pagoNode.ele('total').txt(pago.total.toFixed(2));
    if (pago.plazo) pagoNode.ele('plazo').txt(pago.plazo.toString());
    if (pago.unidadTiempo) pagoNode.ele('unidadTiempo').txt(pago.unidadTiempo);
  });

  // Bloque <detalles>
  const detalles = xml.ele('detalles');
  invoice.detalles.forEach((detail) => {
    const detalle = detalles.ele('detalle');
    detalle.ele('codigoPrincipal').txt(detail.codigoPrincipal);
    if (detail.codigoAuxiliar) detalle.ele('codigoAuxiliar').txt(detail.codigoAuxiliar);
    detalle.ele('descripcion').txt(detail.descripcion);
    
    const precision = ['1.1.0', '2.1.0'].includes(invoice.version) ? 6 : 2;
    detalle.ele('cantidad').txt(detail.cantidad.toFixed(precision));
    detalle.ele('precioUnitario').txt(detail.precioUnitario.toFixed(precision));
    
    detalle.ele('descuento').txt(detail.descuento.toFixed(2));
    detalle.ele('precioTotalSinImpuesto').txt(detail.precioTotalSinImpuesto.toFixed(2));
    addAdditionalDetails(detalle, detail.detallesAdicionales);
    
    const impuestos = detalle.ele('impuestos');
    detail.impuestos.forEach((tax) => {
      const impuesto = impuestos.ele('impuesto');
      impuesto.ele('codigo').txt(tax.codigo);
      impuesto.ele('codigoPorcentaje').txt(tax.codigoPorcentaje);
      impuesto.ele('tarifa').txt(tax.tarifa.toString());
      impuesto.ele('baseImponible').txt(tax.baseImponible.toFixed(2));
      impuesto.ele('valor').txt(tax.valor.toFixed(2));
    });
  });

  // Bloque <infoAdicional> (opcional)
  if (invoice.infoAdicional && invoice.infoAdicional.campos.length > 0) {
    const infoAdicional = xml.ele('infoAdicional');
    invoice.infoAdicional.campos.forEach((campo) => {
      infoAdicional.ele('campoAdicional', { nombre: campo.nombre }).txt(campo.valor);
    });
  }

  const xmlString = xml.end({ prettyPrint: true });
  
  return { xml: xmlString, accessKey };
}