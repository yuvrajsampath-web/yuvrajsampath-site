import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Yuvraj Sampath — Entrepreneur, Sustainability Environmentalist, Bilingual Author";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage:
            "radial-gradient(120% 70% at 50% -10%, #fbe3bd 0%, transparent 55%), linear-gradient(180deg, #f4c88b 0%, #db7a3c 42%, #2a1410 78%, #0d0705 100%)",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 500,
            fontStyle: "italic",
            color: "#fdf3e4",
            fontFamily: "Georgia, serif",
          }}
        >
          Yuvraj Sampath
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "rgba(253,243,228,0.75)",
            fontFamily: "Georgia, serif",
          }}
        >
          Entrepreneur · Sustainability Environmentalist · Bilingual Author
        </div>
      </div>
    ),
    { ...size }
  );
}
