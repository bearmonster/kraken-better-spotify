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
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [nowPlaying, setNowPlaying] = useState<CurrentlyPlaying | null>(nowPlayingInitial);
  const imgRef = useRef<HTMLImageElement>(null);

  // 🔥 每3秒抓一次最新歌曲
  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch("/api/now-playing");
        const data = await res.json();
        if (data && data.item) {
          setNowPlaying(data);
        }
      } catch (error) {
        console.error("Error fetching now playing:", error);
      }
    };

    const interval = setInterval(() => {
      fetchNowPlaying();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 🎨 封面色彩分析 + 字色判斷
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

        // 判斷明亮度
        const luminance = (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255;
        if (luminance > 0.7) {
          setTextColor("#000000"); // 背景太亮 → 黑字
        } else {
          setTextColor("#ffffff"); // 背景偏暗 → 白字
        }
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
        color: textColor,
        fontFamily: "'Poppins', sans-serif",
        textAlign: "center",
        transition: "background 0.5s ease, color 0.5s ease",
        padding: "1rem",
      }}
    >
      <img
        ref={imgRef}
        src={track.album.images[0].url}
        alt="Album Cover"
        style={{
          width: "250px",
          height: "250px",
          borderRadius: "16px",
          marginBottom: "24px",
          objectFit: "cover",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          maxWidth: "90%",
          maxHeight: "90%",
          animation: "spin 15s linear infinite", // 🌟 加旋轉動畫
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

      {/* 🎨 手機版適配 + 旋轉動畫CSS */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 400px) {
          div {
            padding: 0.5rem;
          }
          img {
            width: 180px;
            height: 180px;
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

