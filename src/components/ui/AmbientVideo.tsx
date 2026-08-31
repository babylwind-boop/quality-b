'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Absolute-fill ambient background video (decorative). Autoplays muted and
 * looping; under prefers-reduced-motion it is paused and the poster frame is
 * restored instead.
 */
export function AmbientVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (reduce) {
      // Drop the autoplay attribute first so load() can't restart playback.
      video.removeAttribute('autoplay');
      video.pause();
      // If a few frames already played, reload so the poster shows again.
      if (video.currentTime > 0) video.load();
    } else {
      video.play().catch(() => {
        // Autoplay blocked — the poster stays visible, which is fine.
      });
    }
  }, [reduce]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      aria-hidden
      className={cn('absolute inset-0 size-full object-cover', className)}
    />
  );
}
