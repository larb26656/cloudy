import { Controller, useForm, useWatch } from "react-hook-form";
import { RotateCcw } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import {
  AgentAvatar,
  AgentAvatarAmbientPreview,
  AgentAvatarEyesPreview,
  AgentAvatarFaceDecorationPreview,
  AgentAvatarFacewearPreview,
  AgentAvatarHeadwearPreview,
  agentAvatarAmbient,
  agentAvatarColors,
  agentAvatarFaceDecorations,
  agentAvatarFacewear,
  agentAvatarHeadwear,
  agentAvatarEyes,
  agentAvatarShapes,
  defaultAgentAvatar,
} from "./AgentAvatar";
import type { AgentAvatarRecipe } from "./AgentAvatar";

export type AgentAvatarBuilderProps = {
  className?: string;
  defaultValues?: Partial<AgentAvatarRecipe>;
  onSubmit?: (recipe: AgentAvatarRecipe) => void;
  submitLabel?: string;
};

type AvatarOptionTileProps = {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  selected: boolean;
};

function AvatarOptionTile({
  children,
  label,
  onClick,
  selected,
}: AvatarOptionTileProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border bg-background p-2 text-xs font-medium capitalize transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected
          ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
          : "border-border text-muted-foreground",
      )}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function ColorSwatch({
  color,
  label,
  onClick,
  selected,
}: {
  color: string;
  label: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "size-10 rounded-full border border-black/10 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        selected && "ring-2 ring-primary ring-offset-2",
      )}
      style={{ backgroundColor: color }}
    />
  );
}

function BuilderSection({
  title,
  children,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function optionLabel(value: string) {
  if (value === "none") return "None";
  return value.replaceAll("-", " ");
}

export function AgentAvatarBuilder({
  className,
  defaultValues,
  onSubmit,
  submitLabel = "Save avatar",
}: AgentAvatarBuilderProps) {
  const initialRecipe = { ...defaultAgentAvatar, ...defaultValues };
  const { control, handleSubmit, reset } = useForm<AgentAvatarRecipe>({
    defaultValues: initialRecipe,
  });
  const recipe = useWatch({ control }) as AgentAvatarRecipe;

  return (
    <form
      className={cn(
        "flex h-[calc(100dvh-2rem)] max-h-[44rem] max-w-5xl flex-col overflow-hidden rounded-xl border bg-card md:grid md:grid-cols-[minmax(0,1fr)_16rem]",
        className,
      )}
      onSubmit={handleSubmit((values) => onSubmit?.(values))}
    >
      <aside className="order-1 flex shrink-0 flex-col gap-5 border-b bg-muted/40 p-5 md:col-start-2 md:row-start-1 md:order-2 md:border-b-0 md:border-l">
        <div className="grid h-40 place-items-center overflow-hidden rounded-lg border bg-background p-4 md:h-52">
          <AgentAvatar
            {...recipe}
            width={144}
            height={144}
            className="block shrink-0 md:[width:10rem] md:[height:10rem]"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => reset(initialRecipe)}
          >
            <RotateCcw />
            Reset
          </Button>
          <Button type="submit" size="sm" className="flex-1">
            {submitLabel}
          </Button>
        </div>
      </aside>

      <div className="order-2 min-h-0 flex-1 space-y-7 overflow-y-auto p-5 md:col-start-1 md:row-start-1 md:order-1 md:p-6">
        <BuilderSection title="Shape">
          <Controller
            name="shape"
            control={control}
            render={({ field }) => (
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
              >
                {agentAvatarShapes.map((shape) => (
                  <AvatarOptionTile
                    key={shape}
                    label={optionLabel(shape)}
                    selected={field.value === shape}
                    onClick={() => field.onChange(shape)}
                  >
                    <AgentAvatar
                      shape={shape}
                      color={recipe.color}
                      className="size-11"
                    />
                  </AvatarOptionTile>
                ))}
              </div>
            )}
          />
        </BuilderSection>

        <BuilderSection title="Color">
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-3">
                {Object.entries(agentAvatarColors).map(([color, hex]) => (
                  <ColorSwatch
                    key={color}
                    label={color}
                    selected={field.value === color}
                    onClick={() => field.onChange(color)}
                    color={hex}
                  />
                ))}
              </div>
            )}
          />
        </BuilderSection>

        <BuilderSection title="Eyes">
          <Controller
            name="eyes"
            control={control}
            render={({ field }) => (
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
              >
                {agentAvatarEyes.map((eyes) => (
                  <AvatarOptionTile
                    key={eyes}
                    label={optionLabel(eyes)}
                    selected={field.value === eyes}
                    onClick={() => field.onChange(eyes)}
                  >
                    <AgentAvatarEyesPreview eyes={eyes} className="size-11" />
                  </AvatarOptionTile>
                ))}
              </div>
            )}
          />
        </BuilderSection>

        <BuilderSection title="Headwear">
          <Controller
            name="headwear"
            control={control}
            render={({ field }) => (
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
              >
                {agentAvatarHeadwear.map((headwear) => (
                  <AvatarOptionTile
                    key={headwear}
                    label={optionLabel(headwear)}
                    selected={field.value === headwear}
                    onClick={() => field.onChange(headwear)}
                  >
                    {headwear === "none" ? (
                      <span className="text-xl leading-none">—</span>
                    ) : (
                      <AgentAvatarHeadwearPreview
                        headwear={headwear}
                        className="size-11"
                      />
                    )}
                  </AvatarOptionTile>
                ))}
              </div>
            )}
          />
        </BuilderSection>

        <BuilderSection title="Facewear">
          <Controller
            name="facewear"
            control={control}
            render={({ field }) => (
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
              >
                {agentAvatarFacewear.map((facewear) => (
                  <AvatarOptionTile
                    key={facewear}
                    label={optionLabel(facewear)}
                    selected={field.value === facewear}
                    onClick={() => field.onChange(facewear)}
                  >
                    {facewear === "none" ? (
                      <span className="text-xl leading-none">—</span>
                    ) : (
                      <AgentAvatarFacewearPreview
                        facewear={facewear}
                        className="size-11"
                      />
                    )}
                  </AvatarOptionTile>
                ))}
              </div>
            )}
          />
        </BuilderSection>

        <BuilderSection title="Face decoration">
          <Controller
            name="faceDecoration"
            control={control}
            render={({ field }) => (
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
              >
                {agentAvatarFaceDecorations.map((faceDecoration) => (
                  <AvatarOptionTile
                    key={faceDecoration}
                    label={optionLabel(faceDecoration)}
                    selected={field.value === faceDecoration}
                    onClick={() => field.onChange(faceDecoration)}
                  >
                    {faceDecoration === "none" ? (
                      <span className="text-xl leading-none">—</span>
                    ) : (
                      <AgentAvatarFaceDecorationPreview
                        faceDecoration={faceDecoration}
                        className="size-11"
                      />
                    )}
                  </AvatarOptionTile>
                ))}
              </div>
            )}
          />
        </BuilderSection>

        <BuilderSection title="Ambient">
          <Controller
            name="ambient"
            control={control}
            render={({ field }) => (
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
              >
                {agentAvatarAmbient.map((ambient) => (
                  <AvatarOptionTile
                    key={ambient}
                    label={optionLabel(ambient)}
                    selected={field.value === ambient}
                    onClick={() => field.onChange(ambient)}
                  >
                    {ambient === "none" ? (
                      <span className="text-xl leading-none">—</span>
                    ) : (
                      <AgentAvatarAmbientPreview
                        ambient={ambient}
                        className="size-11"
                      />
                    )}
                  </AvatarOptionTile>
                ))}
              </div>
            )}
          />
        </BuilderSection>
      </div>
    </form>
  );
}
