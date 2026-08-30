'use client';
import React, { useState, useEffect } from 'react';
import { VEHICLES_DATA } from '../data/vehicles';
import { WEAPONS_DATA } from '../data/weapons';
import { BUSINESSES_DATA } from '../data/businesses';
import { Code2, Copy, Check, ShieldCheck, Sparkles, Database, FileCode } from 'lucide-react';
import { copyToClipboard } from '../lib/copyUtils';

export const JsonLdInspector: React.FC = () => {
  const [schemaType, setSchemaType] = useState<'vehicle' | 'weapon' | 'business' | 'comparison'>('vehicle');
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES_DATA[0]);
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS_DATA[0]);
  const [selectedBusiness, setSelectedBusiness] = useState(BUSINESSES_DATA[0]);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Generate dynamic JSON-LD based on selected entity
  const getJsonLdPayload = () => {
    if (schemaType === 'vehicle') {
      const canonicalUrl = `https://gta6hub.com/vehicles/${selectedVehicle.category.toLowerCase()}/${selectedVehicle.slug}`;
      const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": `${selectedVehicle.brand} ${selectedVehicle.name}`,
        "image": [selectedVehicle.imageUrl],
        "description": selectedVehicle.description,
        "sku": `GTA6-VEH-${selectedVehicle.id.toUpperCase()}`,
        "brand": { "@type": "Brand", "name": selectedVehicle.brand },
        "offers": {
          "@type": "Offer",
          "url": canonicalUrl,
          "priceCurrency": "USD",
          "price": selectedVehicle.price,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": selectedVehicle.dealer }
        },
        "additionalProperty": [
          { "@type": "PropertyValue", "name": "Top Speed", "value": `${selectedVehicle.topSpeedMph} MPH` },
          { "@type": "PropertyValue", "name": "Acceleration", "value": `${selectedVehicle.acceleration}/100` },
          { "@type": "PropertyValue", "name": "Handling", "value": `${selectedVehicle.handling}/100` },
          { "@type": "PropertyValue", "name": "Drivetrain", "value": selectedVehicle.drivetrain }
        ]
      };
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gta6hub.com" },
          { "@type": "ListItem", "position": 2, "name": "Vehicles", "item": "https://gta6hub.com/vehicles" },
          { "@type": "ListItem", "position": 3, "name": selectedVehicle.category, "item": `https://gta6hub.com/vehicles/${selectedVehicle.category.toLowerCase()}` },
          { "@type": "ListItem", "position": 4, "name": selectedVehicle.name, "item": canonicalUrl }
        ]
      };
      return [breadcrumbSchema, productSchema];
    }

    if (schemaType === 'weapon') {
      const canonicalUrl = `https://gta6hub.com/weapons/${selectedWeapon.category.toLowerCase()}/${selectedWeapon.slug}`;
      const weaponSchema = {
        "@context": "https://schema.org/",
        "@type": "IndividualProduct",
        "name": selectedWeapon.name,
        "image": [selectedWeapon.imageUrl],
        "description": selectedWeapon.description,
        "sku": `GTA6-WEAPON-${selectedWeapon.id.toUpperCase()}`,
        "brand": { "@type": "Brand", "name": selectedWeapon.manufacturer },
        "offers": {
          "@type": "Offer",
          "url": canonicalUrl,
          "priceCurrency": "USD",
          "price": selectedWeapon.price,
          "availability": "https://schema.org/InStock"
        },
        "additionalProperty": [
          { "@type": "PropertyValue", "name": "Base Damage", "value": `${selectedWeapon.damage}/100` },
          { "@type": "PropertyValue", "name": "Time to Kill", "value": `${selectedWeapon.ttkMs} ms` },
          { "@type": "PropertyValue", "name": "Unlock Rank", "value": `Rank ${selectedWeapon.unlockRank}` }
        ]
      };
      return [weaponSchema];
    }

    if (schemaType === 'business') {
      const canonicalUrl = `https://gta6hub.com/real-estate/${selectedBusiness.slug}`;
      const realEstateSchema = {
        "@context": "https://schema.org/",
        "@type": "RealEstateListing",
        "name": selectedBusiness.name,
        "description": selectedBusiness.description,
        "price": selectedBusiness.purchasePrice,
        "priceCurrency": "USD",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": selectedBusiness.location,
          "addressRegion": "Leonida"
        }
      };
      return [realEstateSchema];
    }

    // 1v1 Comparison Schema
    const compUrl = `https://gta6hub.com/compare/vehicles/${VEHICLES_DATA[0].slug}-vs-${VEHICLES_DATA[1].slug}`;
    const compSchema = {
      "@context": "https://schema.org/",
      "@type": "ItemPage",
      "name": `${VEHICLES_DATA[0].name} vs ${VEHICLES_DATA[1].name} 1v1 Spec Comparison`,
      "url": compUrl,
      "description": `Detailed 1v1 head-to-head comparison between ${VEHICLES_DATA[0].name} and ${VEHICLES_DATA[1].name} in GTA VI Vice City.`
    };
    return [compSchema];
  };

  const payload = getJsonLdPayload();

  // Dynamically inject schema into document head
  useEffect(() => {
    const existingScript = document.getElementById('dynamic-jsonld-schema');
    if (existingScript) {
      existingScript.remove();
    }
    const script = document.createElement('script');
    script.id = 'dynamic-jsonld-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(payload);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('dynamic-jsonld-schema');
      if (el) el.remove();
    };
  }, [schemaType, selectedVehicle, selectedWeapon, selectedBusiness]);

  const copyJsonLd = async () => {
    await copyToClipboard(JSON.stringify(payload, null, 2));
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-rose-400" />
          <div>
            <h4 className="text-sm font-bold text-white">Schema.org JSON-LD Programmatic Meta Inspector</h4>
            <p className="text-[10px] text-zinc-400">Live search engine structured data injected directly into document head.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={schemaType}
            onChange={(e) => setSchemaType(e.target.value as any)}
            className="bg-zinc-900 text-xs text-rose-300 font-bold border border-rose-500/30 rounded-lg px-2.5 py-1 focus:outline-none"
          >
            <option value="vehicle">Vehicle Schema</option>
            <option value="weapon">Weapon Schema</option>
            <option value="business">Real Estate Schema</option>
            <option value="comparison">1v1 Comparison Schema</option>
          </select>

          {schemaType === 'vehicle' && (
            <select
              value={selectedVehicle.id}
              onChange={(e) => {
                const found = VEHICLES_DATA.find((v) => v.id === e.target.value);
                if (found) setSelectedVehicle(found);
              }}
              className="bg-zinc-900 text-xs text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              {VEHICLES_DATA.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          )}

          {schemaType === 'weapon' && (
            <select
              value={selectedWeapon.id}
              onChange={(e) => {
                const found = WEAPONS_DATA.find((w) => w.id === e.target.value);
                if (found) setSelectedWeapon(found);
              }}
              className="bg-zinc-900 text-xs text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              {WEAPONS_DATA.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}

          {schemaType === 'business' && (
            <select
              value={selectedBusiness.id}
              onChange={(e) => {
                const found = BUSINESSES_DATA.find((b) => b.id === e.target.value);
                if (found) setSelectedBusiness(found);
              }}
              className="bg-zinc-900 text-xs text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              {BUSINESSES_DATA.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={copyJsonLd}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
          >
            {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSchema ? 'Copied' : 'Copy JSON-LD'}</span>
          </button>
        </div>
      </div>

      <pre className="bg-zinc-900/90 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-64 scrollbar-thin border border-zinc-800">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
};
