import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './client';
import firebaseConfig from '../../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const storage = getStorage(app);

export interface SitemapUrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number | string;
  imageUrl?: string;
}

export interface SitemapCrawlerResult {
  success: boolean;
  totalRoutes: number;
  generatedAt: string;
  storagePath: string;
  downloadUrl?: string;
  firestoreSaved: boolean;
  xmlPreview: string;
  error?: string;
}

/**
 * Generates an XML string from a list of sitemap route entries.
 */
export function buildSitemapXml(baseUrl: string, entries: SitemapUrlEntry[]): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const now = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  for (const entry of entries) {
    const routeLoc = entry.loc.startsWith('http') ? entry.loc : `${cleanBaseUrl}${entry.loc.startsWith('/') ? '' : '/'}${entry.loc}`;
    const priority = entry.priority !== undefined ? String(entry.priority) : '0.8';
    const changefreq = entry.changefreq || 'weekly';
    const lastmod = entry.lastmod || now;

    xml += `  <url>\n`;
    xml += `    <loc>${routeLoc}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    if (entry.imageUrl && typeof entry.imageUrl === 'string' && entry.imageUrl.startsWith('http')) {
      const cleanImg = entry.imageUrl.replace(/&/g, '&amp;');
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
 * Periodically crawls active application routes, renders an updated sitemap.xml,
 * and persists the artifact to Firebase Storage and Firestore metadata.
 */
export async function generateAndUploadSitemap(baseUrl = 'https://viceintel.app'): Promise<SitemapCrawlerResult> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeIso = now.toISOString();

  // 1. Crawl/collect active platform routes
  const routes: SitemapUrlEntry[] = [
    { loc: '/', priority: '1.0', changefreq: 'daily', lastmod: dateStr },
    { loc: '/vehicles', priority: '0.9', changefreq: 'daily', lastmod: dateStr },
    { loc: '/weapons', priority: '0.9', changefreq: 'daily', lastmod: dateStr },
    { loc: '/characters', priority: '0.9', changefreq: 'daily', lastmod: dateStr },
    { loc: '/comparison', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { loc: '/mod-calculator', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { loc: '/roi-calculator', priority: '0.9', changefreq: 'daily', lastmod: dateStr },
    { loc: '/handling-editor', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { loc: '/economy-balancer', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { loc: '/scripts/generator', priority: '0.95', changefreq: 'daily', lastmod: dateStr },
    { loc: '/blog', priority: '0.9', changefreq: 'daily', lastmod: dateStr },
    { loc: '/map', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { loc: '/rp-servers', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
    { loc: '/chat', priority: '0.7', changefreq: 'daily', lastmod: dateStr },
    { loc: '/profile', priority: '0.6', changefreq: 'monthly', lastmod: dateStr },
    { loc: '/challenges', priority: '0.85', changefreq: 'daily', lastmod: dateStr },
    { loc: '/seo-hub', priority: '0.9', changefreq: 'daily', lastmod: dateStr },
    { loc: '/docs', priority: '0.7', changefreq: 'monthly', lastmod: dateStr },
    { loc: '/for-servers', priority: '0.8', changefreq: 'weekly', lastmod: dateStr },
  ];

  // Try fetching dynamic entities from local API if available
  try {
    const res = await fetch('/api/seo/pages');
    if (res.ok) {
      const seoData = await res.json();
      if (Array.isArray(seoData.pages)) {
        seoData.pages.forEach((p: any) => {
          if (p && p.slug) {
            routes.push({
              loc: `/${p.slug}`,
              priority: '0.85',
              changefreq: 'daily',
              lastmod: p.lastUpdated || dateStr,
            });
          }
        });
      }
    }
  } catch (err) {
    // Graceful fallback to static routes
  }

  const xmlContent = buildSitemapXml(baseUrl, routes);
  const storagePath = `sitemaps/sitemap-${dateStr}.xml`;
  const latestStoragePath = `sitemaps/sitemap.xml`;

  let downloadUrl = '';
  let firestoreSaved = false;

  // 2. Upload to Firebase Storage
  try {
    const latestStorageRef = ref(storage, latestStoragePath);
    await uploadString(latestStorageRef, xmlContent, 'raw', {
      contentType: 'application/xml',
      customMetadata: {
        totalRoutes: String(routes.length),
        generatedAt: timeIso,
        generator: 'GTA VI Vice City Sitemap Crawler',
      },
    });

    try {
      downloadUrl = await getDownloadURL(latestStorageRef);
    } catch {
      downloadUrl = `gs://${firebaseConfig.storageBucket}/${latestStoragePath}`;
    }
  } catch (storageErr) {
    console.warn('[Sitemap Firebase Storage Notice]:', storageErr);
  }

  // 3. Persist metadata & XML backup to Firestore for indexing & admin inspection
  try {
    await setDoc(doc(db, 'system_sitemaps', 'latest'), {
      id: 'latest',
      xml: xmlContent,
      totalRoutes: routes.length,
      storagePath: latestStoragePath,
      downloadUrl: downloadUrl || null,
      generatedAt: timeIso,
      lastmod: dateStr,
      baseUrl,
    });
    firestoreSaved = true;
  } catch (firestoreErr) {
    console.warn('[Sitemap Firestore Persistence Notice]:', firestoreErr);
  }

  return {
    success: true,
    totalRoutes: routes.length,
    generatedAt: timeIso,
    storagePath: latestStoragePath,
    downloadUrl,
    firestoreSaved,
    xmlPreview: xmlContent.slice(0, 500) + '...',
  };
}
