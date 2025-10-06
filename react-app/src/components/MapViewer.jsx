import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// WMS Layer Component
const WMSLayer = () => {
  const map = useMap();
  
  useEffect(() => {
    // Remove default tile layer if exists
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add WMS Layer with authentication
    const wmsLayer = L.tileLayer.wms('http://db-ivl-wms.wheregroup.com/service:80', {
      layers: 'IVL',
      format: 'image/png',
      transparent: true,
      version: '1.1.1',
      attribution: '© DB Netz',
      // Note: Browser-based authentication will need to be handled differently
      // This is a limitation when using WMS with basic auth in the browser
    });

    wmsLayer.addTo(map);

    return () => {
      map.removeLayer(wmsLayer);
    };
  }, [map]);

  return null;
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
        {/* OpenStreetMap as fallback - WMS will be overlayed */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* WMS Layer - Note: Authentication might need to be configured server-side or via proxy */}
        {/* <WMSLayer /> */}

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

      {/* WMS Authentication Note */}
      <div className="absolute bottom-4 left-4 bg-amber-50 bg-opacity-95 rounded-lg shadow-lg p-3 z-[1000] max-w-xs">
        <p className="text-xs text-amber-800">
          <strong>Hinweis:</strong> WMS-Layer mit Authentifizierung funktionieren im Browser möglicherweise nicht direkt. 
          OpenStreetMap wird als Fallback verwendet.
        </p>
      </div>
    </div>
  );
};

export default MapViewer;
