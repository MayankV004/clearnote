import React from "react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,148,136,0.25),rgba(255,255,255,0))]" />
      
      {/* Subtle grid pattern for texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Decorative blurred circles */}
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      {/* Main content wrapper */}
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
            ClearNote
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Welcome back to your workspace.
          </p>
        </div>
        
        {/* Clerk Component Container */}
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-1 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
      </div>
    </main>
  );
}
