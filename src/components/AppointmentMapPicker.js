import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const leafletHtml = ({ latitude, longitude, selectedLocation }) => {
  const markerScript = selectedLocation
    ? `setMarker(${selectedLocation.latitude}, ${selectedLocation.longitude});`
    : '';

  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; background: #eef2ff; }
      .leaflet-control-attribution { font-size: 10px; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const map = L.map('map', { zoomControl: true }).setView([${latitude}, ${longitude}], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      let marker = null;
      function setMarker(lat, lng) {
        if (!marker) {
          marker = L.marker([lat, lng]).addTo(map);
        } else {
          marker.setLatLng([lat, lng]);
        }
      }

      map.on('click', function(event) {
        const lat = event.latlng.lat;
        const lng = event.latlng.lng;
        setMarker(lat, lng);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'select-location',
          latitude: lat,
          longitude: lng
        }));
      });

      ${markerScript}
    </script>
  </body>
</html>`;
};

export default function AppointmentMapPicker({ region, selectedLocation, onLocationSelect }) {
  const html = useMemo(
    () =>
      leafletHtml({
        latitude: selectedLocation?.latitude || region.latitude,
        longitude: selectedLocation?.longitude || region.longitude,
        selectedLocation,
      }),
    [region.latitude, region.longitude, selectedLocation],
  );

  const mapKey = selectedLocation
    ? `${selectedLocation.latitude}-${selectedLocation.longitude}`
    : `${region.latitude}-${region.longitude}`;

  return (
    <View style={styles.container}>
      <WebView
        key={mapKey}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data);
            if (payload.type === 'select-location') {
              onLocationSelect({
                latitude: payload.latitude,
                longitude: payload.longitude,
              });
            }
          } catch {
            // Ignore malformed WebView messages.
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
