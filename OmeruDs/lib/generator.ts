import { Flow, Message, Button, ListRow } from "./types";
import { slugify } from "./flows";

// ============================================================================
// lib/generator.ts
// Turn a free-text business description into a believable, varied WhatsApp
// conversation Flow. Fully offline and deterministic for a given idea, so the
// same input always produces the same demo (great for repeatable pitches) while
// different inputs feel distinct. No API key required.
// ============================================================================

// ---- tiny seeded RNG -------------------------------------------------------
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type RNG = () => number;
const pick = <T,>(r: RNG, arr: T[]): T => arr[Math.floor(r() * arr.length) % arr.length];
const rangeInt = (r: RNG, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
const maybe = (r: RNG, p: number) => r() < p;
const shuffle = <T,>(r: RNG, arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const title = (s: string) =>
  s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

// ---- categories ------------------------------------------------------------
type Category =
  | "restaurant" | "cafe" | "grocery" | "retail" | "beauty" | "fitness"
  | "health" | "realestate" | "hotel" | "education" | "automotive"
  | "events" | "generic";

interface CatConfig {
  color: string;
  subtitle: string;
  quickReplies: string[];        // 3 quick-reply button titles; [0] = the "browse" path
  browseReply: string;           // user's tapped reply for the browse path
  list: { header: string; body: string; footer: (b: string) => string; button: string };
  itemTemplates: string[];       // use {T} = Title(theme)
  defaultThing: string;          // when no theme detected
  serviceItems?: string[];       // for service categories (overrides templates)
  priceBand: [number, number];
  priceSuffix?: string;          // e.g. " / night"
  bigMoney?: boolean;            // thousands (real estate)
  pickReply: string;             // "{item}" gets injected
  cardButtons: [string, string];
  poll: { q: string; opts: string[] };
  hasPremises: boolean;
  addresses: string[];
  ctaLabel: string;
  ctaText: string;
  docName: string;               // base file name
  confirm: string;               // closing bot text (use {biz})
  nameSuffixes: string[];
  imageKey: string;
  unit: string;                  // order / booking / appointment …
}

const C: Record<Category, CatConfig> = {
  restaurant: {
    color: "#c2410c", subtitle: "Business Account",
    quickReplies: ["See the menu", "Book a table", "Order delivery"],
    browseReply: "Can I see the menu?",
    list: { header: "Today’s menu", body: "Freshly prepared — tap to see what’s on.", footer: (b) => b, button: "View menu" },
    itemTemplates: ["{T} platter", "Signature {T} bowl", "{T} of the day", "House {T} special", "Chilled {T} juice", "{T} dessert"],
    defaultThing: "chef’s",
    priceBand: [7, 24], pickReply: "I’ll take the {item} 😋",
    cardButtons: ["Add to order", "More info"],
    poll: { q: "When shall we expect you?", opts: ["Lunch (12–2pm)", "Early dinner (5–7pm)", "Late dinner (7–9pm)"] },
    hasPremises: true,
    addresses: ["14 Market Street", "8 Riverside Walk", "221 High Road", "5 Old Town Square"],
    ctaLabel: "Pay & confirm", ctaText: "Ready when you are — confirm your order below.",
    docName: "Receipt", confirm: "Order confirmed! 🎉 We’ll have it ready for you. Thanks for choosing {biz}.",
    nameSuffixes: ["Kitchen", "Bistro", "Eatery", "Table", "Grill", "House"],
    imageKey: "food", unit: "order",
  },
  cafe: {
    color: "#92400e", subtitle: "Business Account",
    quickReplies: ["See the menu", "Order ahead", "Opening hours"],
    browseReply: "What’s on today?",
    list: { header: "On the counter", body: "Tap to browse today’s board.", footer: (b) => b, button: "View board" },
    itemTemplates: ["{T} flat white", "Iced {T} latte", "{T} cold brew", "{T} bun", "{T} cookie", "Pot of {T} tea"],
    defaultThing: "house",
    priceBand: [3, 9], pickReply: "One {item} please ☕",
    cardButtons: ["Add to order", "Make it a combo"],
    poll: { q: "Pick-up time?", opts: ["In 10 min", "In 30 min", "In an hour"] },
    hasPremises: true,
    addresses: ["3 Station Approach", "47 Bridge Street", "12 Park Lane", "9 Canal Side"],
    ctaLabel: "Pay & collect", ctaText: "Tap to pay — skip the queue and collect at the counter.",
    docName: "Receipt", confirm: "All set! ☕ Your order will be waiting. See you soon at {biz}.",
    nameSuffixes: ["Coffee", "Café", "Roastery", "Espresso Bar", "& Co."],
    imageKey: "coffee", unit: "order",
  },
  grocery: {
    color: "#15803d", subtitle: "Business Account",
    quickReplies: ["Browse products", "Weekly box", "Delivery slots"],
    browseReply: "Show me what you’ve got",
    list: { header: "Fresh this week", body: "Hand-picked and ready to deliver.", footer: (b) => b, button: "Browse products" },
    itemTemplates: ["Fresh {T} box", "Weekly {T} bundle", "Organic {T} selection", "Family {T} pack", "{T} of the week", "Premium {T} crate"],
    defaultThing: "seasonal",
    priceBand: [6, 29], pickReply: "I’d like the {item}",
    cardButtons: ["Add to basket", "See contents"],
    poll: { q: "Which delivery day suits you?", opts: ["Tomorrow AM", "Tomorrow PM", "This weekend"] },
    hasPremises: false,
    addresses: ["Unit 4, Greenway Estate", "The Old Dairy, Mill Lane"],
    ctaLabel: "Checkout securely", ctaText: "Your basket’s ready — checkout below and pick a slot.",
    docName: "Order_Summary", confirm: "Order placed! 🥕 We’ll text you when it’s on the way. Thanks from {biz}.",
    nameSuffixes: ["Market", "Grocer", "Larder", "Pantry", "Fresh", "& Sons"],
    imageKey: "grocery", unit: "order",
  },
  retail: {
    color: "#7c3aed", subtitle: "Business Account",
    quickReplies: ["Browse products", "Track my order", "Today’s offers"],
    browseReply: "I’d like to browse",
    list: { header: "Featured products", body: "A few favourites picked for you.", footer: (b) => b, button: "Browse products" },
    itemTemplates: ["The Everyday {T}", "Premium {T}", "Limited-edition {T}", "{T} gift set", "{T} starter bundle", "Classic {T}"],
    defaultThing: "signature",
    priceBand: [12, 89], pickReply: "I like the {item} — tell me more",
    cardButtons: ["Add to cart", "Size guide"],
    poll: { q: "Which finish do you prefer?", opts: ["Classic", "Bold", "Minimal"] },
    hasPremises: false,
    addresses: ["Unit 12, Design Quarter", "The Studio, Maker’s Yard"],
    ctaLabel: "Pay securely", ctaText: "Happy with your pick? Checkout below — free returns within 30 days.",
    docName: "Receipt", confirm: "Order confirmed! 📦 You’ll get tracking shortly. Thanks for shopping with {biz}.",
    nameSuffixes: ["Co.", "Studio", "Goods", "Supply", "Collective", "Atelier"],
    imageKey: "retail", unit: "order",
  },
  beauty: {
    color: "#db2777", subtitle: "Business Account",
    quickReplies: ["Book an appointment", "See services", "Prices"],
    browseReply: "I’d like to book in",
    list: { header: "Our services", body: "Choose a treatment to get started.", footer: (b) => b, button: "View services" },
    itemTemplates: ["Signature {T} treatment", "{T} & finish", "Luxury {T} ritual", "Express {T}", "Bridal {T} package"],
    defaultThing: "signature",
    serviceItems: ["Cut & finish", "Colour & gloss", "Luxury facial", "Manicure & file", "Bridal package"],
    priceBand: [18, 120], pickReply: "I’d love the {item}",
    cardButtons: ["Book this", "Add to my visit"],
    poll: { q: "Which day works best?", opts: ["This Thursday", "Friday", "Saturday morning"] },
    hasPremises: true,
    addresses: ["27 Boutique Row", "4 Maple Court", "88 Kings Parade", "16 Lavender Lane"],
    ctaLabel: "Confirm booking", ctaText: "Lovely — confirm your appointment and we’ll hold the slot.",
    docName: "Booking_Confirmation", confirm: "You’re booked in! 💖 A reminder will follow the day before. See you at {biz}.",
    nameSuffixes: ["Studio", "Salon", "Beauty", "Spa", "Lounge", "Aesthetics"],
    imageKey: "beauty", unit: "appointment",
  },
  fitness: {
    color: "#0d9488", subtitle: "Business Account",
    quickReplies: ["Book a class", "Memberships", "Timetable"],
    browseReply: "I want to book a class",
    list: { header: "This week’s classes", body: "Reserve your spot — tap a session.", footer: (b) => b, button: "View classes" },
    itemTemplates: ["{T} — Beginners", "{T} — Power hour", "Sunrise {T}", "{T} & mobility", "Open {T} session"],
    defaultThing: "strength",
    serviceItems: ["HIIT — 45 min", "Strength & conditioning", "Sunrise yoga", "Spin class", "Personal training (1:1)"],
    priceBand: [8, 65], pickReply: "Sign me up for {item} 💪",
    cardButtons: ["Reserve spot", "Class details"],
    poll: { q: "What’s your main goal?", opts: ["Build strength", "Lose weight", "Feel energised"] },
    hasPremises: true,
    addresses: ["Arch 9, The Sidings", "Unit 2, Foundry Lane", "120 Athletic Way"],
    ctaLabel: "Confirm booking", ctaText: "Spot’s yours — confirm below and we’ll see you on the mat.",
    docName: "Class_Booking", confirm: "You’re in! 🙌 Arrive 5 min early. Let’s do this — Team {biz}.",
    nameSuffixes: ["Fitness", "Gym", "Studio", "Athletic", "Strength Co.", "Movement"],
    imageKey: "fitness", unit: "booking",
  },
  health: {
    color: "#0369a1", subtitle: "Business Account",
    quickReplies: ["Book an appointment", "Our services", "Opening hours"],
    browseReply: "I’d like to book an appointment",
    list: { header: "How can we help?", body: "Select what you’d like to book.", footer: (b) => b, button: "View services" },
    itemTemplates: ["{T} consultation", "{T} check-up", "{T} review", "New patient {T}", "{T} follow-up"],
    defaultThing: "general",
    serviceItems: ["New patient check-up", "Routine review", "Consultation (30 min)", "Follow-up appointment", "Same-day urgent slot"],
    priceBand: [25, 150], pickReply: "I’d like to book the {item}",
    cardButtons: ["Book this", "Ask a question"],
    poll: { q: "Which time of day suits you?", opts: ["Morning", "Afternoon", "After work"] },
    hasPremises: true,
    addresses: ["2 Wellbeing Court", "45 Harley Walk", "7 Parkview Clinic"],
    ctaLabel: "Confirm appointment", ctaText: "Please confirm and we’ll reserve the slot with your clinician.",
    docName: "Appointment_Details", confirm: "Appointment confirmed. ✅ You’ll receive a reminder by SMS. Warm regards, {biz}.",
    nameSuffixes: ["Clinic", "Practice", "Health", "Care", "Surgery", "Centre"],
    imageKey: "health", unit: "appointment",
  },
  realestate: {
    color: "#b45309", subtitle: "Business Account",
    quickReplies: ["View listings", "Book a viewing", "Sell my home"],
    browseReply: "Show me what’s available",
    list: { header: "Available now", body: "A few that match — tap to see details.", footer: (b) => b, button: "View listings" },
    itemTemplates: ["2-bed {T} apartment", "3-bed {T} house", "Modern {T} loft", "{T} family home", "Studio in {T}"],
    defaultThing: "city",
    priceBand: [245, 950], bigMoney: true, priceSuffix: "",
    pickReply: "I’d love to view the {item}",
    cardButtons: ["Book a viewing", "Full details"],
    poll: { q: "When could you view?", opts: ["This weekend", "A weekday evening", "Next week"] },
    hasPremises: false,
    addresses: ["Office: 30 Estate Avenue", "Office: 5 Crown Buildings"],
    ctaLabel: "Confirm viewing", ctaText: "Great choice — confirm a viewing slot and we’ll meet you there.",
    docName: "Property_Brochure", confirm: "Viewing booked! 🏡 We’ll send directions and meet you on site. — {biz}.",
    nameSuffixes: ["Estates", "Property", "Homes", "& Co. Realty", "Living"],
    imageKey: "house", unit: "viewing",
  },
  hotel: {
    color: "#1d4ed8", subtitle: "Business Account",
    quickReplies: ["Check availability", "Room types", "Book a stay"],
    browseReply: "What rooms do you have?",
    list: { header: "Our rooms", body: "Tap a room to check availability.", footer: (b) => b, button: "View rooms" },
    itemTemplates: ["{T} Double", "{T} Suite", "Deluxe {T} room", "{T} Sea-view", "Family {T} room"],
    defaultThing: "Classic",
    priceBand: [79, 320], priceSuffix: " / night",
    pickReply: "I’d like to book the {item}",
    cardButtons: ["Check dates", "Room details"],
    poll: { q: "How many nights?", opts: ["1 night", "2–3 nights", "A week"] },
    hasPremises: true,
    addresses: ["1 Seafront Parade", "12 Castle Hill", "40 Garden Terrace"],
    ctaLabel: "Confirm & pay", ctaText: "Lovely choice — confirm your dates and secure the room below.",
    docName: "Booking_Confirmation", confirm: "Booking confirmed! 🧳 We can’t wait to host you. Safe travels — {biz}.",
    nameSuffixes: ["Hotel", "Rooms", "Retreat", "Lodge", "House", "Stays"],
    imageKey: "hotel", unit: "stay",
  },
  education: {
    color: "#4338ca", subtitle: "Business Account",
    quickReplies: ["See courses", "Enrol now", "Book a call"],
    browseReply: "Tell me about your courses",
    list: { header: "Popular courses", body: "Pick one to see dates and pricing.", footer: (b) => b, button: "View courses" },
    itemTemplates: ["{T} for beginners", "Intermediate {T}", "{T} masterclass", "1:1 {T} coaching", "Weekend {T} intensive"],
    defaultThing: "core",
    priceBand: [49, 499], priceSuffix: "",
    pickReply: "I’m interested in {item}",
    cardButtons: ["Enrol now", "Download syllabus"],
    poll: { q: "How would you like to learn?", opts: ["In person", "Live online", "Self-paced"] },
    hasPremises: false,
    addresses: ["Campus: 18 Scholars Way", "Studio: 6 Learning Lane"],
    ctaLabel: "Enrol securely", ctaText: "Ready to start? Enrol below and we’ll send your welcome pack.",
    docName: "Syllabus", confirm: "You’re enrolled! 🎓 Welcome aboard — your first lesson details are on the way from {biz}.",
    nameSuffixes: ["Academy", "School", "Institute", "Tutoring", "Learning", "Coaching"],
    imageKey: "education", unit: "enrolment",
  },
  automotive: {
    color: "#334155", subtitle: "Business Account",
    quickReplies: ["Book a service", "Our packages", "Get a quote"],
    browseReply: "I’d like to book my car in",
    list: { header: "Service packages", body: "Choose a package to get started.", footer: (b) => b, button: "View packages" },
    itemTemplates: ["{T} wash & wax", "Full {T} valet", "{T} interior detail", "{T} service & MOT", "Express {T} clean"],
    defaultThing: "premium",
    serviceItems: ["Express wash", "Full valet", "Interior detail", "Service & MOT", "Ceramic protection"],
    priceBand: [15, 220], priceSuffix: "",
    pickReply: "I’ll go with the {item}",
    cardButtons: ["Book this", "What’s included"],
    poll: { q: "When can you drop off?", opts: ["Tomorrow AM", "Tomorrow PM", "Weekend"] },
    hasPremises: true,
    addresses: ["Unit 7, Trade Park", "9 Forecourt Road", "Bay 3, Motorway Services"],
    ctaLabel: "Confirm booking", ctaText: "All set — confirm your slot and we’ll get her looking brand new.",
    docName: "Job_Sheet", confirm: "Booked in! 🚗 We’ll text when she’s ready. Cheers from the team at {biz}.",
    nameSuffixes: ["Auto", "Motors", "Garage", "Detailing", "Service Centre", "Car Care"],
    imageKey: "car", unit: "booking",
  },
  events: {
    color: "#9d174d", subtitle: "Business Account",
    quickReplies: ["See packages", "Check a date", "Get a quote"],
    browseReply: "Tell me about your packages",
    list: { header: "Our packages", body: "Pick a package to see what’s included.", footer: (b) => b, button: "View packages" },
    itemTemplates: ["{T} — Essentials", "{T} — Signature", "{T} — Full day", "Half-day {T}", "{T} & highlights film"],
    defaultThing: "event",
    priceBand: [199, 2500], bigMoney: false, priceSuffix: "",
    pickReply: "The {item} looks perfect",
    cardButtons: ["Check my date", "See portfolio"],
    poll: { q: "What’s the occasion?", opts: ["Wedding", "Corporate", "Celebration"] },
    hasPremises: false,
    addresses: ["Studio: 2 Lens Court", "Studio: 14 Gallery Mews"],
    ctaLabel: "Reserve my date", ctaText: "Let’s make it happen — reserve your date below to lock the diary.",
    docName: "Package_Guide", confirm: "Date reserved! 🥂 We’ll be in touch to plan the details. Excited to work with you — {biz}.",
    nameSuffixes: ["Studio", "Events", "Photography", "Co.", "Productions", "Collective"],
    imageKey: "events", unit: "booking",
  },
  generic: {
    color: "#0f766e", subtitle: "Business Account",
    quickReplies: ["See what we offer", "Book a call", "Get a quote"],
    browseReply: "What do you offer?",
    list: { header: "How we can help", body: "Tap an option to learn more.", footer: (b) => b, button: "View options" },
    itemTemplates: ["{T} — Starter", "{T} — Pro", "{T} consultation", "Custom {T} project", "Monthly {T} plan"],
    defaultThing: "core",
    priceBand: [29, 499], priceSuffix: "",
    pickReply: "I’m interested in {item}",
    cardButtons: ["Get started", "Learn more"],
    poll: { q: "What matters most to you?", opts: ["Speed", "Price", "Quality"] },
    hasPremises: false,
    addresses: ["Office: 10 Enterprise House", "Suite 5, Commerce Court"],
    ctaLabel: "Book a call", ctaText: "Sounds good — book a quick call below and we’ll take it from there.",
    docName: "Overview", confirm: "All booked! 🙌 We’ll be in touch shortly. Thanks for reaching out to {biz}.",
    nameSuffixes: ["Co.", "Group", "Studio", "Partners", "Solutions", "Works"],
    imageKey: "office", unit: "enquiry",
  },
};

// keyword → category (checked top to bottom; first match wins)
const KEYWORDS: [Category, string[]][] = [
  ["cafe", ["café", "cafe", "coffee", "espresso", "roastery", "tea room", "bakery", "patisserie", "brunch"]],
  ["restaurant", ["restaurant", "diner", "eatery", "bistro", "kitchen", "takeaway", "take-away", "pizzeria", "pizza", "grill", "burger", "sushi", "ramen", "street food", "food truck", "meals", "food"]],
  ["grocery", ["grocery", "grocer", "greengrocer", "market", "produce", "farm shop", "deli", "butcher", "fishmonger", "fruit", "vegetable", "veg", "organic", "wholefood"]],
  ["beauty", ["salon", "beauty", "spa", "barber", "hair", "nails", "nail", "lashes", "brows", "facial", "aesthetic", "massage", "waxing", "tanning"]],
  ["fitness", ["gym", "fitness", "yoga", "pilates", "crossfit", "spin", "personal train", "martial", "boxing", "wellness studio"]],
  ["health", ["clinic", "dental", "dentist", "doctor", "gp ", "medical", "physio", "chiropract", "therapy", "therapist", "counsel", "vet", "veterinary", "optician", "pharmacy", "health"]],
  ["realestate", ["real estate", "realtor", "estate agent", "property", "lettings", "apartments", "homes for sale", "houses for sale", "mortgage"]],
  ["hotel", ["hotel", "b&b", "bed and breakfast", "bnb", "hostel", "guest house", "resort", "lodge", "villa", "airbnb", "tour", "travel agency", "holiday"]],
  ["education", ["course", "tutor", "tutoring", "academy", "school", "coaching", "lessons", "training provider", "bootcamp", "workshop", "education", "language class"]],
  ["automotive", ["car wash", "valet", "detailing", "garage", "mechanic", "auto", "motors", "mot", "tyre", "vehicle", "bodyshop"]],
  ["events", ["photograph", "photographer", "videograph", "wedding", "event", "dj", "florist", "flowers", "party planner", "venue hire", "catering company"]],
  ["retail", ["shop", "store", "boutique", "retail", "clothing", "clothes", "fashion", "jewellery", "jewelry", "shoes", "skincare", "cosmetics", "candle", "furniture", "homeware", "bookshop", "books", "toys", "electronics", "gift", "ecommerce", "e-commerce", "online store", "brand", "products"]],
];

const STOP = new Set([
  "i", "we", "you", "a", "an", "the", "my", "our", "your", "have", "has", "had", "is", "are",
  "am", "be", "run", "running", "own", "owns", "that", "which", "who", "this", "these", "those",
  "and", "or", "of", "for", "to", "in", "on", "at", "with", "from", "by", "as", "it", "its",
  "business", "company", "shop", "store", "startup", "brand", "small", "local", "new", "online",
  "sells", "sell", "selling", "offer", "offers", "offering", "provide", "provides", "providing",
  "services", "service", "products", "product", "called", "named", "name", "based", "do", "does",
  "make", "makes", "making", "want", "wants", "would", "like", "help", "helps", "people",
]);

export function detectCategory(idea: string): Category {
  const t = idea.toLowerCase();
  for (const [cat, words] of KEYWORDS) {
    if (words.some((w) => t.includes(w))) return cat;
  }
  return "generic";
}

function extractName(idea: string): string | null {
  const m = idea.match(/\b(?:called|named)\s+["“']?([A-Za-z0-9'&.\- ]{2,40}?)["”']?(?:["”']|[.,!?]|\s+(?:that|which|who|in|on|at|—|-)|$)/i);
  if (m) return m[1].trim();
  const q = idea.match(/["“']([^"“”']{2,40})["”']/);
  if (q) return q[1].trim();
  return null;
}

function extractTheme(idea: string, cat: Category): string {
  // strip the *detected category's* trigger words + stopwords, keep object nouns
  const t = idea.toLowerCase().replace(/[^a-z0-9'&\- ]/g, " ");
  const own = KEYWORDS.find(([c]) => c === cat)?.[1] ?? [];
  const catWords = new Set<string>();
  own.forEach((w) => w.split(" ").forEach((p) => catWords.add(p)));
  const tokens = t.split(/\s+/).filter(Boolean);
  const left = tokens.filter((w) => !STOP.has(w) && !catWords.has(w) && w.length > 2);
  if (left.length === 0) return "";
  // the object of "sells X" tends to be last; prefer it
  const word = left[left.length - 1];
  return word.replace(/s$/i, (s) => (word.length > 4 ? "" : s)); // light singularise
}

function currencyOf(idea: string): string {
  const t = idea.toLowerCase();
  if (/[$]|\bdollars?\b|\busd\b|\bus\b|u\.s\.?a?\b|america|canada|\bcad\b|new york|texas|california/.test(t)) return "$";
  if (/[€]|\beuros?\b|\beur\b|germany|france|spain|italy|berlin|paris|madrid|netherlands|portugal|ireland/.test(t)) return "€";
  if (/[£]|\bpounds?\b|\bgbp\b|\buk\b|united kingdom|england|london|british/.test(t)) return "£";
  return "R"; // Default to South African Rand
}

function money(r: RNG, cfg: CatConfig, currency: string): string {
  const [a, b] = cfg.priceBand;
  if (cfg.bigMoney) {
    const v = rangeInt(r, a, b) * 1000;
    return `${currency}${v.toLocaleString("en-GB")}`;
  }
  const base = rangeInt(r, a, b);
  const cents = pick(r, [".00", ".50", ".99", ".95"]);
  return `${currency}${base}${cents}${cfg.priceSuffix ?? ""}`;
}

// ---- images (known-stable Unsplash photos; safe to omit if unsure) ---------
const IMG: Record<string, string> = {
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=720&q=80",
  fruit: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=720&q=80",
  coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=720&q=80",
  grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=720&q=80",
  retail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=720&q=80",
  beauty: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=720&q=80",
  fitness: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=720&q=80",
  health: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=720&q=80",
  house: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=720&q=80",
  hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=720&q=80",
  education: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=720&q=80",
  car: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=720&q=80",
  events: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=720&q=80",
  flowers: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=720&q=80",
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=720&q=80",
};
function imageFor(theme: string, cfg: CatConfig): string {
  const t = theme.toLowerCase();
  if (t && IMG[t]) return IMG[t];
  if (/fruit|berry|mango|apple|smoothie|juice/.test(t)) return IMG.fruit;
  if (/flower|floral|bouquet/.test(t)) return IMG.flowers;
  return IMG[cfg.imageKey] ?? IMG.office;
}

// ---- waveform for the owner voice note -------------------------------------
function wave(r: RNG, n = 30): number[] {
  return Array.from({ length: n }, () => 0.25 + r() * 0.75);
}

// ---- name + avatar ---------------------------------------------------------
function buildName(r: RNG, idea: string, theme: string, cfg: CatConfig): string {
  const explicit = extractName(idea);
  if (explicit) return explicit;
  const adj = pick(r, ["The", "", "", "Urban", "Fresh", "Little", "Golden", "Daily", "House of"]);
  const core = theme ? title(theme) : pick(r, ["Hawthorn", "Maple", "Harbour", "Willow", "Crown", "Oak", "Aurora"]);
  const suffix = pick(r, cfg.nameSuffixes);
  const parts = [adj, core, suffix].filter(Boolean);
  // avoid awkward "House of X House"
  let name = parts.join(" ").replace(/\s+/g, " ").trim();
  if (adj === "House of") name = `House of ${core}`;
  return name;
}
function initialsOf(name: string): string {
  return name
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(/\s+/)
    .filter((w) => !/^(the|of|&|and)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || name.slice(0, 2).toUpperCase();
}

// ---- offerings -------------------------------------------------------------
function buildItems(r: RNG, theme: string, cfg: CatConfig): string[] {
  if (cfg.serviceItems && !theme) return [...cfg.serviceItems];
  const T = title(theme || cfg.defaultThing);
  const fromTemplates = shuffle(r, cfg.itemTemplates).map((tpl) => tpl.replace(/\{T\}/g, T));
  // for service categories with a theme, blend one themed + the rest services
  if (cfg.serviceItems && theme) {
    return [fromTemplates[0], ...cfg.serviceItems.slice(0, 4)];
  }
  return fromTemplates;
}

// ---- the assembler ---------------------------------------------------------
export function buildFlowFromIdea(idea: string): Flow {
  const clean = (idea || "").trim() || "a small local business";
  const seed = hashStr(clean.toLowerCase());
  const r = mulberry32(seed);

  const cat = detectCategory(clean);
  const cfg = C[cat];
  const theme = extractTheme(clean, cat);
  const currency = currencyOf(clean);
  const name = buildName(r, clean, theme, cfg);
  const items = buildItems(r, theme, cfg).slice(0, 5);

  // a stable clock that ticks forward
  let hh = rangeInt(r, 9, 18);
  let mm = rangeInt(r, 0, 55);
  const tick = () => {
    mm += rangeInt(r, 1, 3);
    if (mm >= 60) { mm -= 60; hh = (hh + 1) % 24; }
    return `${hh}:${mm.toString().padStart(2, "0")}`;
  };

  const M: Message[] = [];
  const bot = (m: Partial<Message>): Message => ({ from: "bot", time: tick(), ...m } as Message);
  const usr = (m: Partial<Message>): Message => ({ from: "user", time: tick(), status: "read", ...m } as Message);

  // 1) chrome
  M.push({ type: "system", text: "This business uses a secure service to manage this chat." });
  M.push({ type: "date", text: "Today" });

  // 2) greeting
  M.push(usr({ type: "text", text: pick(r, ["Hi", "Hello", "Hey 👋", "Hi there"]) }));

  const qr = cfg.quickReplies;
  M.push(bot({
    type: "buttons",
    text: `Welcome to *${name}*! 👋 I’m your assistant — what can I help you with today?`,
    buttons: [
      { title: qr[0], reply: cfg.browseReply, icon: "📋" },
      { title: qr[1], icon: "🗓️" },
      { title: qr[2], icon: "💬" },
    ] as Button[],
  }));

  // 3) user takes the browse path → list
  M.push(usr({ type: "text", text: cfg.browseReply }));

  const rows: ListRow[] = items.map((it, i) => ({
    id: `it-${i}`,
    title: it,
    description: money(r, cfg, currency),
  }));
  M.push(bot({
    type: "list",
    list: {
      header: cfg.list.header,
      body: cfg.list.body,
      footer: cfg.list.footer(name),
      button: cfg.list.button,
      sections: [{ title: theme ? title(theme) : "Popular", rows }],
    },
  }));

  // 4) user picks an item → product/rich card
  const chosen = rows[rangeInt(r, 0, Math.min(2, rows.length - 1))];
  M.push(usr({ type: "text", text: cfg.pickReply.replace("{item}", chosen.title) }));

  const useProduct = maybe(r, 0.5);
  const img = imageFor(theme, cfg);
  if (useProduct) {
    M.push(bot({
      type: "product",
      product: {
        image: img,
        name: chosen.title,
        price: chosen.description,
        description: pick(r, [
          "A customer favourite — great choice!",
          "One of our most popular picks.",
          "Beautifully done, every time.",
          "Highly rated by our regulars.",
        ]),
        catalog: "See full catalogue",
      },
    }));
  } else {
    M.push(bot({
      type: "card",
      card: {
        image: img,
        title: chosen.title,
        subtitle: chosen.description,
        body: pick(r, [
          "Here are the details. Shall I go ahead and set this up for you?",
          "Lovely choice. Want me to lock this in?",
          "Great pick — ready when you are.",
        ]),
        buttons: [{ title: cfg.cardButtons[0], reply: "Yes, let’s do it" }, { title: cfg.cardButtons[1] }] as Button[],
      },
    }));
  }

  // 5) optional poll (preferences / scheduling)
  if (maybe(r, 0.8)) {
    M.push(usr({ type: "text", text: pick(r, ["Yes, let’s do it", "Sounds good 👍", "Perfect"]) }));
    M.push(bot({
      type: "poll",
      poll: {
        question: cfg.poll.q,
        multiple: false,
        options: cfg.poll.opts.map((o) => ({ text: o, votes: 0 })),
      },
    }));
    M.push(usr({ type: "text", text: cfg.poll.opts[rangeInt(r, 0, cfg.poll.opts.length - 1)] }));
  }

  // 6) optional owner voice note (adds a human, premium feel)
  if (maybe(r, 0.6)) {
    M.push(bot({
      type: "voice",
      voice: { duration: `0:${rangeInt(r, 8, 38).toString().padStart(2, "0")}`, waveform: wave(r) },
    }));
  }

  // 7) optional location for places with premises
  if (cfg.hasPremises && maybe(r, 0.8)) {
    M.push(bot({
      type: "location",
      location: {
        name,
        address: `${pick(r, cfg.addresses)}, ${pick(r, ["Cape Town", "Johannesburg", "Durban", "Pretoria", "Sandton", "Stellenbosch"])}`,
      },
    }));
  }

  // 8) CTA — the conversion moment
  M.push(bot({
    type: "cta",
    cta: {
      header: cfg.ctaLabel,
      text: cfg.ctaText,
      display: cfg.ctaLabel,
      url: "https://example.com/checkout",
    },
  }));

  // 9) user reacts to the CTA (reaction attaches to the previous bubble)
  if (maybe(r, 0.7)) {
    M.push(usr({ type: "reaction", reaction: pick(r, ["👍", "❤️", "🙌", "🔥"]) }));
  }

  // 10) optional document (receipt / brochure)
  if (maybe(r, 0.7)) {
    M.push(bot({
      type: "document",
      document: {
        name: `${cfg.docName}_${initialsOf(name)}-${rangeInt(r, 1000, 9999)}.pdf`,
        size: `${rangeInt(r, 90, 480)} kB`,
        pages: `${rangeInt(r, 1, 6)} pages`,
        ext: "PDF",
      },
    }));
  }

  // 11) confirmation
  M.push(bot({ type: "text", text: cfg.confirm.replace(/\{biz\}/g, name) }));

  const flow: Flow = {
    id: `${slugify(name)}-${(seed % 46656).toString(36).padStart(3, "0")}`,
    name,
    subtitle: cfg.subtitle,
    avatar: { initials: initialsOf(name), color: cfg.color },
    verified: true,
    phoneTime: `${rangeInt(r, 8, 21)}:${rangeInt(r, 0, 59).toString().padStart(2, "0")}`,
    battery: rangeInt(r, 38, 96),
    theme: "dark",
    wallpaper: "default",
    speed: 1,
    messages: M,
  };
  return flow;
}

// human-readable label for the detected category (used in the UI)
export function categoryLabel(idea: string): string {
  const map: Record<Category, string> = {
    restaurant: "Restaurant", cafe: "Café", grocery: "Grocery & fresh food",
    retail: "Retail / e-commerce", beauty: "Beauty & salon", fitness: "Fitness studio",
    health: "Health & clinic", realestate: "Real estate", hotel: "Hotel & travel",
    education: "Education & courses", automotive: "Automotive", events: "Events & photography",
    generic: "Professional services",
  };
  return map[detectCategory((idea || "").trim() || "x")];
}

// ---- build a flow from a full intake (name, contacts, goal) -----------------
interface IntakeLike {
  name?: string;
  description?: string;
  goal?: string;
  tone?: string;
  contacts?: { phone?: string; email?: string; website?: string; address?: string; hours?: string };
}

function normaliseUrl(u: string): string {
  const t = u.trim();
  if (!t) return "https://example.com/checkout";
  return /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
}

export function buildFlowFromIntake(intake: IntakeLike): Flow {
  const description = (intake.description || intake.name || "a local business").trim();
  const base = buildFlowFromIdea(description); // theme stays true to the description
  const baseName = base.name;
  const name = (intake.name || baseName).trim();
  const c = intake.contacts || {};

  // swap the synthesised name for the real one everywhere it appears in copy
  const rename = (s?: string) => (s ? s.split(baseName).join(name) : s);
  const msgs: Message[] = base.messages.map((m) => ({ ...m, text: rename(m.text) }));

  const idxOf = (key: keyof Message) => msgs.findIndex((m) => (m as Record<string, unknown>)[key] !== undefined);

  // location (use the address + hours they gave us)
  if (c.address) {
    const loc = { name, address: c.hours ? `${c.address} · ${c.hours}` : c.address };
    const li = idxOf("location");
    if (li >= 0) (msgs[li] as Message).location = loc;
    else {
      const ctaI = idxOf("cta");
      const at = ctaI >= 0 ? ctaI : Math.max(0, msgs.length - 1);
      msgs.splice(at, 0, { from: "bot", type: "location", location: loc, time: msgs[at]?.time });
    }
  }

  // contact card for easy human hand-off
  if (c.phone || c.email) {
    const ctaI = idxOf("cta");
    const at = ctaI >= 0 ? ctaI : Math.max(0, msgs.length - 1);
    msgs.splice(at, 0, {
      from: "bot",
      type: "contact",
      contact: { name, phone: c.phone || c.email, org: name },
      time: msgs[at]?.time,
    });
  }

  // point the call-to-action at their real website
  if (c.website) {
    const ci = idxOf("cta");
    if (ci >= 0 && (msgs[ci] as Message).cta) (msgs[ci] as Message).cta!.url = normaliseUrl(c.website);
  }

  const goalSlug = slugify(intake.goal || "bot").slice(0, 6) || "bot";
  return {
    ...base,
    id: `${slugify(name)}-${goalSlug}`,
    name,
    subtitle: "Business Account",
    avatar: { initials: initialsOf(name), color: base.avatar?.color ?? "#00a884" },
    messages: msgs,
  };
}