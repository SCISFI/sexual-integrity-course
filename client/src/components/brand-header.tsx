import { ThemeToggle } from "@/components/theme-toggle";

export function BrandHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">
          {title}
        </div>
        {subtitle && (
          <div className="text-sm text-muted-foreground mt-0.5">
            {subtitle}
          </div>
        )}
      </div>

      <ThemeToggle />
    </header>
  );
}
