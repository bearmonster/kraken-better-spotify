import { useEffect, useRef, useState } from "react";
import { Session } from "next-auth";
import { CurrentlyPlaying, Track } from "spotify-types";
import ColorThief from "colorthief";

export default function KrakenNowPlaying({
  session,
  nowPlayingInitial,
  viewstate,
}: {
  session: Session | null;
  nowPlayingInitial: CurrentlyPlaying | null;
  viewstate: number;
}) {
  const [bgColor, setBgColor] = useState<string>("#000000");
  const [nowPlaying, setNowPlaying] = useState<CurrentlyPlaying | null>(nowPlayingInitial);
  const imgRef = useRef<HTMLImageElement>(null);

  // 自動偵測歌曲改變
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/now-playing");
        if (!res.ok) throw new Error("Failed to fetch now playing data");
        const data = await res.json();

        // 判斷是不是不同首歌才 setNowPlaying
        if (data?.item?.id !== nowPlaying?.item?.id) {
          setNowPlaying(data);
        }
      } catch (error) {
        console.error("Auto refresh error:", error);
      }
    }, 3000); // 3秒

    return () => clearInterval(interval);
  }, [nowPlaying]);

  // 抓封面顏色
  useEffect(() => {
    if (!nowPlaying?.item) return;
    if (nowPlaying.item.type !== "track") return;

    const track = nowPlaying.item as Track;
    if (!track.album?.images?.[0]?.url) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = track.album.images[0].url;
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const color = colorThief.getColor(img);
        setBgColor(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
      } catch (error) {
        console.error("ColorThief error:", error);
      }
    };
  }, [nowPlaying]);

  if (!nowPlaying?.item || nowPlaying.item.type !== "track") {
    return <div style={{ color: "white" }}>No music is currently playing</div>;
  }

  const track = nowPlaying.item as Track;

  return (
    <div
      style={{
        background: bgColor,
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontFamily: "'Poppins', sans-serif",
        textAlign: "center",
        transition: "background 0.5s ease",
        padding: "1rem",
      }}
    >
      <img
        ref={imgRef}
        src={track.album.images[0].url}
        alt="Album Cover"
        style={{
          width: "30vw",        // 小改：封面寬度是螢幕寬的30%
          height: "30vw",       // 高度一樣
          maxWidth: "300px",    // 但最多300px
          maxHeight: "300px",
          borderRadius: "16px",
          marginBottom: "24px",
          objectFit: "cover",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      />
      <h1
        style={{
          fontSize: "28px",
          marginBottom: "8px",
          maxWidth: "90%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {track.name}
      </h1>
      <p
        style={{
          fontSize: "18px",
          opacity: 0.8,
          maxWidth: "90%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {track.artists.map((artist) => artist.name).join(", ")}
      </p>

      {/* 手機版縮小 */}
      <style jsx>{`
        @media (max-width: 400px) {
          div {
            padding: 0.5rem;
          }
          img {
            width: 50vw;
            height: 50vw;
            max-width: 180px;
            max-height: 180px;
            margin-bottom: 12px;
            border-radius: 12px;
          }
          h1 {
            font-size: 20px;
            margin-bottom: 6px;
          }
          p {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
