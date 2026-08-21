import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talent Mapping | LMS",
  description: "AI Career & Talent Mapping Dashboard",
};

export default function TalentMappingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-purple-500/30">
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative shadow-2xl overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-100 to-slate-50 opacity-50 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-12 -left-24 w-48 h-48 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute top-48 right-12 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        
        {/* Content Container */}
        <div className="relative z-10 h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
