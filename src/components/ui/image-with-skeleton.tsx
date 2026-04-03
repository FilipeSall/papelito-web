"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

interface ImageWithSkeletonProps {
  src?: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  imageClassName?: string;
  containerClassName?: string;
  fallback?: ReactNode;
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ImageWithSkeleton({
  src,
  alt,
  sizes,
  priority = false,
  fill = true,
  imageClassName,
  containerClassName,
  fallback,
}: ImageWithSkeletonProps) {
  const hasImage = typeof src === "string" && src.length > 0;
  const imageSrc = hasImage ? src : null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = !!imageSrc && failedSrc === imageSrc;
  const showFallback = (!hasImage || hasError) && fallback;

  return (
    <div className={joinClasses("relative h-full w-full overflow-hidden", containerClassName)}>
      {showFallback ? <div className="absolute inset-0">{fallback}</div> : null}

      {imageSrc && !hasError ? (
        <Image
          key={imageSrc}
          src={imageSrc}
          alt={alt}
          fill={fill}
          priority={priority}
          sizes={sizes}
          onError={() => setFailedSrc(imageSrc)}
          className={imageClassName}
        />
      ) : null}
    </div>
  );
}
