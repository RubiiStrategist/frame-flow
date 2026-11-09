"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CapPresentation, CapState } from "@/lib/frameflow/types";
export const CAP_STATES: CapState[] = [
  "idle",
  "blink",
  "wave",
  "point",
  "think",
  "celebrate",
  "alert",
  "wait",
];

export const CAP_STATE_LABEL: Record<CapState, string> = {
  idle: "Padrão",
  blink: "Piscar",
  wave: "Acenar",
  point: "Apontar",
  think: "Pensar",
  celebrate: "Comemorar",
  alert: "Alertar",
  wait: "Aguardar",
};

export const CAP_PRESENTATION_LABEL: Record<CapPresentation, string> = {
  executiva: "Cap Executiva",
  comercial: "Cap Comercial",
  operacional: "Cap Operacional",
  concierge: "Cap Concierge",
};

export interface CapAssetsResolver {
  /** Nome do asset por apresentação+estado (ex.: "cap-executiva-wave.svg"). */
  assetName(presentation: CapPresentation, state: CapState): string;
  /** URL base dos assets oficiais, quando publicados. */
  baseUrl?: string;
}

export const CAP_ANIMATION_LABEL: Record<CapPresentation, string> = {
  executiva: "Piscar discreto",
  comercial: "Piscadinha",
  operacional: "Piscar duplo",
  concierge: "Piscar discreto",
};

export function Cap({
  presentation, state = "idle", size = 160, className, assets,
  showAssetNotice = false, paused = false, motionEnabled = false,
}: {
  presentation: CapPresentation;
  state?: CapState;
  size?: number;
  className?: string;
  assets?: CapAssetsResolver;
  showAssetNotice?: boolean;
  paused?: boolean;
  motionEnabled?: boolean;
}) {
  const variant = presentation === "concierge" ? "executiva" : presentation;
  const base = `/brand/cap-v4/${variant}`;
  const custom = assets
    ? `${assets.baseUrl?.replace(/\/$/, "") ?? ""}/${assets.assetName(presentation, state)}`
    : null;
  const openSrc = custom ?? `${base}-open.png`;
  const closedSrc = `${base}-blink.png`;
  const [loadedOpen, setLoadedOpen] = useState("");
  const [loadedClosed, setLoadedClosed] = useState("");
  const ready = loadedOpen === openSrc && loadedClosed === closedSrc;

  return (
    <figure
      className={cn("ff-cap-original ff-cap-v4 relative inline-flex shrink-0 select-none flex-col items-center", className)}
      aria-label={CAP_PRESENTATION_LABEL[presentation]}
      data-variant={variant}
      data-paused={paused}
      data-motion-enabled={motionEnabled}
      data-state={state}
    >
      <div className="ff-cap-body" style={{ width: size, height: size }}>
        <div className="ff-cap-stage">
          <Image
            src={openSrc}
            alt={`${CAP_PRESENTATION_LABEL[presentation]}, mascote da FRAME VISION`}
            fill sizes={`${size}px`} className="ff-cap-image"
            onLoad={() => setLoadedOpen(openSrc)}
          />
          {!custom && (
            <Image
              src={closedSrc} alt="" aria-hidden fill sizes={`${size}px`}
              className={cn("ff-cap-image ff-cap-expression", ready && "is-ready")}
              onLoad={() => setLoadedClosed(closedSrc)}
            />
          )}
        </div>
      </div>
      {showAssetNotice && <figcaption className="ff-cap-credit">FRAME VISION · {CAP_ANIMATION_LABEL[presentation]}</figcaption>}
    </figure>
  );
}
