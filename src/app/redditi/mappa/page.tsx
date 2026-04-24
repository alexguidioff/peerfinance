"use client";
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Info,
  Map as MapIcon,
  TrendingUp,
  Users,
  Search,
  Trophy,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// ─── Costanti ────────────────────────────────────────────────────────────────
// GeoJSON locale: copia il file in /public/italy-provinces.geojson
// così eviti il CDN esterno e migliori i tempi di caricamento
const ITALY_PROVINCES_URL = "/italy-provinces.geojson";
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

const COLOR_RAMP = ["#dbeafe", "#93c5fd", "#3b82f6", "#2563eb", "#1e3a8a"] as const;

const METRICS = [
  { id: "reddito_medio",      label: "Reddito Medio Generale",  icon: <TrendingUp className="w-4 h-4" /> },
  { id: "reddito_dipendenti", label: "Media Dipendenti",        icon: <Users       className="w-4 h-4" /> },
  { id: "reddito_pensionati", label: "Media Pensionati",        icon: <Info        className="w-4 h-4" /> },
  { id: "reddito_autonomi",   label: "Media Autonomi / P.IVA",  icon: <MapIcon     className="w-4 h-4" /> },
] as const;

type MetricId = typeof METRICS[number]["id"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return "€" + n.toLocaleString("it-IT", { maximumFractionDigits: 0 });
}

function normalizeCode(s: string) {
  return (s || "").trim().toUpperCase();
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-muted/60 ${className}`}
      aria-hidden="true"
    />
  );
}

// ─── Bottom Sheet (mobile touch) ─────────────────────────────────────────────
function BottomSheet({
    province,
    metric,
    onClose,
  }: {
    province: any;
    metric: MetricId;
    onClose: () => void;
  }) {
    if (!province) return null;
    return (
      <>
        {/* Overlay leggero per chiudere se si tocca fuori */}
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden" 
          onClick={onClose} 
        />
        
        <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden transform transition-transform duration-300 ease-out">
          <div className="bg-card border-t border-border rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" /> {/* Maniglia estetica */}
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">
                  {province.regione}
                </p>
                <p className="text-3xl font-black mt-1">{province.sigla_provincia}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {METRICS.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-2xl border ${
                    m.id === metric
                      ? "bg-primary/10 border-primary/40"
                      : "bg-secondary/40 border-border"
                  }`}
                >
                  <p className="text-[11px] text-muted-foreground font-medium truncate">
                    {m.label}
                  </p>
                  <p className="text-lg font-bold mt-1">
                    {fmt(Number(province[m.id] ?? 0))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }
  

// ─── Componente principale ────────────────────────────────────────────────────
export default function MappaProvince() {
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData]           = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricId>("reddito_medio");
  const [hoveredProvince, setHoveredProvince]  = useState<any>(null);
  const [touchedProvince, setTouchedProvince]  = useState<any>(null);
  const [pinnedProvince, setPinnedProvince]    = useState<any>(null);
  const [searchQuery, setSearchQuery]          = useState("");
  const [showRanking, setShowRanking]          = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // SSR guard
  useEffect(() => { setIsMounted(true); }, []);

  // Fetch — solo le colonne necessarie
  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      const { data: dbData, error: dbError } = await supabase
        .from("mef_redditi_province")
        .select(
          "sigla_provincia, regione, reddito_medio, reddito_dipendenti, reddito_pensionati, reddito_autonomi"
        );
      if (dbError) {
        setError("Impossibile caricare i dati. Riprova più tardi.");
      } else {
        setData(dbData || []);
      }
      setIsLoading(false);
    };
    fetch();
  }, []);

  // colorScale memoizzata — ricalcola solo se cambiano dati o metrica
  const colorScale = useMemo(() => {
    if (data.length === 0) return () => COLOR_RAMP[0];
    return scaleQuantile<string>()
      .domain(data.map((d) => Number(d[selectedMetric])).filter(Boolean))
      .range([...COLOR_RAMP]);
  }, [data, selectedMetric]);

  // Breakpoint quantili per legenda dinamica
  const quantileBreaks = useMemo(() => {
    if (data.length === 0) return [];
    const vals = data.map((d) => Number(d[selectedMetric])).filter(Boolean).sort((a, b) => a - b);
    const q = (p: number) => vals[Math.floor(p * (vals.length - 1))];
    return [q(0), q(0.25), q(0.5), q(0.75), q(1)];
  }, [data, selectedMetric]);

  // Ranking province per metrica corrente
  const ranking = useMemo(() => {
    return [...data]
      .filter((d) => d[selectedMetric] != null)
      .sort((a, b) => Number(b[selectedMetric]) - Number(a[selectedMetric]));
  }, [data, selectedMetric]);

  // Ricerca
    // Ricerca (Solo per sigla provincia)
    const searchResult = useMemo(() => {
        const q = searchQuery.trim().toUpperCase();
        if (!q) return null;
        
        // Ora cerca solo nella sigla della provincia
        return data.find((d) => normalizeCode(d.sigla_provincia).includes(q)) ?? null;
      }, [data, searchQuery]);
    

  // Provincia attiva (hover > pinned > search)
  const activeProvince = hoveredProvince ?? pinnedProvince ?? searchResult;

  const handleGeoEnter = useCallback(
    (provinceData: any) => {
      if (provinceData) setHoveredProvince(provinceData);
    },
    []
  );

  const handleGeoLeave = useCallback(() => {
    setHoveredProvince(null);
  }, []);

  const handleGeoClick = useCallback((provinceData: any) => {
    if (!provinceData) return;
    // Su mobile apre il bottom sheet
    setTouchedProvince(provinceData);
    // Su desktop pinnare/spinnare
    setPinnedProvince((prev: any) =>
      prev?.sigla_provincia === provinceData.sigla_provincia ? null : provinceData
    );
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Caricamento mappa...
      </div>
    );
  }

  return (
    <main className={`font-sans min-h-screen bg-background p-4 md:p-8 lg:p-12 transition-all ${
        touchedProvince ? "pb-[300px] lg:pb-12" : "" 
      }`}>
      
      <div className="max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-10">

        {/* ── Colonna Sinistra ─────────────────────────────────────── */}
        <div className="order-2 lg:order-1 lg:col-span-1 space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
              Mappa Economica
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Redditi medi per provincia · Dati MEF 2024
            </p>
          </div>

          {/* Ricerca provincia */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Cerca provincia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selezione metrica */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Metrica
            </label>
            <div className="grid gap-2">
              {METRICS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMetric(m.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                    selectedMetric === m.id
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                      : "bg-card hover:bg-secondary border-border"
                  }`}
                >
                  {m.icon}
                  <span className="font-bold text-sm">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

                       {/* Card dettaglio — Nascosta su mobile, visibile da lg in su */}
          <div className="hidden lg:flex bg-card border border-border rounded-3xl p-5 shadow-sm min-h-[260px] flex-col justify-center transition-all">
            {isLoading ? (
              // ... resto del codice inalterato
              <div className="space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-full mt-4" />
                <Skeleton className="h-7 w-32" />
              </div>
            ) : error ? (
              <p className="text-destructive text-sm text-center">{error}</p>
            ) : activeProvince ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">
                      {activeProvince.regione}
                    </p>
                    <p className="text-3xl font-black">{activeProvince.sigla_provincia}</p>
                  </div>
                  {pinnedProvince?.sigla_provincia === activeProvince.sigla_provincia && (
                    <button
                      onClick={() => setPinnedProvince(null)}
                      className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                      aria-label="Rimuovi pin"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {METRICS.map((m) => (
                    <div key={m.id} className="flex justify-between items-center text-sm">
                      <span
                        className={
                          m.id === selectedMetric
                            ? "font-bold text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {m.label}
                      </span>
                      <span
                        className={
                          m.id === selectedMetric ? "font-bold text-lg" : "text-muted-foreground"
                        }
                      >
                        {fmt(Number(activeProvince[m.id] ?? 0))}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center text-sm italic">
                Passa il cursore o cerca una provincia
              </p>
            )}
          </div>

          {/* Ranking collassabile */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <button
              onClick={() => setShowRanking((v) => !v)}
              className="w-full flex items-center justify-between p-4 text-sm font-bold hover:bg-secondary/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Classifica province
              </span>
              {showRanking ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {showRanking && (
              <div className="max-h-64 overflow-y-auto divide-y divide-border">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                        <Skeleton className="h-4 w-4 shrink-0" />
                        <Skeleton className="h-4 w-10 shrink-0" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))
                  : ranking.map((d, i) => (
                      <button
                        key={d.sigla_provincia}
                        onClick={() =>
                          setPinnedProvince((prev: any) =>
                            prev?.sigla_provincia === d.sigla_provincia ? null : d
                          )
                        }
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-secondary/60 transition-colors ${
                          pinnedProvince?.sigla_provincia === d.sigla_provincia
                            ? "bg-primary/10"
                            : ""
                        }`}
                      >
                        <span className="text-xs text-muted-foreground w-5 shrink-0 text-right">
                          {i + 1}
                        </span>
                        <span className="font-bold w-8 shrink-0">{d.sigla_provincia}</span>
                        <span className="text-muted-foreground truncate flex-1 text-xs">
                          {d.regione}
                        </span>
                        <span className="font-semibold shrink-0">
                          {fmt(Number(d[selectedMetric]))}
                        </span>
                      </button>
                    ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Colonna Destra: Mappa ────────────────────────────────── */}
        <div className="order-1 lg:order-2 lg:col-span-2 bg-card border border-border rounded-[2rem] shadow-sm relative overflow-hidden flex items-center justify-center p-2 min-h-[320px] lg:min-h-[500px]">

          {/* Legenda dinamica */}
          <div className="absolute top-4 right-4 flex flex-col gap-1 items-end z-10">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">
              Reddito
            </p>
            <div className="flex h-2 w-28 rounded-full overflow-hidden">
              {COLOR_RAMP.map((c) => (
                <div key={c} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </div>
            {quantileBreaks.length > 0 && (
              <div className="flex justify-between w-28 mt-0.5">
                <span className="text-[9px] text-muted-foreground">
                  {fmt(quantileBreaks[0])}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {fmt(quantileBreaks[4])}
                </span>
              </div>
            )}
          </div>

          {/* Skeleton mappa */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-card/80 rounded-[2rem]">
              <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Caricamento dati…
              </div>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="text-center text-muted-foreground text-sm p-8">
              <p className="text-2xl mb-2">⚠️</p>
              <p>{error}</p>
            </div>
          )}

          <ComposableMap
            projection="geoAzimuthalEqualArea"
            projectionConfig={{ rotate: [-12.5, -42, 0], scale: 4500 }}
            className="w-full h-auto max-h-[700px] min-h-[300px] outline-none"
          >
            <ZoomableGroup center={[12.5, 42]} zoom={1} minZoom={1} maxZoom={5}>
              <Geographies geography={ITALY_PROVINCES_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const siglaGeo = normalizeCode(geo.properties.prov_acr);
                    const prov = data.find(
                      (d) => normalizeCode(d.sigla_provincia) === siglaGeo
                    );
                    const isActive =
                      activeProvince &&
                      normalizeCode(activeProvince.sigla_provincia) === siglaGeo;
                    const isSearch =
                      searchResult &&
                      normalizeCode(searchResult.sigla_provincia) === siglaGeo;

                    const baseFill = prov
                      ? colorScale(Number(prov[selectedMetric]))
                      : "#e2e8f0";

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => handleGeoEnter(prov)}
                        onMouseLeave={handleGeoLeave}
                        onClick={() => handleGeoClick(prov)}
                        onTouchStart={() => {
                          if (prov) setTouchedProvince(prov);
                        }}
                        style={{
                          default: {
                            fill: isSearch ? "#f59e0b" : baseFill,
                            stroke: isActive ? "#1e40af" : "#ffffff",
                            strokeWidth: isActive ? 1.5 : 0.5,
                            outline: "none",
                            transition: "fill 0.25s ease",
                            cursor: prov ? "pointer" : "default",
                          },
                          hover: {
                            fill: "#2563eb",
                            stroke: "#ffffff",
                            strokeWidth: 1.5,
                            outline: "none",
                            cursor: prov ? "pointer" : "default",
                          },
                          pressed: {
                            fill: "#1d4ed8",
                            outline: "none",
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Hint click/touch */}
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap select-none pointer-events-none hidden lg:block">
            Hover per i dettagli · Click per pinnare
          </p>
        </div>
      </div>

      {/* Bottom sheet mobile */}
      <BottomSheet
        province={touchedProvince}
        metric={selectedMetric}
        onClose={() => setTouchedProvince(null)}
      />
    </main>
  );
}
