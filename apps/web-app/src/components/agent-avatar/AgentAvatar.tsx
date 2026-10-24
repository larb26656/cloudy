import { useId } from "react";
import type { SVGProps } from "react";
import {
  agentAvatarAmbientLayouts,
  agentAvatarFaceDecorationLayouts,
  agentAvatarFacewearLayouts,
  agentAvatarHeadwearLayouts,
} from "@/assets/agent-avatar/layers";

export const agentAvatarShapes = [
  "orb",
  "rounded-square",
  "triangle",
  "clover",
  "diamond",
  "star",
] as const;

export const agentAvatarEyes = [
  "awake",
  "happy",
  "focused",
  "angry",
  "sleepy",
  "squint",
  "target",
  "hearts",
] as const;

export const agentAvatarHeadwear = ["none", "sprout", "halo"] as const;

export const agentAvatarFacewear = [
  "none",
  "round-glasses",
  "sunglasses",
] as const;

export const agentAvatarFaceDecorations = [
  "none",
  "blush",
  "freckles",
] as const;

export const agentAvatarAmbient = ["none", "sparkles"] as const;

export const agentAvatarColors = {
  sky: "#3079fa",
  mint: "#22c55e",
  tangerine: "#f97316",
  violet: "#8257e6",
  rose: "#ec5c8d",
  gold: "#fbbf24",
  slate: "#64748b",
} as const;

export type AgentAvatarShape = (typeof agentAvatarShapes)[number];
export type AgentAvatarEyes = (typeof agentAvatarEyes)[number];
export type AgentAvatarHeadwear = (typeof agentAvatarHeadwear)[number];
export type AgentAvatarFacewear = (typeof agentAvatarFacewear)[number];
export type AgentAvatarFaceDecoration =
  (typeof agentAvatarFaceDecorations)[number];
export type AgentAvatarAmbient = (typeof agentAvatarAmbient)[number];
export type AgentAvatarColor = keyof typeof agentAvatarColors;

export type AgentAvatarRecipe = {
  shape: AgentAvatarShape;
  color: AgentAvatarColor;
  eyes: AgentAvatarEyes;
  headwear: AgentAvatarHeadwear;
  facewear: AgentAvatarFacewear;
  faceDecoration: AgentAvatarFaceDecoration;
  ambient: AgentAvatarAmbient;
};

export const defaultAgentAvatar: AgentAvatarRecipe = {
  shape: "orb",
  color: "sky",
  eyes: "awake",
  headwear: "none",
  facewear: "none",
  faceDecoration: "none",
  ambient: "none",
};

export type AgentAvatarProps = Omit<SVGProps<SVGSVGElement>, "color"> &
  Partial<AgentAvatarRecipe> & {
    title?: string;
  };

function AvatarShape({ shape }: { shape: AgentAvatarShape }) {
  switch (shape) {
    case "rounded-square":
      return <rect x="20" y="20" width="88" height="88" rx="26" />;
    case "triangle":
      return (
        <path d="M64 14c5 0 9 3 11 8l38 69c5 10-2 23-13 23H28c-11 0-18-13-13-23l38-69c2-5 6-8 11-8Z" />
      );
    case "clover":
      return (
        <path d="M64 35a22 22 0 1 1 20 29 22 22 0 1 1-20 29 22 22 0 1 1-20-29 22 22 0 1 1 20-29Z" />
      );
    case "diamond":
      return (
        <rect
          x="25"
          y="25"
          width="78"
          height="78"
          rx="17"
          transform="rotate(45 64 64)"
        />
      );
    case "star":
      return (
        <path d="M64 12c2 0 4 2 5 5l10 25 28 1c4 0 7 3 8 6s-1 6-4 8L89 76l7 28c1 4-1 7-4 9s-7 2-10-1L64 97l-18 15c-3 3-7 3-10 1s-5-5-4-9l7-28-22-19c-3-2-5-5-4-8s4-6 8-6l28-1 10-25c1-3 3-5 5-5Z" />
      );
    case "orb":
      return <circle cx="64" cy="64" r="47" />;
  }
}

function AvatarEyes({ eyes }: { eyes: AgentAvatarEyes }) {
  switch (eyes) {
    case "happy":
      return (
        <path
          d="M42 68c1-9 13-9 14 0M72 68c1-9 13-9 14 0"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeWidth="6"
        />
      );
    case "focused":
      return (
        <path
          d="M47 55v15M81 55v15"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeWidth="7"
        />
      );
    case "angry":
      return (
        <path
          d="m40 55 15 8M88 55 73 63"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeWidth="7"
        />
      );
    case "sleepy":
      return (
        <path
          d="M41 65h15M72 65h15"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeWidth="6"
        />
      );
    case "squint":
      return (
        <path
          d="m42 57 12 10M54 57 42 67M74 57l12 10M86 57 74 67"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeWidth="5"
        />
      );
    case "target":
      return (
        <>
          <circle
            cx="48"
            cy="62"
            r="9"
            fill="none"
            stroke="white"
            strokeWidth="5"
          />
          <circle
            cx="80"
            cy="62"
            r="9"
            fill="none"
            stroke="white"
            strokeWidth="5"
          />
          <circle cx="48" cy="62" r="2.5" fill="white" />
          <circle cx="80" cy="62" r="2.5" fill="white" />
        </>
      );
    case "hearts":
      return (
        <path
          d="M48 70 37 59c-5-6 4-14 11-8 7-6 16 2 11 8L48 70Zm32 0L69 59c-5-6 4-14 11-8 7-6 16 2 11 8L80 70Z"
          fill="white"
        />
      );
    case "awake":
      return (
        <>
          <rect x="42" y="51" width="12" height="24" rx="6" fill="white" />
          <rect x="74" y="51" width="12" height="24" rx="6" fill="white" />
        </>
      );
  }
}

function AvatarHeadwear({ headwear }: { headwear: AgentAvatarHeadwear }) {
  switch (headwear) {
    case "sprout":
      return (
        <>
          <path
            d="M64 27v15"
            fill="none"
            stroke="#16a34a"
            strokeLinecap="round"
            strokeWidth="5"
          />
          <path
            d="M62 29c-15 0-18-13-18-17 11 0 19 4 18 17Zm4 0c15 0 18-13 18-17-11 0-19 4-18 17Z"
            fill="#4ade80"
          />
        </>
      );
    case "halo":
      return (
        <ellipse
          cx="64"
          cy="19"
          rx="26"
          ry="7"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="5"
        />
      );
    case "none":
      return null;
  }
}

function AvatarFacewear({ facewear }: { facewear: AgentAvatarFacewear }) {
  switch (facewear) {
    case "round-glasses":
      return (
        <g fill="white" fillOpacity=".18" stroke="#162033" strokeWidth="5">
          <circle cx="46" cy="62" r="14" />
          <circle cx="82" cy="62" r="14" />
          <path d="M60 62h8" />
        </g>
      );
    case "sunglasses":
      return (
        <path
          d="M30 55h29l-5 17c-2 6-19 6-21 0l-3-17Zm39 0h29l-3 17c-2 6-19 6-21 0l-5-17ZM59 60h10"
          fill="#162033"
          stroke="#162033"
          strokeLinejoin="round"
          strokeWidth="4"
        />
      );
    case "none":
      return null;
  }
}

function AvatarFaceDecoration({
  faceDecoration,
}: {
  faceDecoration: AgentAvatarFaceDecoration;
}) {
  switch (faceDecoration) {
    case "blush":
      return (
        <g fill="#fb7185" fillOpacity=".72">
          <ellipse cx="39" cy="78" rx="11" ry="5" />
          <ellipse cx="89" cy="78" rx="11" ry="5" />
        </g>
      );
    case "freckles":
      return (
        <g fill="#9f1239" fillOpacity=".8">
          <circle cx="39" cy="76" r="2" />
          <circle cx="47" cy="79" r="2" />
          <circle cx="55" cy="76" r="2" />
          <circle cx="73" cy="76" r="2" />
          <circle cx="81" cy="79" r="2" />
          <circle cx="89" cy="76" r="2" />
        </g>
      );
    case "none":
      return null;
  }
}

function AvatarAmbient({ ambient }: { ambient: AgentAvatarAmbient }) {
  if (ambient === "none") return null;

  return (
    <path
      d="m25 40 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Zm79 22 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"
      fill="#fbbf24"
    />
  );
}

function getTransform({
  x,
  y,
  scale,
  rotate,
}: {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}) {
  return [
    `translate(${x} ${y})`,
    "translate(64 64)",
    `rotate(${rotate})`,
    `scale(${scale})`,
    "translate(-64 -64)",
  ].join(" ");
}

type AgentAvatarLayerPreviewProps = Omit<SVGProps<SVGSVGElement>, "color">;

export function AgentAvatarEyesPreview({
  eyes,
  style,
  ...props
}: { eyes: AgentAvatarEyes } & AgentAvatarLayerPreviewProps) {
  return (
    <svg
      viewBox="30 45 68 35"
      aria-hidden="true"
      focusable="false"
      style={{ filter: "invert(1)", ...style }}
      {...props}
    >
      <AvatarEyes eyes={eyes} />
    </svg>
  );
}

export function AgentAvatarHeadwearPreview({
  headwear,
  ...props
}: { headwear: AgentAvatarHeadwear } & AgentAvatarLayerPreviewProps) {
  return (
    <svg viewBox="16 0 96 64" aria-hidden="true" focusable="false" {...props}>
      <g transform={getTransform(agentAvatarHeadwearLayouts[headwear])}>
        <AvatarHeadwear headwear={headwear} />
      </g>
    </svg>
  );
}

export function AgentAvatarFacewearPreview({
  facewear,
  ...props
}: { facewear: AgentAvatarFacewear } & AgentAvatarLayerPreviewProps) {
  return (
    <svg viewBox="20 45 88 36" aria-hidden="true" focusable="false" {...props}>
      <g transform={getTransform(agentAvatarFacewearLayouts[facewear])}>
        <AvatarFacewear facewear={facewear} />
      </g>
    </svg>
  );
}

export function AgentAvatarFaceDecorationPreview({
  faceDecoration,
  ...props
}: {
  faceDecoration: AgentAvatarFaceDecoration;
} & AgentAvatarLayerPreviewProps) {
  return (
    <svg viewBox="20 65 88 28" aria-hidden="true" focusable="false" {...props}>
      <g
        transform={getTransform(
          agentAvatarFaceDecorationLayouts[faceDecoration],
        )}
      >
        <AvatarFaceDecoration faceDecoration={faceDecoration} />
      </g>
    </svg>
  );
}

export function AgentAvatarAmbientPreview({
  ambient,
  ...props
}: { ambient: AgentAvatarAmbient } & AgentAvatarLayerPreviewProps) {
  return (
    <svg viewBox="10 30 108 52" aria-hidden="true" focusable="false" {...props}>
      <g transform={getTransform(agentAvatarAmbientLayouts[ambient])}>
        <AvatarAmbient ambient={ambient} />
      </g>
    </svg>
  );
}

export function AgentAvatar({
  shape = defaultAgentAvatar.shape,
  color = defaultAgentAvatar.color,
  eyes = defaultAgentAvatar.eyes,
  headwear = defaultAgentAvatar.headwear,
  facewear = defaultAgentAvatar.facewear,
  faceDecoration = defaultAgentAvatar.faceDecoration,
  ambient = defaultAgentAvatar.ambient,
  title,
  ...props
}: AgentAvatarProps) {
  const gradientId = useId();
  const label = title ?? "Agent avatar";
  const headwearTransform = getTransform(agentAvatarHeadwearLayouts[headwear]);
  const facewearTransform = getTransform(agentAvatarFacewearLayouts[facewear]);
  const faceDecorationTransform = getTransform(
    agentAvatarFaceDecorationLayouts[faceDecoration],
  );
  const ambientTransform = getTransform(agentAvatarAmbientLayouts[ambient]);

  return (
    <svg viewBox="0 0 128 128" role="img" aria-label={label} {...props}>
      <defs>
        <linearGradient
          id={gradientId}
          x1="28"
          y1="22"
          x2="102"
          y2="112"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={agentAvatarColors[color]} />
          <stop
            offset="1"
            stopColor={agentAvatarColors[color]}
            stopOpacity=".72"
          />
        </linearGradient>
      </defs>
      <g fill={`url(#${gradientId})`}>
        <AvatarShape shape={shape} />
      </g>
      <AvatarEyes eyes={eyes} />
      <g transform={headwearTransform}>
        <AvatarHeadwear headwear={headwear} />
      </g>
      <g transform={facewearTransform}>
        <AvatarFacewear facewear={facewear} />
      </g>
      <g transform={faceDecorationTransform}>
        <AvatarFaceDecoration faceDecoration={faceDecoration} />
      </g>
      <g transform={ambientTransform}>
        <AvatarAmbient ambient={ambient} />
      </g>
    </svg>
  );
}
