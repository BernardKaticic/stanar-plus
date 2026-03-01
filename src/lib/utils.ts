import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Sigurno formatira iznos u eurima - 0, undefined i NaN prikazuje kao 0,00 € */
export function formatCurrency(value?: number | null): string {
  const num = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return `${num.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
