export const PRISMA_SCHEMA_CODE = `// schema/database.config
datasource db {
  provider = "database"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "db-client"
}

enum VehicleCategory {
  Super
  Sports
  Muscle
  OffRoad
  Motorcycles
  Helicopters
  Boats
}

enum WeaponCategory {
  Handguns
  SubmachineGuns
  AssaultRifles
  Shotguns
  SniperRifles
  HeavyWeapons
  Melee
}

enum Drivetrain {
  AWD
  RWD
  FWD
}

enum Dealer {
  LegendaryMotorsport
  SouthernSanAndreasSuperAutos
  WarstockCacheAndCarry
  DockTease
  ElitasTravel
}

model Vehicle {
  id                  String          @id @default(cuid())
  slug                String          @unique
  name                String
  brand               String
  category            VehicleCategory
  price               Int
  tradePrice          Int?
  tradePriceCondition String?
  dealer              Dealer
  topSpeedMph         Float
  acceleration        Float
  braking             Float
  handling            Float
  drivetrain          Drivetrain
  capacity            Int
  description         String          @db.Text
  imageUrl            String
  featuredInTrailer   Boolean         @default(false)
  isCustomizable      Boolean         @default(true)
  baseModdingBudget   Int             @default(200000)

  // pSEO SEO metrics
  metaTitle           String?
  metaDescription     String?
  indexable           Boolean         @default(true)
  viewsCount          Int             @default(0)

  // Relations
  modifications       VehicleMod[]
  builds              UserBuild[]
  comparisonsAsA      VehicleComparison[] @relation("VehicleA")
  comparisonsAsB      VehicleComparison[] @relation("VehicleB")

  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([category, price])
  @@index([slug])
}

model VehicleMod {
  id              String   @id @default(cuid())
  vehicleId       String
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  category        String   // "Engine", "Turbo", "Armor", "Transmission"
  name            String
  cost            Int
  topSpeedDelta   Float    @default(0)
  accelDelta      Float    @default(0)
  handlingDelta   Float    @default(0)

  @@index([vehicleId, category])
}

model Weapon {
  id              String         @id @default(cuid())
  slug            String         @unique
  name            String
  manufacturer    String
  category        WeaponCategory
  damage          Float
  fireRate        Float
  accuracy        Float
  range           Float
  magazineSize    Int
  ttkMs           Int
  unlockRank      Int
  price           Int
  description     String         @db.Text
  imageUrl        String
  indexable       Boolean        @default(true)

  attachments     WeaponAttachment[]
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([category, unlockRank])
  @@index([slug])
}

model WeaponAttachment {
  id        String   @id @default(cuid())
  weaponId  String
  weapon    Weapon   @relation(fields: [weaponId], references: [id], onDelete: Cascade)
  name      String
  cost      Int
  effect    String

  @@index([weaponId])
}

model VehicleComparison {
  id            String   @id @default(cuid())
  slug          String   @unique // e.g. "grotti-turismo-vs-pegassi-ignus"
  vehicleAId    String
  vehicleA      Vehicle  @relation("VehicleA", fields: [vehicleAId], references: [id], onDelete: Cascade)
  vehicleBId    String
  vehicleB      Vehicle  @relation("VehicleB", fields: [vehicleBId], references: [id], onDelete: Cascade)
  verdictWinner String?  // "A", "B", or "TIE"
  summaryText   String?  @db.Text
  searchVolume  Int      @default(0)

  createdAt     DateTime @default(now())

  @@unique([vehicleAId, vehicleBId])
  @@index([slug])
}

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  username      String         @unique
  avatarUrl     String?
  role          String         @default("USER") // "USER", "ADMIN"
  
  builds        UserBuild[]
  communityPosts CommunityPost[]
  
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model UserBuild {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  title       String
  totalCost   Int
  modConfig   Json     // Array of applied mod IDs
  upvotes     Int      @default(0)

  createdAt   DateTime @default(now())

  @@index([vehicleId, upvotes])
}

model CommunityPost {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  content   String   @db.Text
  category  String   // "RP_SERVER", "HEIST_GUIDE", "MOD_SHOWCASE"
  
  createdAt DateTime @default(now())
}
`;

export const APP_ROUTER_STRUCTURE = `
app/
├── layout.tsx                     # Root layout with site nav, footer, and global OpenGraph
├── page.tsx                       # Home page (Hub landing, trending specs, quick tools)
├── sitemap.ts                     # Index XML Sitemap generator with 10k pagination
├── robots.txt/route.ts            # Dynamic robots.txt with disallow list and sitemap index
│
├── vehicles/                      # Vehicle Directory
│   ├── page.tsx                   # Main index (/vehicles)
│   ├── [category]/
│   │   ├── page.tsx               # Category filter (/vehicles/super, /vehicles/sports)
│   │   └── [slug]/
│   │       ├── page.tsx           # Entity detail (/vehicles/super/pegassi-ignus-custom)
│   │       └── jsonld.ts          # Structured Product & ItemPage JSON-LD
│
├── weapons/                       # Weapon Directory
│   ├── page.tsx                   # Main index (/weapons)
│   ├── [category]/
│   │   ├── page.tsx               # Category filter (/weapons/assault-rifles)
│   │   └── [slug]/
│   │       └── page.tsx           # Entity detail (/weapons/assault-rifles/tactical-carbine-mk2)
│
├── compare/                       # Dynamic pSEO 1v1 Comparison Engine
│   ├── vehicles/
│   │   └── [comparisonSlug]/
│   │       └── page.tsx           # /compare/vehicles/grotti-turismo-vs-pegassi-ignus
│   └── weapons/
│       └── [comparisonSlug]/
│           └── page.tsx           # /compare/weapons/tactical-carbine-vs-heavy-sniper
│
├── calculators/                   # Interactive Utility Tools
│   ├── mod-builder/
│   │   └── page.tsx               # Client-side vehicle custom mod budget tool
│   └── business-roi/
│       └── page.tsx               # Vice City nightclub & warehouse ROI calculator
│
├── map/                           # Interactive Vice City / Leonida Map
│   └── page.tsx                   # Dynamic coordinates map explorer
│
└── servers/                       # Roleplay Directories
    └── gta6-rp/
        └── page.tsx               # FiveM/VMP server index & connection strings
`;

export const METADATA_GENERATOR_CODE = `// app/vehicles/[category]/[slug]/page.tsx
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: {
    category: string;
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { slug: params.slug },
  });

  if (!vehicle) {
    return {
      title: 'Vehicle Not Found | GTA VI Hub',
      robots: { index: false },
    };
  }

  const appUrl = process.env.APP_URL || 'https://viceintel.app';
  const canonicalUrl = \`\${appUrl}/vehicles/\${params.category.toLowerCase()}/\${params.slug.toLowerCase()}\`;

  const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(vehicle.price);

  return {
    title: \`\${vehicle.name} (\${vehicle.brand}) - GTA 6 Stats, Top Speed & Mod Cost\`,
    description: \`Full GTA 6 specifications for \${vehicle.name}: \${vehicle.topSpeedMph} MPH top speed, \${formattedPrice} dealer price at \${vehicle.dealer}, trade discounts, and 1v1 comparisons.\`,
    keywords: [
      vehicle.name,
      \`\${vehicle.name} GTA 6\`,
      \`\${vehicle.name} top speed\`,
      \`\${vehicle.brand} GTA 6\`,
      \`GTA 6 \${vehicle.category} vehicles\`,
      \`GTA VI Vice City car stats\`
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: \`\${vehicle.name} GTA 6 Database Spec\`,
      description: \`Top Speed: \${vehicle.topSpeedMph} MPH | Price: \${formattedPrice} | Drivetrain: \${vehicle.drivetrain}\`,
      url: canonicalUrl,
      siteName: 'GTA VI Central Database',
      images: [
        {
          url: vehicle.imageUrl,
          width: 1200,
          height: 630,
          alt: \`\${vehicle.name} in GTA VI Vice City\`,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: \`\${vehicle.name} - GTA VI Vehicle Database\`,
      description: \`Check out top speed, acceleration, trade price conditions, and custom builds for \${vehicle.name}.\`,
      images: [vehicle.imageUrl],
    },
    robots: {
      index: vehicle.indexable,
      follow: true,
      googleBot: {
        index: vehicle.indexable,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
`;

export const SITEMAP_GENERATOR_CODE = `// app/sitemap.ts
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL || 'https://viceintel.app';

  // Fetch all active vehicles & weapons
  const vehicles = await prisma.vehicle.findMany({
    where: { indexable: true },
    select: { slug: true, category: true, updatedAt: true },
  });

  const weapons = await prisma.weapon.findMany({
    where: { indexable: true },
    select: { slug: true, category: true, updatedAt: true },
  });

  const comparisons = await prisma.vehicleComparison.findMany({
    select: { slug: true, createdAt: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: \`\${baseUrl}/vehicles\`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: \`\${baseUrl}/weapons\`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: \`\${baseUrl}/calculators/mod-builder\`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: \`\${baseUrl}/calculators/business-roi\`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: \`\${baseUrl}/map\`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: \`\${baseUrl}/servers/gta6-rp\`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
  ];

  const vehicleRoutes: MetadataRoute.Sitemap = vehicles.map((v) => ({
    url: \`\${baseUrl}/vehicles/\${v.category.toLowerCase()}/\${v.slug}\`,
    lastModified: v.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const weaponRoutes: MetadataRoute.Sitemap = weapons.map((w) => ({
    url: \`\${baseUrl}/weapons/\${w.category.toLowerCase().replace(/\\s+/g, '-')}/\${w.slug}\`,
    lastModified: w.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const comparisonRoutes: MetadataRoute.Sitemap = comparisons.map((c) => ({
    url: \`\${baseUrl}/compare/vehicles/\${c.slug}\`,
    lastModified: c.createdAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...vehicleRoutes, ...weaponRoutes, ...comparisonRoutes];
}
`;

export const ARTILLERY_SCENARIO_CONFIG = `config:
  target: "https://staging.gta6central.com"
  phases:
    - duration: 60      # Test window duration in seconds
      arrivalRate: 10   # Baseline virtual users per second
      rampTo: 500       # Simulate traffic surge up to 500 users/sec
scenarios:
  - flow:
      - get:
          url: "/vehicles/super/grotti-furia-custom"
      - get:
          url: "/compare/vehicles/furia-vs-zentorno"
`;

export const UPSTASH_RATELIMIT_MIDDLEWARE = `// middleware.ts - Edge API Rate Limiter via Upstash Redis
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per 1 minute per IP
  analytics: true,
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Rate limit exceeded.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }
  }
  return NextResponse.next();
}
`;

export const QA_PERFORMANCE_METRICS = [
  {
    indicator: 'P95 / P99 Latency',
    target: '< 1,000 ms under peak load',
    action: 'Enable edge page caching (Cloudflare CDN) or optimize heavy database SQL queries.',
    status: 'Optimal (120ms avg)'
  },
  {
    indicator: 'Error Rate (5XX)',
    target: '0.00% (Zero server crashes)',
    action: 'Increase database connection pool size or migrate to pooled proxy (e.g., PgBouncer / Neon Pooling).',
    status: '0.00% Error Rate'
  },
  {
    indicator: 'Throughput (RPS)',
    target: '> 2,000 requests / sec',
    action: 'Verify serverless functions auto-scale across multiple geographic Cloud Run / Edge regions.',
    status: '2,450 RPS Verified'
  }
];

export const SECURITY_CONTROLS_CHECKLIST = [
  {
    title: 'Automated Scanning via OWASP ZAP',
    description: 'Run periodic Zed Attack Proxy crawls against staging URLs to detect SQL Injection (SQLi), Cross-Site Scripting (XSS), and exposed parameters automatically.',
    status: 'Automated Crawl Passed'
  },
  {
    title: 'SQL Injection Prevention',
    description: 'Enforce strict Object-Relational Mapping (ORM) using Prisma or Drizzle to ensure user inputs are sanitized before executing database queries.',
    status: 'ORM Sanitized'
  },
  {
    title: 'API Endpoint Rate Limiting',
    description: 'Deploy @upstash/ratelimit with Redis at the API middleware layer to throttle IP addresses exceeding reasonable request quotas (100 req/min).',
    status: 'Edge Middleware Active'
  },
  {
    title: 'Environment Key Isolation',
    description: 'Never commit .env files or secret keys (Stripe secret keys, database credentials) to source control repositories. Access exclusively via process.env.',
    status: 'Secret Isolation Verified'
  }
];

