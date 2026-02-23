import {
  User,
  Bell,
  Shield,
  Monitor,
  Globe,
  LogOut,
  CreditCard,
  Key,
  Users,
  ChevronRight,
  Settings as SettingsIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRole } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { isManager, activeRole } = useRole();

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-10">

      {/* Compact Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground pl-2">
          <span className="text-zinc-500">ScrimStats</span>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
          <span className="text-white font-medium glow-text">Settings</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border border-white/5 bg-black/40 px-3 py-1.5 rounded-xl">
            Active Role: <span className="text-brand-primary ml-1">{activeRole}</span>
          </span>
          <Button variant="ghost" size="sm" className="h-9 px-4 text-xs font-bold text-red-400 hover:text-red-300 glass-button border-transparent hover:border-red-500/20">
            <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <TabsList className="bg-black/40 border border-white/5 p-1.5 h-auto flex flex-wrap gap-1.5 rounded-2xl w-fit">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'appearance', label: 'Appearance', icon: Monitor },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-brand-primary/20 data-[state=active]:text-brand-primary data-[state=active]:glow-border text-zinc-500 hover:text-zinc-300"
            >
              <tab.icon className="w-3.5 h-3.5 mr-2" /> {tab.label}
            </TabsTrigger>
          ))}

          {/* Manager Exclusive Tabs */}
          {isManager && (
            <>
              <div className="w-px h-6 bg-white/10 mx-1.5 self-center" />
              {[
                { id: 'subscription', label: 'Billing', icon: CreditCard },
                { id: 'integrations', label: 'Integrations', icon: Key },
                { id: 'permissions', label: 'Roles', icon: Users },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-brand-primary/20 data-[state=active]:text-brand-primary data-[state=active]:glow-border text-zinc-500 hover:text-zinc-300"
                >
                  <tab.icon className="w-3.5 h-3.5 mr-2" /> {tab.label}
                </TabsTrigger>
              ))}
            </>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 outline-none">
          <div className="glass-panel p-8 max-w-2xl rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-32 bg-brand-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-8">
              <div>
                <h3 className="text-xl font-bold text-white glow-text mb-1">Public Profile</h3>
                <p className="text-sm text-zinc-500">Your identity within ScrimStats</p>
              </div>

              <div className="flex items-center gap-6 p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                <div className="w-20 h-20 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-2xl font-black text-brand-primary shadow-[0_0_20px_rgba(45,212,191,0.2)]">TH</div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="glass-button border-white/10 text-xs font-bold">Change Avatar</Button>
                  <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Display Name</label>
                  <Input defaultValue="Theory" className="h-11 bg-black/40 border-white/10 text-white rounded-xl focus:ring-brand-primary/50 focus:border-brand-primary/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Email Address</label>
                  <Input defaultValue="theo@scrimstats.com" className="h-11 bg-black/40 border-white/10 text-zinc-500 rounded-xl cursor-not-allowed" readOnly />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button className="bg-brand-primary text-black hover:bg-brand-primary/90 font-bold px-8 shadow-[0_0_20px_rgba(45,212,191,0.2)]">Save Changes</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4 outline-none">
          <div className="glass-panel p-8 max-w-2xl rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-brand-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white glow-text mb-1">Theme Settings</h3>
                <p className="text-sm text-zinc-500">Customize the dashboard interface</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-colors">
                  <div>
                    <p className="font-bold text-white mb-0.5">Glassmorphism Intensity</p>
                    <p className="text-xs text-zinc-500">Adjust the blur and transparency level of panels.</p>
                  </div>
                  <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 uppercase text-[10px] font-black px-3 py-1">ULTIMATE</Badge>
                </div>

                <div className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-colors">
                  <div>
                    <p className="font-bold text-white mb-0.5">Compact Mode</p>
                    <p className="text-xs text-zinc-500">Reduce padding for higher data density across all pages.</p>
                  </div>
                  <Switch className="data-[state=checked]:bg-brand-primary" />
                </div>

                <div className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-colors">
                  <div>
                    <p className="font-bold text-white mb-0.5">Ambient Glow</p>
                    <p className="text-xs text-zinc-500">Enable subtle background glow effects behind active components.</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-brand-primary" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* MANAGER: Subscription */}
        {isManager && (
          <TabsContent value="subscription" className="space-y-4 outline-none">
            <div className="glass-panel p-8 max-w-2xl rounded-2xl relative overflow-hidden border-brand-primary/20">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50" />
              <div className="absolute top-0 right-0 p-32 bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-white glow-text tracking-tighter mb-1">PRO PLAN</h3>
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Annual Subscription</p>
                  </div>
                  <Badge className="bg-brand-primary text-black font-black text-[10px] px-3 py-1 shadow-[0_0_15px_rgba(45,212,191,0.5)]">ACTIVE</Badge>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">$49</span>
                    <span className="text-zinc-500 font-bold uppercase text-xs tracking-widest">/ month</span>
                  </div>
                  <p className="text-xs text-zinc-500 font-bold mt-4 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-brand-primary" />
                    Next billing date: <span className="text-zinc-300">February 28, 2026</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 mt-auto">
                  <Button className="bg-white text-black hover:bg-zinc-200 font-black px-6">Manage Billing</Button>
                  <Button variant="outline" className="glass-button border-white/10 text-zinc-400 hover:text-white font-bold">View Invoices</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* MANAGER: Integrations */}
        {isManager && (
          <TabsContent value="integrations" className="space-y-4 outline-none">
            <div className="glass-panel p-8 max-w-3xl rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-brand-primary/5 blur-[100px] rounded-full pointer-events-none" />

              <div className="relative z-10 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white glow-text mb-1">API Keys & Connections</h3>
                  <p className="text-sm text-zinc-500">Sync external data with ScrimStats</p>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors">
                        <Globe className="w-6 h-6 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white mb-0.5">Riot Games API</p>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                          <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Production Key Active</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="glass-button border-white/10 text-xs font-bold">Configure</Button>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-all group grayscale opacity-50 hover:grayscale-0 hover:opacity-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5">
                        <SettingsIcon className="w-6 h-6 text-zinc-600" />
                      </div>
                      <div>
                        <p className="font-bold text-white mb-0.5">GRID Esports Data</p>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Not Connected</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="glass-button border-white/10 text-xs font-bold">Connect</Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* MANAGER: Permissions/Roles */}
        {isManager && (
          <TabsContent value="permissions" className="space-y-4 outline-none">
            <div className="glass-panel p-8 max-w-3xl rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-brand-primary/5 blur-[100px] rounded-full pointer-events-none" />

              <div className="relative z-10 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white glow-text mb-1">Member Roles & Permissions</h3>
                  <p className="text-sm text-zinc-500">Configure access levels for players and staff</p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-4">
                  <Shield className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-yellow-500">Advanced Access Control</p>
                    <p className="text-xs text-yellow-500/70">Individual permission overrides are available in the Roster management page.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {['Manager', 'Coach', 'Player'].map((role) => (
                    <div key={role} className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-white/5">
                      <div>
                        <p className="font-bold text-white">{role}</p>
                        <p className="text-xs text-zinc-500">Default access level for {role.toLowerCase()} accounts.</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-brand-primary font-bold text-xs hover:bg-brand-primary/10">Edit Policy</Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        )}

      </Tabs>
    </div>
  );
}
