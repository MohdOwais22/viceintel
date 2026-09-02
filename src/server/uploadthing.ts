import { createUploadthing, type FileRouter } from "uploadthing/express";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

/**
 * UploadThing File Router for GTA VI Vice City Utility Suite
 * Defines endpoints with type-safe metadata and image validation
 */
export const uploadthingRouter = {
  // 1. RP Server listings, custom banners and logos (Max 4MB)
  serverBanner: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // Extract client auth or pass through for verified admin / staff sessions
      const authHeader = req.headers.authorization || '';
      return {
        category: 'server_banner' as const,
        uploadedAt: new Date().toISOString(),
        authHeaderPresent: !!authHeader,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UploadThing] Server banner uploaded:`, file.ufsUrl || file.url);
      return { url: file.ufsUrl || file.url, key: file.key, category: metadata.category };
    }),

  // 2. Intelligence articles, news drops & leak thumbnails (Max 4MB)
  newsThumbnail: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      return { category: 'news_thumbnail' as const, uploadedAt: new Date().toISOString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UploadThing] News thumbnail uploaded:`, file.ufsUrl || file.url);
      return { url: file.ufsUrl || file.url, key: file.key, category: metadata.category };
    }),

  // 3. User & Admin profile avatars (Max 2MB)
  avatar: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      return { category: 'avatar' as const, uploadedAt: new Date().toISOString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UploadThing] Avatar uploaded:`, file.ufsUrl || file.url);
      return { url: file.ufsUrl || file.url, key: file.key, category: metadata.category };
    }),

  // 4. Vehicle database, tuning builds & garage showcases (Max 4MB)
  vehicleImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      return { category: 'vehicle' as const, uploadedAt: new Date().toISOString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UploadThing] Vehicle photo uploaded:`, file.ufsUrl || file.url);
      return { url: file.ufsUrl || file.url, key: file.key, category: metadata.category };
    }),

  // 5. Weapon armory, loadout sheets & blueprints (Max 4MB)
  weaponImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      return { category: 'weapon' as const, uploadedAt: new Date().toISOString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UploadThing] Weapon photo uploaded:`, file.ufsUrl || file.url);
      return { url: file.ufsUrl || file.url, key: file.key, category: metadata.category };
    }),

  // 6. Character gallery dossiers & faction boss profiles (Max 4MB)
  characterImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      return { category: 'character' as const, uploadedAt: new Date().toISOString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UploadThing] Character dossier uploaded:`, file.ufsUrl || file.url);
      return { url: file.ufsUrl || file.url, key: file.key, category: metadata.category };
    }),

  // 7. Bug & telemetry issue screenshots (Max 4MB)
  reportScreenshot: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      return { category: 'report_screenshot' as const, uploadedAt: new Date().toISOString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UploadThing] Bug screenshot uploaded:`, file.ufsUrl || file.url);
      return { url: file.ufsUrl || file.url, key: file.key, category: metadata.category };
    }),

  // 8. General asset uploads (Max 4MB)
  generalImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      return { category: 'general' as const, uploadedAt: new Date().toISOString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[UploadThing] Asset uploaded:`, file.ufsUrl || file.url);
      return { url: file.ufsUrl || file.url, key: file.key, category: metadata.category };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadthingRouter;
