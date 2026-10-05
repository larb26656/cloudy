import { useEffect, useState } from "react";

export type PetState = "idle" | "working" | "wait-for-human";

const petSprite = "/sprite/cloudy-pet/sprite-sheet.png";
const petFrameCount = 8;
const petStateRow: Record<PetState, number> = {
  idle: 0,
  working: 1,
  "wait-for-human": 2,
};
const petFrameDuration: Record<PetState, number> = {
  idle: 260,
  working: 140,
  "wait-for-human": 220,
};

export function PetSprite({ state }: { state: PetState }) {
  const [frame, setFrame] = useState(0);
  const row = petStateRow[state];

  useEffect(() => {
    setFrame(0);

    const interval = window.setInterval(
      () => setFrame((current) => (current + 1) % petFrameCount),
      petFrameDuration[state],
    );

    return () => window.clearInterval(interval);
  }, [state]);

  return (
    <span
      aria-hidden="true"
      data-pet-sprite
      data-frame={frame}
      data-pet-row={row}
      className="block size-full bg-no-repeat"
      style={{
        backgroundImage: `url(${petSprite})`,
        backgroundPosition: `${frame * (100 / (petFrameCount - 1))}% ${row * 50}%`,
        backgroundSize: "800% 300%",
      }}
    />
  );
}
