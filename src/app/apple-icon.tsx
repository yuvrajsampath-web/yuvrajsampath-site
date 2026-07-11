import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c1652a",
        }}
      >
        <span
          style={{
            fontSize: 74,
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: "Georgia, serif",
            letterSpacing: -2,
          }}
        >
          YS
        </span>
      </div>
    ),
    { ...size }
  );
}
