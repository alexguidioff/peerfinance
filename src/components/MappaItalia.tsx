"use client";

import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";
import { createClient } from "@supabase/supabase-js";
import { Info, Map as MapIcon, TrendingUp, Users } from "lucide-react";

// Inizializza Supabase (fuori dal componente, così evitiamo il warning di prima)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ITALY_PROVINCES_URL = "https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_provinces.geojson";

const metrics = [
  { id: "reddito_medio", label: "Reddito Medio Generale", icon: <TrendingUp className="w-4 h-4"/> },
  { id: "reddito_dipendenti", label: "Media Dipendenti", icon: <Users className="w-4 h-4"/> },
  { id: "reddito_pensionati", label: "Media Pensionati", icon: <Info className="w-4 h-4"/> },
  { id: "reddito_autonomi", label: "Media Autonomi/P.IVA", icon: <MapIcon className="w-4 h-4"/> },
];

export default function MappaProvince() {
  const [isMounted, setIsMounted] = useState(false); // <-- Fondamentale per Next.js
  const [data, setData] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState("reddito_medio");
  const [hoveredProvince, setHoveredProvince] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true); // Comunica a React che siamo nel browser

    const fetchProvincialData = async () => {
      const { data: dbData, error } = await supabase.from("mef_redditi_province").select("*");
      if (error) {
        console.error("Errore da Supabase:", error);
      }
      setData(dbData || []);
    };
    fetchProvincialData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      console.log("Sample DB row:", data[0]);
      console.log("Sigle DB:", data.map(d => d.sigla_provincia).slice(0, 10));
    }
  }, [data]);

  // Proteggiamo la scala colori dai dati vuoti
  const colorScale = scaleQuantile<string>()
    .domain(data.length > 0 ? data.map(d => Number(d[selectedMetric])) : [0, 100])
    .range(["#dbeafe", "#93c5fd", "#3b82f6", "#2563eb", "#1e3a8a"]);

  // Finché non siamo nel browser, non renderizziamo nulla per evitare che la pagina diventi bianca per un errore di idratazione
  if (!isMounted) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Caricamento mappa...</div>;
  }

  return (
    <main className="font-sans min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Colonna Sinistra */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Mappa Economica</h1>
            <p className="text-muted-foreground mt-2">Analisi dei redditi medi per provincia (Dati MEF)</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Seleziona Metrica</label>
            <div className="grid gap-2">
              {metrics.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMetric(m.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
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

          {/* Dettaglio Hover */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm min-h-[180px] flex flex-col justify-center">
            {hoveredProvince ? (
              <>
                <h3 className="text-xs font-bold text-primary uppercase mb-1">{hoveredProvince.regione || "Regione"}</h3>
                <p className="text-3xl font-black">{hoveredProvince.sigla_provincia}</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Valore selezionato:</p>
                  <p className="text-2xl font-bold">
                    €{Number(hoveredProvince[selectedMetric] || 0).toLocaleString('it-IT')}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center italic">Passa il mouse sulla mappa per i dettagli</p>
            )}
          </div>
        </div>

        {/* Colonna Destra: Mappa */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] shadow-sm relative overflow-hidden flex items-center justify-center p-4">
          <div className="absolute top-6 right-6 flex flex-col gap-1 items-end z-10">
             <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Legenda Reddito</div>
             <div className="flex h-2 w-32 rounded-full overflow-hidden">
                {["#dbeafe", "#93c5fd", "#3b82f6", "#2563eb", "#1e3a8a"].map(c => (
                  <div key={c} className="flex-1" style={{ backgroundColor: c }} />
                ))}
             </div>
             <div className="flex justify-between w-32 text-[10px] text-muted-foreground mt-1">
                <span>Min</span>
                <span>Max</span>
             </div>
          </div>

          <ComposableMap 
            projection="geoAzimuthalEqualArea" 
            projectionConfig={{ rotate: [-12.5, -42, 0], scale: 4500 }}
            className="w-full h-auto max-h-[700px] outline-none"
          >
            <ZoomableGroup center={[12.5, 42]} zoom={1} minZoom={1} maxZoom={4}>
              <Geographies geography={ITALY_PROVINCES_URL}>
              {({ geographies }) => 
                  geographies.map((geo) => {
                    // Fix proprietà: openpolis usa prov_acr, non sigla
                    const siglaGeo = (geo.properties.prov_acr || "").trim().toUpperCase();
                    const provinceData = data.find(d => 
                      (d.sigla_provincia || "").trim().toUpperCase() === siglaGeo
                    );
                    if (geographies.length > 0) {
                        console.log("Sample geo props:", geographies[0].properties);
                        console.log("prov_acr sample:", geographies.slice(0, 5).map(g => g.properties.prov_acr));
                      }
                    // Colore fallback in esadecimale (evita variabili CSS in SVG su vecchi browser)
                    const fill = provinceData ? colorScale(Number(provinceData[selectedMetric])) : "#e2e8f0";

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => provinceData && setHoveredProvince(provinceData)}
                        onMouseLeave={() => setHoveredProvince(null)}
                        style={{
                          default: {
                            fill: fill,
                            stroke: "#ffffff",
                            strokeWidth: 0.5,
                            outline: "none",
                          },
                          hover: {
                            fill: "#2563eb",
                            stroke: "#ffffff",
                            strokeWidth: 1.5,
                            outline: "none",
                            cursor: "pointer"
                          },
                          pressed: { fill: "#1d4ed8", outline: "none" }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </div>
    </main>
  );
}
