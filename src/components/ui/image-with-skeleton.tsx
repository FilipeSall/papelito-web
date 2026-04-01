"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Skeleton from "react-loading-skeleton";

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

type LoadingState = "loading" | "loaded" | "error";

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
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(
    src ? "loading" : "error",
  );

  const hasImage = typeof src === "string" && src.length > 0;
  const imageSrc = hasImage ? src : null;
  const showSkeleton = hasImage && loadingState === "loading";
  const showFallback = (!hasImage || loadingState === "error") && fallback;

  const syncLoadingStateFromImage = useCallback(() => {
    const imageElement = imageRef.current;

    if (!imageElement || !imageElement.complete) {
      return;
    }

    setLoadingState(imageElement.naturalWidth > 0 ? "loaded" : "error");
  }, []);

  const handleImageRef = useCallback(
    (imageElement: HTMLImageElement | null) => {
      imageRef.current = imageElement;

      if (!imageElement) {
        return;
      }

      if (!imageElement.complete) {
        setLoadingState("loading");
        return;
      }

      syncLoadingStateFromImage();
    },
    [syncLoadingStateFromImage],
  );

  useEffect(() => {
    if (!imageSrc) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      syncLoadingStateFromImage();
    });
    const handlePageShow = () => syncLoadingStateFromImage();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncLoadingStateFromImage();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [imageSrc, syncLoadingStateFromImage]);

  return (
    <div
      className={joinClasses(
        "relative h-full w-full overflow-hidden",
        containerClassName,
      )}
    >
      {showSkeleton && (
        <div aria-hidden className="absolute inset-0 leading-none">
          <Skeleton
            className="block! h-full w-full"
            containerClassName="block h-full w-full leading-none"
            borderRadius={0}
            baseColor="#E5E7EB"
            highlightColor="#F3F4F6"
          />
        </div>
      )}

      {showFallback ? <div className="absolute inset-0">{fallback}</div> : null}

      {imageSrc && loadingState !== "error" ? (
        <Image
          key={imageSrc}
          ref={handleImageRef}
          src={imageSrc}
          alt={alt}
          fill={fill}
          priority={priority}
          sizes={sizes}
          onLoad={() => setLoadingState("loaded")}
          onError={() => setLoadingState("error")}
          className={joinClasses(
            "transition-opacity duration-300",
            loadingState === "loaded" ? "opacity-100" : "opacity-0",
            imageClassName,
          )}
        />
      ) : null}
    </div>
  );
}
