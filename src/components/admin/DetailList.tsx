export function DetailList({ rows }: { rows: { label: string; value: string | null }[] }) {
  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className={row.label === "Descrição" ? "sm:col-span-2" : undefined}>
          <dt className="text-xs uppercase tracking-[0.18em] text-brass">{row.label}</dt>
          <dd className="mt-1 whitespace-pre-wrap text-ink">{row.value?.trim() || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
