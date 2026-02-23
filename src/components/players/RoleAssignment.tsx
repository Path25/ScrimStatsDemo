import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PLAYER_ROLES, ROLE_LABELS, type PlayerRole } from "@/types/availability";
import { cn } from "@/lib/utils";
import { Shield, Swords, Zap, Crosshair, Heart, Users as UsersIcon, Check } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";

// Map roles to icons
const RoleIcon = ({ role, className }: { role: PlayerRole; className?: string }) => {
    switch (role) {
        case 'top': return <Shield className={className} />;
        case 'jungle': return <Swords className={className} />;
        case 'mid': return <Zap className={className} />;
        case 'adc': return <Crosshair className={className} />;
        case 'support': return <Heart className={className} />;
        default: return <UsersIcon className={className} />;
    }
};

interface RoleAssignmentProps {
    playerId: string | number;
    playerName: string;
    currentRole?: string;
    onRoleAssign?: (playerId: string | number, role: PlayerRole) => void;
}

export default function RoleAssignment({
    playerId,
    playerName,
    currentRole,
    onRoleAssign
}: RoleAssignmentProps) {
    const { isManager, isCoach } = useRole();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<PlayerRole | undefined>(
        currentRole?.toLowerCase() as PlayerRole
    );

    // Only managers and coaches can assign roles
    if (!isManager && !isCoach) {
        return null;
    }

    const handleRoleSelect = (role: PlayerRole) => {
        setSelectedRole(role);
        if (onRoleAssign) {
            onRoleAssign(playerId, role);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "border-white/10 text-zinc-300 hover:text-white hover:border-brand-primary/50",
                    selectedRole && "border-brand-primary/30 text-brand-primary"
                )}
            >
                {selectedRole ? (
                    <>
                        <RoleIcon role={selectedRole} className="w-4 h-4 mr-2" />
                        {ROLE_LABELS[selectedRole]}
                    </>
                ) : (
                    <>
                        <UsersIcon className="w-4 h-4 mr-2" />
                        Assign Role
                    </>
                )}
            </Button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-2 w-48 glass-panel rounded-lg border border-white/10 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 border-b border-white/5">
                            <p className="text-xs text-zinc-500 font-medium px-2 py-1">
                                Assign role to {playerName}
                            </p>
                        </div>
                        <div className="p-1">
                            {PLAYER_ROLES.map((role) => (
                                <button
                                    key={role}
                                    onClick={() => handleRoleSelect(role)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-left",
                                        selectedRole === role
                                            ? "bg-brand-primary/10 text-brand-primary"
                                            : "text-zinc-300 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <RoleIcon role={role} className="w-4 h-4" />
                                    <span className="flex-1 font-medium">{ROLE_LABELS[role]}</span>
                                    {selectedRole === role && (
                                        <Check className="w-4 h-4 text-brand-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
