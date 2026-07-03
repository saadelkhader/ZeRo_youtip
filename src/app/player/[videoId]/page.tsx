import type { Metadata } from "next";
import { PlayerView } from "@/components/player/PlayerView";
import { fetchYoutubeOEmbed } from "@/lib/utils/youtube";

export async function generateMetadata({
  params,
}: {
  params: { videoId: string };
}): Promise<Metadata> {
  const oembed = await fetchYoutubeOEmbed(params.videoId);
  // The template in the root layout appends " · ZeRo youtip".
  return { title: oembed?.title ?? "Lecteur" };
}

export default function PlayerPage({
  params,
}: {
  params: { videoId: string };
}) {
  return <PlayerView videoId={params.videoId} />;
}
