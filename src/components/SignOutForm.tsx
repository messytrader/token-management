import { LogOut } from "lucide-react";

export function SignOutForm({
  action,
  label,
}: {
  action: () => void | Promise<void>;
  label: string;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
      >
        <LogOut className="size-3.5" /> {label}
      </button>
    </form>
  );
}