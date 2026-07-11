import { ImageResponse } from "next/og";

export const size = { width: 128, height: 128 };
export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 116,
            height: 116,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "#c1652a",
            border: "6px solid #ffffff",
            transform: "rotate(-6deg)",
          }}
        >
          <span
            style={{
              fontSize: 54,
              fontWeight: 700,
              color: "#ffffff",
              fontFamily: "Georgia, serif",
              letterSpacing: -2,
            }}
          >
            YS
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
