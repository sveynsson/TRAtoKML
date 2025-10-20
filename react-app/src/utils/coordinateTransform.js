import proj4 from 'proj4';

// Register EPSG definitions for accurate transformations
// Note: RD/83 and DHDN both use the same grid file (de_adv_BETA2007.tif/BETA2007.gsb)
// They are essentially the same datum. The difference is mainly administrative.

// DHDN (Deutsches Hauptdreiecksnetz) - Legacy GK zones
proj4.defs('EPSG:31466', '+proj=tmerc +lat_0=0 +lon_0=6 +k=1 +x_0=2500000 +y_0=0 +ellps=bessel +nadgrids=@BETA2007.gsb +units=m +no_defs'); // DHDN / 3-degree Gauss-Kruger zone 2
proj4.defs('EPSG:31467', '+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +nadgrids=@BETA2007.gsb +units=m +no_defs'); // DHDN / 3-degree Gauss-Kruger zone 3
proj4.defs('EPSG:31468', '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +nadgrids=@BETA2007.gsb +units=m +no_defs'); // DHDN / 3-degree Gauss-Kruger zone 4
proj4.defs('EPSG:31469', '+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=5500000 +y_0=0 +ellps=bessel +nadgrids=@BETA2007.gsb +units=m +no_defs'); // DHDN / 3-degree Gauss-Kruger zone 5

// RD/83 (Rauenberg Datum 1983) - Uses the same grid as DHDN (de_adv_BETA2007.tif)
// According to official EPSG definitions, RD/83 uses the BETA2007 grid transformation
proj4.defs('EPSG:3398', '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +nadgrids=@BETA2007.gsb +units=m +no_defs'); // RD/83 / 3-degree Gauss-Kruger zone 4
proj4.defs('EPSG:3399', '+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=5500000 +y_0=0 +ellps=bessel +nadgrids=@BETA2007.gsb +units=m +no_defs'); // RD/83 / 3-degree Gauss-Kruger zone 5
proj4.defs('EPSG:5668', '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +nadgrids=@BETA2007.gsb +units=m +no_defs'); // RD/83 / 3-degree Gauss-Kruger zone 4 (E-N)
proj4.defs('EPSG:5669', '+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=5500000 +y_0=0 +ellps=bessel +nadgrids=@BETA2007.gsb +units=m +no_defs'); // RD/83 / 3-degree Gauss-Kruger zone 5 (E-N)

// ETRS89 / UTM
proj4.defs('EPSG:25833', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'); // ETRS89 / UTM zone 33N
proj4.defs('EPSG:3045', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'); // ETRS89 / UTM zone 33N (N-E)
proj4.defs('EPSG:5653', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'); // ETRS89 / UTM zone 33N (N-zE)
proj4.defs('EPSG:5650', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'); // ETRS89 / UTM zone 33N (zE-N)

// Coordinate system mapping to EPSG codes
const COORDINATE_SYSTEMS = {
  // Legacy Gauß-Krüger zones (DHDN)
  'gk2': 'EPSG:31466',
  'gk3': 'EPSG:31467',
  'gk4': 'EPSG:31468',
  'gk5': 'EPSG:31469',
  
  // RD/83 3-degree Gauss-Kruger zones
  'rd83_gk4': 'EPSG:3398',
  'rd83_gk5': 'EPSG:3399',
  'rd83_gk4_en': 'EPSG:5668',
  'rd83_gk5_en': 'EPSG:5669',
  
  // ETRS89 / UTM zones
  'etrs89_utm33n': 'EPSG:25833',
  'etrs89_utm33n_ne': 'EPSG:3045',
  'etrs89_utm33n_nze': 'EPSG:5653',
  'etrs89_utm33n_zen': 'EPSG:5650'
};

const WGS84 = 'EPSG:4326';

// Coordinate system configurations with axis order handling
const COORDINATE_CONFIG = {
  // DHDN (Deutsches Hauptdreiecksnetz) - Traditional German reference system
  'gk2': { axisOrder: 'yx', name: 'DHDN / GK Zone 2 (EPSG:31466)', epsg: 'EPSG:31466' },
  'gk3': { axisOrder: 'yx', name: 'DHDN / GK Zone 3 (EPSG:31467)', epsg: 'EPSG:31467' },
  'gk4': { axisOrder: 'yx', name: 'DHDN / GK Zone 4 (EPSG:31468)', epsg: 'EPSG:31468' },
  'gk5': { axisOrder: 'yx', name: 'DHDN / GK Zone 5 (EPSG:31469)', epsg: 'EPSG:31469' },
  
  // RD/83 (Rauenberg Datum 1983) - Uses same transformation as DHDN (BETA2007 grid)
  // Note: RD/83 is administratively different but technically identical to DHDN
  'rd83_gk4': { axisOrder: 'yx', name: 'RD/83 / GK Zone 4 (EPSG:3398)', epsg: 'EPSG:3398' },
  'rd83_gk5': { axisOrder: 'yx', name: 'RD/83 / GK Zone 5 (EPSG:3399)', epsg: 'EPSG:3399' },
  'rd83_gk4_en': { axisOrder: 'xy', name: 'RD/83 / GK Zone 4 E-N (EPSG:5668)', epsg: 'EPSG:5668' },
  'rd83_gk5_en': { axisOrder: 'xy', name: 'RD/83 / GK Zone 5 E-N (EPSG:5669)', epsg: 'EPSG:5669' },
  
  // ETRS89 / UTM systems  
  'etrs89_utm33n': { axisOrder: 'xy', name: 'ETRS89 / UTM 33N (EPSG:25833)', epsg: 'EPSG:25833' },
  'etrs89_utm33n_ne': { axisOrder: 'yx', name: 'ETRS89 / UTM 33N N-E (EPSG:3045)', epsg: 'EPSG:3045' },
  'etrs89_utm33n_nze': { axisOrder: 'yx', name: 'ETRS89 / UTM 33N N-zE (EPSG:5653)', epsg: 'EPSG:5653' },
  'etrs89_utm33n_zen': { axisOrder: 'xy', name: 'ETRS89 / UTM 33N zE-N (EPSG:5650)', epsg: 'EPSG:5650' }
};

/**
 * Transforms coordinates to WGS84
 * @param {number} rY - Rechtswert (Easting) or first coordinate
 * @param {number} rX - Hochwert (Northing) or second coordinate  
 * @param {string} system - Coordinate system key
 * @returns {object} - { lon, lat } in WGS84
 */
export function transformCoordinates(rY, rX, system) {
  // Handle legacy GK zone format (for backward compatibility)
  if (['2', '3', '4', '5'].includes(system)) {
    system = 'gk' + system;
  }

  if (!COORDINATE_SYSTEMS[system]) {
    throw new Error(`Unsupported coordinate system: ${system}`);
  }

  const projection = COORDINATE_SYSTEMS[system];
  const config = COORDINATE_CONFIG[system];
  
  try {
    let coords;
    
    // Handle axis order based on coordinate system type
    if (config.axisOrder === 'xy') {
      // East-North or X-Y order
      coords = [rY, rX];
    } else {
      // North-East or Y-X order (traditional GK)
      coords = [rY, rX];
    }
    
    // Transform to WGS84
    const [lon, lat] = proj4(projection, WGS84, coords);
    
    return { lon, lat };
  } catch (error) {
    console.error('Coordinate transformation error:', error);
    throw new Error(`Fehler bei der Koordinatentransformation: ${error.message}`);
  }
}

/**
 * Get available coordinate systems for the dropdown
 * @returns {Array} Array of coordinate system options
 */
export function getCoordinateSystems() {
  return Object.keys(COORDINATE_CONFIG).map(key => ({
    value: key,
    label: COORDINATE_CONFIG[key].name,
    category: getCategoryForSystem(key)
  }));
}

/**
 * Get category for grouping coordinate systems
 * @param {string} system - Coordinate system key
 * @returns {string} Category name
 */
function getCategoryForSystem(system) {
  if (system.startsWith('gk')) return 'DHDN (Deutsches Hauptdreiecksnetz)';
  if (system.startsWith('rd83')) return 'RD/83 (Rauenberg Datum 1983)';
  if (system.startsWith('etrs89')) return 'ETRS89/UTM';
  return 'Andere';
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
