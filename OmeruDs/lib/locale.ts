// ============================================================================
// lib/locale.ts
// South African locale configuration. Designed to be swappable for future
// locales — all region-specific defaults live here.
// ============================================================================

export interface Locale {
  code: string;
  country: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  phonePlaceholder: string;
  cities: string[];
  addresses: string[];
  greeting: string;
  businessSuffix: string;
  examples: { chip: string; name: string; description: string; goal: string }[];
}

export const ZA: Locale = {
  code: "za",
  country: "South Africa",
  currency: "ZAR",
  currencySymbol: "R",
  phonePrefix: "+27",
  phonePlaceholder: "+27 82 123 4567",
  cities: [
    "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth",
    "Bloemfontein", "Stellenbosch", "Sandton", "Umhlanga", "Rosebank",
    "Braamfontein", "Melville", "Camps Bay", "Constantia", "Ballito",
  ],
  addresses: [
    "14 Long Street, Cape Town",
    "221 Jan Smuts Avenue, Rosebank",
    "8 Florida Road, Durban",
    "45 Rivonia Road, Sandton",
    "12 Kloof Street, Gardens",
    "30 Nelson Mandela Drive, Bloemfontein",
    "7 Dorp Street, Stellenbosch",
    "88 Oxford Road, Rosebank",
    "5 Umhlanga Rocks Drive, Umhlanga",
    "16 Bree Street, Cape Town",
  ],
  greeting: "Howzit",
  businessSuffix: "Business Account",
  examples: [
    {
      chip: "🍖 Braai restaurant",
      name: "",
      description: "A restaurant serving flame-grilled meats, boerewors rolls, pap and chakalaka in Johannesburg",
      goal: "Take orders",
    },
    {
      chip: "💇 Hair salon",
      name: "",
      description: "A trendy hair salon in Cape Town offering cuts, braids, colour and bridal styling",
      goal: "Take bookings",
    },
    {
      chip: "🏡 Estate agent",
      name: "",
      description: "An estate agency selling and renting apartments and family homes in Sandton and Rosebank",
      goal: "Book viewings",
    },
    {
      chip: "🦷 Dental practice",
      name: "",
      description: "A modern dental practice in Durban offering check-ups, hygiene and cosmetic treatments",
      goal: "Take bookings",
    },
    {
      chip: "🏨 Boutique lodge",
      name: "",
      description: "A boutique lodge in Stellenbosch wine country with vineyard views and a spa",
      goal: "Drive to checkout",
    },
    {
      chip: "🧘 Yoga studio",
      name: "",
      description: "A yoga and pilates studio in Melville with classes, memberships and 1:1 sessions",
      goal: "Take bookings",
    },
  ],
};

// Active locale — swap this when adding new regions
export const LOCALE = ZA;

// Utility: format price in active locale
export function formatPrice(amount: number): string {
  return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Utility: format phone number for display
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("27") && digits.length === 11) {
    return `+27 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

// Utility: get a random SA city
export function randomCity(seed?: number): string {
  const idx = seed !== undefined ? Math.abs(seed) % LOCALE.cities.length : Math.floor(Math.random() * LOCALE.cities.length);
  return LOCALE.cities[idx];
}

// Utility: get a random SA address
export function randomAddress(seed?: number): string {
  const idx = seed !== undefined ? Math.abs(seed) % LOCALE.addresses.length : Math.floor(Math.random() * LOCALE.addresses.length);
  return LOCALE.addresses[idx];
}
