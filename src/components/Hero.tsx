import { BirdNav } from "./BirdNav";

const GRAIN =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
  ).toString("base64");

export function Hero() {
  return (
    <header
      className="relative flex flex-col justify-between overflow-hidden px-6 pt-16 pb-10 sm:pt-24 sm:pb-14 text-[#fdf3e4]"
      style={{
        backgroundImage:
          "radial-gradient(120% 70% at 50% -10%, #fbe3bd 0%, transparent 55%), linear-gradient(180deg, var(--sky-top) 0%, var(--sky-mid) 42%, var(--sky-deep) 78%, #0d0705 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{ backgroundImage: `url(${GRAIN})` }}
      />

      <div className="relative mx-auto w-full max-w-3xl text-center">
        <p className="font-body text-xs sm:text-sm tracking-[0.25em] uppercase text-[#fdf3e4]/70">
          Entrepreneur · Sustainability Advocate · Bilingual Author
        </p>
        <h1 className="mt-5 font-tamil-display text-6xl sm:text-8xl leading-[1.05] text-balance drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)]">
          யுவராஜ் சம்பத்
        </h1>
        <p className="mt-4 font-display italic text-lg sm:text-xl text-[#fdf3e4]/85">
          Yuvraj Sampath
        </p>
      </div>

      <div className="relative mx-auto mt-14 sm:mt-20 w-full max-w-3xl">
        <BirdNav />
      </div>
    </header>
  );
}
