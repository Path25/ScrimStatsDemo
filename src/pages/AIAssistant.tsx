import {
  Bot,
  Send,
  Sparkles,
  User,
  Lightbulb,
  ChevronRight,
  History,
  Info,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello! I've analyzed your recent scrims against G2 Academy. Would you like to review the objective control patterns?" },
    { role: "user", text: "Yes, what was our dragon control rate?" },
    { role: "assistant", text: "Your team secured 62% of dragons, but lost 3 out of 4 Elder Dragons. This suggests a struggle in late-game objective setups." }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const SUGGESTED_QUERIES = [
    "Analyze recent draft winrates",
    "Show me enemy jungle pathing from last game",
    "What are the top bans against G2?"
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: "user", text }]);
    setInputValue("");
    setIsTyping(true);

    // Dynamic mock response logic based on query
    setTimeout(() => {
      let response = "I'm analyzing that specific data point now. Based on the logs, your Mid-Jungle synergy is currently performing in the 85th percentile of your division.";

      if (text.includes("draft")) response = "Aggregate data show a 74% winrate when B1 securing Orianna. However, your Red-side winrate drops by 15% when banning Lee Sin in Phase 1.";
      if (text.includes("jungle")) response = "Enemy jungle pathing was highly predictable: 80% Top-to-Bot clear. Recommendation: Invade the second raptor respawn at 4:15.";
      if (text.includes("G2")) response = "G2 Academy prioritize high-mobility supports. Banning Rell or Gragas significantly disrupts their late-game engage reliability.";

      setMessages(prev => [...prev, { role: "assistant", text: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-6 h-[calc(100vh-140px)] flex flex-col animate-page-entry">

      {/* Compact Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20 shrink-0">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground pl-2">
          <span className="text-zinc-500">ScrimStats</span>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
          <span className="text-white font-medium glow-text">AI Tactical Assistant</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 px-3 py-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(45,212,191,0.1)]">
            <Sparkles className="h-3 w-3" />
            Intelligence Online
          </Badge>
          <Button variant="ghost" size="sm" className="h-9 px-4 text-xs font-bold text-zinc-400 hover:text-white glass-button border-transparent">
            <History className="w-3.5 h-3.5 mr-2" /> Session History
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col border border-white/5 shadow-2xl">

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-8 bg-black/20 scroll-smooth">
          <div className="flex justify-center mb-8">
            <div className="px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/5 text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-3 h-3" /> Secure Tactical Channel Established
            </div>
          </div>

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-5 max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-lg transition-transform hover:scale-105",
                msg.role === 'assistant'
                  ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-brand-primary/5"
                  : "bg-zinc-900 border-white/10 text-white shadow-black"
              )}>
                {msg.role === 'assistant' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
              </div>

              <div className="space-y-1.5">
                <div className={cn("text-[10px] font-black uppercase tracking-widest text-zinc-600 px-1", msg.role === 'user' ? "text-right" : "")}>
                  {msg.role === 'assistant' ? "COMMAND INTELLIGENCE" : "HEAD COACH"}
                </div>
                <div className={cn(
                  "p-5 rounded-2xl text-sm leading-relaxed shadow-xl",
                  msg.role === 'assistant'
                    ? "bg-white/[0.03] border border-white/10 text-zinc-100 backdrop-blur-md"
                    : "bg-brand-primary text-black font-bold shadow-brand-primary/10"
                )}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-5 max-w-3xl animate-in fade-in duration-300">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-brand-primary/30 bg-brand-primary/10 text-brand-primary">
                <Bot className="w-6 h-6 scale-90 opacity-50" />
              </div>
              <div className="flex items-center gap-1.5 p-5">
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions & Input */}
        <div className="p-8 bg-black/40 border-t border-white/5 space-y-6 shrink-0 relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />

          {/* Suggested Chips */}
          <div className="flex flex-wrap gap-2.5">
            {SUGGESTED_QUERIES.map((query, i) => (
              <button
                key={i}
                onClick={() => handleSend(query)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-bold text-zinc-500 hover:text-white hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all group active:scale-95"
              >
                <Lightbulb className="w-3.5 h-3.5 text-zinc-700 group-hover:text-brand-primary transition-colors" /> {query}
              </button>
            ))}
          </div>

          {/* Input Field */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-brand-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Query the tactical database..."
              className="bg-black/60 border-white/10 h-14 pl-6 pr-16 text-sm focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary/40 rounded-2xl relative z-10 font-medium placeholder:text-zinc-700"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-2 h-10 w-10 bg-brand-primary text-black hover:bg-brand-primary/90 rounded-xl shadow-lg shadow-brand-primary/20 transition-all active:scale-95 z-20"
            >
              <Send className="w-4.5 h-4.5" />
            </Button>
          </form>

          <p className="text-[9px] font-black text-center text-zinc-700 uppercase tracking-widest">Powered by ScrimStats Hybrid-LLM Architecture</p>
        </div>

      </div>

    </div>
  );
}
