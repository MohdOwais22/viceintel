/**
 * Global TypeScript contracts for the GTA VI / Vice City RP Suite:
 * 1. CAD / MDT Dispatch & Emergency Terminal
 * 2. Visual Character ID & Leonida Driver's License
 * 3. No-Code Server Rules & Event Generator
 * 4. Dynasty 8 Real Estate & Business Directory
 */

// ==========================================
// 1. CAD / MDT TERMINAL & DISPATCH TYPES
// ==========================================

export type CallPriority = 'Code 1 (Routine)' | 'Code 2 (Urgent)' | 'Code 3 (Emergency / Lights & Sirens)' | '10-99 Officer Down';
export type CallStatus = 'Pending' | 'En Route' | 'On Scene' | 'Under Investigation' | 'Cleared';
export type UnitStatusCode = '10-8 Available' | '10-7 Out of Service' | '10-6 Busy' | '10-99 Emergency' | '10-23 Arrived on Scene';
export type CadDepartment = 'VCPD (Vice City Police)' | 'LHPO (Leonida Highway Patrol)' | 'VCFD (Fire & Rescue)' | 'VC-EMS (Ocean Drive EMS)' | 'USCG (Vice Coast Guard)';

export interface ActiveCadCall {
  id: string;
  caller: string;
  callerPhone?: string;
  title: string;
  description: string;
  location: string;
  postal: string;
  district: string;
  priority: CallPriority;
  status: CallStatus;
  attachedUnits: string[]; // Callsigns e.g. ["1-ADAM-12", "MEDIC-4"]
  timestamp: number;
  reportedBy?: string;
  suspectDescription?: string;
  vehicleDescription?: string;
  notes?: string[];
}

export interface ActiveCadUnit {
  badgeNumber: string;
  officerName: string;
  callsign: string;
  department: CadDepartment;
  status: UnitStatusCode;
  assignedCallId: string | null;
  location: string;
  lastUpdated: number;
  vehiclePlate?: string;
  panicActive?: boolean;
}

export interface NcicSuspectRecord {
  id: string;
  characterName: string;
  dob: string;
  ssn: string;
  gender: string;
  hairColor: string;
  eyeColor: string;
  address: string;
  priorArrests: number;
  isWanted: boolean;
  activeWarrantsCount: number;
  driverLicenseStatus: 'Valid' | 'Suspended' | 'Revoked' | 'None';
  weaponPermitStatus: 'Valid Class 1' | 'Valid Class 2' | 'Revoked' | 'None';
  mugshotUrl?: string;
  notes: string[];
}

export interface NcicVehicleRecord {
  plate: string;
  vin: string;
  model: string;
  brand: string;
  color: string;
  ownerName: string;
  ownerSsn: string;
  registrationStatus: 'Valid' | 'Expired' | 'Suspended' | 'Stolen';
  stolenFlag: boolean;
  boloActive: boolean;
  boloReason?: string;
}

export interface CadWarrant {
  id: string;
  suspectName: string;
  suspectSsn: string;
  issuingJudge: string;
  reportingOfficer: string;
  charges: { title: string; count: number; severity: 'Infraction' | 'Misdemeanor' | 'Felony' }[];
  status: 'Active' | 'Served' | 'Quashed';
  bailAmount: number;
  bailable: boolean;
  notes: string;
  issuedAt: number;
  servedAt?: number;
}

export interface CadIncidentReport {
  id: string;
  title: string;
  caseNumber: string;
  leadOfficer: string;
  assistingOfficers: string[];
  location: string;
  summary: string;
  involvedPersons: { name: string; role: 'Suspect' | 'Victim' | 'Witness' | 'Informant'; details: string }[];
  evidenceNotes: string[];
  chargesFiled: string[];
  createdAt: number;
}

export type AnatomicalZone = 
  | 'Head & Facial'
  | 'Neck & Cervical'
  | 'Chest & Thorax'
  | 'Abdomen'
  | 'Left Upper Arm'
  | 'Right Upper Arm'
  | 'Left Forearm / Hand'
  | 'Right Forearm / Hand'
  | 'Left Leg / Thigh'
  | 'Right Leg / Thigh'
  | 'Left Foot'
  | 'Right Foot'
  | 'Spine & Upper Back';

export type TraumaInjuryType = 
  | 'Gunshot Wound (Entry/Exit)'
  | 'Laceration / Deep Cut'
  | 'Blunt Force Contusion'
  | '2nd/3rd Degree Burn'
  | 'Compound Fracture'
  | 'Puncture / Shrapnel'
  | 'Internal Bleeding'
  | 'Taser Shock / Cardiac Strain';

export interface PatientTraumaLog {
  id: string;
  zone: AnatomicalZone;
  injuryType: TraumaInjuryType;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Critical / Lethal';
  treatmentApplied: string;
  timestamp: number;
  medicName: string;
}

export interface PatientMedicalRecord {
  id: string;
  characterName: string;
  dob: string;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  organDonor: boolean;
  prescriptions: { medication: string; dosage: string; prescribedBy: string; active: boolean }[];
  toxicologyHistory: { substance: string; detectedLevel: string; date: string }[];
  traumaLogs: PatientTraumaLog[];
  lastHospitalized?: number;
}

// ==========================================
// 2. RP IDENTITY & DRIVER'S LICENSE TYPES
// ==========================================

export interface CharacterIdentityData {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dob: string;
  ssn: string;
  gender: 'M' | 'F' | 'X';
  height: string; // e.g. 5'11"
  weightLbs: number;
  eyeColor: 'Brown' | 'Blue' | 'Hazel' | 'Green' | 'Amber' | 'Gray';
  hairColor: 'Black' | 'Brown' | 'Blonde' | 'Red' | 'Gray' | 'Bald';
  fingerprintId: string;
  address: string;
  city: string;
  postalCode: string;
  donorStatus: boolean;
  portraitUrl: string;
  signatureText: string;
  issueDate: string;
  expiryDate: string;
  endorsements: {
    drivers: boolean;
    commercial: boolean;
    motorcycle: boolean;
    aviation: boolean;
    maritime: boolean;
    ccwClass: 'None' | 'Class 1 (Handgun / Concealed)' | 'Class 2 (Tactical Rifle)' | 'Class 3 (Specialty Class / Collector)';
  };
  occupation?: string;
  backstorySnippet?: string;
  createdAt: number;
}

// ==========================================
// 3. SERVER RULES & EVENT GENERATOR TYPES
// ==========================================

export interface RpRuleDefinition {
  id: string;
  title: string;
  shortCode: string;
  category: 'Core Conduct' | 'Combat & Death' | 'Communication & Voice' | 'Crime & Economy' | 'Vehicle Realism';
  summary: string;
  detailedExplanation: string;
  examplesGood: string[];
  examplesBad: string[];
  defaultPenalty: 'Verbal Warning' | 'Formal Strike 1' | '24 Hour Suspension' | '3-Day Ban' | 'Permanent Exile';
  enabled: boolean;
}

export interface RpEventPlan {
  id: string;
  title: string;
  eventType: 'Street Race / Underground Meet' | 'High-Stakes Auction' | 'Courtroom Trial' | 'Music Festival / Beach Party' | 'Organized Heist Event' | 'Fight Night Championship';
  hostEntity: string;
  locationName: string;
  district: string;
  eventDate: string;
  eventTime: string;
  timezone: string;
  prizePoolDesc: string;
  entryFee?: number;
  rulesNotes: string;
  discordInviteUrl?: string;
  bannerImageUrl?: string;
  createdAt: number;
}

// ==========================================
// 4. DYNASTY 8 REAL ESTATE & BUSINESS TYPES
// ==========================================

export type PropertyCategory = 
  | 'Beachfront Mansion' 
  | 'Downtown Luxury Penthouse' 
  | 'Nightclub & Lounge' 
  | 'Industrial Warehouse' 
  | 'Underground Vehicle Garage' 
  | 'Strip Mall Commercial Unit'
  | 'Oceanfront Villa'
  | 'Port Gellhorn Safehouse';

export interface DynastyProperty {
  id: string;
  slug: string;
  title: string;
  category: PropertyCategory;
  district: string;
  address: string;
  purchasePrice: number;
  dailyUpkeepTax: number;
  storageSlots: number;
  garageSlots: number;
  interiorTier: 'Stock Minimalist' | 'Modern High-End' | 'Executive Marble Suite' | 'Vice City VIP Luxury Penthouse' | 'Heist Command Bunker';
  status: 'Available' | 'Under Escrow / Pending' | 'Sold / Occupied' | 'Government Seizure';
  ownerCharacterName?: string;
  ownerDiscordId?: string;
  featuredImageUrl: string;
  galleryImages: string[];
  description: string;
  features: string[];
  hasHelipad: boolean;
  hasPrivateBoatDock: boolean;
  hasVaultRoom: boolean;
  createdAt: number;
}

export interface PropertyEscrowBid {
  id: string;
  propertyId: string;
  propertyTitle: string;
  buyerCharacterName: string;
  buyerDiscordUsername: string;
  buyerPhone: string;
  bidAmount: number;
  downPayment: number;
  financingTermDays: number;
  intendedUse: string;
  status: 'Pending Escrow Review' | 'Approved by City Council' | 'Rejected' | 'Completed';
  submittedAt: number;
  adminNotes?: string;
}
