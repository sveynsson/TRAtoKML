import proj4 from 'proj4';

// Gauß-Krüger zone definitions with DHDN transformation parameters
const GK_PROJECTIONS = {
  '2': '+proj=tmerc +lat_0=0 +lon_0=6 +k=1 +x_0=2500000 +y_0=0 +ellps=bessel +towgs84=584.9636,107.7175,413.8067,1.1155214628,0.2824339890,-3.1384490633,-7.992235 +units=m +no_defs',
  '3': '+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +towgs84=584.9636,107.7175,413.8067,1.1155214628,0.2824339890,-3.1384490633,-7.992235 +units=m +no_defs',
  '4': '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +towgs84=584.9636,107.7175,413.8067,1.1155214628,0.2824339890,-3.1384490633,-7.992235 +units=m +no_defs',
  '5': '+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=5500000 +y_0=0 +ellps=bessel +towgs84=584.9636,107.7175,413.8067,1.1155214628,0.2824339890,-3.1384490633,-7.992235 +units=m +no_defs'
};

const WGS84 = 'EPSG:4326';

/**
 * Transforms Gauß-Krüger coordinates to WGS84
 * @param {number} rY - Rechtswert (Easting)
 * @param {number} rX - Hochwert (Northing)
 * @param {string} zone - GK zone ('2', '3', '4', or '5')
 * @returns {object} - { lon, lat } in WGS84
 */
export function transformCoordinates(rY, rX, zone) {
  if (!GK_PROJECTIONS[zone]) {
    throw new Error(`Unsupported GK zone: ${zone}. Must be '2', '3', '4', or '5'.`);
  }

  const gkProj = GK_PROJECTIONS[zone];
  
  try {
    // Transform from GK to WGS84
    // proj4 expects [x, y] which in our case is [rY (Rechtswert), rX (Hochwert)]
    const [lon, lat] = proj4(gkProj, WGS84, [rY, rX]);
    
    return { lon, lat };
  } catch (error) {
    console.error('Coordinate transformation error:', error);
    throw new Error(`Fehler bei der Koordinatentransformation: ${error.message}`);
  }
}

/**
 * Validates if coordinates are within expected bounds
 * @param {number} lon - Longitude
 * @param {number} lat - Latitude
 * @returns {boolean}
 */
export function isValidCoordinate(lon, lat) {
  // Germany is roughly between 5-15°E and 47-55°N
  return lon >= 5 && lon <= 16 && lat >= 47 && lat <= 56;
}
