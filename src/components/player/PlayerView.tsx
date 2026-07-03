"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Image as ImageIcon, Eye, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IntentionScreen } from "@/components/player/IntentionScreen";
import { PlayerControls } from "@/components/player/PlayerControls";
import { NoteInput } from "@/components/player/NoteInput";
import { NotesPanel } from "@/components/player/NotesPanel";
import { NextActionDialog } from "@/components/shared/NextActionDialog";
import { ScreenFreeMode } from "@/components/player/ScreenFreeMode";
import { DailyLimitDialog } from "@/components/player/DailyLimitDialog";
import { ReflectionPause } from "@/components/player/ReflectionPause";
import { VideoEndScreen } from "@/components/player/VideoEndScreen";
import { PLAYER_STAGE_ID } from "@/components/player/PlayerHost";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { usePlayerShortcuts } from "@/lib/hooks/usePlayerShortcuts";
import { playerControls } from "@/lib/player-controls";
import { ensureVideo } from "@/lib/actions/videos";
import { buildThumbnailUrl } from "@/lib/utils/youtube";
import type { Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface PlayerViewProps {
  videoId: string; // youtube id from the route
}

/** Build a minimal stand-in Video for a direct link with no DB row. */
function syntheticVideo(youtubeId: string): Video {
  return {
    id: `yt:${youtubeId}`,
    user_id: "",
    vault_id: null,
    youtube_id: youtubeId,
    title: "Lecture",
    channel_name: "",
    duration_seconds: 0,
    thumbnail_url: buildThumbnailUrl(youtubeId, "hqdefault"),
    youtube_url: `https://www.youtube.com/watch?v=${youtubeId}`,
    status: "playing",
    priority: "now",
    intention: null,
    expected_result: null,
    max_duration_minutes: null,
    listened_seconds: 0,
    position_in_queue: 0,
    is_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function PlayerView({ videoId }: PlayerViewProps) {
  const router = useRouter();
  const noteRef = React.useRef<HTMLTextAreaElement>(null);

  const storeVideo = usePlayerStore((s) => s.currentVideo);
  const playVideo = usePlayerStore((s) => s.playVideo);
  const replaceVideo = usePlayerStore((s) => s.replaceVideo);
  const maximize = usePlayerStore((s) => s.maximize);
  const minimize = usePlayerStore((s) => s.minimize);
  const showIntentionScreen = usePlayerStore((s) => s.showIntentionScreen);
  const isScreenFreeMode = usePlayerStore((s) => s.isScreenFreeMode);
  const intention = usePlayerStore((s) => s.intention);
  const videoEnded = usePlayerStore((s) => s.videoEnded);
  const markEnded = usePlayerStore((s) => s.markEnded);
  const audioMode = usePlayerStore((s) => s.isAudioMode);
  const toggleAudioMode = usePlayerStore((s) => s.toggleAudioMode);

  const [actionOpen, setActionOpen] = React.useState(false);
  const [singleVideoMode, setSingleVideoMode] = React.useState(false);

  // Resolve the video to a REAL DB row (create it if missing) so notes,
  // actions and sessions can reference video.id. The store value is preferred
  // only if it's already a persisted row (uuid, not a synthetic "yt:" id).
  const storeIsReal =
    storeVideo?.youtube_id === videoId && !storeVideo.id.startsWith("yt:");

  const { data: fetchedVideo } = useQuery({
    queryKey: ["ensure-video", videoId],
    enabled: !storeIsReal,
    queryFn: async () => {
      try {
        return await ensureVideo(videoId);
      } catch {
        return null;
      }
    },
  });

  const video = storeIsReal
    ? storeVideo
    : (fetchedVideo ?? storeVideo ?? syntheticVideo(videoId));

  // Load / reconcile the video into the store.
  React.useEffect(() => {
    if (!video) return;
    const isReal = !video.id.startsWith("yt:");

    if (!storeVideo || storeVideo.youtube_id !== videoId) {
      // Nothing loaded for this route yet → start a fresh session.
      playVideo(video);
    } else if (isReal && storeVideo.id !== video.id) {
      // Same video already playing but as a synthetic stand-in → swap to the
      // real DB row in place, without resetting the session/intention.
      replaceVideo(video);
    }
  }, [video, storeVideo, videoId, playVideo, replaceVideo]);

  // This route is the "maximized" surface; restore mini-player on leave.
  React.useEffect(() => {
    maximize();
    return () => minimize();
  }, [maximize, minimize]);

  const focusNote = React.useCallback(() => {
    noteRef.current?.focus();
    noteRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  usePlayerShortcuts({
    onSeekBy: playerControls.seekBy,
    onFocusNote: focusNote,
    onAddAction: () => setActionOpen(true),
    onEscape: () => {
      if (usePlayerStore.getState().isScreenFreeMode)
        usePlayerStore.getState().toggleScreenFreeMode();
      else setActionOpen(false);
    },
  });

  if (!video) return null;

  // Intention gate
  if (showIntentionScreen) {
    return <IntentionScreen video={video} />;
  }

  // End-of-video gate
  if (videoEnded) {
    return (
      <VideoEndScreen
        video={video}
        onAddNote={() => {
          usePlayerStore.getState().clearEnded();
          setTimeout(focusNote, 50);
        }}
      />
    );
  }

  const thumb = video.thumbnail_url || buildThumbnailUrl(video.youtube_id);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Réduire le lecteur"
          onClick={() => router.push("/")}
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAudioMode}
          >
            {audioMode ? (
              <>
                <Eye className="h-4 w-4" />
                Afficher la vidéo
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Mode audio
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={markEnded}>
            Terminer
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-10 lg:flex-row lg:px-8">
        {/* Left: video + controls */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Stage — the global PlayerHost positions the iframe over this box. */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-card">
            <div id={PLAYER_STAGE_ID} className="absolute inset-0" />
            {audioMode ? (
              <div className="absolute inset-0 z-20">
                <Image
                  src={thumb}
                  alt={`Miniature : ${video.title}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur">
                    Mode audio
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Controls — desktop under the video */}
          <div className="hidden lg:block">
            <PlayerControls
              onSeekTo={playerControls.seekTo}
              onSeekBy={playerControls.seekBy}
              onSetRate={playerControls.setRate}
              singleVideoMode={singleVideoMode}
              onToggleSingleVideo={setSingleVideoMode}
            />
          </div>

          <p className="hidden text-xs text-text-tertiary lg:block">
            Raccourcis : Espace, ←→, N, A, M
          </p>
        </div>

        {/* Right: info, intention, notes, action */}
        <aside className="flex w-full flex-col gap-5 lg:max-w-[360px]">
          <div>
            <h1 className="text-base font-semibold text-text-primary">
              {video.title}
            </h1>
            <p className="text-sm text-text-secondary">{video.channel_name}</p>
          </div>

          {intention?.reason ? (
            <div className="rounded-lg border border-border-light bg-surface-secondary/50 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
                <Target className="h-3.5 w-3.5" />
                Ton intention
              </p>
              <p className="text-sm text-text-secondary">{intention.reason}</p>
            </div>
          ) : null}

          {/* Mobile controls live here, above notes */}
          <div className="lg:hidden">
            <PlayerControls
              compact
              onSeekTo={playerControls.seekTo}
              onSeekBy={playerControls.seekBy}
              onSetRate={playerControls.setRate}
              singleVideoMode={singleVideoMode}
              onToggleSingleVideo={setSingleVideoMode}
            />
          </div>

          <Separator />

          {/* Quick capture */}
          <NoteInput ref={noteRef} video={video} />

          {/* Existing notes for this video */}
          <NotesPanel video={video} onSeekTo={playerControls.seekTo} listOnly />

          <div className="flex flex-col gap-2">
            <h3 className="text-base font-medium text-text-primary">
              Actions rapides
            </h3>
            <Button variant="outline" onClick={() => setActionOpen(true)}>
              Créer une action depuis cette vidéo
            </Button>
          </div>
        </aside>
      </div>

      {/* Overlays */}
      {isScreenFreeMode ? (
        <ScreenFreeMode
          video={video}
          onSeekBy={playerControls.seekBy}
          onAddNote={() => {
            usePlayerStore.getState().toggleScreenFreeMode();
            focusNote();
          }}
          onAddAction={() => {
            usePlayerStore.getState().toggleScreenFreeMode();
            setActionOpen(true);
          }}
        />
      ) : null}

      <ReflectionPause onAddNote={focusNote} />
      <DailyLimitDialog />
      <NextActionDialog
        open={actionOpen}
        onOpenChange={setActionOpen}
        videoId={video.id}
        defaultVaultId={video.vault_id}
      />
    </div>
  );
}
