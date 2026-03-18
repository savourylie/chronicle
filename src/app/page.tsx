import { Breadcrumb } from "@/components/breadcrumb";
import { CirclePack } from "@/components/circle-pack";
import { DetailPanel } from "@/components/detail-panel";
import { Header } from "@/components/layout/header";
import { Decorations } from "@/components/layout/decorations";

export default function Home() {
  return (
    <div className="relative grid h-dvh grid-rows-[auto_1fr_auto]">
      <Decorations />

      {/* Header */}
      <div data-slot="header" className="relative z-10">
        <Header />
      </div>

      {/* Visualization area */}
      <main
        data-slot="visualization"
        className="relative z-10 min-h-0 flex flex-col"
      >
        <Breadcrumb />
        <div className="relative min-h-0 flex-1">
          <CirclePack />
        </div>
      </main>

      {/* Timeline slot */}
      <div
        data-slot="timeline"
        className="relative z-10 h-[120px] border-t-2 border-border"
      />

      {/* Detail panel */}
      <DetailPanel />
    </div>
  );
}
