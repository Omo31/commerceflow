import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h1 className="text-2xl font-bold tracking-tight font-headline">
        {title}
      </h1>
      {children && <div>{children}</div>}
    </div>
  );
}
