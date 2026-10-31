export function petTriggerLabel(
  waitingCount: number,
  workingCount: number,
): string {
  if (waitingCount > 0) {
    return `Agent activity: ${waitingCount} session${waitingCount === 1 ? "" : "s"} waiting for you`;
  }
  if (workingCount > 0) {
    return `Agent activity: ${workingCount} session${workingCount === 1 ? "" : "s"} working`;
  }
  return "Agent activity";
}
