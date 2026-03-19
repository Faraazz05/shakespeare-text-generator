const StatusBadge = ({ running, finished, error }: { running: boolean; finished: boolean; error: string | null }) => {
  if (error) return <span className="rounded-full bg-destructive/20 px-2.5 py-0.5 text-xs font-medium text-destructive">Error</span>;
  if (running) return <span className="rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-medium text-warning">Training…</span>;
  if (finished) return <span className="rounded-full bg-success/20 px-2.5 py-0.5 text-xs font-medium text-success">Complete</span>;
  return <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Idle</span>;
};

export default StatusBadge;
