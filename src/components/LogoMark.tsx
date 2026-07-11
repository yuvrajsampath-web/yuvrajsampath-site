export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, transform: "rotate(-6deg)" }}
      className="flex shrink-0 items-center justify-center rounded-full bg-amber shadow-sm ring-[3px] ring-white"
    >
      <span
        style={{ fontSize: size * 0.42 }}
        className="font-display font-bold leading-none text-white"
      >
        YS
      </span>
    </span>
  );
}
