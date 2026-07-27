type ProductProofFrameProps = {
  alt?: string;
  caption?: string;
  desktopSrc?: string;
  mobileSrc?: string;
};

export function ProductProofFrame({
  alt = "An anonymised ScrimStats team workspace",
  caption = "Private by design. Workspace membership is controlled by your team, and team data is never displayed publicly.",
  desktopSrc,
  mobileSrc,
}: ProductProofFrameProps) {
  const hasCapture = Boolean(desktopSrc);

  return (
    <figure className="public-proof">
      <div className="public-proof-frame">
        <div
          className={`public-proof-placeholder${hasCapture ? " public-proof-placeholder--capture" : ""}`}
          role={hasCapture ? undefined : "img"}
          aria-label={hasCapture ? undefined : "A privacy-obscured preview of the ScrimStats team workspace"}
        >
          {hasCapture ? (
            <picture className="absolute inset-0 z-0 block">
              {mobileSrc && <source media="(max-width: 639px)" srcSet={mobileSrc} />}
              <img
                src={desktopSrc}
                alt={alt}
                width={1753}
                height={897}
                className="h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            </picture>
          ) : (
            <>
            <div className="public-proof-rail" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="public-proof-workspace" aria-hidden="true">
              <div className="public-proof-toolbar">
                <span className="w-28 sm:w-40" />
                <span className="w-16 sm:w-24" />
              </div>
              <div className="public-proof-canvas">
                <span className="col-span-2 h-20 sm:h-28" />
                <span className="h-28 sm:h-40" />
                <span className="h-28 sm:h-40" />
                <span className="col-span-2 h-12 sm:h-16" />
              </div>
            </div>
            </>
          )}
          <div className="public-proof-veil" aria-hidden="true" />
          <div className="public-proof-scan" aria-hidden="true" />
          <div className="public-proof-mark">
            <img src="/ScrimStats logo.png" alt="" className="h-8 w-auto sm:h-10" />
            <span className="ss-mono text-[13px] uppercase tracking-[0.13em] text-white/70">
              Private team workspace
            </span>
          </div>
        </div>
      </div>

      <figcaption className="mt-4 flex flex-col gap-2 text-sm leading-6 text-[var(--public-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>{caption}</span>
        <span className="ss-mono shrink-0 text-[13px] uppercase tracking-[0.12em] text-[var(--public-accent)]">
          ScrimStats workspace
        </span>
      </figcaption>
    </figure>
  );
}
