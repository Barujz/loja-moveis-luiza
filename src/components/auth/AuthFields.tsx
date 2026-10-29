import { Button } from "@/components/ui/Button";

export const fieldClass =
  "w-full rounded-sm border border-line bg-cream px-4 py-3 text-ink placeholder:text-muted/70 transition-colors focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass";

export const labelClass = "block text-sm font-medium text-ink";

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        className={`${fieldClass} mt-2`}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
      />
      {hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function FormFeedback({
  error,
  message,
}: {
  error: string | null;
  message: string | null;
}) {
  if (error) {
    return (
      <p className="rounded-sm border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-ink" role="alert">
        {error}
      </p>
    );
  }
  if (message) {
    return (
      <p className="rounded-sm border border-line bg-cream px-4 py-3 text-sm text-ink" role="status">
        {message}
      </p>
    );
  }
  return null;
}

export function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Aguarde…" : children}
    </Button>
  );
}
