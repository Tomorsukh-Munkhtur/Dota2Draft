"use client";

import { useEffect, useRef, useState } from "react";

/** Skill-ийн зураг; Valve-д зураг байхгүй (ж: төрөлхийн skill) бол эхний үсгийг харуулна. */
export default function AbilityIcon({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Зураг hydration-аас өмнө алдаа өгсөн бол onError дуудагдахгүй тул ачаалагдсаны дараа шалгана.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  if (failed)
    return (
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded bg-panel-2 text-xl font-bold text-muted">
        {name.charAt(0)}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={name}
      width={56}
      height={56}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-14 w-14 shrink-0 rounded"
    />
  );
}
