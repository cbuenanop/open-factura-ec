/**
 * @file src/utils/utils.ts
 * @description Funciones de utilidad para la generación de la clave de acceso,
 * implementando el algoritmo Módulo 11 según la Ficha Técnica del SRI.
 */

/**
 * Define la estructura de los componentes necesarios para generar la clave de acceso.
 */
interface AccessKeyParts {
  date: string; // Formato: dd/mm/yyyy
  voucherType: string; // ej: '01' para factura
  ruc: string;
  environment: string; // '1' o '2'
  series: string; // Concatenación de estab + ptoEmi, ej: '001001'
  sequence: string; // ej: '000000001'
  numericCode: string; // Código numérico de 8 dígitos
  emissionType: string; // '1' para emisión normal
}

/**
 * Calcula el dígito verificador utilizando el algoritmo Módulo 11 con pesos fijos,
 * tal como se especifica en la Ficha Técnica del SRI.
 * @param key La clave de 48 dígitos sin el dígito verificador.
 * @returns El dígito verificador como un número.
 */
function getCheckDigit(key: string): number {
  const weights = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 48; i++) {
    sum += parseInt(key[i], 10) * weights[i];
  }

  const remainder = sum % 11;
  const checkDigit = 11 - remainder;

  if (checkDigit === 11) return 0;
  if (checkDigit === 10) return 1;
  return checkDigit;
}

/**
 * Genera la clave de acceso completa de 49 dígitos para un comprobante electrónico.
 * @param parts Un objeto con todas las partes necesarias para la clave.
 * @returns La clave de acceso completa de 49 dígitos.
 */
export function getAccessKey(parts: AccessKeyParts): string {
  // La Ficha Técnica exige el formato ddmmyyyy para la clave de acceso.
  const dateParts = parts.date.split('/');
  if (dateParts.length !== 3) throw new Error('El formato de la fecha debe ser dd/mm/yyyy');
  const formattedDate = `${dateParts[0]}${dateParts[1]}${dateParts[2]}`;

  // Se asegura que cada parte tenga la longitud correcta usando padStart.
  const keyWithoutCheckDigit = [
    formattedDate,
    parts.voucherType.padStart(2, '0'),
    parts.ruc,
    parts.environment.padStart(1, '0'),
    parts.series.padStart(6, '0'),
    parts.sequence.padStart(9, '0'),
    parts.numericCode.padStart(8, '0'),
    parts.emissionType.padStart(1, '0')
  ].join('');

  if (keyWithoutCheckDigit.length !== 48) {
    throw new Error(`Error de longitud al generar la clave de acceso. Se esperaban 48 dígitos y se obtuvieron ${keyWithoutCheckDigit.length}.`);
  }

  const checkDigit = getCheckDigit(keyWithoutCheckDigit);

  return `${keyWithoutCheckDigit}${checkDigit}`;
}
