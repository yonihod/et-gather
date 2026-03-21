import { useTranslations } from "next-intl";
import { GatherQueue } from "@/components/gather/GatherQueue";
import { GatherHistory } from "@/components/gather/GatherHistory";

export default function GatherPage() {
  const t = useTranslations("gather");

  return (
    <div className="space-y-8 topo-grid -mx-4 sm:-mx-6 px-4 sm:px-6 py-2">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-mono mt-2">Match Lobby</p>
      </div>
      <GatherQueue />
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("history")}</h2>
        <GatherHistory />
      </section>
    </div>
  );
}
