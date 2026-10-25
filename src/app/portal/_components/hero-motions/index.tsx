"use client";

import * as React from "react";
import type { HeroSettings } from "@/features/identity";
import { LotusBloomMotion } from "./lotus-bloom-motion";
import { AshokaFlowerMotion } from "./ashoka-flower-motion";
import { DharmachakraMotion } from "./dharmachakra-motion";
import { BodhiLeafMotion } from "./bodhi-leaf-motion";

export { LotusBloomMotion, AshokaFlowerMotion, DharmachakraMotion, BodhiLeafMotion };

interface HeroMotionArtworkProps {
  hero: HeroSettings;
}

export function HeroMotionArtwork({ hero }: HeroMotionArtworkProps) {
  const preset = hero.motionPreset ?? "lotus-bloom";

  // 1. Lotus Bloom (ดอกบัวหลวงกำลังบาน)
  if (preset === "lotus-bloom") {
    return <LotusBloomMotion />;
  }

  // 2. Ashoka Flower (ดอกอโศกอินเดีย)
  if (preset === "ashoka-flower") {
    return <AshokaFlowerMotion />;
  }

  // 3. Dharmachakra (วงล้อธรรมจักร 8 ซี่)
  if (preset === "dharmachakra") {
    return <DharmachakraMotion />;
  }

  // 4. Bodhi Leaf (ใบโพธิ์ทองแห่งการตรัสรู้)
  if (preset === "bodhi-leaf") {
    return <BodhiLeafMotion />;
  }

  // 5. EMBER or Custom Video/WebP/GIF Fallback
  return (
    <picture className="w-full h-full flex items-center justify-center">
      <source
        srcSet={hero.motionArtworkUrl?.trim() || "/ember_animation_30fps.webp"}
        type="image/webp"
      />
      <img
        src={hero.motionPreviewUrl?.trim() || "/ember_preview.gif"}
        alt="Motion Artwork"
        className="w-full h-full object-cover lg:object-contain object-center scale-[1.01] transition-transform duration-700"
      />
    </picture>
  );
}
