import assert from "node:assert/strict";
import test from "node:test";

import {
  transformParticipantFromDB,
  transformScrimGameFromDB,
  type ScrimGameDB,
  type ScrimParticipantDB,
} from "../src/types/scrimGame.ts";

test("normalizes the ARAM collector shapes used by Game 1", () => {
  const game = transformScrimGameFromDB({
    id: "game-1", scrim_id: "scrim-1", game_number: 1, status: "completed",
    our_team_kills: 0, enemy_team_kills: 0, our_team_gold: 0, enemy_team_gold: 0,
    objectives: {}, bans: {},
    external_game_data: { game_context: { mode: "ARAM", map_name: "Map12", map_number: 12 } },
    created_at: "2026-07-26T23:01:23Z", updated_at: "2026-07-26T23:01:23Z",
  } as ScrimGameDB);
  const participant = transformParticipantFromDB({
    id: "participant-1", scrim_game_id: "game-1", summoner_name: "Path",
    kills: 9, deaths: 9, assists: 8, cs: 0, gold: 0, damage_dealt: 0,
    damage_taken: 0, vision_score: 0, level: 17, is_our_team: true,
    items: [{ itemID: 3142, displayName: "Youmuu's Ghostblade", slot: 0 }],
    runes: {
      primaryRuneTree: { id: 8000, displayName: "Precision" },
      secondaryRuneTree: { id: 8200, displayName: "Sorcery" },
      generalRunes: [{ id: 8005, displayName: "Press the Attack" }],
      statRunes: [{ id: 5008 }],
    },
    summoner_spells: {
      summonerSpellOne: { displayName: "Flash" },
      summonerSpellTwo: { displayName: "Ignite" },
    },
    created_at: "2026-07-26T23:01:23Z", updated_at: "2026-07-26T23:01:23Z",
  } as ScrimParticipantDB);

  assert.deepEqual(game.objectives, { dragons: [], barons: [], towers: [], inhibitors: [] });
  assert.deepEqual(game.bans, { our_bans: [], enemy_bans: [] });
  assert.equal(game.game_mode, "ARAM");
  assert.equal(game.map_number, 12);
  assert.deepEqual(participant.items[0], { id: 3142, name: "Youmuu's Ghostblade", slot: 0 });
  assert.deepEqual(participant.summoner_spells.map((spell) => spell.name), ["Flash", "Ignite"]);
  assert.deepEqual(participant.runes, { primary_tree: "Precision", secondary_tree: "Sorcery", runes: [8005], stat_mods: [5008] });
});
