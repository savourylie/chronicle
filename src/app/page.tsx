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
        className="relative z-10 min-h-0 flex-grow"
      />

      {/* Timeline slot */}
      <div
        data-slot="timeline"
        className="relative z-10 h-[120px] border-t-2 border-border"
      />

      {/* Detail panel (off-screen by default) */}
      <aside
        data-slot="detail-panel"
        className="fixed inset-y-0 right-0 z-30 w-full translate-x-full md:w-[400px]"
      />
    </div>
  );
}
