import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { STATUS_COLORS } from "./NearbyPanel";

type Status = "En curs" | "Adjudicada" | "Publicat" | "Licitació" | "Planificada";

type Tender = {
  id: string;
  licitacioId: string;
  title: string;
  municipality: string;
  organizer: string;
  status: Status;
  budget: number;
  lat: number;
  lng: number;
};

type Props = {
  tenders: Tender[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const ACTIVE_COLOR = "#f97316"; // orange-500 — brand accent

const fmtEur = (n: number) =>
  new Intl.NumberFormat("ca-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function makeIcon(color: string, active: boolean) {
  const size = active ? 34 : 26;
  const html = `
    <div style="
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="width:8px;height:8px;border-radius:50%;background:white;transform:rotate(45deg);"></div>
    </div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export default function TenderMapClient({ tenders, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Init
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([41.7, 1.8], 8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove stale
    const keep = new Set(tenders.map((t) => t.id));
    markersRef.current.forEach((m, id) => {
      if (!keep.has(id)) {
        m.remove();
        markersRef.current.delete(id);
      }
    });

    // Add / update
    tenders.forEach((t) => {
      const active = t.id === selectedId;
      const color = active ? ACTIVE_COLOR : STATUS_COLORS[t.status];
      const popupHtml = `
        <div style="font-family:inherit;min-width:200px;">
          <div style="font-weight:600;font-size:13px;line-height:1.3;margin-bottom:4px;">${escapeHtml(t.title)}</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:6px;">${escapeHtml(t.licitacioId)}</div>
          <div style="font-size:12px;">${escapeHtml(t.municipality)} · ${escapeHtml(t.organizer)}</div>
          <div style="font-size:12px;margin-top:4px;"><strong>${fmtEur(t.budget)}</strong></div>
          <div style="font-size:11px;margin-top:4px;color:${color};">● ${t.status}</div>
        </div>`;
      let marker = markersRef.current.get(t.id);
      if (!marker) {
        marker = L.marker([t.lat, t.lng], { icon: makeIcon(color, active) }).addTo(map);
        marker.bindPopup(popupHtml);
        marker.on("click", () => onSelect(t.id));
        markersRef.current.set(t.id, marker);
      } else {
        marker.setIcon(makeIcon(color, active));
        marker.setPopupContent(popupHtml);
      }
    });

    // Fit bounds when filter changes and nothing selected
    if (!selectedId && tenders.length > 0) {
      const bounds = L.latLngBounds(tenders.map((t) => [t.lat, t.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }, [tenders, selectedId, onSelect]);

  // Focus selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (!marker) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 13), { duration: 0.6 });
    marker.openPopup();
  }, [selectedId]);

  return <div ref={containerRef} className="h-72 w-full lg:h-full" />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
