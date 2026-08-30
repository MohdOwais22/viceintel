'use client';
import React from 'react';
import { LEONIDA_COUNTIES, LEONIDA_LANDMARKS } from '../../data/leonidaGeography';

export type MapSourceType = 'gtav' | 'gtavi';
export type MapTheme = 'leonida' | 'satellite' | 'night' | 'tactical' | 'neon';

interface VectorMapTerrainProps {
  sourceType: MapSourceType;
  theme?: MapTheme;
  showRoads?: boolean;
  showDistricts?: boolean;
  showTopography?: boolean;
  showWaterways?: boolean;
  showCountyBorders?: boolean;
  showBuildings?: boolean;
  showMetro?: boolean;
  showGrid?: boolean;
  onSelectLandmark?: (landmark: (typeof LEONIDA_LANDMARKS)[0]) => void;
  selectedLandmarkId?: string | null;
}

export const VectorMapTerrain: React.FC<VectorMapTerrainProps> = ({
  sourceType,
  theme = 'leonida',
  showRoads = true,
  showDistricts = true,
  showTopography = true,
  showWaterways = true,
  showCountyBorders = true,
  showBuildings = true,
  showMetro = true,
  showGrid = true,
  onSelectLandmark,
  selectedLandmarkId
}) => {
  // Theme Color Palette
  const getThemePalette = () => {
    switch (theme) {
      case 'leonida': // Authentic State of Leonida Mapping Project Theme (from user image)
      default:
        return {
          waterDeep: '#6ba2ce',
          waterMid: '#74a4cf',
          waterShallow: '#86b4db',
          waterShoal: '#9ac5e5',
          landRural: '#8bc27c',
          landRuralAlt: '#7ebc70',
          landUrban: '#c2ceb9',
          landUrbanDense: '#b8c5af',
          sandBeach: '#ede3ad',
          sandDune: '#e0d396',
          lakeWater: '#74a4cf',
          topoElevation10m: '#79b26b',
          topoElevation15m: '#68a159',
          topoElevation20m: '#507548',
          topoContourLine: '#3e6237',
          forestCanopy: '#2d6a36',
          specHighway: '#e63946',
          specRoad: '#f05a28',
          standardRoad: '#505a66',
          localStreet: '#717c8a',
          metroMule: '#ffd600',
          railway: '#2b2d42',
          airportRunway: '#3a4454',
          airportRunwayStripe: '#ffffff',
          buildingConfirmed: '#ffe600',
          buildingSpec: '#eb3b3b',
          countyBorder: '#00b4d8',
          countyBorderSpec: '#0096c7',
          districtTextDark: '#1e293b',
          districtTextLight: '#ffffff',
          districtTextYellow: '#fef08a',
          gridLine: '#ffffff',
          gridText: '#e2e8f0',
          prisonWall: '#475569'
        };
      case 'satellite':
        return {
          waterDeep: '#081726',
          waterMid: '#0c2438',
          waterShallow: '#134657',
          waterShoal: '#1c6070',
          landRural: '#172f22',
          landRuralAlt: '#12261b',
          landUrban: '#262f3a',
          landUrbanDense: '#323d4b',
          sandBeach: '#bfa980',
          sandDune: '#9e8964',
          lakeWater: '#0c2438',
          topoElevation10m: '#1f3d2e',
          topoElevation15m: '#173024',
          topoElevation20m: '#10231a',
          topoContourLine: '#2b523f',
          forestCanopy: '#0e1f15',
          specHighway: '#f59e0b',
          specRoad: '#fbbf24',
          standardRoad: '#475569',
          localStreet: '#334155',
          metroMule: '#38bdf8',
          railway: '#0f172a',
          airportRunway: '#1e293b',
          airportRunwayStripe: '#ffffff',
          buildingConfirmed: '#38bdf8',
          buildingSpec: '#f43f5e',
          countyBorder: '#38bdf8',
          countyBorderSpec: '#0284c7',
          districtTextDark: '#e2e8f0',
          districtTextLight: '#f8fafc',
          districtTextYellow: '#fef08a',
          gridLine: '#38bdf8',
          gridText: '#94a3b8',
          prisonWall: '#334155'
        };
      case 'night':
        return {
          waterDeep: '#05070a',
          waterMid: '#080d14',
          waterShallow: '#0e1724',
          waterShoal: '#152236',
          landRural: '#0f1712',
          landRuralAlt: '#0a100d',
          landUrban: '#1a202c',
          landUrbanDense: '#242d3d',
          sandBeach: '#3f392f',
          sandDune: '#2d2820',
          lakeWater: '#080d14',
          topoElevation10m: '#142018',
          topoElevation15m: '#101a13',
          topoElevation20m: '#0c140f',
          topoContourLine: '#1f3024',
          forestCanopy: '#09120b',
          specHighway: '#f59e0b',
          specRoad: '#fbbf24',
          standardRoad: '#334155',
          localStreet: '#1e293b',
          metroMule: '#fde047',
          railway: '#020617',
          airportRunway: '#1e293b',
          airportRunwayStripe: '#38bdf8',
          buildingConfirmed: '#fde047',
          buildingSpec: '#ef4444',
          countyBorder: '#06b6d4',
          countyBorderSpec: '#0891b2',
          districtTextDark: '#f8fafc',
          districtTextLight: '#ffffff',
          districtTextYellow: '#fde047',
          gridLine: '#475569',
          gridText: '#64748b',
          prisonWall: '#1e293b'
        };
      case 'tactical':
        return {
          waterDeep: '#021812',
          waterMid: '#03261c',
          waterShallow: '#063f2e',
          waterShoal: '#0a543e',
          landRural: '#062d21',
          landRuralAlt: '#042017',
          landUrban: '#0b382b',
          landUrbanDense: '#0f4737',
          sandBeach: '#115e59',
          sandDune: '#0f766e',
          lakeWater: '#03261c',
          topoElevation10m: '#083e2e',
          topoElevation15m: '#063124',
          topoElevation20m: '#04241a',
          topoContourLine: '#10b981',
          forestCanopy: '#031c14',
          specHighway: '#34d399',
          specRoad: '#6ee7b7',
          standardRoad: '#059669',
          localStreet: '#047857',
          metroMule: '#a7f3d0',
          railway: '#022c22',
          airportRunway: '#064e3b',
          airportRunwayStripe: '#a7f3d0',
          buildingConfirmed: '#34d399',
          buildingSpec: '#f43f5e',
          countyBorder: '#10b981',
          countyBorderSpec: '#059669',
          districtTextDark: '#6ee7b7',
          districtTextLight: '#a7f3d0',
          districtTextYellow: '#a7f3d0',
          gridLine: '#10b981',
          gridText: '#34d399',
          prisonWall: '#064e3b'
        };
      case 'neon':
        return {
          waterDeep: '#0a0d1a',
          waterMid: '#0f172a',
          waterShallow: '#162744',
          waterShoal: '#1c365d',
          landRural: '#161c2e',
          landRuralAlt: '#121726',
          landUrban: '#283149',
          landUrbanDense: '#323e5c',
          sandBeach: '#c49d82',
          sandDune: '#99735a',
          lakeWater: '#0f172a',
          topoElevation10m: '#1d253d',
          topoElevation15m: '#171d30',
          topoElevation20m: '#111624',
          topoContourLine: '#f43f5e',
          forestCanopy: '#0f1524',
          specHighway: '#f43f5e',
          specRoad: '#fb7185',
          standardRoad: '#38bdf8',
          localStreet: '#475569',
          metroMule: '#f472b6',
          railway: '#090d16',
          airportRunway: '#272738',
          airportRunwayStripe: '#f472b6',
          buildingConfirmed: '#38bdf8',
          buildingSpec: '#f43f5e',
          countyBorder: '#ec4899',
          countyBorderSpec: '#a855f7',
          districtTextDark: '#f8fafc',
          districtTextLight: '#ffffff',
          districtTextYellow: '#fde047',
          gridLine: '#6366f1',
          gridText: '#94a3b8',
          prisonWall: '#334155'
        };
    }
  };

  const p = getThemePalette();

  return (
    <svg
      viewBox="0 0 1000 1000"
      className="absolute inset-0 w-full h-full select-none"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Ocean gradient */}
        <radialGradient id={`ocean-base-grad-${theme}`} cx="60%" cy="45%" r="70%">
          <stop offset="0%" stopColor={p.waterMid} />
          <stop offset="70%" stopColor={p.waterDeep} />
          <stop offset="100%" stopColor={p.waterDeep} />
        </radialGradient>

        {/* Coastal Shoal Glow */}
        <filter id="coastal-shoal-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Dense Urban Grid Hatch Pattern */}
        <pattern id={`urban-hatch-${theme}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 8 8 M 8 0 L 0 8" fill="none" stroke={p.localStreet} strokeWidth="0.4" opacity="0.3" />
        </pattern>

        {/* Tree Forest Symbol */}
        <g id="pine-tree-symbol">
          <polygon points="0,-4 3,0 1,0 3,3 -3,3 -1,0 -3,0" fill={p.forestCanopy} />
          <rect x="-0.5" y="3" width="1" height="1.5" fill="#4a3525" />
        </g>
      </defs>

      {/* =========================================================================
          1. OCEAN WATER BASE & BATHYMETRIC CONTOURS
          ========================================================================= */}
      <rect width="1000" height="1000" fill={`url(#ocean-base-grad-${theme})`} />

      {/* Bathymetric depth lines */}
      <g opacity="0.25" fill="none" stroke={p.waterShoal} strokeWidth="1" strokeDasharray="6,6">
        <path d="M 200 0 C 250 180, 200 400, 300 600 C 360 720, 350 850, 420 1000" />
        <path d="M 850 0 C 920 200, 950 450, 930 700 C 910 850, 850 950, 800 1000" />
        <path d="M 0 350 C 150 320, 260 400, 320 550" />
        <path d="M 0 780 C 180 750, 380 820, 520 920" />
      </g>

      {/* =========================================================================
          2. COASTAL SHALLOWS & REEF SHELVES (TURQUOISE WATER CONTOURS)
          ========================================================================= */}
      <g id="leonida-coastal-shallows" opacity="0.6">
        {/* West coast shallows */}
        <path
          d="M 380 70
             C 320 140, 280 260, 340 380
             C 380 460, 380 560, 420 660
             C 460 760, 450 860, 520 950
             L 560 970
             C 500 880, 480 760, 440 660
             C 400 560, 400 460, 360 380
             C 320 280, 350 180, 400 80 Z"
          fill={p.waterShoal}
        />
        {/* East Coast barrier reef shelf */}
        <path
          d="M 820 50
             C 880 120, 960 250, 970 420
             C 980 580, 950 720, 880 860
             C 830 960, 750 980, 680 940
             C 740 910, 820 820, 860 720
             C 910 580, 930 420, 870 260
             C 830 180, 780 110, 820 50 Z"
          fill={p.waterShoal}
        />
      </g>

      {/* =========================================================================
          3. MAINLAND LEONIDA - RURAL LANDMASS (SAGE GREEN CONTINENT)
          ========================================================================= */}
      <g id="leonida-mainland-rural">
        {/* Massive Leonida State landmass polygon strictly matching the community mapping GIS geometry */}
        <path
          d="M 390 50
             L 620 50
             C 690 50, 760 55, 830 80
             C 870 120, 900 180, 920 260
             C 935 340, 930 440, 925 540
             C 920 640, 890 750, 850 820
             C 810 880, 750 930, 680 950
             C 620 970, 560 940, 520 890
             C 490 850, 460 760, 460 670
             C 460 580, 410 490, 400 410
             C 390 330, 360 250, 360 170
             C 360 110, 380 70, 390 50 Z"
          fill={p.landRural}
          stroke={p.topoContourLine}
          strokeWidth="1.2"
        />

        {/* Kelly County northwest peninsula */}
        <path
          d="M 390 50
             C 360 80, 340 140, 340 200
             C 340 260, 380 320, 395 380
             C 410 440, 440 500, 450 560
             L 420 560
             C 400 490, 370 430, 350 360
             C 330 280, 310 200, 320 120
             C 330 70, 360 50, 390 50 Z"
          fill={p.landRuralAlt}
        />

        {/* Mariana County / Watson Bay southwest coast */}
        <path
          d="M 450 560
             C 460 630, 470 700, 490 770
             C 510 840, 540 900, 570 950
             L 530 960
             C 490 900, 460 830, 440 750
             C 420 680, 420 610, 420 560 Z"
          fill={p.landRural}
        />
      </g>

      {/* =========================================================================
          4. URBAN DISTRICT ZONES (OLIVE / BEIGE-GRAY MUNICIPAL LANDS)
          ========================================================================= */}
      <g id="leonida-urban-zones">
        {/* Vice City Metro Extent (Vice-Dale County) */}
        <path
          id="vice-city-urban-zone"
          d="M 720 480
             C 770 460, 830 470, 880 510
             C 910 550, 920 620, 910 700
             C 890 780, 840 840, 770 850
             C 720 850, 680 810, 660 740
             C 650 670, 680 580, 700 520 Z"
          fill={p.landUrban}
          stroke={p.districtTextDark}
          strokeWidth="0.8"
          opacity="0.95"
        />

        {/* Port Gellhorn Urban Zone */}
        <path
          id="port-gellhorn-urban-zone"
          d="M 400 320
             C 440 310, 470 330, 480 370
             C 490 420, 470 480, 450 530
             C 420 550, 390 530, 380 480
             C 370 420, 380 360, 400 320 Z"
          fill={p.landUrban}
          stroke={p.districtTextDark}
          strokeWidth="0.8"
          opacity="0.92"
        />

        {/* Ambrosia Town & Mill District */}
        <path
          id="ambrosia-urban-zone"
          d="M 640 420
             C 670 410, 700 420, 710 450
             C 710 480, 680 510, 650 510
             C 620 500, 620 450, 640 420 Z"
          fill={p.landUrban}
          stroke={p.districtTextDark}
          strokeWidth="0.6"
        />

        {/* Hamlet Junction */}
        <path
          id="hamlet-urban-zone"
          d="M 670 850
             C 700 840, 730 850, 735 880
             C 735 910, 710 930, 680 930
             C 650 920, 650 870, 670 850 Z"
          fill={p.landUrban}
          stroke={p.districtTextDark}
          strokeWidth="0.6"
        />

        {/* Seaview & North Vice Urban Cluster */}
        <path
          id="seaview-north-vice-zone"
          d="M 780 200
             C 830 180, 870 210, 880 260
             C 880 310, 840 350, 800 350
             C 770 330, 760 260, 780 200 Z"
          fill={p.landUrban}
          stroke={p.districtTextDark}
          strokeWidth="0.6"
        />
      </g>

      {/* =========================================================================
          5. WATERWAYS, INLAND LAKES & EVERGLADES CHANNELS
          ========================================================================= */}
      {showWaterways && (
        <g id="leonida-inland-waterways">
          {/* Lake Leonida (Central Freshwater Lake) */}
          <path
            id="lake-leonida"
            d="M 670 280
               C 710 260, 750 280, 760 320
               C 770 370, 750 420, 710 440
               C 670 450, 640 420, 635 370
               C 630 320, 645 290, 670 280 Z"
            fill={p.lakeWater}
            stroke={p.waterDeep}
            strokeWidth="1.2"
          />
          {/* Islands inside Lake Leonida */}
          <ellipse cx="680" cy="340" rx="6" ry="4" fill={p.landRural} />
          <ellipse cx="720" cy="380" rx="8" ry="5" fill={p.landRural} />

          {/* Lake Leonida outflow rivers & canals */}
          <path
            d="M 710 440 Q 730 480 750 510 T 780 540"
            fill="none"
            stroke={p.lakeWater}
            strokeWidth="3.5"
          />
          <path
            d="M 640 370 Q 580 390 520 420 T 450 460"
            fill="none"
            stroke={p.lakeWater}
            strokeWidth="2.5"
          />

          {/* Grass Rivers / Everglades meandering wetland channels */}
          <g opacity="0.85" stroke={p.lakeWater} strokeWidth="2.8" fill="none">
            <path d="M 580 870 C 600 890, 610 930, 630 960" />
            <path d="M 610 880 C 640 910, 650 950, 660 980" />
            <path d="M 640 860 C 660 890, 680 920, 690 970" />
            <path d="M 550 900 C 570 930, 580 960, 590 990" />
            <path d="M 520 920 C 540 950, 550 970, 560 995" />
          </g>

          {/* Biscayne Bay / Vice Harbor Shallows & Estuary Channels */}
          <path
            d="M 790 520
               C 830 520, 870 560, 875 640
               C 880 720, 850 800, 810 820
               C 780 820, 770 760, 780 680
               C 785 600, 770 540, 790 520 Z"
            fill={p.lakeWater}
            stroke={p.waterDeep}
            strokeWidth="1"
          />
        </g>
      )}

      {/* =========================================================================
          6. SANDY BEACHES, BARRIER ISLANDS & OCEAN DRIVE STRIP
          ========================================================================= */}
      <g id="leonida-beaches-and-islands">
        {/* Vice Beach Atlantic Sand Strip (Continuous golden sand) */}
        <path
          d="M 880 460
             C 915 500, 935 580, 925 680
             C 915 780, 875 850, 830 875
             L 815 865
             C 860 830, 895 760, 905 670
             C 915 580, 895 510, 865 470 Z"
          fill={p.sandBeach}
          stroke={p.sandDune}
          strokeWidth="0.8"
        />

        {/* Ocean Beach / South Beach Urban Island */}
        <path
          d="M 865 520
             C 890 540, 900 600, 895 680
             C 890 760, 860 820, 825 845
             C 810 830, 820 760, 835 680
             C 845 600, 840 545, 865 520 Z"
          fill={p.landUrbanDense}
          stroke={p.districtTextDark}
          strokeWidth="0.8"
        />

        {/* Star Island */}
        <ellipse cx="845" cy="635" rx="8" ry="6" fill={p.landUrban} stroke={p.sandDune} strokeWidth="0.8" />
        <ellipse cx="845" cy="635" rx="5" ry="3.5" fill={p.landUrbanDense} />

        {/* Venetian Islands Chain */}
        <ellipse cx="830" cy="590" rx="5" ry="3" fill={p.landUrban} stroke={p.sandDune} strokeWidth="0.6" />
        <ellipse cx="842" cy="593" rx="5.5" ry="3.5" fill={p.landUrban} stroke={p.sandDune} strokeWidth="0.6" />
        <ellipse cx="855" cy="596" rx="5" ry="3" fill={p.landUrban} stroke={p.sandDune} strokeWidth="0.6" />

        {/* Pelican Harbor & North Islands */}
        <ellipse cx="850" cy="530" rx="7" ry="4" fill={p.landUrban} stroke={p.sandDune} strokeWidth="0.6" />
        <ellipse cx="865" cy="540" rx="8" ry="5" fill={p.landUrban} stroke={p.sandDune} strokeWidth="0.6" />

        {/* Brickell Key */}
        <polygon points="805,670 812,665 818,675 812,682 805,677" fill={p.landUrbanDense} stroke={p.sandDune} strokeWidth="0.6" />

        {/* Fisher Island */}
        <path d="M 900 740 C 915 745, 920 765, 910 775 C 895 780, 885 765, 890 745 Z" fill={p.landUrban} stroke={p.sandDune} strokeWidth="0.8" />

        {/* Virginia Key */}
        <path d="M 855 770 C 875 765, 890 785, 880 805 C 865 815, 845 800, 850 780 Z" fill={p.landRural} stroke={p.sandDune} strokeWidth="0.8" />

        {/* Key Biscayne */}
        <path d="M 825 820 C 845 815, 860 840, 850 880 C 835 910, 815 890, 815 850 Z" fill={p.landRural} stroke={p.sandDune} strokeWidth="0.8" />

        {/* Leonida Keys Archipelago Chain (South) */}
        <path d="M 680 955 C 695 960, 690 975, 675 975 C 665 970, 670 955, 680 955 Z" fill={p.landRural} stroke={p.sandDune} strokeWidth="0.6" />
        <path d="M 640 965 C 655 970, 650 985, 635 985 C 625 980, 630 965, 640 965 Z" fill={p.landRural} stroke={p.sandDune} strokeWidth="0.6" />
        <path d="M 600 975 C 615 980, 610 995, 595 995 C 585 990, 590 975, 600 975 Z" fill={p.landRural} stroke={p.sandDune} strokeWidth="0.6" />
      </g>

      {/* =========================================================================
          7. TOPOGRAPHY, HILL ELEVATIONS & FORESTS
          ========================================================================= */}
      {showTopography && (
        <g id="leonida-topography-highlands">
          {/* Mount Kalaga Elevation Contours (10m, 15m, 20m+) */}
          <g id="mount-kalaga-topography">
            {/* 10m base contour */}
            <path
              d="M 670 80
                 C 720 60, 770 70, 780 110
                 C 785 150, 750 180, 700 180
                 C 660 170, 645 130, 655 95 Z"
              fill={p.topoElevation10m}
              stroke={p.topoContourLine}
              strokeWidth="0.8"
            />
            {/* 15m contour */}
            <path
              d="M 685 90
                 C 720 75, 755 85, 760 115
                 C 765 140, 740 160, 705 160
                 C 675 150, 665 125, 675 100 Z"
              fill={p.topoElevation15m}
              stroke={p.topoContourLine}
              strokeWidth="0.8"
            />
            {/* 20m+ Peak Ridge */}
            <path
              d="M 700 95
                 C 720 85, 745 90, 750 110
                 C 750 130, 730 145, 710 140
                 C 690 135, 685 115, 695 100 Z"
              fill={p.topoElevation20m}
              stroke={p.topoContourLine}
              strokeWidth="1"
            />
            {/* Ridge Hatching lines */}
            <line x1="700" y1="100" x2="720" y2="120" stroke={p.topoContourLine} strokeWidth="1" />
            <line x1="710" y1="95" x2="735" y2="115" stroke={p.topoContourLine} strokeWidth="1" />
            <line x1="720" y1="95" x2="745" y2="110" stroke={p.topoContourLine} strokeWidth="1" />
          </g>

          {/* Domed Hills & Redhill (Kelly County) */}
          <g id="domed-hills-topography">
            <ellipse cx="550" cy="180" rx="35" ry="20" fill={p.topoElevation10m} stroke={p.topoContourLine} strokeWidth="0.8" />
            <ellipse cx="555" cy="178" rx="22" ry="12" fill={p.topoElevation15m} stroke={p.topoContourLine} strokeWidth="0.8" />
            <ellipse cx="560" cy="176" rx="12" ry="6" fill={p.topoElevation20m} stroke={p.topoContourLine} strokeWidth="0.8" />

            <ellipse cx="600" cy="190" rx="25" ry="15" fill={p.topoElevation10m} stroke={p.topoContourLine} strokeWidth="0.8" />
            <ellipse cx="602" cy="188" rx="14" ry="8" fill={p.topoElevation15m} stroke={p.topoContourLine} strokeWidth="0.8" />
          </g>

          {/* Hank Hill & Jack's Hill */}
          <g id="hank-and-jacks-hills">
            <ellipse cx="490" cy="240" rx="28" ry="16" fill={p.topoElevation10m} stroke={p.topoContourLine} strokeWidth="0.8" />
            <ellipse cx="492" cy="238" rx="15" ry="8" fill={p.topoElevation15m} stroke={p.topoContourLine} strokeWidth="0.8" />

            <ellipse cx="560" cy="270" rx="24" ry="14" fill={p.topoElevation10m} stroke={p.topoContourLine} strokeWidth="0.8" />
          </g>

          {/* Gellhorn Bluff (near Port Gellhorn) */}
          <g id="gellhorn-bluff">
            <path
              d="M 440 400
                 C 465 390, 485 410, 480 435
                 C 475 455, 450 460, 435 445
                 C 425 430, 430 410, 440 400 Z"
              fill={p.topoElevation10m}
              stroke={p.topoContourLine}
              strokeWidth="0.8"
            />
            <path
              d="M 448 408
                 C 462 400, 475 412, 470 428
                 C 465 440, 450 445, 440 435
                 C 435 425, 438 412, 448 408 Z"
              fill={p.topoElevation15m}
              stroke={p.topoContourLine}
              strokeWidth="0.8"
            />
          </g>

          {/* Dense Pine Forest Clusters (Fairyland & Redhill Forests) */}
          <g id="forest-tree-clusters" opacity="0.9">
            <use href="#pine-tree-symbol" x="620" y="110" transform="scale(1.3)" />
            <use href="#pine-tree-symbol" x="635" y="115" transform="scale(1.2)" />
            <use href="#pine-tree-symbol" x="610" y="125" transform="scale(1.4)" />
            <use href="#pine-tree-symbol" x="630" y="130" transform="scale(1.1)" />
            <use href="#pine-tree-symbol" x="645" y="120" transform="scale(1.3)" />
            <use href="#pine-tree-symbol" x="655" y="135" transform="scale(1.2)" />
            <use href="#pine-tree-symbol" x="620" y="145" transform="scale(1.4)" />

            <use href="#pine-tree-symbol" x="670" y="190" transform="scale(1.2)" />
            <use href="#pine-tree-symbol" x="685" y="185" transform="scale(1.3)" />
            <use href="#pine-tree-symbol" x="700" y="195" transform="scale(1.1)" />
            <use href="#pine-tree-symbol" x="675" y="205" transform="scale(1.3)" />
          </g>
        </g>
      )}

      {/* =========================================================================
          8. AIRPORTS, RUNWAYS, BUILDINGS & SPECULATIVE STRUCTURES
          ========================================================================= */}
      {showBuildings && (
        <g id="leonida-airports-and-structures">
          {/* Vice City International Airport (VIA) Complex */}
          <g id="vice-city-airport-complex">
            {/* Tarmac apron */}
            <polygon
              points="630,660 740,650 750,710 640,730 625,690"
              fill={p.landUrbanDense}
              stroke={p.districtTextDark}
              strokeWidth="0.8"
            />
            {/* Runway 1 (East-West Parallel 09L/27R) */}
            <line x1="635" y1="670" x2="740" y2="660" stroke={p.airportRunway} strokeWidth="6" strokeLinecap="square" />
            <line x1="635" y1="670" x2="740" y2="660" stroke={p.airportRunwayStripe} strokeWidth="1" strokeDasharray="6,4" />

            {/* Runway 2 (Parallel 09R/27L) */}
            <line x1="640" y1="695" x2="745" y2="685" stroke={p.airportRunway} strokeWidth="6" strokeLinecap="square" />
            <line x1="640" y1="695" x2="745" y2="685" stroke={p.airportRunwayStripe} strokeWidth="1" strokeDasharray="6,4" />

            {/* Runway 3 (Crosswind Diagonal) */}
            <line x1="655" y1="655" x2="720" y2="720" stroke={p.airportRunway} strokeWidth="5" strokeLinecap="square" />

            {/* Airport Terminal & Hangars (Red Spec & Yellow Confirmed) */}
            <rect x="680" y="640" width="30" height="10" rx="1" fill={p.buildingSpec} stroke="#991b1b" strokeWidth="0.5" />
            <rect x="670" y="652" width="15" height="6" rx="0.5" fill={p.buildingConfirmed} stroke="#ca8a04" strokeWidth="0.5" />
            <rect x="715" y="645" width="20" height="8" rx="0.5" fill={p.buildingSpec} stroke="#991b1b" strokeWidth="0.5" />
            <rect x="635" y="705" width="25" height="12" rx="1" fill={p.buildingSpec} stroke="#991b1b" strokeWidth="0.5" />
            {/* Control Tower */}
            <circle cx="675" cy="645" r="3" fill="#ffffff" stroke="#000000" strokeWidth="0.8" />
          </g>

          {/* Port Gellhorn Airfield */}
          <g id="port-gellhorn-airfield-complex">
            <line x1="450" y1="490" x2="495" y2="540" stroke={p.airportRunway} strokeWidth="5" strokeLinecap="square" />
            <line x1="450" y1="490" x2="495" y2="540" stroke={p.airportRunwayStripe} strokeWidth="0.8" strokeDasharray="5,3" />
            <line x1="450" y1="535" x2="495" y2="500" stroke={p.airportRunway} strokeWidth="4" strokeLinecap="square" />
            <rect x="460" y="480" width="14" height="8" rx="0.5" fill={p.buildingSpec} stroke="#991b1b" strokeWidth="0.5" />
          </g>

          {/* Leonida State Prison (LDC) */}
          <g id="leonida-state-prison-complex">
            {/* Perimeter Security Fence */}
            <rect x="545" y="505" width="32" height="28" fill="none" stroke={p.prisonWall} strokeWidth="1.2" strokeDasharray="3,2" />
            {/* Cell Blocks */}
            <rect x="550" y="510" width="10" height="6" fill={p.buildingSpec} />
            <rect x="563" y="510" width="10" height="6" fill={p.buildingSpec} />
            <rect x="550" y="520" width="10" height="6" fill={p.buildingSpec} />
            <rect x="563" y="520" width="10" height="6" fill={p.buildingSpec} />
            {/* Guard Watchtowers */}
            <circle cx="545" cy="505" r="1.5" fill="#ef4444" />
            <circle cx="577" cy="505" r="1.5" fill="#ef4444" />
            <circle cx="545" cy="533" r="1.5" fill="#ef4444" />
            <circle cx="577" cy="533" r="1.5" fill="#ef4444" />
          </g>

          {/* Vice Port Container Terminal & Docks */}
          <g id="vice-port-docks">
            <rect x="840" y="685" width="22" height="12" fill={p.landUrbanDense} stroke={p.districtTextDark} strokeWidth="0.5" />
            {/* Colored Cargo Containers */}
            <rect x="842" y="688" width="4" height="2" fill="#3b82f6" />
            <rect x="847" y="688" width="4" height="2" fill="#ef4444" />
            <rect x="852" y="688" width="4" height="2" fill="#eab308" />
            <rect x="842" y="692" width="4" height="2" fill="#10b981" />
            <rect x="847" y="692" width="4" height="2" fill="#f97316" />
            <rect x="852" y="692" width="4" height="2" fill="#8b5cf6" />
          </g>

          {/* Urban Building Footprints across Vice City (Red Spec & Yellow/Gray Footprints) */}
          <g id="vice-city-skyscrapers" opacity="0.85">
            <rect x="790" y="620" width="8" height="12" fill={p.buildingSpec} />
            <rect x="802" y="618" width="10" height="16" fill={p.buildingSpec} />
            <rect x="815" y="625" width="7" height="9" fill={p.buildingConfirmed} />
            <rect x="795" y="640" width="14" height="10" fill={p.buildingSpec} />
            <rect x="812" y="642" width="9" height="14" fill={p.buildingSpec} />
            <rect x="785" y="660" width="12" height="8" fill={p.buildingConfirmed} />
            <rect x="870" y="550" width="5" height="18" fill={p.buildingSpec} />
            <rect x="878" y="560" width="6" height="14" fill={p.buildingConfirmed} />
            <rect x="888" y="580" width="5" height="20" fill={p.buildingSpec} />
          </g>
        </g>
      )}

      {/* =========================================================================
          9. HIGHWAY NETWORKS, FREEWAYS & URBAN ROAD GRIDS
          ========================================================================= */}
      {showRoads && (
        <g id="leonida-road-and-highway-networks">
          {/* Secondary & Local Street Grid across Vice City */}
          <g id="vice-city-street-grid" stroke={p.standardRoad} strokeWidth="0.8" fill="none" opacity="0.75">
            {/* North-South avenues */}
            <line x1="770" y1="520" x2="770" y2="760" />
            <line x1="785" y1="510" x2="785" y2="780" />
            <line x1="800" y1="500" x2="800" y2="800" />
            <line x1="815" y1="520" x2="815" y2="790" />
            <line x1="830" y1="540" x2="830" y2="770" />
            {/* East-West cross streets */}
            <line x1="760" y1="540" x2="840" y2="540" />
            <line x1="755" y1="570" x2="850" y2="570" />
            <line x1="750" y1="600" x2="860" y2="600" />
            <line x1="745" y1="630" x2="850" y2="630" />
            <line x1="745" y1="660" x2="840" y2="660" />
            <line x1="750" y1="690" x2="830" y2="690" />
            <line x1="755" y1="720" x2="820" y2="720" />
            <line x1="760" y1="750" x2="810" y2="750" />
            {/* Ocean Drive Beachside Boulevard */}
            <path d="M 870 510 C 895 560, 905 650, 885 750 C 870 800, 840 840, 820 855" strokeWidth="1.2" stroke={p.standardRoad} />
          </g>

          {/* Port Gellhorn Local Road Network */}
          <g id="port-gellhorn-streets" stroke={p.standardRoad} strokeWidth="0.8" fill="none" opacity="0.7">
            <line x1="390" y1="350" x2="470" y2="350" />
            <line x1="385" y1="390" x2="475" y2="390" />
            <line x1="380" y1="430" x2="470" y2="430" />
            <line x1="390" y1="470" x2="460" y2="470" />
            <line x1="410" y1="330" x2="410" y2="490" />
            <line x1="440" y1="320" x2="440" y2="500" />
          </g>

          {/* =====================================================================
              PRIMARY SPEC HIGHWAYS (BOLD RED INTERSTATES - EXACT ROUTING FROM IMAGE)
              ===================================================================== */}
          <g id="spec-highways" stroke={p.specHighway} fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* 1. Trans-Leonida Central Interstate (Vice City <-> Mariana <-> Port Gellhorn) */}
            <path
              d="M 850 600
                 C 810 590, 770 585, 720 590
                 C 660 595, 600 580, 540 550
                 C 490 520, 450 480, 430 430
                 C 420 390, 425 350, 435 310"
              strokeWidth="2.8"
            />

            {/* 2. North-South Interstate (Mount Kalaga / Leonard <-> Vice City <-> Hamlet <-> Keys) */}
            <path
              d="M 720 70
                 C 740 140, 760 230, 780 320
                 C 795 400, 790 480, 785 560
                 C 780 640, 765 720, 740 790
                 C 720 840, 700 870, 690 910
                 C 680 940, 650 965, 610 985"
              strokeWidth="2.8"
            />

            {/* 3. Western Kelly County Coastal Highway */}
            <path
              d="M 410 70
                 C 400 140, 410 210, 435 280
                 C 450 340, 465 410, 460 480
                 C 455 540, 470 610, 490 680
                 C 510 750, 535 830, 560 900
                 C 575 940, 560 970, 530 980"
              strokeWidth="2.2"
            />

            {/* 4. Southern East-West Highway Connector (Hamlet <-> Watson Bay) */}
            <path
              d="M 740 790
                 C 700 810, 650 825, 600 830
                 C 550 835, 510 860, 490 900
                 C 475 930, 485 960, 520 975"
              strokeWidth="2.0"
            />

            {/* 5. Causeway Bridges across Biscayne Bay (Connecting Vice City mainland to barrier islands) */}
            {/* Venetian Causeway */}
            <line x1="800" y1="590" x2="865" y2="590" strokeWidth="2.0" />
            {/* MacArthur / Port Blvd Causeway */}
            <line x1="800" y1="635" x2="870" y2="635" strokeWidth="2.4" />
            {/* Julia Tuttle Causeway */}
            <line x1="795" y1="535" x2="860" y2="535" strokeWidth="2.0" />
            {/* Rickenbacker Causeway to Virginia Key & Key Biscayne */}
            <path d="M 790 700 C 810 730, 840 760, 860 780" strokeWidth="2.2" />
          </g>
        </g>
      )}

      {/* =========================================================================
          10. METRO MULE RAPID TRANSIT & FREIGHT RAILWAYS
          ========================================================================= */}
      {showMetro && (
        <g id="leonida-transit-networks">
          {/* Metro Mule Transit Line (Bright Yellow Line through Vice City) */}
          <path
            id="metro-mule-transit"
            d="M 775 530
               C 775 580, 785 640, 800 670
               C 815 700, 810 740, 790 770
               C 770 795, 740 805, 715 800"
            fill="none"
            stroke={p.metroMule}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Metro Mule Stations */}
          <circle cx="775" cy="540" r="2.5" fill="#000000" stroke={p.metroMule} strokeWidth="1" />
          <circle cx="780" cy="610" r="2.5" fill="#000000" stroke={p.metroMule} strokeWidth="1" />
          <circle cx="800" cy="670" r="2.5" fill="#000000" stroke={p.metroMule} strokeWidth="1" />
          <circle cx="800" cy="735" r="2.5" fill="#000000" stroke={p.metroMule} strokeWidth="1" />
          <circle cx="750" cy="803" r="2.5" fill="#000000" stroke={p.metroMule} strokeWidth="1" />

          {/* Freight Railway (Dashed rail line) */}
          <path
            id="freight-railway"
            d="M 440 370
               C 470 410, 520 450, 580 470
               C 640 490, 700 520, 750 560
               C 800 600, 825 650, 845 685"
            fill="none"
            stroke={p.railway}
            strokeWidth="1.6"
            strokeDasharray="4,3"
          />
        </g>
      )}

      {/* =========================================================================
          11. COUNTY BOUNDARIES (CYAN / TEAL DASHED BORDERS)
          ========================================================================= */}
      {showCountyBorders && (
        <g id="leonida-county-borders" stroke={p.countyBorder} strokeWidth="1.4" fill="none" strokeDasharray="5,4" opacity="0.85">
          {/* Kelly County <-> Ambrosia County Border */}
          <line x1="580" y1="50" x2="580" y2="350" />
          {/* Ambrosia County <-> Leonard County Border */}
          <line x1="770" y1="50" x2="770" y2="360" />
          {/* Kelly County <-> Mariana County Border */}
          <line x1="380" y1="460" x2="580" y2="460" />
          {/* Ambrosia <-> Vice-Dale County Border */}
          <line x1="580" y1="460" x2="800" y2="460" />
          {/* Mariana County <-> Vice-Dale County Border */}
          <line x1="650" y1="460" x2="650" y2="820" />
          {/* Vice-Dale <-> Grass Rivers Border */}
          <line x1="530" y1="820" x2="820" y2="820" />
        </g>
      )}

      {/* =========================================================================
          12. COUNTY PROMINENT TITLES & DISTRICT TYPOGRAPHY
          ========================================================================= */}
      {showDistricts && (
        <g id="leonida-county-and-district-labels" className="pointer-events-none select-none">
          {/* County Big Labels */}
          {LEONIDA_COUNTIES.map((county) => (
            <g key={county.id} transform={`translate(${county.center.x * 10}, ${county.center.y * 10})`}>
              <text
                textAnchor="middle"
                className="font-black font-mono uppercase tracking-widest"
                fontSize="15"
                fill={p.districtTextDark}
                opacity="0.75"
                stroke={theme === 'leonida' ? '#ffffff' : '#000000'}
                strokeWidth="1"
                paintOrder="stroke"
              >
                {county.name}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* =========================================================================
          13. INTERACTIVE LANDMARK PINS & POI MARKERS (EXACT PINS FROM USER IMAGE)
          ========================================================================= */}
      <g id="leonida-landmark-pins">
        {LEONIDA_LANDMARKS.map((landmark) => {
          const isSelected = selectedLandmarkId === landmark.id;
          const pinX = landmark.x * 10;
          const pinY = landmark.y * 10;

          // Pin Color Styling
          let pinFill = '#000000';
          let pinBorder = '#ffffff';
          let textColor = p.districtTextDark;

          if (landmark.pinColor === 'purple') {
            pinFill = '#a855f7';
            pinBorder = '#ffffff';
            textColor = '#9333ea';
          } else if (landmark.pinColor === 'cyan') {
            pinFill = '#06b6d4';
            pinBorder = '#ffffff';
            textColor = '#0284c7';
          } else if (landmark.pinColor === 'red') {
            pinFill = '#ef4444';
            pinBorder = '#ffffff';
            textColor = '#dc2626';
          }

          return (
            <g
              key={landmark.id}
              transform={`translate(${pinX}, ${pinY})`}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectLandmark) onSelectLandmark(landmark);
              }}
              className="cursor-pointer group pointer-events-auto"
            >
              {/* Selected Pulse Ring */}
              {isSelected && (
                <circle r="12" fill="none" stroke="#f43f5e" strokeWidth="2" className="animate-ping" />
              )}

              {/* Pin Icon Pinhead */}
              <g transform="translate(0, -6)">
                {/* Pin body shape */}
                <path
                  d="M 0 0 C -4 -4, -6 -8, -6 -12 C -6 -16, -3 -19, 0 -19 C 3 -19, 6 -16, 6 -12 C 6 -8, 4 -4, 0 0 Z"
                  fill={pinFill}
                  stroke={pinBorder}
                  strokeWidth="1.2"
                  filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.4))"
                />
                {/* Inner dot */}
                <circle cx="0" cy="-12" r="2.2" fill={pinBorder} />
              </g>

              {/* Landmark Name Label */}
              {showDistricts && (
                <g transform="translate(0, 10)">
                  <rect
                    x={-(landmark.name.length * 3.2)}
                    y="-4"
                    width={landmark.name.length * 6.4}
                    height="12"
                    rx="3"
                    fill={theme === 'leonida' ? '#ffffff' : '#090d16'}
                    fillOpacity="0.85"
                    stroke={isSelected ? '#f43f5e' : (theme === 'leonida' ? '#cbd5e1' : '#334155')}
                    strokeWidth="0.8"
                  />
                  <text
                    textAnchor="middle"
                    y="5"
                    fontSize="8.5"
                    fontWeight="800"
                    fill={textColor}
                    className="font-sans select-none tracking-tight"
                  >
                    {landmark.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* =========================================================================
          14. ROCKSTAR INTERNAL GRID SYSTEM (COORDINATES: n08, s01, e01, sb37...)
          ========================================================================= */}
      {showGrid && (
        <g id="rockstar-grid-system" opacity="0.35">
          {/* Vertical grid lines */}
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((gx, idx) => {
            const eastCode = `e0${idx + 1}`;
            return (
              <g key={`gx-${gx}`}>
                <line x1={gx} y1="0" x2={gx} y2="1000" stroke={p.gridLine} strokeWidth="0.6" strokeDasharray="3,3" />
                <text x={gx + 4} y="15" fontSize="8" fontFamily="monospace" fill={p.gridText} fontWeight="bold">
                  {eastCode}
                </text>
              </g>
            );
          })}

          {/* Horizontal grid lines */}
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((gy, idx) => {
            const northCode = idx < 5 ? `n0${5 - idx}` : `s0${idx - 4}`;
            return (
              <g key={`gy-${gy}`}>
                <line x1="0" y1={gy} x2="1000" y2={gy} stroke={p.gridLine} strokeWidth="0.6" strokeDasharray="3,3" />
                <text x="5" y={gy - 4} fontSize="8" fontFamily="monospace" fill={p.gridText} fontWeight="bold">
                  {northCode}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Map watermark / Attribution */}
      <text
        x="15"
        y="990"
        fontSize="8"
        fontFamily="monospace"
        fill={theme === 'leonida' ? '#334155' : '#94a3b8'}
        opacity="0.8"
      >
        STATE OF LEONIDA GIS • GTA VI COMMUNITY MAPPING PROJECT
      </text>
    </svg>
  );
};
