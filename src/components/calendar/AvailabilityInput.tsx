import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACTIVE_ROSTER } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import { useAvailability } from "@/hooks/useAvailability";
import { toast } from "sonner";

interface AvailabilityInputProps {
    onClose: () => void;
    onSave?: (data: any) => void;
}

export default function AvailabilityInput({ onClose, onSave }: AvailabilityInputProps) {
    const { isPlayer, isCoach, isManager } = useRole();
    const { saveAvailability } = useAvailability();
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        playerId: isPlayer ? ACTIVE_ROSTER[0].id : "",
        date: "",
        startTime: "18:00",
        endTime: "21:00",
        isAvailable: true,
        recurring: false,
        recurrencePattern: "weekly",
        notes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.playerId) {
            toast.error("Please select a player");
            return;
        }

        if (!formData.date) {
            toast.error("Please select a date");
            return;
        }

        setIsSaving(true);
        try {
            // Combine date and time
            const startStr = `${formData.date}T${formData.startTime}:00`;
            const endStr = `${formData.date}T${formData.endTime}:00`;

            await saveAvailability({
                playerId: formData.playerId,
                startTime: new Date(startStr),
                endTime: new Date(endStr),
                isAvailable: formData.isAvailable,
                notes: formData.notes,
                // Recurrence logic would be handled here if implemented in the hook
            });

            if (onSave) {
                onSave(formData);
            }
            onClose();
        } catch (error) {
            // Error handled by hook toast
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel rounded-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white glow-text">Add Availability</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Player Selection (for coaches/managers) */}
                    {(isCoach || isManager) && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Player
                            </label>
                            <select
                                value={formData.playerId}
                                onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                                required
                            >
                                <option value="">Select a player</option>
                                {ACTIVE_ROSTER.map(player => (
                                    <option key={player.id} value={player.id}>
                                        {player.name} ({player.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Date
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                            required
                        />
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                End Time
                            </label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                                required
                            />
                        </div>
                    </div>

                    {/* Availability Status */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Status
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isAvailable: true })}
                                className={cn(
                                    "flex-1 py-2.5 rounded-lg border transition-all font-medium",
                                    formData.isAvailable
                                        ? "bg-green-500/20 border-green-500/50 text-green-300"
                                        : "bg-black/20 border-white/10 text-zinc-400 hover:border-white/20"
                                )}
                            >
                                Available
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isAvailable: false })}
                                className={cn(
                                    "flex-1 py-2.5 rounded-lg border transition-all font-medium",
                                    !formData.isAvailable
                                        ? "bg-red-500/20 border-red-500/50 text-red-300"
                                        : "bg-black/20 border-white/10 text-zinc-400 hover:border-white/20"
                                )}
                            >
                                Unavailable
                            </button>
                        </div>
                    </div>

                    {/* Recurring */}
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.recurring}
                                onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                                className="w-4 h-4 rounded border-white/10 bg-black/40 text-brand-primary focus:ring-brand-primary/50"
                            />
                            <span className="text-sm text-zinc-300">Recurring availability</span>
                        </label>
                    </div>

                    {formData.recurring && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Repeat
                            </label>
                            <select
                                value={formData.recurrencePattern}
                                onChange={(e) => setFormData({ ...formData, recurrencePattern: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Notes (optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            placeholder="Add any additional notes..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 border-white/10 text-zinc-300 hover:text-white hover:border-brand-primary/50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-brand-primary text-black hover:bg-brand-primary/80 shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4 mr-2" />
                            )}
                            {isSaving ? "Saving..." : "Save Availability"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
