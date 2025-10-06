/**
 * Exports track data to KML format
 * @param {Array} selectedRecords - Selected records to export
 * @param {Array} allRecords - All records for full track
 * @returns {string} - KML file content
 */
export function exportToKML(selectedRecords, allRecords) {
  const formatCoord = (record) => {
    return `${record.lon.toFixed(6)},${record.lat.toFixed(6)},0`;
  };

  const selectedCoords = selectedRecords
    .filter(r => r.lat && r.lon)
    .map(formatCoord)
    .join(' ');

  const allCoords = allRecords
    .filter(r => r.lat && r.lon)
    .map(formatCoord)
    .join(' ');

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>TRA zu KML Export</name>
    <description>Konvertiert mit TRA zu KML Konverter</description>
    
    <Style id="redLineStyle">
      <LineStyle>
        <color>ff0000ff</color>
        <width>5</width>
      </LineStyle>
    </Style>
    
    <Style id="greenLineStyle">
      <LineStyle>
        <color>ff00ff00</color>
        <width>5</width>
      </LineStyle>
    </Style>
    
    <Placemark>
      <name>Gesamte Trasse</name>
      <description>Alle ${allRecords.length} Punkte der Trasse</description>
      <styleUrl>#redLineStyle</styleUrl>
      <LineString>
        <extrude>0</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>clampToGround</altitudeMode>
        <coordinates>
          ${allCoords}
        </coordinates>
      </LineString>
    </Placemark>
    
    <Placemark>
      <name>Ausgewählte Trasse</name>
      <description>Ausgewählte ${selectedRecords.length} Punkte</description>
      <styleUrl>#greenLineStyle</styleUrl>
      <LineString>
        <extrude>0</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>clampToGround</altitudeMode>
        <coordinates>
          ${selectedCoords}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

  return kml;
}
