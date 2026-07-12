function StatusBar() {
  return (
    <div className="bg-muted px-2 py-1 text-sm flex gap-2">
      <span>Mode: local (mock)</span>
      <div className="flex-1" />
      <span>http://127.0.0.1:4122</span>
    </div>
  );
}

export default StatusBar;
