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

  // 自動更新目前播放的歌曲
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

    const interval = setInterval(fetchNowPlaying, 3000);
    return () => clearInterval(interval);
  }, []);

  // 畫面顏色與文字顏色偵測
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

        // 根據亮度決定字體顏色
        const luminance = (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255;
        setTextColor(luminance > 0.7 ? "#000000" : "#ffffff");
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
        padding: "0.5rem",
      }}
    >
      <img
        ref={imgRef}
        src={track.album.images[0].url}
        alt="Album Cover"
        style={{
          width: "160px", // ⬅️ 小一點，水冷頭也看得清楚
          height: "160px",
          borderRadius: "12px",
          marginBottom: "20px",
          objectFit: "cover",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          animation: "spin 20s linear infinite", // 保留旋轉
          maxWidth: "80%",
          maxHeight: "80%",
        }}
      />
      <h1
        style={{
          fontSize: "20px",
          marginBottom: "6px",
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
          fontSize: "14px",
          opacity: 0.8,
          maxWidth: "90%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {track.artists.map((artist) => artist.name).join(", ")}
      </p>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
