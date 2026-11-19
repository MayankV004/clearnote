import { SignIn } from "@clerk/nextjs";
import { AuthLayout } from "../../ui/AuthLayout";

export default function SignInPage() {
  return (
    <AuthLayout
      title="Sign In to Your Clinic Portal"
      subtitle="Access your active patient roster and AI consultation reviews."
    >
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none border-none p-0 bg-transparent",
            card: "w-full shadow-none border-none p-0 bg-transparent",
            headerTitle: "sr-only",
            headerSubtitle: "sr-only",
            socialButtonsBlockButton:
              "w-full bg-card hover:bg-muted text-foreground border border-border rounded-[var(--radius-sm)] text-xs font-semibold py-2 transition-colors",
            socialButtonsBlockButtonText: "text-foreground font-semibold text-xs",
            dividerRow: "my-4",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground text-[11px] uppercase tracking-wider font-mono",
            formFieldLabel: "text-xs font-semibold text-foreground/90 uppercase tracking-wider mb-1",
            formFieldInput:
              "w-full bg-card border border-border text-foreground rounded-[var(--radius-sm)] text-sm px-3 py-1.5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground",
            formButtonPrimary:
              "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-2.5 rounded-[var(--radius-sm)] transition-colors shadow-xs mt-2 cursor-pointer",
            footerActionText: "text-muted-foreground text-xs",
            footerActionLink: "text-primary hover:underline text-xs font-semibold transition-colors",
            identityPreviewText: "text-foreground font-medium text-xs",
            identityPreviewEditButtonIcon: "text-primary hover:text-primary/80 transition-colors",
          },
        }}
      />
    </AuthLayout>
  );
}
