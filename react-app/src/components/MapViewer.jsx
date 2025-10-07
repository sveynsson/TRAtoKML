import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, WMSTileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// WMS Configuration
const WMS_URL = 'http://db-ivl-wms.wheregroup.com/service:80';
const WMS_LAYERS = {
  IVL: 'IVL',
  OSM: 'OSM',
  OSM_GREYSCALE: 'OSM Greyscale'
};

// Component to fit bounds when data changes
const FitBounds = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);

  return null;
};

const MapViewer = ({ records, selectedRecords }) => {
  const mapRef = useRef(null);
  const [baseLayer, setBaseLayer] = useState('OSM'); // 'OSM', 'OSM_GREYSCALE', or 'IVL'
  const [showIVL, setShowIVL] = useState(false);
  const [wmsStatus, setWmsStatus] = useState(null); // null, 'checking', 'available', 'error'

  // All coordinates
  const allPositions = useMemo(() => {
    return records
      .filter(r => r.lat && r.lon)
      .map(r => [r.lat, r.lon]);
  }, [records]);

  // Selected coordinates
  const selectedPositions = useMemo(() => {
    return records
      .filter((r, idx) => selectedRecords.has(idx) && r.lat && r.lon)
      .map(r => [r.lat, r.lon]);
  }, [records, selectedRecords]);

  // Calculate center
  const center = useMemo(() => {
    if (allPositions.length === 0) return [51.1657, 10.4515]; // Germany center
    
    const sumLat = allPositions.reduce((sum, pos) => sum + pos[0], 0);
    const sumLon = allPositions.reduce((sum, pos) => sum + pos[1], 0);
    return [sumLat / allPositions.length, sumLon / allPositions.length];
  }, [allPositions]);

  // Check WMS availability
  const checkWMSAvailability = async () => {
    setWmsStatus('checking');
    try {
      const capabilities = `${WMS_URL}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.1.1`;
      const response = await fetch(capabilities, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (response.ok) {
        setWmsStatus('available');
        setTimeout(() => setWmsStatus(null), 3000);
      } else {
        setWmsStatus('error');
        setTimeout(() => setWmsStatus(null), 3000);
      }
    } catch (error) {
      console.error('WMS Check failed:', error);
      setWmsStatus('error');
      setTimeout(() => setWmsStatus(null), 3000);
    }
  };

  if (records.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Keine Daten zum Anzeigen</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        {/* Base Layer - OSM WMS */}
        {baseLayer === 'OSM' && (
          <WMSTileLayer
            url={WMS_URL}
            layers={WMS_LAYERS.OSM}
            format="image/png"
            transparent={false}
            version="1.1.1"
            attribution='© DB Netz - OSM'
          />
        )}

        {/* Base Layer - OSM Greyscale WMS */}
        {baseLayer === 'OSM_GREYSCALE' && (
          <WMSTileLayer
            url={WMS_URL}
            layers={WMS_LAYERS.OSM_GREYSCALE}
            format="image/png"
            transparent={false}
            version="1.1.1"
            attribution='© DB Netz - OSM Greyscale'
          />
        )}

        {/* IVL Overlay Layer */}
        {showIVL && (
          <WMSTileLayer
            url={WMS_URL}
            layers={WMS_LAYERS.IVL}
            format="image/png"
            transparent={true}
            version="1.1.1"
            attribution='© DB Netz - IVL'
          />
        )}

        {/* All positions line (red) */}
        {allPositions.length > 1 && (
          <Polyline
            positions={allPositions}
            pathOptions={{
              color: 'red',
              weight: 5,
              opacity: 0.7
            }}
          />
        )}

        {/* Selected positions line (green) */}
        {selectedPositions.length > 1 && (
          <Polyline
            positions={selectedPositions}
            pathOptions={{
              color: 'green',
              weight: 5,
              opacity: 0.9
            }}
          />
        )}

        <FitBounds positions={allPositions} />
      </MapContainer>

      {/* Layer Controls */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 rounded-lg shadow-lg p-3 z-[1000] space-y-3">
        <div>
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Grundlayer</h3>
          <div className="space-y-1">
            <label className="flex items-center space-x-2 text-xs cursor-pointer">
              <input
                type="radio"
                name="baseLayer"
                checked={baseLayer === 'OSM'}
                onChange={() => setBaseLayer('OSM')}
                className="cursor-pointer"
              />
              <span>OSM</span>
            </label>
            <label className="flex items-center space-x-2 text-xs cursor-pointer">
              <input
                type="radio"
                name="baseLayer"
                checked={baseLayer === 'OSM_GREYSCALE'}
                onChange={() => setBaseLayer('OSM_GREYSCALE')}
                className="cursor-pointer"
              />
              <span>OSM Greyscale</span>
            </label>
          </div>
        </div>

        <div className="border-t pt-2">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Overlay</h3>
          <label className="flex items-center space-x-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={showIVL}
              onChange={(e) => setShowIVL(e.target.checked)}
              className="cursor-pointer"
            />
            <span>IVL-Layer</span>
          </label>
        </div>

        <div className="border-t pt-2">
          <button
            onClick={checkWMSAvailability}
            disabled={wmsStatus === 'checking'}
            className={`w-full text-xs py-1.5 px-3 rounded transition-colors ${
              wmsStatus === 'checking'
                ? 'bg-gray-300 text-gray-600 cursor-wait'
                : wmsStatus === 'available'
                ? 'bg-green-500 text-white'
                : wmsStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {wmsStatus === 'checking' && 'Prüfe...'}
            {wmsStatus === 'available' && '✓ Verfügbar'}
            {wmsStatus === 'error' && '✗ Nicht verfügbar'}
            {!wmsStatus && 'WMS-Verfügbarkeit prüfen'}
          </button>
        </div>
      </div>

      {/* Info overlay */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-xs space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-red-500"></div>
            <span className="text-gray-700">Alle Punkte ({allPositions.length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-green-500"></div>
            <span className="text-gray-700">Auswahl ({selectedPositions.length})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapViewer;
