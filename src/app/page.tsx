import { Breadcrumb } from "@/components/breadcrumb";
import { CirclePack } from "@/components/circle-pack";
import { DetailPanel } from "@/components/detail-panel";
import { EncodingToolbar } from "@/components/encoding-toolbar";
import { Header } from "@/components/layout/header";
import { Decorations } from "@/components/layout/decorations";
import { RepoInputTabs } from "@/components/repo-input-tabs";
import { Search } from "@/components/search";
import { TimelineMinimap } from "@/components/timeline";
import { VisualizationGate } from "@/components/visualization-gate";

export default function Home() {
  return (
    <div className="relative grid h-dvh grid-rows-[auto_1fr_auto]">
      <Decorations />

      {/* Header */}
      <div data-slot="header" className="relative z-10">
        <Header>
          <EncodingToolbar />
          <Search />
        </Header>
      </div>

      {/* Main content — repo input or visualization */}
      <VisualizationGate
        fallback={
          <main className="relative z-10 min-h-0 flex flex-col">
            <RepoInputTabs />
          </main>
        }
      >
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
          className="relative z-10 hidden h-[120px] border-t-2 border-border md:block"
        >
          <TimelineMinimap />
        </div>

        {/* Detail panel */}
        <DetailPanel />
      </VisualizationGate>
    </div>
  );
}
