"use client";
import React, { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";

const ITALY_PROVINCES_URL = "/italy-provinces.geojson";

const METRICS = [
  { id: "vendita",    label: "Vendita media",    unit: "€/mq",      color: ["#dbeafe", "#93c5fd", "#3b82f6", "#2563eb", "#1e3a8a"] },
  { id: "affitto",    label: "Affitto medio",    unit: "€/mq/mese", color: ["#d1fae5", "#6ee7b7", "#10b981", "#059669", "#064e3b"] },
  { id: "rendimento", label: "Rendimento lordo", unit: "%",         color: ["#fef3c7", "#fcd34d", "#f59e0b", "#d97706", "#78350f"] },
] as const;

type MetricId = typeof METRICS[number]["id"];

export type ProvinceData = {
  sigla_provincia: string;
  vendita: number;
  affitto: number;
  rendimento: number;
};

function normalizeCode(s: string) {
  return (s || "").trim().toUpperCase();
}

function fmt(n: number, unit: string) {
  if (unit === "%") return n.toFixed(2) + "%";
  return "€" + n.toLocaleString("it-IT", { maximumFractionDigits: 0 }) + " " + unit;
}

function Tooltip({ province, metric }: { province: ProvinceData; metric: typeof METRICS[number] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-xl min-w-[180px]">
      <p className="text-lg font-black mb-3">{province.sigla_provincia}</p>
      <div className="space-y-1.5 text-sm">
        {METRICS.map((m) => (
          <div
            key={m.id}
            className={`flex justify-between gap-4 ${
              m.id === metric.id ? "font-bold text-foreground" : "text-muted-foreground"
            }`}
          >
            <span>{m.label}</span>
            <span>{fmt(province[m.id], m.unit)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MappaProvinceImmobiliare({ data }: { data: ProvinceData[] }) {
  const [selectedMetric, setSelectedMetric] = useState<MetricId>("rendimento");
  const [hovered, setHovered] = useState<ProvinceData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => { setIsMounted(true); }, []);

  const metric = METRICS.find((m) => m.id === selectedMetric)!;

  const colorScale = useMemo(() => {
    if (data.length === 0) return () => metric.color[0];
    return scaleQuantile<string>()
      .domain(data.map((d) => d[selectedMetric]).filter(Boolean))
      .range([...metric.color]);
  }, [data, selectedMetric, metric]);

  const quantileBreaks = useMemo(() => {
    if (data.length === 0) return [];
    const vals = data.map((d) => d[selectedMetric]).filter(Boolean).sort((a, b) => a - b);
    const q = (p: number) => vals[Math.floor(p * (vals.length - 1))];
    return [q(0), q(1)];
  }, [data, selectedMetric]);

  if (!isMounted) {
    return (
      <div className="h-[500px] bg-card border border-border rounded-[2rem] flex items-center justify-center text-muted-foreground text-sm">
        Caricamento mappa…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selettore metrica */}
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMetric(m.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              selectedMetric === m.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                : "bg-card border-border hover:bg-secondary"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Mappa */}
      <div
        className="bg-card border border-border rounded-[2rem] relative overflow-visible flex items-center justify-center p-4 min-h-[420px]"
        onMouseLeave={() => setHovered(null)}
      >
        {/* Legenda */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 items-end z-10">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">{metric.label}</p>
          <div className="flex h-2 w-28 rounded-full overflow-hidden">
            {metric.color.map((c) => (
              <div key={c} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
          {quantileBreaks.length === 2 && (
            <div className="flex justify-between w-28 mt-0.5">
              <span className="text-[9px] text-muted-foreground">{fmt(quantileBreaks[0], metric.unit)}</span>
              <span className="text-[9px] text-muted-foreground">{fmt(quantileBreaks[1], metric.unit)}</span>
            </div>
          )}
        </div>

        {/* Tooltip */}
        {hovered && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{ left: tooltipPos.x + 16, top: tooltipPos.y - 10 }}
          >
            <Tooltip province={hovered} metric={metric} />
          </div>
        )}

        <ComposableMap
          projection="geoAzimuthalEqualArea"
          projectionConfig={{ rotate: [-12.5, -42, 0], scale: 4500 }}
          className="w-full h-auto max-h-[600px] min-h-[300px] outline-none"
        >
          <ZoomableGroup center={[12.5, 42]} zoom={1} minZoom={1} maxZoom={5}>
            <Geographies geography={ITALY_PROVINCES_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const siglaGeo = normalizeCode(geo.properties.prov_acr);
                  const prov = data.find((d) => normalizeCode(d.sigla_provincia) === siglaGeo);
                  const isHovered = hovered && normalizeCode(hovered.sigla_provincia) === siglaGeo;
                  const fill = prov ? colorScale(prov[selectedMetric]) : "#e2e8f0";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(e: React.MouseEvent) => {
                        if (prov) {
                          setHovered(prov);
                          setTooltipPos({ x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseMove={(e: React.MouseEvent) => {
                        if (prov) setTooltipPos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        default: {
                          fill,
                          stroke: isHovered ? "#1e40af" : "#ffffff",
                          strokeWidth: isHovered ? 1.5 : 0.5,
                          outline: "none",
                          transition: "fill 0.2s ease",
                          cursor: prov ? "pointer" : "default",
                        },
                        hover: {
                          fill: "#2563eb",
                          stroke: "#ffffff",
                          strokeWidth: 1.5,
                          outline: "none",
                        },
                        pressed: { fill: "#1d4ed8", outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Top / Bottom 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: `Top 5 · ${metric.label}`,
            rows: [...data].sort((a, b) => b[selectedMetric] - a[selectedMetric]).slice(0, 5),
            top: true,
          },
          {
            label: `Bottom 5 · ${metric.label}`,
            rows: [...data].sort((a, b) => a[selectedMetric] - b[selectedMetric]).slice(0, 5),
            top: false,
          },
        ].map(({ label, rows, top }) => (
          <div key={label} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
            </div>
            <div className="divide-y divide-border">
              {rows.map((d, i) => (
                <div key={d.sigla_provincia} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <span className="font-bold">{d.sigla_provincia}</span>
                  </div>
                  <span className={`font-semibold ${top ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    {fmt(d[selectedMetric], metric.unit)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
