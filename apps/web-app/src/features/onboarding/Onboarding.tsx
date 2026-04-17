import { useState, useCallback, memo, useMemo } from "react";
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
import { useInstanceStore } from "@/stores/instanceStore";
import { WORKSPACE_COLORS, type WorkspaceColor } from "@/stores/workspaceStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";
import { registerInstance } from "@/lib/instance-registry";

type OnboardingProps = {
  onComplete?: () => void;
};

type Step = "welcome" | "instance" | "workspace" | "all-set";

const STEPS: Step[] = ["welcome", "instance", "workspace", "all-set"];

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
          className={`w-2 h-2 rounded-full transition-all duration-300 ${index <= currentIndex ? "bg-foreground" : "bg-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
});

const WelcomeStep = memo(function WelcomeStep() {
  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <img
        src="/mascot/greeting.png"
        alt="Welcome"
        className="w-[150px] h-[150px] mb-6 rounded-2xl bg-muted object-cover"
      />
      <h2 className="text-3xl font-semibold text-center font-content">
        Welcome to Cloudy
      </h2>
      <p className="text-base mt-2 text-center text-muted-foreground font-content">
        Your AI agent sidekick for chat, ideas, memories, and artifacts.
      </p>
      <div className="flex flex-col items-center gap-4 mt-6 w-full font-content">
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
        src="/mascot/connect-server.png"
        alt="Instance"
        className="w-[150px] h-[150px] mb-6 rounded-2xl bg-muted object-cover"
      />
      <h2 className="text-2xl font-semibold text-center font-content">
        Connect to OpenCode
      </h2>
      <p className="text-sm mt-2 text-center text-muted-foreground font-content">
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
  oc,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<WorkspaceFormData>>;
  oc: ReturnType<typeof createOpencodeClient> | null;
  onSubmit: (data: WorkspaceFormData) => void;
}) {
  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <img
        src="/mascot/create-workspace.png"
        alt="Workspace"
        className="w-[150px] h-[150px] mb-6 rounded-2xl bg-muted object-cover"
      />
      <h2 className="text-2xl font-semibold text-center font-content">
        Create Workspace
      </h2>
      <p className="text-sm mt-2 text-center text-muted-foreground font-content">
        Workspaces help organize your chats and sessions
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
            oc={oc ?? undefined}
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

const AllSetStep = memo(function AllSetStep() {
  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <img
        src="/mascot/happy.png"
        alt="Welcome"
        className="w-[150px] h-[150px] mb-6 rounded-2xl bg-muted object-cover"
      />
      <h2 className="text-3xl font-semibold text-center font-content">
        You're all set
      </h2>
      <p className="text-base mt-2 text-center text-muted-foreground font-content">
        Your workspace is ready to go. Start chatting, organizing, and
        building&mdash;your AI sidekick is waiting.
      </p>
    </div>
  );
});

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("welcome");

  const workspaceStore = useWorkspaceStore();
  const { addInstance } = useInstanceStore();
  const { setHasCompletedOnboarding } = useOnboardingStore();

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

  const tempOC = useMemo(() => {
    if (step !== "workspace") return null;
    const endpoint = instanceForm.getValues("endpoint");
    return createOpencodeClient({ baseUrl: endpoint });
  }, [step, instanceForm]);

  const handleBack = useCallback(() => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1]);
    }
  }, [step]);

  const handleNextFromInstance = useCallback(() => {
    setStep("workspace");
  }, []);

  const handleCreateWorkspace = useCallback(
    (data: WorkspaceFormData) => {
      try {
        const instanceData = instanceForm.getValues();
        const instance = addInstance({
          name: instanceData.name.trim(),
          endpoint: instanceData.endpoint.trim(),
        });

        registerInstance(instance);

        workspaceStore.createWorkspace(
          instance.id,
          {
            name: data.name.trim(),
            color: data.color as WorkspaceColor,
            directory: data.directory.trim(),
          },
          true,
        );

        setStep("all-set");
      } catch {
        workspaceForm.setError("root", {
          message: "Failed to create workspace",
        });
      }
    },
    [addInstance, instanceForm, workspaceStore, workspaceForm, onComplete],
  );

  const handleGoToWorkspace = useCallback(() => {
    setHasCompletedOnboarding(true);
    setTimeout(() => {
      onComplete?.();
    }, 0);
  }, [onComplete, setHasCompletedOnboarding]);

  const handleNext = useCallback(() => {
    setStep("instance");
  }, []);

  const handleSubmitInstance = useCallback(() => {
    instanceForm.handleSubmit(handleNextFromInstance)();
  }, [instanceForm, handleNextFromInstance]);

  const handleSubmitWorkspace = useCallback(() => {
    workspaceForm.handleSubmit(handleCreateWorkspace)();
  }, [workspaceForm, handleCreateWorkspace]);

  const STEP_CONFIG: Record<
    Step,
    {
      showBack: boolean;
      text: string;
      onClick: () => void;
    }
  > = {
    welcome: { showBack: false, text: "Next →", onClick: handleNext },
    instance: { showBack: true, text: "Next →", onClick: handleSubmitInstance },
    workspace: {
      showBack: true,
      text: "Create Workspace →",
      onClick: handleSubmitWorkspace,
    },
    "all-set": {
      showBack: false,
      text: "Go to Workspace →",
      onClick: handleGoToWorkspace,
    },
  };

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
            oc={tempOC}
            onSubmit={handleCreateWorkspace}
          />
        )}
        {step === "all-set" && <AllSetStep />}
      </div>

      <div className="shrink-0 px-6 pt-4 pb-6 flex flex-col items-center gap-4">
        <StepIndicator current={step} />
        <div className="w-full flex items-center gap-3">
          {STEP_CONFIG[step].showBack && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex-1"
              size="lg"
            >
              ← Back
            </Button>
          )}
          <Button
            onClick={STEP_CONFIG[step].onClick}
            className="flex-1"
            size="lg"
          >
            {STEP_CONFIG[step].text}
          </Button>
        </div>
      </div>
    </div>
  );
}
