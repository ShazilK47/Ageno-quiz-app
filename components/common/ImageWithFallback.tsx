"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface ImageWithFallbackProps extends Omit<ImageProps, "src" | "onError"> {
  src: string;
  fallbackSrc: string;
  alt: string;
}

/**
 * A wrapper around Next.js Image component that provides fallback handling
 * and optimized loading for a better user experience
 */
export default function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setLoading(true);
    setError(false);
  }, [src]);

  return (
    <div className="relative">
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse"
          style={{ zIndex: 0 }}
        />
      )}

      <Image
        {...props}
        src={imgSrc}
        alt={alt}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setImgSrc(fallbackSrc);
        }}
        style={{
          ...props.style,
          opacity: loading ? 0.5 : 1,
          transition: "opacity 0.2s ease-in-out",
        }}
        sizes={
          props.sizes ||
          "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        }
        priority={props.priority || false}
        quality={props.quality || 75}
      />
    </div>
  );
}
