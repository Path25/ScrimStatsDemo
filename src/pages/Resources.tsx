import {
  FileText,
  Video,
  Download,
  Link as LinkIcon,
  BookOpen,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Resources() {
  const RESOURCES = [
    {
      title: "Team Playbook 2025",
      type: "PDF",
      size: "2.4 MB",
      updated: "2 days ago",
      icon: BookOpen,
      color: "text-brand-primary",
      bg: "bg-brand-primary/10",
      accent: "from-brand-primary/5"
    },
    {
      title: "Patch 14.12 Analysis",
      type: "Video",
      size: "15 min",
      updated: "Yesterday",
      icon: Video,
      color: "text-red-400",
      bg: "bg-red-500/10",
      accent: "from-red-500/5"
    },
    {
      title: "Scouting Template",
      type: "Spreadsheet",
      size: "External",
      updated: "Last Week",
      icon: FileText,
      color: "text-green-400",
      bg: "bg-green-500/10",
      accent: "from-green-500/5"
    },
    {
      title: "Standard Config",
      type: "Zip",
      size: "45 KB",
      updated: "Jan 12",
      icon: Download,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      accent: "from-blue-500/5"
    }
  ];

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-10">

      {/* Compact Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground pl-2">
          <span className="text-zinc-500">ScrimStats</span>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
          <span className="text-white font-medium glow-text">Resources</span>
        </div>

        <div className="flex items-center gap-2">
          <Button className="h-9 px-4 bg-brand-primary text-black hover:bg-brand-primary/90 font-bold text-xs shadow-[0_0_15px_rgba(45,212,191,0.2)]">
            <Download className="w-3.5 h-3.5 mr-2" /> Upload
          </Button>
        </div>
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {RESOURCES.map((res, i) => (
          <div key={i} className="glass-panel group relative overflow-hidden p-6 rounded-2xl border border-white/5 hover:border-brand-primary/30 transition-all cursor-pointer">
            <div className={cn("absolute top-0 right-0 p-16 blur-[50px] rounded-full pointer-events-none group-hover:opacity-100 transition-opacity opacity-50 bg-gradient-to-br", res.accent)} />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 shadow-lg group-hover:border-brand-primary/30 transition-colors", res.bg, res.color)}>
                  <res.icon className="w-6 h-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white glass-button border-transparent hover:border-white/10">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white glass-button border-transparent hover:border-white/10">
                    <LinkIcon className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white glow-text-sm group-hover:text-brand-primary transition-colors tracking-tight">{res.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/5 text-zinc-500 border-white/10 text-[8px] font-black uppercase tracking-widest px-1.5 py-0">
                    {res.type}
                  </Badge>
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{res.size}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-8 pt-4 border-t border-white/5">
                <span className="text-zinc-700">Modification</span>
                <span className="text-zinc-400">{res.updated}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
