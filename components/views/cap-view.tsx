"use client";

import { ModuleHeader } from "@/components/common/frame-primitives";
import { CAP_PRESENTATION_LABEL } from "@/components/cap/cap";
import { CapContent } from "@/components/cap/cap-panel";
import { getEnvironment } from "@/lib/frameflow/environments";
import type { EnvironmentId } from "@/lib/frameflow/types";

export function CapView({ envId }: { envId: EnvironmentId }) {
  const env = getEnvironment(envId);
  return (
    <div className="ff-cap-page">
      <ModuleHeader
        eyebrow={`${env.label} · Seu espaço de inteligência`}
        title={CAP_PRESENTATION_LABEL[env.capPresentation]}
        description="Uma visão clara do que importa. Um próximo passo de cada vez."
      />
      <CapContent key={env.id} presentation={env.capPresentation} />
    </div>
  );
}
