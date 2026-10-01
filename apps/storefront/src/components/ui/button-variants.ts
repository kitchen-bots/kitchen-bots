import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none active:scale-[0.98] font-bold font-['Outfit']",
  {
    variants: {
      variant: {
        default: "bg-[#1E2329] text-white hover:bg-kb-tertiary shadow-lg shadow-black/5",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-2 border-[#E2E8F0] bg-white text-[#112329] hover:border-[#112329] hover:bg-[#F8FAFC]",
        secondary:
          "bg-kb-primary text-white hover:bg-[#145e2e] shadow-lg shadow-kb-primary",
        accent: "bg-kb-tertiary text-white hover:bg-[#D18509] shadow-[0_8px_30px_rgba(245,168,0,0.4)]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[48px] md:h-[52px] px-8 text-[14px] md:text-[15px] rounded-xl",
        sm: "h-[40px] md:h-[44px] px-6 text-[13px] md:text-[14px] rounded-lg",
        lg: "h-[56px] md:h-[60px] px-10 text-[16px] md:text-[17px] rounded-2xl",
        icon: "size-9 rounded-md",
        "icon-sm": "size-8 rounded-sm",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
