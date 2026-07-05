import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface DeleteConfirmDialogProps {
  item: { id: string; name: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({
  item,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={item !== null}
      onOpenChange={(open) => !open && onCancel()}
      title={`Delete Confirm`}
      description={`Delete "${item?.name}" permanently? This action cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={onConfirm}
      destructive
    />
  );
}

export { DeleteConfirmDialog };
export type { DeleteConfirmDialogProps };
