// components/KrakenNowPlaying.tsx
import { Session } from "next-auth";
import { useRef, useState, useEffect } from "react";
import { CurrentlyPlaying, Episode, Track as TrackType } from "spotify-types";
import Track from "@/components/Track";
import Podcast from "@/components/Podcast";
import { averageColor, isPodcast, isTrack } from "@/lib/utils";
import { css } from "@emotion/css";

const stylesFn = (backgroundColor: string) => ({
  background: css`
    position: absolute;
    inset: 0;
    z-index: inherit;
    background-color: ${backgroundColor};
    background-size: cover;
    background-position: center center;
    filter: blur(20px);
    transform: scale(1.2);
  `,
  message: css`
    color: white;
    font-size: 2rem;
    text-align: center;
    padding: 0 10vw;
  `,
  spotifyLogo: css`
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    width: 6em;
    opacity: 0.6;
  `,
});

const getNowPlaying = async (): Promise<CurrentlyPlaying> => {
  try {
    const res = await fetch("/api/playing", { cache: "no-store" });
    const json = await res.json();
    return { ...json, status: res.status };
  } catch {
    throw new Error("Unable to retrieve album art");
  }
};

const KrakenNowPlaying: React.FC<{
  nowPlayingInitial: CurrentlyPlaying | null;
  session: Session | null;
  viewstate: number;
}> = ({ nowPlayingInitial, session, viewstate }) => {
  const [nowPlaying, setNowPlaying] = useState<TrackType | Episode | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>("black");
  const [showMessage, setShowMessage] = useState<string>("");
  const imageRef = useRef<HTMLImageElement>(null);
  const styles = stylesFn(backgroundColor);

  const updateNowPlaying = async () => {
    try {
      if (session) {
        const nowPlaying = await getNowPlaying();
        if (nowPlaying.item) {
          setNowPlaying(nowPlaying.item);
          setShowMessage("");
        } else {
          setNowPlaying(null);
          setShowMessage("請開始播放音樂來啟動視覺化效果！");
        }
      } else {
        setNowPlaying(null);
        setShowMessage("請登入 Spotify 後開始使用！");
      }
    } catch {
      setShowMessage("無法取得音樂資訊！");
    }
  };

  useEffect(() => {
    if (nowPlayingInitial?.item) {
      setNowPlaying(nowPlayingInitial.item);
    } else {
      setShowMessage("請開始播放音樂來啟動視覺化效果！");
    }
  }, [nowPlayingInitial]);

  useEffect(() => {
    const interval = setInterval(updateNowPlaying, 5000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (imageRef.current) {
      averageColor(imageRef.current, 1)
        .then(setBackgroundColor)
        .catch(console.error);
    }
  }, [nowPlaying]);

  return (
    <>
      {nowPlaying && isTrack(nowPlaying) && (
        <Track nowPlaying={nowPlaying} imageRef={imageRef} viewstate={viewstate} />
      )}
      {nowPlaying && isPodcast(nowPlaying) && (
        <Podcast nowPlaying={nowPlaying} imageRef={imageRef} viewstate={viewstate} />
      )}
      {nowPlaying && <div className={styles.background} />}
      {!nowPlaying && showMessage && (
        <p className={styles.message}>{showMessage}</p>
      )}
      <img
        className={styles.spotifyLogo}
        src="/spotify-small.png"
        alt="Spotify Logo"
      />
    </>
  );
};

export default KrakenNowPlaying;

