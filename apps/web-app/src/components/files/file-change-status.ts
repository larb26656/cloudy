export const FILE_CHANGE_STATUS_META = {
  added: { variant: "default", short: "A", label: "added" },
  modified: { variant: "secondary", short: "M", label: "modified" },
  deleted: { variant: "destructive", short: "D", label: "deleted" },
} as const;
