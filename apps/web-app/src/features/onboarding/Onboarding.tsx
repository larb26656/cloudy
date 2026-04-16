import { useState, useCallback, memo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ColorPicker } from "@/components/ui/color-picker/ColorPicker";
import { DirectoryCombobox } from "@/components/workspace/DirectoryCombobox";
import { useInstanceStore, type Instance } from "@/stores/instanceStore";
import { registerInstance } from "@/stores/instance/instanceScopeHook";
import { WORKSPACE_COLORS, type WorkspaceColor } from "@/stores/workspaceStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { cn } from "@/lib/utils";

type OnboardingProps = {
  onComplete?: (instance: Instance) => void;
};

type Step = "welcome" | "instance" | "workspace";

const STEPS: Step[] = ["welcome", "instance", "workspace"];

const instanceSchema = z.object({
  name: z.string().min(1, "Please enter an instance name"),
  endpoint: z.string().min(1, "Please enter an endpoint"),
});

const workspaceSchema = z.object({
  name: z.string().min(1, "Please enter a workspace name"),
  directory: z.string().min(1, "Please enter a directory path"),
  color: z.enum(WORKSPACE_COLORS as unknown as [string, ...string[]]),
});

type InstanceFormData = z.infer<typeof instanceSchema>;
type WorkspaceFormData = z.infer<typeof workspaceSchema>;

const StepIndicator = memo(function StepIndicator({
  current,
}: {
  current: Step;
}) {
  const currentIndex = STEPS.indexOf(current);

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, index) => (
        <div
          key={step}
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            index <= currentIndex ? "bg-foreground" : "bg-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
});

const WelcomeStep = memo(function WelcomeStep() {
  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <img
        src="/onboard/greeting.png"
        alt="Welcome"
        className="w-[150px] h-[150px] mb-6 rounded-2xl bg-muted object-cover"
      />
      <h2 className="text-3xl font-semibold text-center">Welcome to Cloudy</h2>
      <p className="text-base mt-2 text-center text-muted-foreground">
        Your AI agent sidekick for chat, ideas, memories, and artifacts.
      </p>
      <div className="flex flex-col items-center gap-4 mt-6 w-full">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-foreground">✨</span>
            <span>Organize conversations by workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground">🧠</span>
            <span>Persistent memories across sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground">🎨</span>
            <span>Rich artifacts and code sharing</span>
          </div>
        </div>
      </div>
    </div>
  );
});

const InstanceStep = memo(function InstanceStep({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<InstanceFormData>>;
  onSubmit: (data: InstanceFormData) => void;
}) {
  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <img
        src="onboard/connect-server.png"
        alt="Instance"
        className="w-[150px] h-[150px] mb-6 rounded-2xl bg-muted object-cover"
      />
      <h2 className="text-2xl font-semibold text-center">
        Connect to OpenCode
      </h2>
      <p className="text-sm mt-2 text-center text-muted-foreground">
        First, connect to your OpenCode instance
      </p>
      <form
        id="instance-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full mt-6"
      >
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="instance-name" className="required">
                  Instance Name
                </FieldLabel>
                <Input
                  {...field}
                  id="instance-name"
                  placeholder="My Server"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="endpoint"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="instance-endpoint" className="required">
                  Endpoint
                </FieldLabel>
                <Input
                  {...field}
                  id="instance-endpoint"
                  placeholder="http://localhost:4096"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {form.formState.errors.root && (
          <p className="text-sm text-destructive mt-4">
            {form.formState.errors.root.message}
          </p>
        )}
      </form>
    </div>
  );
});

const WorkspaceStep = memo(function WorkspaceStep({
  form,
  createdInstance,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<WorkspaceFormData>>;
  createdInstance: Instance | null;
  onSubmit: (data: WorkspaceFormData) => void;
}) {
  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <img
        src="onboard/create-workspace.png"
        alt="Workspace"
        className="w-[150px] h-[150px] mb-6 rounded-2xl bg-muted object-cover"
      />
      <h2 className="text-2xl font-semibold text-center">Create Workspace</h2>
      <p className="text-sm mt-2 text-center text-muted-foreground">
        Workspaces help organize your chats and memories
      </p>
      <form
        id="workspace-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full mt-6"
      >
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-name" className="required">
                  Workspace Name
                </FieldLabel>
                <Input
                  {...field}
                  id="workspace-name"
                  placeholder="My Workspace"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <DirectoryCombobox
            instanceId={createdInstance?.id}
            control={form.control}
            errors={form.formState.errors}
          />

          <Field>
            <FieldLabel className="required">Color</FieldLabel>
            <Controller
              name="color"
              control={form.control}
              render={({ field }) => (
                <ColorPicker
                  value={field.value}
                  onChange={field.onChange}
                  colors={WORKSPACE_COLORS}
                  columns={4}
                  size="md"
                />
              )}
            />
          </Field>
        </FieldGroup>

        {form.formState.errors.root && (
          <p className="text-sm text-destructive mt-4">
            {form.formState.errors.root.message}
          </p>
        )}
      </form>
    </div>
  );
});

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const [createdInstance, setCreatedInstance] = useState<Instance | null>(null);
  const workspaceStore = useWorkspaceStore();

  const { addInstance } = useInstanceStore();

  const instanceForm = useForm<InstanceFormData>({
    resolver: zodResolver(instanceSchema),
    defaultValues: {
      name: "",
      endpoint: "http://localhost:4096",
    },
  });

  const workspaceForm = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      directory: "",
      color: WORKSPACE_COLORS[0],
    },
  });

  const handleNextFromInstance = useCallback(
    (data: InstanceFormData) => {
      const instance = addInstance({
        name: data.name.trim(),
        endpoint: data.endpoint.trim(),
      });

      registerInstance(instance);
      setCreatedInstance(instance);
      setStep("workspace");
    },
    [addInstance],
  );

  const handleCreateWorkspace = useCallback(
    (data: WorkspaceFormData) => {
      if (!createdInstance) return;

      setIsCreatingWorkspace(true);
      try {
        workspaceStore.createWorkspace(
          createdInstance.id,
          {
            name: data.name.trim(),
            color: data.color as WorkspaceColor,
            directory: data.directory.trim(),
          },
          true,
        );

        onComplete?.(createdInstance);
      } catch {
        workspaceForm.setError("root", {
          message: "Failed to create workspace",
        });
      } finally {
        setIsCreatingWorkspace(false);
      }
    },
    [createdInstance, workspaceStore, onComplete, workspaceForm],
  );

  const handleFooterButtonClick = useCallback(async () => {
    if (step === "welcome") {
      setStep("instance");
    } else if (step === "instance") {
      await instanceForm.handleSubmit(handleNextFromInstance)();
    } else if (step === "workspace") {
      await workspaceForm.handleSubmit(handleCreateWorkspace)();
    }
  }, [
    step,
    instanceForm,
    workspaceForm,
    handleNextFromInstance,
    handleCreateWorkspace,
  ]);

  return (
    <div className="flex flex-col h-full w-[400px]">
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {step === "welcome" && <WelcomeStep />}
        {step === "instance" && (
          <InstanceStep form={instanceForm} onSubmit={handleNextFromInstance} />
        )}
        {step === "workspace" && (
          <WorkspaceStep
            form={workspaceForm}
            createdInstance={createdInstance}
            onSubmit={handleCreateWorkspace}
          />
        )}
      </div>

      <div className="shrink-0 px-6 pt-4 pb-6 flex flex-col items-center gap-4">
        <StepIndicator current={step} />
        <Button
          onClick={handleFooterButtonClick}
          className="w-full"
          size="lg"
          disabled={step === "workspace" && isCreatingWorkspace}
        >
          {step === "welcome" && "Get Started →"}
          {step === "instance" && "Next →"}
          {step === "workspace" &&
            (isCreatingWorkspace ? "Creating..." : "Create Workspace →")}
        </Button>
      </div>
    </div>
  );
}
