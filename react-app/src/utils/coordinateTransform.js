import proj4 from 'proj4';

// Coordinate system definitions
const COORDINATE_SYSTEMS = {
  // Legacy Gauß-Krüger zones
  'gk2': '+proj=tmerc +lat_0=0 +lon_0=6 +k=1 +x_0=2500000 +y_0=0 +ellps=bessel +towgs84=584.9636,107.7175,413.8067,1.1155214628,0.2824339890,-3.1384490633,-7.992235 +units=m +no_defs',
  'gk3': '+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +towgs84=584.9636,107.7175,413.8067,1.1155214628,0.2824339890,-3.1384490633,-7.992235 +units=m +no_defs',
  'gk4': '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +towgs84=584.9636,107.7175,413.8067,1.1155214628,0.2824339890,-3.1384490633,-7.992235 +units=m +no_defs',
  'gk5': '+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=5500000 +y_0=0 +ellps=bessel +towgs84=584.9636,107.7175,413.8067,1.1155214628,0.2824339890,-3.1384490633,-7.992235 +units=m +no_defs',
  
  // RD/83 3-degree Gauss-Kruger zones
  'rd83_gk4': '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +towgs84=612.4,77.0,440.2,-0.054,0.057,-2.797,2.55 +units=m +no_defs', // EPSG:3398
  'rd83_gk5': '+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=5500000 +y_0=0 +ellps=bessel +towgs84=612.4,77.0,440.2,-0.054,0.057,-2.797,2.55 +units=m +no_defs', // EPSG:3399
  'rd83_gk4_en': '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +towgs84=612.4,77.0,440.2,-0.054,0.057,-2.797,2.55 +units=m +no_defs', // EPSG:5668
  'rd83_gk5_en': '+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=5500000 +y_0=0 +ellps=bessel +towgs84=612.4,77.0,440.2,-0.054,0.057,-2.797,2.55 +units=m +no_defs', // EPSG:5669
  
  // ETRS89 / UTM zones
  'etrs89_utm33n': '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs', // EPSG:25833
  'etrs89_utm33n_ne': '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs', // EPSG:3045
  'etrs89_utm33n_nze': '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs', // EPSG:5653
  'etrs89_utm33n_zen': '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'  // EPSG:5650
};

const WGS84 = 'EPSG:4326';

// Coordinate system configurations with axis order handling
const COORDINATE_CONFIG = {
  // Legacy Gauß-Krüger zones (Rechtswert, Hochwert)
  'gk2': { axisOrder: 'yx', name: 'GK Zone 2' },
  'gk3': { axisOrder: 'yx', name: 'GK Zone 3' },
  'gk4': { axisOrder: 'yx', name: 'GK Zone 4' },
  'gk5': { axisOrder: 'yx', name: 'GK Zone 5' },
  
  // RD/83 systems
  'rd83_gk4': { axisOrder: 'yx', name: 'RD/83 3-degree GK Zone 4' },
  'rd83_gk5': { axisOrder: 'yx', name: 'RD/83 3-degree GK Zone 5' },
  'rd83_gk4_en': { axisOrder: 'xy', name: 'RD/83 3-degree GK Zone 4 (E-N)' },
  'rd83_gk5_en': { axisOrder: 'xy', name: 'RD/83 3-degree GK Zone 5 (E-N)' },
  
  // ETRS89 / UTM systems  
  'etrs89_utm33n': { axisOrder: 'xy', name: 'ETRS89 / UTM Zone 33N' },
  'etrs89_utm33n_ne': { axisOrder: 'yx', name: 'ETRS89 / UTM Zone 33N (N-E)' },
  'etrs89_utm33n_nze': { axisOrder: 'yx', name: 'ETRS89 / UTM Zone 33N (N-zE)' },
  'etrs89_utm33n_zen': { axisOrder: 'xy', name: 'ETRS89 / UTM Zone 33N (zE-N)' }
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
  if (system.startsWith('gk')) return 'Gauß-Krüger (Legacy)';
  if (system.startsWith('rd83')) return 'RD/83';
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
