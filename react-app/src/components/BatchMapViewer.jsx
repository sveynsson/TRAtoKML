import React, { useEffect, useMemo } from 'react';
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

// Component to fit bounds when data changes
const FitBounds = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const latLngBounds = L.latLngBounds(bounds);
      map.fitBounds(latLngBounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  return null;
};

const BatchMapViewer = ({ files }) => {
  // Collect all positions and prepare polylines
  const { allBounds, polylines } = useMemo(() => {
    const bounds = [];
    const lines = [];

    files.forEach(file => {
      const positions = file.records
        .filter(r => r.lat && r.lon)
        .map(r => [r.lat, r.lon]);

      if (positions.length > 0) {
        bounds.push(...positions);
        lines.push({
          id: file.id,
          positions,
          color: file.color.hex,
          name: file.name
        });
      }
    });

    return { allBounds: bounds, polylines: lines };
  }, [files]);

  // Calculate center
  const center = useMemo(() => {
    if (allBounds.length === 0) return [51.1657, 10.4515]; // Germany center
    
    const sumLat = allBounds.reduce((sum, pos) => sum + pos[0], 0);
    const sumLon = allBounds.reduce((sum, pos) => sum + pos[1], 0);
    return [sumLat / allBounds.length, sumLon / allBounds.length];
  }, [allBounds]);

  if (files.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Keine Trassen zum Anzeigen</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] rounded-lg overflow-hidden shadow-md">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        {/* OpenStreetMap Base Layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Draw all polylines with their colors */}
        {polylines.map(line => (
          <Polyline
            key={line.id}
            positions={line.positions}
            pathOptions={{
              color: line.color,
              weight: 3,
              opacity: 0.8
            }}
          >
            {/* Optional: Add popup with file name */}
          </Polyline>
        ))}

        {/* Fit map to show all tracks */}
        <FitBounds bounds={allBounds} />
      </MapContainer>
    </div>
  );
};

export default BatchMapViewer;
