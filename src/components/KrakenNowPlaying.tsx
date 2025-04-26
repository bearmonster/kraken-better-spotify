import { useEffect, useRef, useState } from "react";
import { Session } from "next-auth";
import { CurrentlyPlaying } from "spotify-types";
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

  useEffect(() => {
    if (!nowPlaying?.item?.album?.images?.[0]?.url) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = nowPlaying.item.album.images[0].url;
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

  if (!nowPlaying || !nowPlaying.item) {
    return <div style={{ color: "white" }}>No music is currently playing</div>;
  }

  const { album, name, artists } = nowPlaying.item;

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
        src={album.images[0].url}
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
        {name}
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
        {artists.map((artist) => artist.name).join(", ")}
      </p>

      {/* 小螢幕時特別縮小 */}
      <style jsx>{`
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
