import { useTranslations } from "next-intl";
import { GatherQueue } from "@/components/gather/GatherQueue";
import { GatherHistory } from "@/components/gather/GatherHistory";

export default function GatherPage() {
  const t = useTranslations("gather");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <GatherQueue />
      <section>
        <h2 className="text-xl font-semibold mb-4">{t("history")}</h2>
        <GatherHistory />
      </section>
    </div>
  );
}
