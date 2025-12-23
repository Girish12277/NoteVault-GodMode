import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand={true}
      richColors
      closeButton
      duration={5000}
      style={{ zIndex: 9999 }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:text-foreground group-[.toaster]:border-border/40 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-xl font-sans group-[.toaster]:min-h-[64px] group-[.toaster]:p-4 data-[type=success]:group-[.toaster]:bg-emerald-50/95 dark:data-[type=success]:group-[.toaster]:bg-emerald-950/20 data-[type=success]:group-[.toaster]:border-emerald-500/30 data-[type=success]:group-[.toaster]:text-emerald-900 dark:data-[type=success]:group-[.toaster]:text-emerald-100 data-[type=error]:group-[.toaster]:bg-red-50/95 dark:data-[type=error]:group-[.toaster]:bg-red-950/20 data-[type=error]:group-[.toaster]:border-red-500/30 data-[type=error]:group-[.toaster]:text-red-900 dark:data-[type=error]:group-[.toaster]:text-red-100 data-[type=warning]:group-[.toaster]:bg-amber-50/95 dark:data-[type=warning]:group-[.toaster]:bg-amber-950/20 data-[type=warning]:group-[.toaster]:border-amber-500/30 data-[type=warning]:group-[.toaster]:text-amber-900 dark:data-[type=warning]:group-[.toaster]:text-amber-100 data-[type=info]:group-[.toaster]:bg-blue-50/95 dark:data-[type=info]:group-[.toaster]:bg-blue-950/20 data-[type=info]:group-[.toaster]:border-blue-500/30 data-[type=info]:group-[.toaster]:text-blue-900 dark:data-[type=info]:group-[.toaster]:text-blue-100",
          title: "group-[.toast]:font-semibold group-[.toast]:text-base",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:mt-1 data-[type=success]:group-[.toast]:text-emerald-700/90 dark:data-[type=success]:group-[.toast]:text-emerald-300/90 data-[type=error]:group-[.toast]:text-red-700/90 dark:data-[type=error]:group-[.toast]:text-red-300/90 data-[type=warning]:group-[.toast]:text-amber-700/90 dark:data-[type=warning]:group-[.toast]:text-amber-300/90",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80",
          closeButton: "group-[.toast]:bg-background/50 group-[.toast]:border group-[.toast]:border-border/40 group-[.toast]:hover:bg-background/80",
        },
        style: {
          zIndex: 9999,
        }
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
