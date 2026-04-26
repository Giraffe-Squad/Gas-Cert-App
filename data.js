/* ═══════════════════════════════════════════════════════════════
   COLORS — Orange accent to match the app logo
   Certificate PDF keeps its own separate color scheme
   ═══════════════════════════════════════════════════════════════ */
export const COLORS = {
  primary: "#1a1a2e",
  accent: "#e65100",
  accentBg: "#fff3e0",
  text: "#1a2b3d",
  muted: "#6b7d8d",
  border: "#dce2e8",
  bg: "#f9f9fb",
  card: "#ffffff",
  inputBg: "#f8f9fb",
  green: "#2e7d32",
  greenBg: "#e8f5e9",
  red: "#c62828",
  redBg: "#ffebee",
  amber: "#f57f17",
  amberBg: "#fff8e1",
};

/* ═══════════════════════════════════════════════════════════════
   APPLIANCE DROPDOWN DATA
   ═══════════════════════════════════════════════════════════════ */
export const APPLIANCE_DATA = {
  locations: [
    "Kitchen", "Living Room", "Lounge", "Dining Room", "Kitchen/Diner",
    "Utility Room", "Hallway", "Landing", "Bedroom 1", "Bedroom 2",
    "Bedroom 3", "Bedroom 4", "Bedroom 5", "Bathroom", "En-Suite",
    "Shower Room", "WC/Toilet", "Airing Cupboard", "Boiler Cupboard",
    "Under Stairs Cupboard", "Garage", "Integral Garage", "Loft/Attic",
    "Cellar/Basement", "Conservatory", "Porch", "Outbuilding",
    "External/Outside", "Plant Room", "Office/Study", "Communal Area",
    "Cloakroom",
  ],
  makes: [
    "Worcester Bosch", "Vaillant", "Ideal", "Baxi", "Glow-worm",
    "Potterton", "Main", "Viessmann", "Alpha", "Ferroli", "Ravenheat",
    "Ariston", "Navien", "Remeha", "Intergas", "Vokera", "Keston",
    "Heatline", "Valor", "Robinson Willey", "Flavel", "Gazco",
    "Belling", "Stoves", "Rangemaster", "New World", "Hotpoint",
    "Indesit", "Cannon", "Parkinson Cowan", "Leisure", "Zanussi",
    "Smeg", "Neff", "Bosch", "AGA", "Rinnai", "Johnson & Starley",
    "Halstead", "Chaffoteaux", "Biasi", "Myson", "Sime", "Thorn",
  ],
  types: [
    "Combination Boiler", "System Boiler", "Regular Boiler (Heat Only)",
    "Back Boiler Unit", "Floor-Standing Boiler", "Wall-Hung Boiler",
    "Open Flue Gas Fire", "Balanced Flue Gas Fire",
    "Decorative Fuel Effect Fire (DFE)", "Live Fuel Effect Fire (LFE)",
    "Inset Gas Fire", "Flueless Gas Fire", "Gas Stove", "Convector Heater",
    "Gas Cooker (Freestanding)", "Gas Hob (Built-in)", "Built-in Gas Oven",
    "Gas Eye-Level Grill", "Range Cooker", "Dual Fuel Cooker",
    "Instantaneous Water Heater", "Multipoint Water Heater",
    "Storage Water Heater", "Warm Air Unit", "Gas Tumble Dryer",
    "Space Heater", "Radiant Heater", "Cabinet Heater",
  ],
  flueTypes: [
    { code: "OF", label: "Open Flue (OF)" },
    { code: "RS", label: "Room Sealed (RS)" },
    { code: "BF", label: "Balanced Flue (BF)" },
    { code: "FF", label: "Fanned Flue (FF)" },
    { code: "FL", label: "Flueless (FL)" },
    { code: "SE", label: "Se-Duct (SE)" },
    { code: "U",  label: "U-Duct (U)" },
    { code: "N/A", label: "N/A" },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   FORM STEPS
   ═══════════════════════════════════════════════════════════════ */
export const FORM_STEPS = [
  { id: 1, label: "Engineer" },
  { id: 2, label: "Property" },
  { id: 3, label: "Landlord" },
  { id: 4, label: "Appliances" },
  { id: 5, label: "Pipework" },
  { id: 6, label: "Faults" },
  { id: 7, label: "Declaration" },
  { id: 8, label: "Review" },
];

/* ═══════════════════════════════════════════════════════════════
   FACTORY FUNCTIONS — UPRN removed
   ═══════════════════════════════════════════════════════════════ */
export function createEmptyAppliance() {
  return {
    id: Date.now() + Math.random(),
    location: "", make: "", model: "", type: "",
    flueType: "", operatingPressure: "",
    safetyDevices: "", spillageTest: "", smokePelletTest: "",
    initRatio: "", initCO: "", initCO2: "",
    finalRatio: "", finalCO: "", finalCO2: "",
    satTermination: "", flueVisual: "", adequateVent: "",
    landlordsAppliance: "", inspected: "", appVisualCheck: "",
    appServiced: "", appSafeToUse: "",
  };
}

export function createEmptyCertificate() {
  return {
    id: Date.now(),
    eng: {
      name: "", company: "", address: "", tel: "",
      gasSafe: "", idCard: "", email: "",
    },
    prop: {
      name: "", address: "", city: "", county: "",
      postcode: "", mobile: "", landline: "", email: "",
    },
    inspDate: new Date().toISOString().slice(0, 10),
    nextDate: "",
    certNo: "",
    ct: "landlord",
    ll: {
      name: "", company: "", address: "", city: "",
      postcode: "", email: "", phone: "",
    },
    apps: [createEmptyAppliance()],
    pipe: { visualInsp: "", ecvAccessible: "", gasTightness: "", bonding: "" },
    alarms: { coFitted: "", coInDate: "", coTested: "", smokeFitted: "" },
    faults: "", rect: "", works: "", flueCap: "",
    decl: { confirmed: false, engSig: "", receivedBy: "" },
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}

/* ═══════════════════════════════════════════════════════════════
   INVOICE FACTORY FUNCTIONS
   (No Gas Safe — invoices are general plumbing/gas invoices)
   ═══════════════════════════════════════════════════════════════ */
export const INVOICE_STEPS = [
  { id: 1, label: "Business" },
  { id: 2, label: "Customer" },
  { id: 3, label: "Items" },
  { id: 4, label: "Review" },
];

export function createEmptyLineItem() {
  return {
    id: Date.now() + Math.random(),
    description: "",
    quantity: 1,
    rate: 0,
  };
}

export function createEmptyInvoice() {
  return {
    id: Date.now(),
    invoiceNo: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    business: {
      name: "", address: "", city: "", postcode: "",
      phone: "", email: "",
    },
    customer: {
      name: "", company: "", address: "", city: "",
      postcode: "", email: "", phone: "",
    },
    items: [createEmptyLineItem()],
    vatRate: 0,
    notes: "",
    paymentDetails: "",
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}

export function calcInvoiceTotals(invoice) {
  const subtotal = (invoice.items || []).reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0),
    0
  );
  const vatAmount = subtotal * ((parseFloat(invoice.vatRate) || 0) / 100);
  const total = subtotal + vatAmount;
  return { subtotal, vatAmount, total };
}

/* ═══════════════════════════════════════════════════════════════
   LOCAL STORAGE HELPERS
   ═══════════════════════════════════════════════════════════════ */
export function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

/* ═══════════════════════════════════════════════════════════════
   CREDENTIALS
   ═══════════════════════════════════════════════════════════════ */
export const DEFAULT_USERNAME = "mediumlinkuk";
export const DEFAULT_PASSWORD = "Wajfeb909090@";
export const MASTER_KEY = "0526";
export const APP_VERSION = "3.1";
