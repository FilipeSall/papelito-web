"use client";

import dynamic from "next/dynamic";

export const CountdownTimerNoSSR = dynamic(
  () => import("./countdown-timer").then((mod) => mod.CountdownTimer),
  { ssr: false },
);
