import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function seedDemoScoutingData(userId: string) {
    try {
        // 1. Clear existing scouting data
        await supabase.from('opponent_drafts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('opponent_playstyle_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('opponent_players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('opponent_teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // For demo seeding, we'll use a placeholder tenant_id or derive it if possible.
        // In many multi-tenant apps, the user's ID is often linked to a tenant, 
        // but here we'll assume a default or provide a temporary one if needed by schema.
        const tenantId = "default-tenant";

        // 2. Create Demo Teams
        const teams = [
            {
                name: "G2 Academy",
                strategic_notes: "High priority on early drakes. Aggressive jungle invades at level 3.",
                created_by: userId,
                tenant_id: tenantId
            },
            {
                name: "FNC TQ",
                strategic_notes: "Strong teamfighting. Tends to play for late game soul win conditions.",
                created_by: userId,
                tenant_id: tenantId
            },
            {
                name: "KCB Blue",
                strategic_notes: "Focus on Top side map control. High priority on K'Sante and Jax.",
                created_by: userId,
                tenant_id: tenantId
            }
        ];

        const { data: createdTeams, error: teamError } = await supabase
            .from('opponent_teams')
            .insert(teams)
            .select();

        if (teamError) throw teamError;

        // 3. Create Demo Players & Tags
        const g2a = createdTeams.find(t => t.name === 'G2 Academy');
        const fnc = createdTeams.find(t => t.name === 'FNC TQ');

        if (g2a) {
            await supabase.from('opponent_players').insert([
                { opponent_team_id: g2a.id, summoner_name: "Yike Jr", role: "jungle" },
                { opponent_team_id: g2a.id, summoner_name: "Caps Jr", role: "mid" },
                { opponent_team_id: g2a.id, summoner_name: "Mikyx Jr", role: "support" }
            ]);

            await supabase.from('opponent_playstyle_tags').insert([
                { opponent_team_id: g2a.id, tag_name: "Aggressive Early", tag_type: "team", created_by: userId }
            ]);
        }

        if (fnc) {
            await supabase.from('opponent_players').insert([
                { opponent_team_id: fnc.id, summoner_name: "Noah Jr", role: "adc" },
                { opponent_team_id: fnc.id, summoner_name: "Oscar Jr", role: "top" }
            ]);

            await supabase.from('opponent_playstyle_tags').insert([
                { opponent_team_id: fnc.id, tag_name: "Front-to-Back", tag_type: "team", created_by: userId }
            ]);
        }

        // 4. Create Demo Draft History
        if (g2a) {
            const drafts = [
                {
                    opponent_team_id: g2a.id,
                    opponent_name: g2a.name,
                    match_date: new Date(Date.now() - 86400000).toISOString(),
                    result: "win",
                    our_side: "red",
                    draft_data: {
                        picks: {
                            enemy_picks: ["Maokai", "Tristana", "Nautilus", "Kai'Sa", "Renekton"],
                            our_picks: ["Sejuani", "Azir", "Rell", "Xayah", "Ornn"]
                        },
                        bans: {
                            enemy_bans: ["Ashe", "Kalista", "Rumble"],
                            our_bans: ["Sylas", "Bel'Veth", "LeBlanc"]
                        }
                    },
                    created_by: userId
                },
                {
                    opponent_team_id: g2a.id,
                    opponent_name: g2a.name,
                    match_date: new Date(Date.now() - 172800000).toISOString(),
                    result: "loss",
                    our_side: "blue",
                    draft_data: {
                        picks: {
                            enemy_picks: ["Lee Sin", "Sylas", "Thresh", "Varus", "Jax"],
                            our_picks: ["Vi", "Orianna", "Alisat", "Jinx", "Aatrox"]
                        },
                        bans: {
                            enemy_bans: ["Maokai", "Azir", "K'Sante"],
                            our_bans: ["Tristana", "Nidalee", "Renata Glasc"]
                        }
                    },
                    created_by: userId
                }
            ];

            const { error: draftError } = await supabase.from('opponent_drafts').insert(drafts);
            if (draftError) throw draftError;
        }

        toast.success("Demo scouting data seeded successfully!");
        window.location.reload(); // Refresh to show new data
        return true;
    } catch (error: any) {
        console.error("Error seeding demo data:", error);
        toast.error("Failed to seed demo data: " + error.message);
        return false;
    }
}
