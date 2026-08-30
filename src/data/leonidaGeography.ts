export interface LeonidaCounty {
  id: string;
  name: string;
  code: string;
  color: string;
  center: { x: number; y: number };
  description: string;
  subDistricts: string[];
}

export interface LeonidaLandmark {
  id: string;
  name: string;
  type: 'city' | 'town' | 'airport' | 'facility' | 'mountain' | 'lake' | 'district' | 'harbor' | 'point_of_interest';
  county: string;
  x: number; // percentage in 0..100 coordinates
  y: number;
  pinColor: 'black' | 'purple' | 'red' | 'yellow' | 'cyan';
  elevation?: string;
  gridCode?: string;
  inGameConfirmed?: boolean;
  speculative?: boolean;
  trailerRef?: string;
  description: string;
  teleportCommand?: string;
}

export const LEONIDA_COUNTIES: LeonidaCounty[] = [
  {
    id: 'kelly-county',
    name: 'Kelly County',
    code: 'KC',
    color: '#00b4d8',
    center: { x: 49, y: 22 },
    description: 'Northwestern rural county featuring rolling hills, agricultural farmland, Hank Hill, Jack\'s Hill, Domed Hills, and the gateway to Port Gellhorn.',
    subDistricts: ['Hank Hill', 'Domed Hills', 'Redhill', 'Jack\'s Hill', 'Yorktown', 'Redwood Mail Club']
  },
  {
    id: 'ambrosia-county',
    name: 'Ambrosia County',
    code: 'AC',
    color: '#0284c7',
    center: { x: 69, y: 20 },
    description: 'Northern wilderness and highlands containing Mount Kalaga National Park, Redhill Forest, Fairyland Forest, and the industrial sugar mill town of Ambrosia.',
    subDistricts: ['Mount Kalaga', 'Ambrosia Town', 'Fairyland Forest', 'Redhill Forest', 'Sugar Mill District']
  },
  {
    id: 'leonard-county',
    name: 'Leonard County',
    code: 'LC',
    color: '#0ea5e9',
    center: { x: 81, y: 28 },
    description: 'Northeastern coastal county bridging the northern highlands with greater Vice City, featuring scenic coastlines, Seaview, and North Beaches.',
    subDistricts: ['Seaview', 'North Vice', 'North Beaches', 'Waning Sands', 'Pelican Ridge']
  },
  {
    id: 'mariana-county',
    name: 'Mariana County',
    code: 'MC',
    color: '#0284c7',
    center: { x: 57, y: 76 },
    description: 'Central-south county connecting western port cities to the Everglades, housing the high-security Leonida State Prison and rural marshland trails.',
    subDistricts: ['Leonida State Prison', 'Watson Bay', 'Hamlet Junction', 'Pine Ridge', 'Marsh Basin']
  },
  {
    id: 'vice-dale-county',
    name: 'Vice-Dale County',
    code: 'VDC',
    color: '#38bdf8',
    center: { x: 70, y: 60 },
    description: 'The economic and cultural heart of Leonida, encompassing greater Vice City, Vice Beach, Ocean Drive, Biscayne Bay, and Vice City International Airport.',
    subDistricts: ['Downtown Vice', 'Vice Beach', 'South Beach', 'Little Haiti', 'Starfish Island', 'Bayside', 'Brickell', 'Vice Port', 'Bayshore', 'Fisher Island', 'Virginia Key', 'Key Biscayne', 'Crosstown', 'Rockridge']
  },
  {
    id: 'grass-rivers',
    name: 'Grass Rivers',
    code: 'GR',
    color: '#10b981',
    center: { x: 65, y: 94 },
    description: 'Vast subtropical wetland expanse modeling the Florida Everglades, dominated by meandering mangrove canals, alligator reserves, and airboat channels.',
    subDistricts: ['Alligator Alley', 'Mangrove Estuary', 'Sawgrass Flats', 'Southern Key Way', 'Airboat Basin']
  }
];

export const LEONIDA_LANDMARKS: LeonidaLandmark[] = [
  // Major Urban Centers & Towns
  {
    id: 'vice-city-metro',
    name: 'Vice City',
    type: 'city',
    county: 'Vice-Dale County',
    x: 84,
    y: 58,
    pinColor: 'black',
    elevation: '4m AMSL',
    gridCode: 's01 e08 (sb37)',
    inGameConfirmed: true,
    trailerRef: 'Trailer 1 (0:12 - Ocean Drive & Skyline)',
    description: 'The sprawling, sun-soaked metropolis of Vice City. Features luxury high-rises, Ocean Drive art deco strip, Vice Beach, Little Haiti, and bustling nightlife.',
    teleportCommand: '/tp 840.5 580.2 6.0'
  },
  {
    id: 'port-gellhorn',
    name: 'Port Gellhorn',
    type: 'city',
    county: 'Kelly County',
    x: 43,
    y: 35,
    pinColor: 'black',
    elevation: '8m AMSL',
    gridCode: 'n04 w06',
    inGameConfirmed: true,
    trailerRef: 'Trailer 1 (0:48 - Gellhorn Strip & Pawn Shops)',
    description: 'Western coastal industrial city known for cargo shipping ports, strip malls, motels, raceways, and manufacturing plants.',
    teleportCommand: '/tp 430.0 350.0 8.0'
  },
  {
    id: 'ambrosia-town',
    name: 'Ambrosia',
    type: 'town',
    county: 'Ambrosia County',
    x: 66,
    y: 44,
    pinColor: 'black',
    elevation: '18m AMSL',
    gridCode: 'n03 e02',
    inGameConfirmed: true,
    trailerRef: 'Trailer 1 (0:36 - Rural Farmlands & Sugar Refinery)',
    description: 'Agricultural and industrial town centered around sugarcane plantations, manufacturing mills, and regional supply depots.',
    teleportCommand: '/tp 660.0 440.0 18.0'
  },
  {
    id: 'mount-kalaga',
    name: 'Mount Kalaga',
    type: 'mountain',
    county: 'Ambrosia County',
    x: 71,
    y: 10,
    pinColor: 'purple',
    elevation: '420m AMSL',
    gridCode: 'n12 e03',
    inGameConfirmed: true,
    trailerRef: 'Trailer 1 (0:04 - Northern Forest Ridge Panorama)',
    description: 'Highest elevation peak in Leonida, featuring hiking trails, scenic overlooks, communications relay towers, and deep pine forests.',
    teleportCommand: '/tp 710.0 100.0 420.0'
  },
  {
    id: 'hamlet',
    name: 'Hamlet',
    type: 'town',
    county: 'Mariana County',
    x: 69,
    y: 87,
    pinColor: 'black',
    elevation: '3m AMSL',
    gridCode: 's07 e03',
    inGameConfirmed: true,
    trailerRef: 'Trailer 1 (0:22 - Southern Swamp Junction)',
    description: 'Quaint southern settlement serving as the transit junction between central Leonida and the Florida/Leonida Keys overseas highway.',
    teleportCommand: '/tp 690.0 870.0 3.0'
  },
  {
    id: 'watson-bay',
    name: 'Watson Bay',
    type: 'harbor',
    county: 'Mariana County',
    x: 53,
    y: 92,
    pinColor: 'black',
    elevation: '2m AMSL',
    gridCode: 's09 w03',
    inGameConfirmed: true,
    description: 'Southwestern coastal harbor basin popular for commercial shrimp trawlers, sport fishing charters, and clandestine smuggling channels.',
    teleportCommand: '/tp 530.0 920.0 2.0'
  },
  {
    id: 'lake-leonida',
    name: 'Lake Leonida',
    type: 'lake',
    county: 'Ambrosia County',
    x: 69,
    y: 33,
    pinColor: 'cyan',
    elevation: '12m AMSL',
    gridCode: 'n06 e03',
    inGameConfirmed: true,
    description: 'Massive inland freshwater lake modeling Lake Okeechobee, flanked by wetlands, lock gates, and recreational boating docks.',
    teleportCommand: '/tp 690.0 330.0 12.0'
  },

  // Key Facilities & Infrastructure
  {
    id: 'vice-city-airport',
    name: 'Vice City International Airport (VIA)',
    type: 'airport',
    county: 'Vice-Dale County',
    x: 67,
    y: 67,
    pinColor: 'purple',
    elevation: '5m AMSL',
    gridCode: 's03 e02 (ap01)',
    inGameConfirmed: true,
    trailerRef: 'Trailer 1 (0:15 - Commercial Jetliners over Freeway)',
    description: 'Primary international airport terminal with dual parallel commercial runways, cargo hangars, executive jet aprons, and control tower.',
    teleportCommand: '/tp 670.0 670.0 5.0'
  },
  {
    id: 'leonida-state-prison',
    name: 'Leonida State Prison (LDC)',
    type: 'facility',
    county: 'Mariana County',
    x: 56,
    y: 52,
    pinColor: 'purple',
    elevation: '14m AMSL',
    gridCode: 'n01 w02',
    inGameConfirmed: true,
    trailerRef: 'Trailer 1 (0:02 - Lucia Prison Interview Scene)',
    description: 'Maximum security correctional facility featuring reinforced razor wire perimeter fencing, guard watchtowers, exercise yards, and intake blocks.',
    teleportCommand: '/tp 560.0 520.0 14.0'
  },
  {
    id: 'port-gellhorn-airfield',
    name: 'Port Gellhorn Airfield',
    type: 'airport',
    county: 'Kelly County',
    x: 47,
    y: 51,
    pinColor: 'black',
    elevation: '9m AMSL',
    gridCode: 's01 w05',
    inGameConfirmed: true,
    description: 'Regional airfield supporting domestic cargo logistics, agricultural crop-dusters, flight schools, and private aircraft hangars.',
    teleportCommand: '/tp 470.0 510.0 9.0'
  },
  {
    id: 'vice-port',
    name: 'Vice Port (Port VC)',
    type: 'harbor',
    county: 'Vice-Dale County',
    x: 85,
    y: 69,
    pinColor: 'black',
    elevation: '3m AMSL',
    gridCode: 's04 e08 (po02)',
    inGameConfirmed: true,
    description: 'Bustling deepwater container shipping port with gantry cranes, cargo container yards, cruise liner terminals, and customs warehouses.',
    teleportCommand: '/tp 850.0 690.0 3.0'
  },

  // Districts & Neighborhoods
  {
    id: 'south-beach-ocean-drive',
    name: 'South Beach & Ocean Drive',
    type: 'district',
    county: 'Vice-Dale County',
    x: 90,
    y: 61,
    pinColor: 'black',
    elevation: '2m AMSL',
    gridCode: 's02 e10 (sb01)',
    inGameConfirmed: true,
    trailerRef: 'Trailer 1 (0:18 - Ocean Drive Supercars & Beach)',
    description: 'World-famous neon-lit boulevard lined with art deco hotels, outdoor cafes, palm trees, golden sand dunes, and vibrant nightlife.',
    teleportCommand: '/tp 900.0 610.0 2.0'
  },
  {
    id: 'washington-beach',
    name: 'Washington Beach',
    type: 'district',
    county: 'Vice-Dale County',
    x: 90,
    y: 49,
    pinColor: 'black',
    elevation: '3m AMSL',
    gridCode: 'n02 e10 (wb01)',
    inGameConfirmed: true,
    description: 'High-end coastal district featuring luxury beachfront condominiums, boardwalks, boutique shopping, and marina docks.',
    teleportCommand: '/tp 900.0 490.0 3.0'
  },
  {
    id: 'bayside-downtown',
    name: 'Bayside & Brickell',
    type: 'district',
    county: 'Vice-Dale County',
    x: 80,
    y: 65,
    pinColor: 'black',
    elevation: '6m AMSL',
    gridCode: 's03 e07 (bk01)',
    inGameConfirmed: true,
    description: 'Financial skyscraper district with luxury hotel penthouses, corporate headquarters, yacht basins, and transit stations.',
    teleportCommand: '/tp 800.0 650.0 6.0'
  },
  {
    id: 'little-haiti',
    name: 'Little Haiti',
    type: 'district',
    county: 'Vice-Dale County',
    x: 77,
    y: 55,
    pinColor: 'black',
    elevation: '7m AMSL',
    gridCode: 'n01 e06 (lh01)',
    inGameConfirmed: true,
    description: 'Culturally vibrant inner-city neighborhood with colorful street murals, local mom-and-pop auto shops, botanicas, and syndicate activity.',
    teleportCommand: '/tp 770.0 550.0 7.0'
  },
  {
    id: 'star-island',
    name: 'Star Island & Venetian Islands',
    type: 'district',
    county: 'Vice-Dale County',
    x: 86,
    y: 62,
    pinColor: 'black',
    elevation: '3m AMSL',
    gridCode: 's02 e09',
    inGameConfirmed: true,
    description: 'Exclusive gated artificial island enclave home to celebrity mansions, private security gates, yacht slips, and swimming pools.',
    teleportCommand: '/tp 860.0 620.0 3.0'
  },
  {
    id: 'key-biscayne-virginia-key',
    name: 'Virginia Key & Key Biscayne',
    type: 'district',
    county: 'Vice-Dale County',
    x: 83,
    y: 79,
    pinColor: 'black',
    elevation: '2m AMSL',
    gridCode: 's06 e08 (vk01)',
    inGameConfirmed: true,
    description: 'Barrier island nature parks, historic lighthouse, marine research basins, and scenic causeways south of Vice City.',
    teleportCommand: '/tp 830.0 790.0 2.0'
  },
  {
    id: 'fisher-island',
    name: 'Fisher Island',
    type: 'district',
    county: 'Vice-Dale County',
    x: 93,
    y: 75,
    pinColor: 'black',
    elevation: '2m AMSL',
    gridCode: 's05 e11',
    inGameConfirmed: true,
    description: 'Ultra-private island accessible exclusively via ferry or helicopter, featuring luxury villas, private golf courses, and marina slips.',
    teleportCommand: '/tp 930.0 750.0 2.0'
  },
  {
    id: 'fairyland-forest',
    name: 'Fairyland Forest',
    type: 'point_of_interest',
    county: 'Ambrosia County',
    x: 60,
    y: 12,
    pinColor: 'purple',
    elevation: '85m AMSL',
    gridCode: 'n11 e00',
    inGameConfirmed: false,
    speculative: true,
    description: 'Dense deciduous and evergreen forest canopy north of Hank Hill, popular for off-road rallies, hunting camps, and hidden contraband cabins.',
    teleportCommand: '/tp 600.0 120.0 85.0'
  },
  {
    id: 'domed-hills',
    name: 'Domed Hills',
    type: 'mountain',
    county: 'Kelly County',
    x: 55,
    y: 18,
    pinColor: 'purple',
    elevation: '120m AMSL',
    gridCode: 'n09 w02',
    inGameConfirmed: true,
    description: 'Prominent geological dome formations offering panoramic vantage points over Kelly County farmlands and northern highways.',
    teleportCommand: '/tp 550.0 180.0 120.0'
  },
  {
    id: 'west-perrine',
    name: 'West Perrine',
    type: 'town',
    county: 'Vice-Dale County',
    x: 73,
    y: 81,
    pinColor: 'black',
    elevation: '4m AMSL',
    gridCode: 's05 e04',
    inGameConfirmed: true,
    description: 'Suburban township southwest of Vice City featuring highway truck stops, strip malls, and residential cul-de-sacs.',
    teleportCommand: '/tp 730.0 810.0 4.0'
  },
  {
    id: 'redwood-mail-club',
    name: 'Redwood Mail Club / Racetrack',
    type: 'facility',
    county: 'Kelly County',
    x: 51,
    y: 63,
    pinColor: 'purple',
    elevation: '11m AMSL',
    gridCode: 's04 w04',
    inGameConfirmed: false,
    speculative: true,
    description: 'Speculative motorsport speedway complex and regional country club facility situated west of Mariana County.',
    teleportCommand: '/tp 510.0 630.0 11.0'
  }
];
