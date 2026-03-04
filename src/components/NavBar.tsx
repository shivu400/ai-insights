import { Film } from "lucide-react";

export function NavBar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-2xl">
            <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
                <div className="flex items-center gap-2.5 group cursor-pointer">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-600 to-cyan-500 text-white shadow-[0_0_10px_rgba(232,121,249,0.5)] transition-all group-hover:shadow-[0_0_15px_rgba(232,121,249,0.8)]">
                        <Film className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-bold tracking-tight text-sm text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">AI Movie Insights</span>
                </div>
                <div className="ml-auto flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="hidden sm:inline-block">Powered by Gemini Engine</span>
                    <div className="h-3 w-px bg-slate-800" />
                    <span className="hover:text-slate-300 transition-colors cursor-pointer">Documentation</span>
                    <span className="hover:text-slate-300 transition-colors cursor-pointer">Settings</span>
                </div>
            </div>
        </header>
    );
}
