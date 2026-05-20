import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';

function MapEvents({ onLocationSelect }) {
  useMapEvents({
    click(event) {
      onLocationSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function Recenter({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

export default function AppointmentMapPicker({ region, selectedLocation, onLocationSelect }) {
  const center = [
    selectedLocation?.latitude || region.latitude,
    selectedLocation?.longitude || region.longitude,
  ];

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />
      <MapEvents onLocationSelect={onLocationSelect} />
      {selectedLocation ? (
        <CircleMarker
          center={[selectedLocation.latitude, selectedLocation.longitude]}
          pathOptions={{ color: '#149688', fillColor: '#149688', fillOpacity: 0.9 }}
          radius={8}
        />
      ) : null}
    </MapContainer>
  );
}
