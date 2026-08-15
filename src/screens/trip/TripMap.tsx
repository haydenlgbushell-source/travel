import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { TripItem } from "./trip-data";

export interface MapPin {
  item: TripItem;
  number: number;
}

/** A real, pannable map with CARTO's Voyager tiles — a clean, labelled
 *  style close to Google Maps' look, free and keyless — and a numbered pin
 *  per located item. Nearby pins (several West Loop venues sit metres
 *  apart) cluster into a single marker until zoomed in, so one never sits
 *  invisibly under another. Replaces the old abstract dot-spiral
 *  visualisation with actual roads and geography. */
export function TripMap({
  pins,
  height = 220,
}: {
  pins: MapPin[];
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
      detectRetina: true,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.markerClusterGroup({
      maxClusterRadius: 44,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const located = pins.filter(
      (p) => typeof p.item.lat === "number" && typeof p.item.lng === "number",
    );
    if (located.length === 0) return;

    located.forEach(({ item, number }) => {
      const icon = L.divIcon({
        className: "trip-map__marker",
        html: `<span style="background:${item.accent}">${number}</span>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker([item.lat as number, item.lng as number], { icon })
        .addTo(layer)
        .bindPopup(`<strong>${item.title}</strong><br>${item.place}`);
    });

    const bounds = L.latLngBounds(located.map((p) => [p.item.lat as number, p.item.lng as number]));
    if (located.length === 1) {
      map.setView(bounds.getCenter(), 14);
    } else {
      map.fitBounds(bounds, { padding: [28, 28] });
    }
    requestAnimationFrame(() => map.invalidateSize());
  }, [pins]);

  return (
    <div
      ref={containerRef}
      className="trip-map"
      role="region"
      aria-label="Map of trip locations"
      style={{ height }}
    />
  );
}
