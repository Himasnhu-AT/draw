"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

export default function Home() {
  const [height, setHeight] = useState("100vh");

  useEffect(() => {
    // Update height on resize
    const updateHeight = () => {
      setHeight(`${window.innerHeight}px`);
    };

    // Set initial height
    updateHeight();

    // Add resize listener
    window.addEventListener("resize", updateHeight);

    // Clean up
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <>
      <div style={{ height }}>
        <Excalidraw />
      </div>
    </>
  );
}
