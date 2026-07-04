import { cn } from "@/lib/utils";

export function OrganigramaIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path d="M12 17V7" />
      <path d="M4 17v-4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v4" />
      <circle cx="12" cy="19" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="20" cy="19" r="2" />
      <circle cx="4" cy="19" r="2" />
    </svg>
  );
}
