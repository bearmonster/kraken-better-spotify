import { Session } from "next-auth";
import { useEffect, useRef, useState } from "react";
import { CurrentlyPlaying, Track as TrackType } from "spotify-types";
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
  const [nowPlaying, setNowPlaying] = useState<TrackType | null>(
    nowPlayingInitial?.item?.type === "track" ? nowPlayingInitial.item : null
  );
  const [bgColor, setBgColor] = useState("#000000");
  const imgRef = useRef<HTMLImageElement>(null);

  // 定時更新歌曲
  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch("/api/playing", { cache: "no-store" });
        const data = await res.json();
        if (data.item?.type === "track") {
          if (!nowPlaying || nowPlaying.id !== data.item.id) {
            setNowPlaying(data.item);
          }
        } else {
          setNowPlaying(null);
        }
      } catch (error) {
        console.error("Failed to fetch now playing:", error);
      }
    };

    const interval = setInterval(fetchNowPlaying, 3000); // 每3秒抓一次
    return () => clearInterval(interval);
  }, [nowPlaying]);

  // 更新背景顏色
  useEffect(() => {
    if (!nowPlaying?.album?.images?.[0]?.url || !imgRef.current) return;

    const img = imgRef.current;
    img.crossOrigin = "anonymous";
    img.src = nowPlaying.album.images[0].url;
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const color = colorThief.getColor(img);
        const brightness = (color[0] * 299 + color[1] * 587 + color[2] * 114) / 1000;
        const isLight = brightness > 140;
        setBgColor(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        document.body.style.color = isLight ? "black" : "white"; // 根據亮度換字色
      } catch (err) {
        console.error("ColorThief error:", err);
      }
    };
  }, [nowPlaying?.id]);

  if (!nowPlaying) {
    return (
      <div
        style={{
          background: "#000",
          color: "#fff",
          height: "100vh",
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "20px",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        No music playing
      </div>
    );
  }

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
        fontFamily: "'Poppins', sans-serif",
        textAlign: "center",
        transition: "background 0.5s ease",
        overflow: "hidden",
        padding: "1rem",
      }}
    >
      <img
        ref={imgRef}
        src={nowPlaying.album.images[0].url}
        alt="Album Cover"
        style={{
          width: "180px",
          height: "180px",
          borderRadius: "16px",
          marginBottom: "20px",
          objectFit: "cover",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          animation: "spin 10s linear infinite",
        }}
      />
      <h1
        style={{
          fontSize: "24px",
          marginBottom: "8px",
          maxWidth: "90%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {nowPlaying.name}
      </h1>
      <p
        style={{
          fontSize: "16px",
          opacity: 0.8,
          maxWidth: "90%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {nowPlaying.artists.map((artist) => artist.name).join(", ")}
      </p>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 400px) {
          img {
            width: 140px;
            height: 140px;
            margin-bottom: 12px;
          }
          h1 {
            font-size: 20px;
          }
          p {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

