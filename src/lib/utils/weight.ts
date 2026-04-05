import type { WeightUnit, HeightUnit } from "@/types/database";

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.20462 * 10) / 10;
}

export function cmToInches(cm: number): number {
  return Math.round(cm / 2.54 * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-500" };
  if (bmi < 25) return { label: "Normal", color: "text-green-500" };
  if (bmi < 30) return { label: "Overweight", color: "text-yellow-500" };
  return { label: "Obese", color: "text-red-500" };
}

export function formatWeight(weight: number, units: WeightUnit): string {
  const value = units === "lbs" ? kgToLbs(weight) : weight;
  return `${value.toFixed(1)} ${units}`;
}

export function formatHeight(heightCm: number, units: HeightUnit): string {
  if (units === "inches") {
    const totalInches = cmToInches(heightCm);
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  return `${heightCm} cm`;
}

export function toKg(weight: number, units: WeightUnit): number {
  return units === "lbs" ? lbsToKg(weight) : weight;
}

export function fromKg(weightKg: number, units: WeightUnit): number {
  return units === "lbs" ? kgToLbs(weightKg) : weightKg;
}

export function estimateCompletionDate(
  currentWeight: number,
  goalWeight: number,
  weeklyRate: number
): Date | null {
  if (weeklyRate === 0) return null;
  const remaining = currentWeight - goalWeight;
  if (remaining <= 0) return new Date();
  const weeksNeeded = remaining / Math.abs(weeklyRate);
  const date = new Date();
  date.setDate(date.getDate() + Math.ceil(weeksNeeded * 7));
  return date;
}
