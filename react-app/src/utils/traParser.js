/**
 * Parses a TRA binary file and returns an array of records.
 * 
 * TRA_DATA structure (78 bytes per record):
 * - double rR1;    // Radius 1 (Start) - 8 bytes
 * - double rR2;    // Radius 2 (End) - 8 bytes
 * - double rY;     // East Coordinate (Start) - 8 bytes
 * - double rX;     // North Coordinate (Start) - 8 bytes
 * - double rT;     // Bearing (Start) - 8 bytes
 * - double rS;     // Station (Start) - 8 bytes
 * - short  nKz;    // Element Type - 2 bytes
 * - double rL;     // Length (Start) - 8 bytes
 * - double rU1;    // Superelevation (Start) - 8 bytes
 * - double rU2;    // Superelevation (End) - 8 bytes
 * - int    iC;     // Distance to Route - 4 bytes
 */

export function parseTRAFile(arrayBuffer) {
  const RECORD_SIZE = 78; // bytes per record
  const view = new DataView(arrayBuffer);
  
  if (arrayBuffer.byteLength < RECORD_SIZE) {
    throw new Error('Datei zu kurz für einen Header-Datensatz.');
  }

  const records = [];
  let offset = 0;

  // Read header record
  const nKz = view.getInt16(offset + 48, true); // little-endian
  const iNumData = nKz + 1;

  console.log(`TRA-Datei: ${iNumData} Datensätze gefunden (nKz=${nKz})`);

  // Skip header and read data records
  offset += RECORD_SIZE;

  for (let i = 0; i < iNumData; i++) {
    if (offset + RECORD_SIZE > arrayBuffer.byteLength) {
      console.warn(`Nicht genügend Daten für Datensatz ${i + 1}.`);
      break;
    }

    const record = {
      radius: view.getFloat64(offset + 0, true),   // rR1
      // rR2: view.getFloat64(offset + 8, true),
      rY: view.getFloat64(offset + 16, true),       // East coordinate (Rechtswert)
      rX: view.getFloat64(offset + 24, true),       // North coordinate (Hochwert)
      direction: view.getFloat64(offset + 32, true), // rT
      station: view.getFloat64(offset + 40, true),   // rS
      // nKz: view.getInt16(offset + 48, true),
      // rL: view.getFloat64(offset + 50, true),
      // rU1: view.getFloat64(offset + 58, true),
      // rU2: view.getFloat64(offset + 66, true),
      // iC: view.getInt32(offset + 74, true),
    };

    records.push(record);
    offset += RECORD_SIZE;
  }

  console.log(`TRA-Datei erfolgreich eingelesen. Anzahl der Datensätze: ${records.length}`);
  return records;
}
