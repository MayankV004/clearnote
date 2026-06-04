import { SignIn } from "@clerk/nextjs";
import { AuthLayout } from "../../ui/AuthLayout";

export default function Page() {
  return (
    <AuthLayout>
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-transparent border-none shadow-none w-full max-w-md mx-auto",
            headerTitle: "text-slate-100",
            headerSubtitle: "text-slate-400",
            socialButtonsBlockButton: "bg-slate-800/50 hover:bg-slate-800 text-slate-200 border-slate-700",
            socialButtonsBlockButtonText: "text-slate-200 font-medium",
            dividerLine: "bg-slate-700",
            dividerText: "text-slate-500",
            formFieldLabel: "text-slate-300",
            formFieldInput: "bg-slate-900/50 border-slate-700 text-slate-100 focus:border-teal-500 focus:ring-teal-500/20",
            formButtonPrimary: "bg-teal-600 hover:bg-teal-700 text-white shadow-sm",
            footerActionText: "text-slate-400",
            footerActionLink: "text-teal-400 hover:text-teal-300",
            identityPreviewText: "text-slate-200",
            identityPreviewEditButtonIcon: "text-teal-400",
          },
        }}
      />
    </AuthLayout>
  );
}