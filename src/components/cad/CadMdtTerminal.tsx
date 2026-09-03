import React, { useState, useEffect } from 'react';
import { 
  ActiveCadCall, 
  ActiveCadUnit, 
  CadDepartment, 
  CallPriority, 
  CallStatus, 
  UnitStatusCode,
  CadWarrant,
  NcicSuspectRecord,
  NcicVehicleRecord,
  PatientMedicalRecord,
  PatientTraumaLog,
  AnatomicalZone,
  TraumaInjuryType
} from '../../types/rpSuite';
import { 
  Siren, 
  Radio, 
  PhoneCall, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  FileText, 
  Activity, 
  Heart, 
  Plus, 
  Clock, 
  MapPin, 
  User, 
  Car, 
  Stethoscope, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Bell
} from 'lucide-react';

// INITIAL SEED DATA FOR REAL-TIME SIMULATION & FIRESTORE BACKING
const INITIAL_CALLS: ActiveCadCall[] = [
  {
    id: 'call-911-8842',
    caller: 'Anonymous Resident',
    callerPhone: '555-0194',
    title: '10-90 In Progress / Armed Bank Robbery',
    description: '4 masked suspects armed with heavy carbines entering Fleeca Bank on Ocean Drive. Black Gauntlet Interceptor idling outside.',
    location: '1240 Ocean Drive, Vice Beach',
    postal: '1042',
    district: 'Vice Beach',
    priority: 'Code 3 (Emergency / Lights & Sirens)',
    status: 'On Scene',
    attachedUnits: ['1-ADAM-12', 'AIR-1', 'MEDIC-4'],
    timestamp: Date.now() - 1000 * 60 * 4,
    suspectDescription: '4 males, dark tactical balaclavas, duffel bags',
    vehicleDescription: 'Black Bravado Gauntlet Interceptor, tinted windows'
  },
  {
    id: 'call-911-8843',
    caller: 'Dr. Evelyn Martinez',
    callerPhone: '555-0182',
    title: '10-50 Major Traffic Collision / Extrication Required',
    description: 'High-speed T-bone collision involving Grotti Cheetah and Sandking XL. Gasoline leak detected, multiple casualties trapped.',
    location: 'Intersection of MacArthur Cswy & Biscayne Blvd',
    postal: '2019',
    district: 'Downtown Vice',
    priority: 'Code 3 (Emergency / Lights & Sirens)',
    status: 'En Route',
    attachedUnits: ['ENGINE-2', 'MEDIC-1', '2-LINCOLN-10'],
    timestamp: Date.now() - 1000 * 60 * 9
  },
  {
    id: 'call-311-8844',
    caller: 'Security Guard Davis',
    callerPhone: '555-0133',
    title: '10-37 Suspicious Persons Loitering',
    description: 'Two individuals inspecting shipping container locks near Pier 4 warehouse.',
    location: 'Pier 4, Vice Port Gellhorn',
    postal: '4091',
    district: 'Port Gellhorn',
    priority: 'Code 1 (Routine)',
    status: 'Pending',
    attachedUnits: [],
    timestamp: Date.now() - 1000 * 60 * 18
  }
];

const INITIAL_UNITS: ActiveCadUnit[] = [
  {
    badgeNumber: 'VCPD-402',
    officerName: 'Sgt. Leo Vance',
    callsign: '1-ADAM-12',
    department: 'VCPD (Vice City Police)',
    status: '10-23 Arrived on Scene',
    assignedCallId: 'call-911-8842',
    location: 'Ocean Drive & 12th St',
    lastUpdated: Date.now() - 1000 * 30,
    vehiclePlate: 'VCPD 12'
  },
  {
    badgeNumber: 'VCPD-119',
    officerName: 'Ofc. Jason Duval',
    callsign: '2-LINCOLN-10',
    department: 'VCPD (Vice City Police)',
    status: '10-8 Available',
    assignedCallId: null,
    location: 'Downtown Vice Central',
    lastUpdated: Date.now() - 1000 * 120,
    vehiclePlate: 'VCPD 88'
  },
  {
    badgeNumber: 'EMS-04',
    officerName: 'Paramedic Clara Diaz',
    callsign: 'MEDIC-4',
    department: 'VC-EMS (Ocean Drive EMS)',
    status: '10-23 Arrived on Scene',
    assignedCallId: 'call-911-8842',
    location: 'Ocean Drive Fleeca Perimeter',
    lastUpdated: Date.now() - 1000 * 45,
    vehiclePlate: 'MEDIC 04'
  },
  {
    badgeNumber: 'LHPO-77',
    officerName: 'Trooper Marcus Brody',
    callsign: '3-MARY-05',
    department: 'LHPO (Leonida Highway Patrol)',
    status: '10-6 Busy',
    assignedCallId: null,
    location: 'Everglades Toll Highway KM 44',
    lastUpdated: Date.now() - 1000 * 300,
    vehiclePlate: 'LHPO 77'
  }
];

const SEED_WARRANTS: CadWarrant[] = [
  {
    id: 'WAR-2026-904',
    suspectName: 'Ricardo Cortez Jr.',
    suspectSsn: '901-44-8821',
    issuingJudge: 'Hon. Margaret Holloway',
    reportingOfficer: 'Det. Marcus Ray',
    charges: [
      { title: 'Grand Theft Auto (Class A Felony)', count: 2, severity: 'Felony' },
      { title: 'Evading Police with High Speed', count: 1, severity: 'Misdemeanor' }
    ],
    status: 'Active',
    bailAmount: 75000,
    bailable: true,
    notes: 'Armed and dangerous. Known to frequent Starfish Island marina docks.',
    issuedAt: Date.now() - 1000 * 60 * 60 * 48
  },
  {
    id: 'WAR-2026-908',
    suspectName: 'Dante "Viper" Morales',
    suspectSsn: '812-33-0941',
    issuingJudge: 'Hon. Arthur Vance',
    reportingOfficer: 'Sgt. Leo Vance',
    charges: [
      { title: 'Armed Robbery with Firearm Enhancement', count: 1, severity: 'Felony' },
      { title: 'Assault with a Deadly Weapon on Peace Officer', count: 1, severity: 'Felony' }
    ],
    status: 'Active',
    bailAmount: 250000,
    bailable: false,
    notes: 'No bail per Judicial Special Order. Suspect active with Downtown Vice syndicate.',
    issuedAt: Date.now() - 1000 * 60 * 60 * 12
  }
];

export const CadMdtTerminal: React.FC = () => {
  const [activeCadView, setActiveCadView] = useState<'dispatch' | 'police' | 'ems' | 'warrants' | 'ncic'>('dispatch');
  const [myCallsign, setMyCallsign] = useState<string>('1-ADAM-12');
  const [myOfficerName, setMyOfficerName] = useState<string>('Sgt. Leo Vance');
  const [myDepartment, setMyDepartment] = useState<CadDepartment>('VCPD (Vice City Police)');
  const [myStatus, setMyStatus] = useState<UnitStatusCode>('10-8 Available');
  
  // Real-Time Calls & Units State (with localStorage caching)
  const [calls, setCalls] = useState<ActiveCadCall[]>(() => {
    try {
      const saved = localStorage.getItem('vice_cad_calls');
      return saved ? JSON.parse(saved) : INITIAL_CALLS;
    } catch (e) {
      return INITIAL_CALLS;
    }
  });

  const [units, setUnits] = useState<ActiveCadUnit[]>(() => {
    try {
      const saved = localStorage.getItem('vice_cad_units');
      return saved ? JSON.parse(saved) : INITIAL_UNITS;
    } catch (e) {
      return INITIAL_UNITS;
    }
  });

  const [warrants, setWarrants] = useState<CadWarrant[]>(SEED_WARRANTS);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(calls[0]?.id || null);
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // NCIC Search State
  const [ncicQuery, setNcicQuery] = useState<string>('');
  const [ncicType, setNcicType] = useState<'person' | 'vehicle'>('person');
  const [ncicResultPerson, setNcicResultPerson] = useState<NcicSuspectRecord | null>(null);
  const [ncicResultVehicle, setNcicResultVehicle] = useState<NcicVehicleRecord | null>(null);
  const [ncicSearching, setNcicSearching] = useState<boolean>(false);

  // New Call Form State
  const [newCallTitle, setNewCallTitle] = useState('');
  const [newCallDesc, setNewCallDesc] = useState('');
  const [newCallLocation, setNewCallLocation] = useState('');
  const [newCallPostal, setNewCallPostal] = useState('');
  const [newCallPriority, setNewCallPriority] = useState<CallPriority>('Code 2 (Urgent)');

  // EMS Anatomical Damage Chart State
  const [selectedAnatomicalZone, setSelectedAnatomicalZone] = useState<AnatomicalZone>('Chest & Thorax');
  const [selectedInjuryType, setSelectedInjuryType] = useState<TraumaInjuryType>('Gunshot Wound (Entry/Exit)');
  const [injurySeverity, setInjurySeverity] = useState<'Minor' | 'Moderate' | 'Severe' | 'Critical / Lethal'>('Severe');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [patientName, setPatientName] = useState('John Doe (Subject #492)');
  const [patientBloodType, setPatientBloodType] = useState<'O+' | 'A+' | 'B+' | 'AB-'>('O+');
  const [traumaLogs, setTraumaLogs] = useState<PatientTraumaLog[]>([
    {
      id: 'trauma-1',
      zone: 'Chest & Thorax',
      injuryType: 'Gunshot Wound (Entry/Exit)',
      severity: 'Severe',
      treatmentApplied: 'Hemostatic gauze packed, chest seal applied, 2x 18G IV normal saline pushed.',
      timestamp: Date.now() - 1000 * 60 * 15,
      medicName: 'Paramedic Clara Diaz'
    }
  ]);

  // Persist calls to local storage
  useEffect(() => {
    try {
      localStorage.setItem('vice_cad_calls', JSON.stringify(calls));
    } catch (e) {}
  }, [calls]);

  useEffect(() => {
    try {
      localStorage.setItem('vice_cad_units', JSON.stringify(units));
    } catch (e) {}
  }, [units]);

  const handleUpdateUnitStatus = (status: UnitStatusCode) => {
    setMyStatus(status);
    setUnits(prev => {
      const existing = prev.find(u => u.callsign === myCallsign);
      if (existing) {
        return prev.map(u => u.callsign === myCallsign ? { ...u, status, lastUpdated: Date.now() } : u);
      } else {
        return [...prev, {
          badgeNumber: 'VCPD-990',
          officerName: myOfficerName,
          callsign: myCallsign,
          department: myDepartment,
          status,
          assignedCallId: null,
          location: 'Vice City Perimeter',
          lastUpdated: Date.now()
        }];
      }
    });
  };

  const handleUpdateCallStatus = (callId: string, status: CallStatus) => {
    setCalls(prev => prev.map(c => c.id === callId ? { ...c, status } : c));
  };

  const handleAttachSelfToCall = (callId: string) => {
    setCalls(prev => prev.map(c => {
      if (c.id === callId) {
        const hasUnit = c.attachedUnits.includes(myCallsign);
        return {
          ...c,
          attachedUnits: hasUnit ? c.attachedUnits : [...c.attachedUnits, myCallsign]
        };
      }
      return c;
    }));
  };

  const handleCreateCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCallTitle || !newCallLocation) return;
    const newCall: ActiveCadCall = {
      id: `call-911-${Math.floor(1000 + Math.random() * 9000)}`,
      caller: '911 Emergency Operator',
      title: newCallTitle,
      description: newCallDesc || 'Officer dispatched via manual terminal creation.',
      location: newCallLocation,
      postal: newCallPostal || '1001',
      district: 'Vice City Metro',
      priority: newCallPriority,
      status: 'Pending',
      attachedUnits: [myCallsign],
      timestamp: Date.now()
    };
    setCalls(prev => [newCall, ...prev]);
    setSelectedCallId(newCall.id);
    setIsNewCallModalOpen(false);
    setNewCallTitle('');
    setNewCallDesc('');
    setNewCallLocation('');
  };

  const handleRunNcicSearch = () => {
    if (!ncicQuery) return;
    setNcicSearching(true);
    setNcicResultPerson(null);
    setNcicResultVehicle(null);

    setTimeout(() => {
      setNcicSearching(false);
      if (ncicType === 'person') {
        setNcicResultPerson({
          id: 'ncic-p-994',
          characterName: ncicQuery.toUpperCase(),
          dob: '1994-08-14',
          ssn: '882-90-1142',
          gender: 'Male',
          hairColor: 'Dark Brown',
          eyeColor: 'Hazel',
          address: '884 Starfish Island Way, Apt 12B',
          priorArrests: 4,
          isWanted: true,
          activeWarrantsCount: 2,
          driverLicenseStatus: 'Valid',
          weaponPermitStatus: 'Valid Class 1',
          mugshotUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
          notes: ['Subject known to carry concealed sidearm.', 'Flagged for multiple street racing citations on Ocean Drive.']
        });
      } else {
        setNcicResultVehicle({
          plate: ncicQuery.toUpperCase(),
          vin: '1VCPD2026LEONIDA992',
          model: 'Bravado Gauntlet Interceptor',
          brand: 'Bravado',
          color: 'Midnight Black / Gloss Red Pearl',
          ownerName: 'Ricardo Cortez Jr.',
          ownerSsn: '901-44-8821',
          registrationStatus: 'Valid',
          stolenFlag: false,
          boloActive: true,
          boloReason: 'Suspect vehicle in Fleeca Bank Armed Robbery on Ocean Drive.'
        });
      }
    }, 600);
  };

  const handleAddTraumaLog = () => {
    const newLog: PatientTraumaLog = {
      id: `trauma-${Date.now()}`,
      zone: selectedAnatomicalZone,
      injuryType: selectedInjuryType,
      severity: injurySeverity,
      treatmentApplied: treatmentNotes || 'Emergency stabilization & trauma wound treatment recorded.',
      timestamp: Date.now(),
      medicName: myOfficerName
    };
    setTraumaLogs(prev => [newLog, ...prev]);
    setTreatmentNotes('');
  };

  const selectedCall = calls.find(c => c.id === selectedCallId) || calls[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* CAD HEADER BAR WITH REALTIME RADIO & UNIT TOGGLE */}
      <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30">
            <Siren className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">Leonida CAD / MDT Emergency Gateway</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                RTDB LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">VCPD • Leonida Highway Patrol • Ocean Drive Fire & EMS Unified Terminal</p>
          </div>
        </div>

        {/* ACTIVE UNIT QUICK CONTROLS */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
          <div className="px-3 py-1 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Officer Callsign:</span>
            <span className="font-mono text-cyan-300 font-bold">{myCallsign} ({myOfficerName})</span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          {/* 10-Codes Status Bar */}
          <div className="flex items-center gap-1">
            {(['10-8 Available', '10-6 Busy', '10-7 Out of Service', '10-99 Emergency'] as UnitStatusCode[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleUpdateUnitStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                  myStatus === st
                    ? st.includes('10-8') 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                      : st.includes('10-99')
                      ? 'bg-red-600 text-white border-red-400 shadow-red-600/40 animate-pulse font-black'
                      : 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{st.split(' ')[0]}</span>
                <span className="hidden md:inline">{st.split(' ').slice(1).join(' ')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TOP SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'dispatch', label: '911 Dispatch Board', icon: PhoneCall, count: calls.filter(c => c.status !== 'Cleared').length },
          { id: 'police', label: 'Police MDT & Records', icon: ShieldAlert },
          { id: 'ncic', label: 'NCIC Database Lookup', icon: Search },
          { id: 'warrants', label: 'Active Arrest Warrants', icon: FileText, count: warrants.length },
          { id: 'ems', label: 'EMS Hospital & Trauma Log', icon: Stethoscope, count: traumaLogs.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCadView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCadView(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* VIEW 1: 911 / 311 DISPATCH BOARD */}
      {activeCadView === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CALLS LIST (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Siren className="w-5 h-5 text-rose-400" />
                <h2 className="text-base font-black text-white uppercase tracking-wider">Active Emergency Call Queue</h2>
              </div>
              <button
                onClick={() => setIsNewCallModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Create 911 Incident</span>
              </button>
            </div>

            <div className="space-y-3">
              {calls.map((call) => {
                const isSelected = selectedCallId === call.id;
                const isEmergency = call.priority.includes('Code 3') || call.priority.includes('10-99');
                return (
                  <div
                    key={call.id}
                    onClick={() => setSelectedCallId(call.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isEmergency 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {call.priority}
                          </span>
                          <span className="font-mono text-xs text-slate-400">{call.id}</span>
                        </div>
                        <h3 className="font-black text-white text-sm">{call.title}</h3>
                      </div>
                      <div className="text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          call.status === 'On Scene' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          call.status === 'En Route' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {call.status}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 mb-3">{call.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{call.location} (Postal {call.postal})</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">Units:</span>
                        {call.attachedUnits.length > 0 ? (
                          call.attachedUnits.map(u => (
                            <span key={u} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[10px] font-mono font-bold">
                              {u}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-rose-400 font-bold">No Units Attached</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CALL INSPECTION & ROSTER (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            {selectedCall ? (
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Incident Details</span>
                    <h3 className="font-black text-white text-base mt-0.5">{selectedCall.title}</h3>
                  </div>
                  <button
                    onClick={() => handleAttachSelfToCall(selectedCall.id)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer transition shadow"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Attach My Unit ({myCallsign})</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Caller Identity:</span>
                    <span className="text-white font-medium">{selectedCall.caller} ({selectedCall.callerPhone || 'Unknown'})</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Dispatch Location:</span>
                    <span className="text-cyan-300 font-mono font-bold">{selectedCall.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Postal Code:</span>
                    <span className="text-white font-mono">{selectedCall.postal}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs leading-relaxed text-slate-300">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Incident Narrative:</span>
                  {selectedCall.description}
                </div>

                {/* Call Status Mutators */}
                <div>
                  <label className="block text-slate-400 text-xs font-bold mb-1.5">Update Incident Status:</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Pending', 'En Route', 'On Scene', 'Cleared'] as CallStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateCallStatus(selectedCall.id, st)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center cursor-pointer border ${
                          selectedCall.status === st
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* REAL-TIME UNIT STATUS ROSTER */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Field Units Connected ({units.length})</h3>
                </div>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {units.map((unit) => (
                  <div key={unit.callsign} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{unit.callsign}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({unit.officerName})</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{unit.department} • {unit.location}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      unit.status.includes('10-8') ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                      unit.status.includes('10-99') ? 'bg-red-950 text-red-300 border border-red-500/40 animate-ping' :
                      'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}>
                      {unit.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: POLICE MDT & INCIDENTS */}
      {activeCadView === 'police' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <ShieldAlert className="w-6 h-6 text-indigo-400" />
                <div>
                  <h2 className="text-lg font-black text-white">VCPD Incident Report & Case File Engine</h2>
                  <p className="text-xs text-slate-400">File official felony reports, attach evidence logs, and issue judicial citations</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Case Title:</label>
                  <input
                    type="text"
                    defaultValue="Grand Theft Auto & Evading Peace Officer"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Primary Suspect Name:</label>
                  <input
                    type="text"
                    defaultValue="Ricardo Cortez Jr."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Probable Cause & Narrative:</label>
                <textarea
                  rows={4}
                  defaultValue="On 09/02/2026 at approximately 14:20 hours, unit 1-ADAM-12 observed suspect operating a stolen black Bravado Gauntlet at excessive speed on Ocean Drive. Suspect failed to yield to emergency lights and sirens, initiating a Code 3 vehicle pursuit."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 font-mono">Lead Officer: {myOfficerName} ({myCallsign})</span>
                <button
                  type="button"
                  onClick={() => alert('Incident Report successfully filed and synchronized with case archives.')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg"
                >
                  File Incident Record
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Quick Penal Code Cheatsheet</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200">PC 10-90 Bank Robbery</span>
                  <span className="text-rose-400 font-mono font-bold">$50,000 / 45 Mo</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200">PC 10-99 Officer Down</span>
                  <span className="text-rose-500 font-mono font-bold">No Bail / Max</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200">PC 10-50 Evading Police</span>
                  <span className="text-amber-400 font-mono font-bold">$15,000 / 20 Mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: NCIC DATABASE LOOKUP */}
      {activeCadView === 'ncic' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-cyan-400" />
                  <span>National Crime Information Center (NCIC) Terminal</span>
                </h2>
                <p className="text-xs text-slate-400">Search suspect criminal dossiers, vehicle registrations, and active warrants</p>
              </div>

              {/* Type Switcher */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setNcicType('person'); setNcicQuery('Ricardo Cortez'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    ncicType === 'person' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Suspect Search
                </button>
                <button
                  type="button"
                  onClick={() => { setNcicType('vehicle'); setNcicQuery('VCPD 12'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    ncicType === 'vehicle' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Vehicle Plate / VIN
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={ncicQuery}
                onChange={(e) => setNcicQuery(e.target.value)}
                placeholder={ncicType === 'person' ? 'Enter suspect name (e.g. Ricardo Cortez) or SSN...' : 'Enter plate number (e.g. VCPD 12) or VIN...'}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleRunNcicSearch}
                disabled={ncicSearching}
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer transition shadow"
              >
                {ncicSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Query NCIC</span>
              </button>
            </div>

            {/* RESULTS RENDERING */}
            {ncicResultPerson && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 animate-in fade-in">
                <div className="md:col-span-3 space-y-2 text-center">
                  <div className="w-full h-44 rounded-2xl bg-slate-950 border border-slate-700 overflow-hidden relative shadow-inner">
                    <img
                      src={ncicResultPerson.mugshotUrl}
                      alt="Mugshot"
                      className="w-full h-full object-cover grayscale contrast-125"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[9px]">
                      WANTED
                    </div>
                  </div>
                  <span className="font-mono text-xs text-rose-400 font-bold">Warrants: {ncicResultPerson.activeWarrantsCount} Active</span>
                </div>

                <div className="md:col-span-9 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Suspect Profile:</span>
                      <h3 className="text-base font-black text-white">{ncicResultPerson.characterName}</h3>
                    </div>
                    <span className="font-mono text-slate-400">SSN: {ncicResultPerson.ssn}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Driver License:</span>
                      <span className="font-bold text-emerald-400">{ncicResultPerson.driverLicenseStatus}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Weapons Permit:</span>
                      <span className="font-bold text-amber-400">{ncicResultPerson.weaponPermitStatus}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Prior Arrests:</span>
                      <span className="font-bold text-rose-400">{ncicResultPerson.priorArrests} Convictions</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Officer Safety Notes:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                      {ncicResultPerson.notes.map((n, idx) => (
                        <li key={idx}>{n}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {ncicResultVehicle && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 mt-4 space-y-3 text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-black text-white">{ncicResultVehicle.brand} {ncicResultVehicle.model}</h3>
                  </div>
                  <span className="px-3 py-1 rounded bg-slate-950 border border-cyan-500/40 text-cyan-300 font-mono font-black text-sm">
                    {ncicResultVehicle.plate}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Owner Name:</span>
                    <span className="font-bold text-white">{ncicResultVehicle.ownerName}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Color & Finish:</span>
                    <span className="font-bold text-slate-300">{ncicResultVehicle.color}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Registration Status:</span>
                    <span className="font-bold text-emerald-400">{ncicResultVehicle.registrationStatus}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">BOLO Alert:</span>
                    <span className="font-bold text-rose-400">{ncicResultVehicle.boloActive ? 'ACTIVE BOLO' : 'None'}</span>
                  </div>
                </div>

                {ncicResultVehicle.boloActive && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300">
                    <strong>BOLO Reason:</strong> {ncicResultVehicle.boloReason}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: ACTIVE ARREST WARRANTS */}
      {activeCadView === 'warrants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Active Judicial Arrest Warrants ({warrants.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warrants.map((w) => (
              <div key={w.id} className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">{w.id}</span>
                    <h3 className="text-base font-black text-white">{w.suspectName}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/40">
                    {w.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Filed Charges:</div>
                  {w.charges.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span>{c.count}x {c.title}</span>
                      <span className="text-[10px] font-bold text-rose-400">{c.severity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                  <span>Bail: <strong className="text-emerald-400">{w.bailable ? `$${w.bailAmount.toLocaleString()}` : 'No Bail Allowed'}</strong></span>
                  <span>Issued By: {w.issuingJudge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 5: EMS HOSPITAL & INTERACTIVE DAMAGE CHART */}
      {activeCadView === 'ems' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* INTERACTIVE ANATOMICAL BODY DIAGRAM (5 COLS) */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Activity className="w-5 h-5 text-rose-400" />
              <div>
                <h3 className="font-black text-white text-base">Interactive Trauma Body Matrix</h3>
                <p className="text-xs text-slate-400">Click anatomical body regions to log wound trauma</p>
              </div>
            </div>

            {/* Clickable Anatomical Zones */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {([
                'Head & Facial',
                'Neck & Cervical',
                'Chest & Thorax',
                'Abdomen',
                'Left Upper Arm',
                'Right Upper Arm',
                'Left Forearm / Hand',
                'Right Forearm / Hand',
                'Left Leg / Thigh',
                'Right Leg / Thigh',
                'Left Foot',
                'Right Foot'
              ] as AnatomicalZone[]).map((zone) => {
                const isSelected = selectedAnatomicalZone === zone;
                const hasTrauma = traumaLogs.some(t => t.zone === zone);
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setSelectedAnatomicalZone(zone)}
                    className={`p-3 rounded-2xl border text-left font-bold transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                        : hasTrauma
                        ? 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>{zone}</span>
                    {hasTrauma && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                  </button>
                );
              })}
            </div>

            {/* Selected Zone Log Form */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <div className="font-bold text-white">Logging Trauma on: <span className="text-rose-400">{selectedAnatomicalZone}</span></div>
              
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Injury Type:</label>
                <select
                  value={selectedInjuryType}
                  onChange={(e) => setSelectedInjuryType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-bold"
                >
                  <option>Gunshot Wound (Entry/Exit)</option>
                  <option>Laceration / Deep Cut</option>
                  <option>Blunt Force Contusion</option>
                  <option>2nd/3rd Degree Burn</option>
                  <option>Compound Fracture</option>
                  <option>Puncture / Shrapnel</option>
                  <option>Internal Bleeding</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Treatment Applied:</label>
                <input
                  type="text"
                  value={treatmentNotes}
                  onChange={(e) => setTreatmentNotes(e.target.value)}
                  placeholder="e.g. Gauze packed, tourniquet high and tight, IV morphine..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleAddTraumaLog}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-md transition"
              >
                Record Trauma Wound Entry
              </button>
            </div>
          </div>

          {/* PATIENT TRIAGE LEDGER (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-white text-base">Patient Medical Registry & Triage</h3>
                  <p className="text-xs text-slate-400">Active Trauma Ledger for {patientName}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold text-xs">
                  Blood: {patientBloodType}
                </span>
              </div>

              <div className="space-y-3">
                {traumaLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">{log.zone}</span>
                        <strong className="text-white text-sm">{log.injuryType}</strong>
                      </div>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      {log.treatmentApplied}
                    </p>

                    <div className="text-[10px] text-slate-500 text-right">
                      Treating Medic: {log.medicName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE 911 MODAL OVERLAY */}
      {isNewCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Siren className="w-5 h-5 text-rose-400" />
                <span>Create Live 911 Incident</span>
              </h3>
              <button
                onClick={() => setIsNewCallModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCall} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Incident Title / 10-Code:</label>
                <input
                  type="text"
                  required
                  value={newCallTitle}
                  onChange={(e) => setNewCallTitle(e.target.value)}
                  placeholder="e.g. 10-90 Armed Bank Robbery Fleeca"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Location / Street:</label>
                  <input
                    type="text"
                    required
                    value={newCallLocation}
                    onChange={(e) => setNewCallLocation(e.target.value)}
                    placeholder="e.g. 1400 Ocean Drive"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Postal Code:</label>
                  <input
                    type="text"
                    value={newCallPostal}
                    onChange={(e) => setNewCallPostal(e.target.value)}
                    placeholder="e.g. 1042"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Priority Level:</label>
                <select
                  value={newCallPriority}
                  onChange={(e) => setNewCallPriority(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  <option>Code 1 (Routine)</option>
                  <option>Code 2 (Urgent)</option>
                  <option>Code 3 (Emergency / Lights & Sirens)</option>
                  <option>10-99 Officer Down</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description & Suspect Details:</label>
                <textarea
                  rows={3}
                  value={newCallDesc}
                  onChange={(e) => setNewCallDesc(e.target.value)}
                  placeholder="Provide incident narrative, vehicle colors, weapons involved..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewCallModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-lg"
                >
                  Broadcast Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
