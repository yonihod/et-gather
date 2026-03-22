"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Known ET maps with preview images.
 * Add new maps by placing a .jpg in /public/images/maps/{mapname}.jpg
 */
const KNOWN_MAPS = new Set([
  "supply",
  "goldrush",
  "oasis",
  "battery",
  "fuel_dump",
  "radar",
  "railgun",
  "mp_beach",
  "adlernest",
  "frostbite",
  "venice",
  "caen",
  "bremen",
  "baserace",
  "sp_delivery",
  "erdenberg",
  "warbell",
  "te_valhalla",
  "sw_goldrush_te",
  "karsiah",
  "braundorf_b4",
  "sw_battery",
  "missile_b3",
  "sw_oasis_b3",
  "tc_base",
  "sw_fueldump_te",
]);

/** Display names for well-known maps */
const MAP_NAMES: Record<string, string> = {
  supply: "Supply Depot",
  goldrush: "Gold Rush",
  oasis: "Oasis",
  battery: "Battery",
  fuel_dump: "Fuel Dump",
  radar: "Radar",
  railgun: "Rail Gun",
  mp_beach: "Omaha Beach",
  adlernest: "Adlernest",
  frostbite: "Frostbite",
  venice: "Venice",
  caen: "Caen",
  bremen: "Bremen",
  baserace: "Base Race",
  sp_delivery: "Special Delivery",
  erdenberg: "Erdenberg",
  warbell: "War Bell",
  te_valhalla: "Valhalla",
  te_escape2: "Escape",
  sw_goldrush_te: "Gold Rush TE",
  karsiah: "Karsiah",
  braundorf_b4: "Braundorf",
  braundorf: "Braundorf",
  sw_battery: "Battery SW",
  missile_b3: "Missile",
  sw_oasis_b3: "Oasis SW",
  tc_base: "TC Base",
  sw_fueldump_te: "Fuel Dump TE",
};

export function MapPreview({ mapName }: { mapName: string }) {
  const [imgError, setImgError] = useState(false);
  const cleanName = mapName.toLowerCase().trim();
  const hasImage = KNOWN_MAPS.has(cleanName) && !imgError;
  const displayName = MAP_NAMES[cleanName] || mapName;

  if (!hasImage) {
    // Fallback: styled card with map name
    return (
      <div className="relative rounded overflow-hidden bg-secondary/50 h-16 flex items-center justify-center">
        <div className="text-xs text-muted-foreground/60 uppercase tracking-wider font-mono">
          {displayName}
        </div>
        {/* Tactical grid pattern */}
        <div className="absolute inset-0 topo-grid opacity-50" />
      </div>
    );
  }

  return (
    <div className="relative rounded overflow-hidden h-20 group">
      <Image
        src={`/images/maps/${cleanName}.jpg`}
        alt={displayName}
        fill
        className="object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
        sizes="300px"
        onError={() => setImgError(true)}
      />
      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      {/* Map name */}
      <div className="absolute bottom-1.5 start-2.5 text-[11px] font-semibold text-white/90 drop-shadow-md">
        {displayName}
      </div>
    </div>
  );
}
