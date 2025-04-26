import { useRef, useState, useEffect } from "react";
import { Session } from "next-auth";
import { CurrentlyPlaying, Track as TrackType } from "spotify-types";
import { css } from "@emotion/css";
import ColorThief from "colorthief";

const stylesFn = (backgroundColor: string) => ({
  background: css`
    position: absolute;
    inset: 0;
    background-color: ${backgroundColor};
    background-size: cover;
    background-position: center center;
    filter: blur(20px);
    transform: scale(1.2);
  `,
  content: css`
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: white;
    text-align: center;
  `,
  albumImage: css`
    width: 200px;
    height: 200px;
    border-radius: 16px;
    margin-bottom: 20px;
    object-fit: cover;
  `,
  songTitle: css`
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
  `,
  artist: css`
    font-size: 18px;
    opacity: 0.8;
  `
});

const KrakenNowPlaying = ({
  nowPlayingInitial,
  session,
  viewstate,
}: {
  nowPlayingInitial: CurrentlyPlaying | null;
  session: Session | null;
  viewstate: number;
}) => {
  const [nowPlaying, setNowPlaying] = useState<TrackType | null>(
    nowPlayingInitial?.item?.type === "track" ? (nowPlayingInitial.item as TrackType) : null
  );
  const [backgroundColor, setBackgroundColor] = useState<string>("black");
  const imgRef = useRef<HTMLImageElement>(null);
  const styles = stylesFn(backgroundColor);

  const fetchNowPlaying = async () => {
    try {
      const res = await fetch("/api/playing");
      const data = await res.json();
      if (data.item?.type === "track") {
        setNowPlaying(data.item);
      } else {
        setNowPlaying(null);
      }
    } catch (err) {
      console.error("Failed to fetch now playing:", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNowPlaying();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const color = colorThief.getColor(img);
        setBackgroundColor(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
      } catch (err) {
        console.error("ColorThief error:", err);
      }
    };
  }, [nowPlaying]);

  if (!nowPlaying) {
    return (
      <div className={styles.content}>
        <p>No music is currently playing</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.background} />
      <div className={styles.content}>
        <img
          ref={imgRef}
          src={nowPlaying.album.images[0].url}
          alt="Album Cover"
          className={styles.albumImage}
        />
        <div className={styles.songTitle}>{nowPlaying.name}</div>
        <div className={styles.artist}>
          {nowPlaying.artists.map((artist) => artist.name).join(", ")}
        </div>
      </div>
    </>
  );
};

export default KrakenNowPlaying;

