import { GatherDetail } from "@/components/gather/GatherDetail";

export default function GatherDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <GatherDetail gatherId={params.id} />;
}
