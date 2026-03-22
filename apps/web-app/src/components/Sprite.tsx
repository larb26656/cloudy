import { useEffect, useState } from "react";

type Props = {
  src: string;
  frameWidth: number;
  frameHeight: number;
  cols: number;
  rows: number;
  fps?: number;
};

export function Sprite({
  src,
  frameWidth,
  frameHeight,
  cols,
  rows,
  fps = 10,
}: Props) {
  const [frame, setFrame] = useState(0);
  const totalFrames = cols * rows;

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % totalFrames);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [totalFrames, fps]);

  const col = frame % cols;
  const row = Math.floor(frame / cols);

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
      }}
    />
  );
}
