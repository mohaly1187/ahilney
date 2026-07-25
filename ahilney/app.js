// Ahilney Prototype State Management

// 1. Doctor Specializations List (Requirement 11)
const DOCTOR_SPECIALIZATIONS = [
  "Orthopedic Physician",
  "Orthopedic Surgeon",
  "Neurosurgery / Neurology",
  "Nutrition Specialist",
  "Psychiatry / Psychology",
  "Physical Medicine, Rheumatology & Rehabilitation",
  "Pediatrics"
];

// 2. Services Catalog (Requirement 12)
// Universal services can be done at Home or Rehab Center; Hydrotherapy is Rehab Center exclusive.
const SERVICES_CATALOG = [
  { id: "SRV-01", name: "Physical Therapy (PT)", supportsHome: true, supportsCenter: true, icon: "🧘‍♂️", category: "Therapy" },
  { id: "SRV-02", name: "Post-Injury Rehabilitation", supportsHome: true, supportsCenter: true, icon: "🩹", category: "Rehab" },
  { id: "SRV-03", name: "Elderly Rehabilitation", supportsHome: true, supportsCenter: true, icon: "👵", category: "Geriatric" },
  { id: "SRV-04", name: "Special Needs Rehabilitation", supportsHome: true, supportsCenter: true, icon: "♿", category: "Specialized" },
  { id: "SRV-05", name: "Pediatric Rehabilitation", supportsHome: true, supportsCenter: true, icon: "👶", category: "Pediatrics" },
  { id: "SRV-06", name: "Nutritional Rehabilitation", supportsHome: true, supportsCenter: true, icon: "🥗", category: "Wellness" },
  { id: "SRV-07", name: "Manual Therapy (Chiropractic / Osteopathy)", supportsHome: true, supportsCenter: true, icon: "👐", category: "Therapy" },
  { id: "SRV-08", name: "Basic Recovery & Wellness Services", supportsHome: true, supportsCenter: true, icon: "⚡", category: "Wellness" },
  { id: "SRV-09", name: "Hydrotherapy", supportsHome: false, supportsCenter: true, icon: "🏊‍♂️", category: "Center Exclusive", note: "Rehab Center Only" }
];

// 3. Egypt Subregions with Geolocation Coordinates (Requirement 7, 8, 9)
const EGYPT_SUBREGIONS = [
  { name: "New Cairo", lat: 30.0276, lng: 31.4913 },
  { name: "Al-Raml", lat: 31.2333, lng: 29.9667 },
  { name: "Heliopolis", lat: 30.0889, lng: 31.3153 },
  { name: "Maadi", lat: 29.9602, lng: 31.2569 },
  { name: "Dokki", lat: 30.0381, lng: 31.2118 },
  { name: "6th of October", lat: 29.9723, lng: 30.9442 },
  { name: "Sheikh Zayed", lat: 30.0468, lng: 30.9856 },
  { name: "Nasr City", lat: 30.0561, lng: 31.3301 },
  { name: "Alexandria", lat: 31.2001, lng: 29.9187 }
];

// Distance Calculation Helper (Haversine Formula in km)
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5.0; // fallback mock distance
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Default mock data for Providers (Doctors & Rehab Specialists)
const DEFAULT_PROVIDERS = [
  {
    id: "PROV-001",
    name: "Dr. Sarah Jenkins",
    type: "Doctor",
    specialty: "Orthopedic Physician",
    email: "sarah.j@ahilney.com",
    password: "password",
    phone: "+201011223344",
    price: "450 EGP",
    duration: "45 min",
    sessionDuration: 45,
    status: "active",
    payoutDetails: "Instapay: sarah.j@instapay",
    regionsCovered: ["New Cairo", "Heliopolis"],
    lat: 30.0276,
    lng: 31.4913,
    documents: [
      { name: "National_ID.pdf", status: "Approved" },
      { name: "Medical_License.pdf", status: "Approved" },
      { name: "Sports_Medicine_Specialization.pdf", status: "Approved" }
    ],
    interviewDate: "2026-06-25",
    contractSigned: true
  },
  {
    id: "PROV-002",
    name: "Dr. Marcus Vance",
    type: "Doctor",
    specialty: "Orthopedic Surgeon",
    email: "marcus.v@ahilney.com",
    password: "password",
    phone: "+201099887766",
    price: "500 EGP",
    duration: "30 min",
    sessionDuration: 30,
    status: "active",
    payoutDetails: "Bank: HSBC EG789012345",
    regionsCovered: ["Maadi", "Dokki"],
    lat: 30.0889,
    lng: 31.3153,
    documents: [
      { name: "National_ID.pdf", status: "Approved" },
      { name: "Orthopedic_Board_Certificate.pdf", status: "Approved" }
    ],
    interviewDate: "2026-07-02",
    contractSigned: true
  },
  {
    id: "PROV-003",
    name: "Amira Kanaan",
    type: "RS", // Rehab Specialist
    specialty: "Physical Therapy (PT)",
    email: "amira.k@ahilney.com",
    password: "password",
    phone: "+201055667788",
    price: "350 EGP",
    duration: "60 min",
    sessionDuration: 60,
    status: "active",
    payoutDetails: "Instapay: amira.k@instapay",
    regionsCovered: ["New Cairo", "Maadi"],
    lat: 30.0150,
    lng: 31.4800,
    documents: [
      { name: "National_ID.pdf", status: "Approved" },
      { name: "PT_Bachelor_Degree.pdf", status: "Approved" }
    ],
    interviewDate: "2026-06-20",
    contractSigned: true
  },
  {
    id: "PROV-004",
    name: "Karim Abdel-Hadi",
    type: "RS",
    specialty: "Post-Injury Rehabilitation",
    email: "karim.a@ahilney.com",
    password: "password",
    phone: "+201022334455",
    price: "400 EGP",
    duration: "50 min",
    sessionDuration: 50,
    status: "active",
    payoutDetails: "Wallet: Vodafone Cash 01222334455",
    regionsCovered: ["New Cairo", "Al-Raml", "Maadi", "Nasr City"],
    lat: 30.0350,
    lng: 31.4600,
    documents: [
      { name: "National_ID.pdf", status: "Approved" },
      { name: "Rehab_Science_Master.pdf", status: "Approved" },
      { name: "Clinic_Permit.pdf", status: "Approved" }
    ],
    interviewDate: "2026-06-28",
    contractSigned: true
  },
  {
    id: "PROV-005",
    name: "Hassan Al-Saeed",
    type: "RS",
    specialty: "Pediatric Rehabilitation",
    email: "hassan.s@ahilney.com",
    password: "password",
    phone: "+201077889900",
    price: "300 EGP",
    duration: "45 min",
    sessionDuration: 45,
    status: "active",
    payoutDetails: "Bank: CIB EG44556677",
    regionsCovered: ["Heliopolis", "Dokki", "Nasr City"],
    lat: 30.0900,
    lng: 31.3200,
    documents: [],
    interviewDate: "",
    contractSigned: true
  }
];

// Load providers from localStorage or use defaults
function getProviders() {
  const data = localStorage.getItem("ahilney_providers");
  let providers;
  if (!data) {
    providers = DEFAULT_PROVIDERS;
  } else {
    providers = JSON.parse(data);
  }
  
  
  let migrated = false;
  providers.forEach(p => {
    const oldShiftsFormat = p.shifts && !Array.isArray(p.shifts["Mon"]);
    if (!p.shifts || oldShiftsFormat) {
      p.shifts = {
        "Mon": [
          { start: "09:00 AM", end: "11:00 AM" },
          { start: "09:00 PM", end: "11:00 PM" }
        ],
        "Tue": [
          { start: "09:00 AM", end: "11:00 AM" },
          { start: "09:00 PM", end: "11:00 PM" }
        ],
        "Wed": [
          { start: "09:00 AM", end: "11:00 AM" },
          { start: "09:00 PM", end: "11:00 PM" }
        ],
        "Thu": [
          { start: "09:00 AM", end: "11:00 AM" },
          { start: "09:00 PM", end: "11:00 PM" }
        ],
        "Fri": [],
        "Sat": [],
        "Sun": []
      };
      migrated = true;
    }
    if (!p.password) {
      p.password = "password";
      migrated = true;
    }
    if (!p.payoutDetails) {
      p.payoutDetails = p.id === "PROV-001" ? "Instapay: sarah.j@instapay" : "Bank: CIB EG123456789";
      migrated = true;
    }
    if (!p.regionsCovered) {
      p.regionsCovered = p.type === "RS" ? ["New Cairo", "Maadi"] : [];
      migrated = true;
    }
    if (!p.sessionDuration) {
      p.sessionDuration = 45;
      migrated = true;
    }
    if (p.rating === undefined) {
      p.rating = 4.8;
      p.reviewCount = 15;
      migrated = true;
    }
  });
  
  if (migrated || !data) {
    localStorage.setItem("ahilney_providers", JSON.stringify(providers));
  }
  return providers;
}

function saveProviders(providers) {
  localStorage.setItem("ahilney_providers", JSON.stringify(providers));
  // Dispatch dynamic event for updates
  window.dispatchEvent(new Event("storage"));
}

// Sub-admins List
const DEFAULT_SUB_ADMINS = [
  { id: "ADM-001", name: "Sherif Amer", email: "sherif@ahilney.com", role: "Super Admin" },
  { id: "ADM-002", name: "Yasmin Refaat", email: "yasmin@ahilney.com", role: "Operations Lead" },
  { id: "ADM-003", name: "Tarek Nour", email: "tarek@ahilney.com", role: "Document Reviewer" }
];

function getSubAdmins() {
  const data = localStorage.getItem("ahilney_subadmins");
  if (!data) {
    localStorage.setItem("ahilney_subadmins", JSON.stringify(DEFAULT_SUB_ADMINS));
    return DEFAULT_SUB_ADMINS;
  }
  return JSON.parse(data);
}

function saveSubAdmins(admins) {
  localStorage.setItem("ahilney_subadmins", JSON.stringify(admins));
}

// Promo Codes List
const DEFAULT_PROMO_CODES = [
  { code: "AHILNEY50", discount: "50%", maxUses: 200, uses: 45, expiry: "2026-12-31", status: "active" },
  { code: "SPORTSREHAB", discount: "20%", maxUses: 500, uses: 128, expiry: "2026-09-30", status: "active" }
];

function getPromoCodes() {
  const data = localStorage.getItem("ahilney_promo_codes");
  if (!data) {
    localStorage.setItem("ahilney_promo_codes", JSON.stringify(DEFAULT_PROMO_CODES));
    return DEFAULT_PROMO_CODES;
  }
  return JSON.parse(data);
}

function savePromoCodes(codes) {
  localStorage.setItem("ahilney_promo_codes", JSON.stringify(codes));
}

// Schedule Availability Slot Options
const DEFAULT_SLOTS = [
  { time: "09:00 AM", selected: true },
  { time: "10:00 AM", selected: false },
  { time: "11:00 AM", selected: true },
  { time: "12:00 PM", selected: false },
  { time: "01:00 PM", selected: true },
  { time: "02:00 PM", selected: true },
  { time: "03:00 PM", selected: false },
  { time: "04:00 PM", selected: false },
  { time: "05:00 PM", selected: true }
];

function getSlots(providerId) {
  const key = `ahilney_slots_${providerId}`;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(DEFAULT_SLOTS));
    return DEFAULT_SLOTS;
  }
  return JSON.parse(data);
}

function saveSlots(providerId, slots) {
  localStorage.setItem(`ahilney_slots_${providerId}`, JSON.stringify(slots));
}

// Notifications List
const DEFAULT_NOTIFICATIONS = [
  { id: 1, text: "Patient Ahmed Wael booked an Online Consultation session.", time: "2 hours ago" },
  { id: 2, text: "Admin approved your updated Medical License document.", time: "1 day ago" }
];

function getNotifications(providerId) {
  const key = `ahilney_notifications_${providerId}`;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(DEFAULT_NOTIFICATIONS));
    return DEFAULT_NOTIFICATIONS;
  }
  return JSON.parse(data);
}

function saveNotifications(providerId, list) {
  localStorage.setItem(`ahilney_notifications_${providerId}`, JSON.stringify(list));
}

// Patient Records & Dynamic State
const DEFAULT_PATIENTS = [
  {
    id: "P-001",
    name: "Ahmed Ali Wael",
    age: "28 years",
    phone: "+201211098465",
    email: "ahmed.wael@gmail.com",
    address: "Egypt - New Cairo, Subregion Al-Raml",
    history: "ACL reconstruction surgery on left knee (4 weeks post-op). Mild swelling, limited extension range (currently 5 degrees deficiency). Needs hamstring strengthening and range extension therapy.",
    prescription: {
      text: "Prescribed 10 physical therapy sessions focusing on: (1) Active range-of-motion extension exercises, (2) Quad/Hamstring isometric contractions, (3) Proprioceptive balance training.",
      doctor: "Dr. Sarah Jenkins"
    },
    treatmentPlans: [
      {
        id: "PLAN-001",
        doctorName: "Dr. Sarah Jenkins",
        diagnosis: "Post-ACL stiffness and weak hamstring response.",
        text: "Active range-of-motion extension exercises, Quad/Hamstring isometric contractions, Proprioceptive balance training.",
        date: "2026-06-25",
        status: "Logged"
      }
    ],
    walletBalance: 450,
    completedSessionsCount: 3
  },
  {
    id: "P-002",
    name: "Mariam Nour",
    age: "34 years",
    phone: "+201222446688",
    email: "mariam.nour@gmail.com",
    address: "Egypt - Heliopolis",
    history: "Rotator cuff tendonitis in right shoulder. Pain during abduction beyond 90 degrees.",
    prescription: {
      text: "Manual therapy mobilization combined with scapular stabilization exercises. Limit lifting heavier than 2kg for the next 3 weeks.",
      doctor: "Dr. Sarah Jenkins"
    },
    treatmentPlans: [
      {
        id: "PLAN-002",
        doctorName: "Dr. Sarah Jenkins",
        diagnosis: "Rotator cuff tendonitis in right shoulder.",
        text: "Manual therapy mobilization combined with scapular stabilization exercises. Limit lifting heavier than 2kg for the next 3 weeks.",
        date: "2026-06-26",
        status: "Logged"
      }
    ],
    walletBalance: 1200,
    completedSessionsCount: 1
  },
  {
    id: "P-003",
    name: "Youssef Ibrahim",
    age: "42 years",
    phone: "+201199335522",
    email: "youssef.ibrahim@gmail.com",
    address: "Egypt - Maadi",
    history: "Lower back pain (L4-L5 disc protrusion). Occasional radiating pain to the right calf.",
    prescription: {
      text: "Core stabilization program, McKenzie progression exercises, and posture correction education. Avoid lumbar flexion under load.",
      doctor: "Dr. Sarah Jenkins"
    },
    treatmentPlans: [
      {
        id: "PLAN-003",
        doctorName: "Dr. Sarah Jenkins",
        diagnosis: "Lower back pain (L4-L5 disc protrusion).",
        text: "Core stabilization program, McKenzie progression exercises, and posture correction education. Avoid lumbar flexion under load.",
        date: "2026-06-27",
        status: "Logged"
      }
    ],
    walletBalance: 0,
    completedSessionsCount: 5
  },
  {
    id: "P-004",
    name: "Hanaa Mansour",
    age: "57 years",
    phone: "+201588663322",
    email: "hanaa.mansour@gmail.com",
    address: "Egypt - New Cairo, Rehab City",
    history: "Total hip replacement (left side), 6 weeks post-surgery. Improving weight-bearing capability.",
    prescription: {
      text: "Gait retraining, progressive hip abduction strengthening, and functional balance exercises. Strictly observe hip precautions (no flexion > 90 deg).",
      doctor: "Dr. Sarah Jenkins"
    },
    treatmentPlans: [
      {
        id: "PLAN-004",
        doctorName: "Dr. Sarah Jenkins",
        diagnosis: "Total hip replacement (left side)",
        text: "Gait retraining, progressive hip abduction strengthening, and functional balance exercises. Strictly observe hip precautions (no flexion > 90 deg).",
        date: "2026-06-28",
        status: "Logged"
      }
    ],
    walletBalance: 1500,
    completedSessionsCount: 0
  }
];

const DEFAULT_APPOINTMENTS = [
  { id: "APT-101", patientId: "P-001", providerId: "PROV-001", time: "02:00 PM Today", type: "Online Consultation", status: "Finished", price: 450 },
  { id: "APT-102", patientId: "P-002", providerId: "PROV-001", time: "04:30 PM Today", type: "Online Consultation", status: "Upcoming", price: 450 },
  { id: "APT-201", patientId: "P-003", providerId: "PROV-004", time: "10:00 AM Today", type: "Home Visit", status: "Pending RS Acceptance", price: 400, serviceName: "Post-Injury Rehabilitation" },
  { id: "APT-202", patientId: "P-001", providerId: "PROV-004", time: "01:00 PM Today", type: "Home Visit", status: "Confirmed", price: 400, serviceName: "Physical Therapy (PT)" },
  { id: "APT-203", patientId: "P-004", providerId: "PROV-004", time: "03:30 PM Today", type: "Home Visit", status: "Upcoming", price: 400, serviceName: "Elderly Rehabilitation" }
];

// Operations Team Exclusive Financial Functions (Requirement 6)
function issuePatientRefund(patientId, amount, reason) {
  const patients = getPatients();
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return false;

  const refundAmt = parseFloat(amount) || 0;
  patient.walletBalance = (patient.walletBalance || 0) + refundAmt;
  savePatients(patients);

  // Log Transaction
  const txns = getTransactions();
  txns.unshift({
    id: `TXN-REF-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split("T")[0],
    type: "Refund Issued",
    entityName: `Refund for ${patient.name} (${reason || 'Ops Adjustment'})`,
    amount: refundAmt,
    status: "Completed",
    method: "Wallet Credit"
  });
  saveTransactions(txns);
  return true;
}

function addPackageSessions(patientId, count) {
  const patients = getPatients();
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return false;

  const sessionCount = parseInt(count) || 1;
  patient.packageSessionsRemaining = (patient.packageSessionsRemaining || 0) + sessionCount;
  savePatients(patients);
  return true;
}

const DEFAULT_REGIONS = [
  {
    id: "REG-001",
    name: "Egypt",
    nameAr: "مصر",
    icon: "🇪🇬",
    currency: "EGP",
    subregions: [
      { name: "New Cairo", nameAr: "القاهرة الجديدة" },
      { name: "Al-Raml", nameAr: "الرمل" },
      { name: "Heliopolis", nameAr: "مصر الجديدة" },
      { name: "Maadi", nameAr: "المعادي" }
    ]
  }
];

const DEFAULT_BANNERS = [
  { id: "BAN-001", title: "Sports Rehabilitation Campaign", status: "active", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=60" }
];

const DEFAULT_TRANSACTIONS = [
  { id: "TXN-001", date: "2026-06-25", type: "Payout", entityName: "Dr. Sarah Jenkins", amount: 450, status: "Completed", method: "Online" },
  { id: "TXN-002", date: "2026-06-28", type: "Commission", entityName: "Ahilney Commission (Hassan)", amount: 50, status: "Completed", method: "Offline" }
];

const DEFAULT_SUMMARIES = [
  {
    id: "SUM-001",
    appointmentId: "APT-101",
    providerId: "PROV-001",
    patientId: "P-001",
    date: "2026-06-25",
    complaint: "Knee pain during extension exercises.",
    diagnosis: "Post-ACL stiffness and weak hamstring response.",
    treatmentPlan: "Hamstring curls 3x10, patellar mobilization daily.",
    status: "Approved"
  }
];

// Helper getters/setters for localStorage
function getPatients() {
  const data = localStorage.getItem("ahilney_patients");
  if (!data) {
    localStorage.setItem("ahilney_patients", JSON.stringify(DEFAULT_PATIENTS));
    return DEFAULT_PATIENTS;
  }
  let list = JSON.parse(data);
  let migrated = false;
  list = list.map(p => {
    const def = DEFAULT_PATIENTS.find(d => d.id === p.id);
    if (def) {
      if (!p.treatmentPlans || p.treatmentPlans.length === 0) {
        p.treatmentPlans = def.treatmentPlans || [];
        migrated = true;
      }
      if (p.completedSessionsCount === undefined) {
        p.completedSessionsCount = def.completedSessionsCount || 0;
        migrated = true;
      }
      if (!p.prescription || !p.prescription.text) {
        p.prescription = def.prescription || { text: "", doctor: "" };
        migrated = true;
      }
    }
    return p;
  });
  if (migrated) {
    localStorage.setItem("ahilney_patients", JSON.stringify(list));
  }
  return list;
}

function savePatients(list) {
  localStorage.setItem("ahilney_patients", JSON.stringify(list));
  syncGlobals();
  window.dispatchEvent(new Event("storage"));
}

function getAppointments() {
  const data = localStorage.getItem("ahilney_appointments");
  if (!data) {
    localStorage.setItem("ahilney_appointments", JSON.stringify(DEFAULT_APPOINTMENTS));
    return DEFAULT_APPOINTMENTS;
  }
  let list = JSON.parse(data);
  let migrated = false;
  const apt101 = list.find(a => a.id === "APT-101");
  if (apt101 && apt101.status !== "Finished") {
    apt101.status = "Finished";
    migrated = true;
  }
  if (migrated) {
    localStorage.setItem("ahilney_appointments", JSON.stringify(list));
  }
  return list;
}

function saveAppointments(list) {
  localStorage.setItem("ahilney_appointments", JSON.stringify(list));
  syncGlobals();
  window.dispatchEvent(new Event("storage"));
}

function submitRating(aptId, rating, feedback) {
  const apts = getAppointments();
  const apt = apts.find(a => a.id === aptId);
  if (apt) {
    apt.rating = parseInt(rating);
    apt.feedback = feedback;
    saveAppointments(apts);
    
    const provs = getProviders();
    const prov = provs.find(p => p.id === apt.providerId);
    if (prov) {
      prov.reviewCount = (prov.reviewCount || 0) + 1;
      prov.rating = (Math.min(5.0, ((prov.rating * (prov.reviewCount - 1)) + apt.rating) / prov.reviewCount)).toFixed(1);
      saveProviders(provs);
    }
    return true;
  }
  return false;
}

function getRegions() {
  const data = localStorage.getItem("ahilney_regions");
  if (!data) {
    localStorage.setItem("ahilney_regions", JSON.stringify(DEFAULT_REGIONS));
    return DEFAULT_REGIONS;
  }
  return JSON.parse(data);
}

function saveRegions(list) {
  localStorage.setItem("ahilney_regions", JSON.stringify(list));
  window.dispatchEvent(new Event("storage"));
}

function getBanners() {
  const data = localStorage.getItem("ahilney_banners");
  if (!data) {
    localStorage.setItem("ahilney_banners", JSON.stringify(DEFAULT_BANNERS));
    return DEFAULT_BANNERS;
  }
  return JSON.parse(data);
}

function saveBanners(list) {
  localStorage.setItem("ahilney_banners", JSON.stringify(list));
  window.dispatchEvent(new Event("storage"));
}

function getTransactions() {
  const data = localStorage.getItem("ahilney_transactions");
  if (!data) {
    localStorage.setItem("ahilney_transactions", JSON.stringify(DEFAULT_TRANSACTIONS));
    return DEFAULT_TRANSACTIONS;
  }
  return JSON.parse(data);
}

function saveTransactions(list) {
  localStorage.setItem("ahilney_transactions", JSON.stringify(list));
  window.dispatchEvent(new Event("storage"));
}

function getSummaries() {
  const data = localStorage.getItem("ahilney_summaries");
  if (!data) {
    localStorage.setItem("ahilney_summaries", JSON.stringify(DEFAULT_SUMMARIES));
    return DEFAULT_SUMMARIES;
  }
  return JSON.parse(data);
}

function saveSummaries(list) {
  localStorage.setItem("ahilney_summaries", JSON.stringify(list));
  window.dispatchEvent(new Event("storage"));
}

// Backwards-compatible globals for provider/admin page code
let PATIENTS_DATA = {};
let DOCTOR_APPOINTMENTS = [];
let RS_APPOINTMENTS = [];

function syncGlobals() {
  const patientsList = getPatients();
  PATIENTS_DATA = {};
  patientsList.forEach(p => {
    PATIENTS_DATA[p.id] = p;
  });

  const apts = getAppointments();
  DOCTOR_APPOINTMENTS = apts.filter(a => a.providerId === "PROV-001" || a.providerId === "PROV-002");
  RS_APPOINTMENTS = apts.filter(a => a.providerId === "PROV-003" || a.providerId === "PROV-004");
}

// Initial global synchronization
syncGlobals();
window.addEventListener("storage", syncGlobals);
