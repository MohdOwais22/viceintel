import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' ? firebaseConfig.firestoreDatabaseId : undefined);

export interface RouteItem {
  path: string;
  priority: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastmod?: string;
  imageUrl?: string;
}

/**
 * Crawls and compiles all active platform routes:
 * - Core navigational hubs
 * - Vehicle & Weapon catalogs
 * - Character dossier hubs
 * - FiveM RP Servers
 * - Dynamic programmatic SEO & news articles
 */
export async function crawlActiveRoutes(baseUrl = 'https://viceintel.app'): Promise<RouteItem[]> {
  const dateStr = new Date().toISOString().split('T')[0];

  const coreRoutes: RouteItem[] = [
    { path: '/', priority: '1.0', changefreq: 'daily', lastmod: dateStr },
    { path: '/vehicles', priority: '0.9', changefreq: 'daily', lastmod: dateStr },
    { path: '/weapons', priority: '0.9', changefreq: 'daily', lastmod: dateStr },
    { path: '/characters', priority: '0.9', changefreq: 'daily', lastmod: dateStr },
    { path: '/characters?page=2', priority: '0.85', changefreq: 'daily', lastmod: dateStr },
    { path: '/comparison', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { path: '/mod-calculator', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { path: '/roi-calculator', priority: '0.9', changefreq: 'daily', lastmod: dateStr },
    { path: '/handling-editor', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { path: '/economy-balancer', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { path: '/scripts/generator', priority: '0.95', changefreq: 'daily', lastmod: dateStr },
    { path: '/blog', priority: '0.9', changefreq: 'daily', lastmod: dateStr },
    { path: '/map', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { path: '/rp-servers', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { path: '/chat', priority: '0.7', changefreq: 'daily', lastmod: dateStr },
    { path: '/profile', priority: '0.6', changefreq: 'monthly', lastmod: dateStr },
    { path: '/monetization', priority: '0.5', changefreq: 'monthly', lastmod: dateStr },
    { path: '/docs', priority: '0.7', changefreq: 'monthly', lastmod: dateStr },
    { path: '/pseo', priority: '0.6', changefreq: 'monthly', lastmod: dateStr },
    { path: '/giftcards', priority: '0.6', changefreq: 'weekly', lastmod: dateStr },
    { path: '/seo-hub', priority: '0.9', changefreq: 'daily', lastmod: dateStr },
    { path: '/challenges', priority: '0.85', changefreq: 'daily', lastmod: dateStr },
    { path: '/for-servers', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { path: '/about', priority: '0.5', changefreq: 'monthly', lastmod: dateStr },
    { path: '/privacy', priority: '0.4', changefreq: 'monthly', lastmod: dateStr },
    { path: '/copyright', priority: '0.4', changefreq: 'monthly', lastmod: dateStr },
  ];

  // Fetch dynamically generated pSEO pages from local backend
  try {
    const res = await fetch('http://127.0.0.1:3000/api/seo/pages');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.pages)) {
        data.pages.forEach((p: any) => {
          if (p && p.slug) {
            coreRoutes.push({
              path: `/${p.slug}`,
              priority: '0.85',
              changefreq: 'daily',
              lastmod: p.lastUpdated || dateStr,
            });
          }
        });
      }
    }
  } catch (err) {
    // Local dev fallback
  }

  return coreRoutes;
}

/**
 * Builds standard XML sitemap format conforming to Google/Bing specifications.
 */
export function generateSitemapXml(baseUrl: string, routes: RouteItem[]): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  for (const r of routes) {
    const loc = r.path.startsWith('http') ? r.path : `${cleanBase}${r.path.startsWith('/') ? '' : '/'}${r.path}`;
    xml += `  <url>\n`;
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${r.lastmod || new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>${r.changefreq || 'weekly'}</changefreq>\n`;
    xml += `    <priority>${r.priority || '0.8'}</priority>\n`;
    if (r.imageUrl) {
      const cleanImg = r.imageUrl.replace(/&/g, '&amp;');
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${cleanImg}</image:loc>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * Executes full crawling pass, generates sitemap.xml, uploads to Firebase Storage,
 * and records metadata to Firestore collection `system_sitemaps`.
 */
export async function runSitemapCrawlerJob(baseUrl = process.env.APP_URL || 'https://viceintel.app') {
  console.log(`[Sitemap Crawler] Initiating route crawl for: ${baseUrl}`);
  const startTime = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];
  const timeIso = new Date().toISOString();

  const routes = await crawlActiveRoutes(baseUrl);
  console.log(`[Sitemap Crawler] Discovered ${routes.length} active routes`);

  const xml = generateSitemapXml(baseUrl, routes);
  const storageFilePath = `sitemaps/sitemap.xml`;
  const archivePath = `sitemaps/archives/sitemap-${dateStr}-${Date.now()}.xml`;

  let storageUrl = '';
  let storageSuccess = false;

  // 1. Upload to Firebase Storage
  try {
    const storageRef = ref(storage, storageFilePath);
    await uploadString(storageRef, xml, 'raw', {
      contentType: 'application/xml',
      cacheControl: 'public, max-age=3600',
      customMetadata: {
        totalRoutes: String(routes.length),
        generatedAt: timeIso,
        generator: 'GTA VI Vice City Sitemap Generator',
      },
    });

    try {
      storageUrl = await getDownloadURL(storageRef);
    } catch {
      storageUrl = `gs://${firebaseConfig.storageBucket}/${storageFilePath}`;
    }
    storageSuccess = true;
    console.log(`[Sitemap Crawler] Successfully uploaded sitemap.xml to Firebase Storage: ${storageUrl}`);

    // Also upload versioned archive
    const archiveRef = ref(storage, archivePath);
    await uploadString(archiveRef, xml, 'raw', { contentType: 'application/xml' }).catch(() => {});
  } catch (err: any) {
    console.error(`[Sitemap Crawler] Firebase Storage upload error:`, err?.message || err);
  }

  // 2. Persist audit & XML record to Firestore
  let firestoreSuccess = false;
  try {
    await setDoc(doc(db, 'system_sitemaps', 'latest'), {
      id: 'latest',
      xml,
      totalRoutes: routes.length,
      storagePath: storageFilePath,
      archivePath,
      downloadUrl: storageUrl || null,
      generatedAt: timeIso,
      lastmod: dateStr,
      baseUrl,
      executionMs: Date.now() - startTime,
    });
    firestoreSuccess = true;
    console.log(`[Sitemap Crawler] Successfully recorded sitemap metadata to Firestore collection system_sitemaps/latest`);
  } catch (err: any) {
    console.error(`[Sitemap Crawler] Firestore metadata record error:`, err?.message || err);
  }

  return {
    success: true,
    totalRoutes: routes.length,
    generatedAt: timeIso,
    storageSuccess,
    firestoreSuccess,
    storagePath: storageFilePath,
    downloadUrl: storageUrl,
    durationMs: Date.now() - startTime,
  };
}

// Allow direct execution via node/tsx CLI (e.g. `npx tsx scripts/generate-sitemap.ts`)
runSitemapCrawlerJob()
  .then((res) => {
    console.log('[Sitemap Crawler CLI] Job finished:', JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Sitemap Crawler CLI] Job failed:', err);
    process.exit(1);
  });
