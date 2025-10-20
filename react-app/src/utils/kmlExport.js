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

/**
 * Exports multiple tracks to a single KML file with different colors
 * @param {Array} files - Array of file objects with records and color
 * @returns {string} - KML file content
 */
export function exportBatchToKML(files) {
  const formatCoord = (record) => {
    return `${record.lon.toFixed(6)},${record.lat.toFixed(6)},0`;
  };

  // Generate styles for each color
  const styles = files.map((file, index) => `
    <Style id="lineStyle${index}">
      <LineStyle>
        <color>${file.color.kml}</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>${file.color.kml}80</color>
      </PolyStyle>
    </Style>`).join('');

  // Generate placemarks for each track
  const placemarks = files.map((file, index) => {
    const coords = file.records
      .filter(r => r.lat && r.lon)
      .map(formatCoord)
      .join(' ');

    return `
    <Placemark>
      <name>${file.name}</name>
      <description>
        <![CDATA[
          <b>Datei:</b> ${file.name}<br/>
          <b>Punkte:</b> ${file.pointCount}<br/>
          <b>Farbe:</b> ${file.color.name}
        ]]>
      </description>
      <styleUrl>#lineStyle${index}</styleUrl>
      <LineString>
        <extrude>0</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>clampToGround</altitudeMode>
        <coordinates>
          ${coords}
        </coordinates>
      </LineString>
    </Placemark>`;
  }).join('');

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>TRA Batch Export</name>
    <description>Mehrere Trassen exportiert mit TRA zu KML Konverter - ${files.length} Trassen</description>
    ${styles}
    <Folder>
      <name>Alle Trassen</name>
      <open>1</open>
      ${placemarks}
    </Folder>
  </Document>
</kml>`;

  return kml;
}
