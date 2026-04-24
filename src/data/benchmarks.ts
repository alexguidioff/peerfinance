// src/data/benchmarks.ts
import benchmarkData from './benchmarks.json';

export type AgeGroup = "18-25" | "26-30" | "31-35" | "36-40" | "41-50" | "51-60";
export type Region = "Nord" | "Centro" | "Sud" | "Isole";

// Definiamo l'interfaccia dei dati foglia per massima chiarezza
export interface BenchmarkMetrics {
  avgSavingsRate: number;
  avgNetWorth: number;
  avgMonthlyExpenses: number;
}

// Creiamo un Record TS per mappare esattamente la struttura del JSON
const typedBenchmarks: Record<AgeGroup, Record<Region, BenchmarkMetrics>> = 
  benchmarkData.benchmarks as Record<AgeGroup, Record<Region, BenchmarkMetrics>>;

export function getBenchmark(ageGroup: AgeGroup, region: Region): BenchmarkMetrics {
  return typedBenchmarks[ageGroup][region];
}

// Funzione helper per mappare l'età esatta alla fascia corrispondente
export function getAgeGroup(age: number): AgeGroup {
  if (age <= 25) return "18-25";
  if (age <= 30) return "26-30";
  if (age <= 35) return "31-35";
  if (age <= 40) return "36-40";
  if (age <= 50) return "41-50";
  return "51-60";
}
