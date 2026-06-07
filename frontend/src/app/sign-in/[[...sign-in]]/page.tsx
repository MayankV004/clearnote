import { SignIn } from "@clerk/nextjs";
import { AuthLayout } from "../../ui/AuthLayout";

export default function Page() {
  return (
    <AuthLayout>
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full flex justify-center",
            card: "bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-md mx-auto relative z-10",
            headerTitle: "text-slate-900",
            headerSubtitle: "text-slate-600",
            socialButtonsBlockButton: "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 transition-colors",
            socialButtonsBlockButtonText: "text-slate-700 font-medium",
            dividerLine: "bg-slate-200",
            dividerText: "text-slate-500",
            formFieldLabel: "text-slate-700",
            formFieldInput: "bg-white border-slate-200 text-slate-900 focus:border-teal-500 focus:ring-teal-500/20 transition-all",
            formButtonPrimary: "bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all hover:shadow-[0_0_15px_rgba(13,148,136,0.3)]",
            footerActionText: "text-slate-600",
            footerActionLink: "text-teal-600 hover:text-teal-700 transition-colors",
            identityPreviewText: "text-slate-900",
            identityPreviewEditButtonIcon: "text-teal-600 hover:text-teal-700 transition-colors",
          },
        }}
      />
    </AuthLayout>
  );
}