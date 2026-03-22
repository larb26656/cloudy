import { useEffect, useMemo, useState } from "react";

type Props = {
  src: string;
  frameWidth: number;
  frameHeight: number;
  cols: number;
  rows: number;
  fps?: number;

  // optional
  totalFramesOverride?: number; // จำกัดจำนวน frame เช่น 5
  frames?: number[]; // sequence เช่น [0,1,2,1]
  currentFrame?: number; // control จากภายนอก
  loop?: boolean; // default true
};

export function Sprite({
  src,
  frameWidth,
  frameHeight,
  cols,
  rows,
  fps = 10,
  totalFramesOverride,
  frames,
  currentFrame,
  loop = true,
}: Props) {
  const defaultTotal = cols * rows;
  const totalFrames = totalFramesOverride ?? defaultTotal;

  // generate default sequence ถ้าไม่ได้ส่ง frames มา
  const sequence = useMemo(() => {
    if (frames && frames.length > 0) return frames;
    return Array.from({ length: totalFrames }, (_, i) => i);
  }, [frames, totalFrames]);

  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (currentFrame !== undefined) return; // ถ้ามี external control ไม่ต้อง auto

    let i = 0;

    const interval = setInterval(() => {
      setFrameIndex(() => {
        const next = i + 1;

        if (!loop && next >= sequence.length) {
          return sequence.length - 1;
        }

        i = next % sequence.length;
        return i;
      });
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [sequence, fps, currentFrame, loop]);

  const actualFrame =
    currentFrame !== undefined ? currentFrame : sequence[frameIndex];

  const col = actualFrame % cols;
  const row = Math.floor(actualFrame / cols);

  const x = -col * frameWidth;
  const y = -row * frameHeight;

  return (
    <div
      style={{
        width: frameWidth,
        height: frameHeight,
        backgroundImage: `url(${src})`,
        backgroundPosition: `${x}px ${y}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated", // optional: สำหรับ pixel art
      }}
    />
  );
}
