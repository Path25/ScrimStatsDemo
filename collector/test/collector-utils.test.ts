import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCapture, dedupeEvents, deriveCaptureFacts, normalizeChampionSelect, normalizePostGame, normalizeRunes, normalizeSummonerSpells, normalizeTimelineEvents, resolveRosterTeam, riotIdMatches, toRiotId } from '../src/collector-utils';
import { leagueCatalog } from '../src/league-client';
import { CollectorService } from '../src/collector-service';
import type { CollectorPersistence, PersistedCaptureState } from '../src/types';

test('dedupeEvents preserves only unseen Game Client events', () => {
  const seen = new Set(['one']);
  assert.deepEqual(dedupeEvents([{ event_id: 'one', sequence: 1 }, { event_id: 'two', sequence: 2 }], seen).map((event) => event.event_id), ['two']);
});
test('Riot ID matching is case-insensitive and trim-safe', () => assert.equal(riotIdMatches('Player #EUW', ' player #euw '), true));
test('team side resolves from roster Riot identities rather than assuming blue side', () => {
  const roster = [{ playerId: 'p1', riotId: 'Path', tagLine: 'EUW', region: 'EUW' }];
  const red = resolveRosterTeam(
    [
      { riotIdGameName: 'Opponent', riotIdTagLine: 'EUW', team: 'ORDER' },
      { riotIdGameName: 'Path', riotIdTagLine: 'EUW', team: 'CHAOS' },
    ],
    roster,
  );
  assert.equal(red.team, 'CHAOS');
  assert.equal(red.status, 'matched');
});

test('ambiguous roster identities do not silently choose a side', () => {
  const roster = [
    { playerId: 'p1', riotId: 'One', tagLine: 'EUW' },
    { playerId: 'p2', riotId: 'Two', tagLine: 'EUW' },
  ];
  const result = resolveRosterTeam(
    [
      { riotIdGameName: 'One', riotIdTagLine: 'EUW', team: 'ORDER' },
      { riotIdGameName: 'Two', riotIdTagLine: 'EUW', team: 'CHAOS' },
    ],
    roster,
  );
  assert.equal(result.team, undefined);
  assert.equal(result.status, 'ambiguous');
});
test('League client player shape becomes a Riot ID', () => assert.equal(toRiotId({ riotIdGameName: 'Player', riotIdTagLine: 'EUW' }), 'Player#EUW'));

test('completed Riot timeline produces final scores, result, duration, and objective ownership', () => {
  const ours = { summonerName: 'Path', riotIdGameName: 'Path', riotIdTagLine: 'EUW', team: 'ORDER' };
  const enemy = { summonerName: 'Opponent', riotIdGameName: 'Opponent', riotIdTagLine: 'EUW', team: 'CHAOS' };
  const facts = deriveCaptureFacts(
    [ours, enemy],
    [
      { event_id: '1', sequence: 1, event_type: 'ChampionKill', EventName: 'ChampionKill', EventTime: 40, KillerName: 'Path', VictimName: 'Opponent', Assisters: [] },
      { event_id: '2', sequence: 2, event_type: 'TurretKilled', EventName: 'TurretKilled', EventTime: 80, KillerName: 'Path', TurretKilled: 'Turret_TChaos_L1_P3' },
      { event_id: '3', sequence: 3, event_type: 'GameEnd', EventName: 'GameEnd', EventTime: 100, Result: 'Win' },
    ],
    'ORDER',
    { riotIdGameName: 'Path', riotIdTagLine: 'EUW' },
  );
  assert.equal(facts.result, 'win');
  assert.equal(facts.durationSeconds, 100);
  assert.equal(facts.ourTeamKills, 1);
  assert.equal(facts.enemyTeamKills, 0);
  assert.deepEqual(facts.scoreFor(ours), { kills: 1, deaths: 0, assists: 0 });
  assert.deepEqual(facts.objectives.towers[0], { timestamp: 80, team: 'our', position: 'Turret_TChaos_L1_P3' });
});

test('GameEnd result is inverted when the capture account is on the opponent side', () => {
  const ours = { riotIdGameName: 'Path', riotIdTagLine: 'EUW', team: 'ORDER' };
  const enemy = { riotIdGameName: 'Opponent', riotIdTagLine: 'EUW', team: 'CHAOS' };
  const facts = deriveCaptureFacts(
    [ours, enemy],
    [{ event_id: '1', sequence: 1, event_type: 'GameEnd', EventName: 'GameEnd', EventTime: 100, Result: 'Win' }],
    'ORDER',
    { riotIdGameName: 'Opponent', riotIdTagLine: 'EUW' },
  );
  assert.equal(facts.result, 'loss');
});

test('single-player post-game payload preserves analytical statistics', () => {
  const payload = {
    gameLength: 1234,
    gameMode: 'CLASSIC',
    mapId: 11,
    localPlayer: {
      riotIdGameName: 'Path', riotIdTagLine: 'EUW', teamId: 100, championId: 266, championName: 'Aatrox', win: true,
      stats: {
        CHAMPIONS_KILLED: 8, NUM_DEATHS: 2, ASSISTS: 5, MINIONS_KILLED: 140, NEUTRAL_MINIONS_KILLED: 10,
        GOLD_EARNED: 12345, TOTAL_DAMAGE_DEALT_TO_CHAMPIONS: 25000, TOTAL_DAMAGE_TAKEN: 18000,
        VISION_SCORE: 22, CHAMPION_LEVEL: 16, ITEM0: 3071,
      },
    },
  };
  const normalized = normalizePostGame(payload, [], [{ playerId: 'p1', riotId: 'Path', tagLine: 'EUW' }]);
  assert.equal(normalized.participants.length, 1);
  assert.equal(normalized.participants[0].is_our_team, true);
  assert.equal(normalized.participants[0].player_id, 'p1');
  assert.equal(normalized.participants[0].cs, 150);
  assert.equal(normalized.participants[0].gold, 12345);
  assert.equal(normalized.participants[0].damage_dealt, 25000);
  assert.equal(normalized.participants[0].vision_score, 22);
  assert.equal(normalized.ourTeamKills, 8);
  assert.equal(normalized.ourTeamGold, 12345);
  assert.equal(normalized.durationSeconds, 1234);
  assert.equal(normalized.result, 'win');
});

test('completed champion-select actions become ordered picks and bans', () => {
  const normalized = normalizeChampionSelect({
    myTeam: [{ cellId: 1 }],
    theirTeam: [{ cellId: 6 }],
    actions: [[
      { id: 1, actorCellId: 1, type: 'ban', championId: 103, completed: true, isAllyAction: true },
      { id: 2, actorCellId: 6, type: 'pick', championId: 266, completed: true, isAllyAction: false },
    ]],
  }, 'blue', {
    participants: [
      { championId: 103, championName: 'Ahri' },
      { championId: 266, championName: 'Aatrox' },
    ],
  });
  assert.deepEqual(normalized.bans, [{ order: 1, team: 'blue', champion: 'Ahri', champion_id: 103 }]);
  assert.deepEqual(normalized.picks, [{ order: 2, team: 'red', champion: 'Aatrox', champion_id: 266 }]);
  assert.equal(normalized.completed, true);
});

test('catalogue resolves champions absent from post-game and zero pick turns retain sequence', () => {
  const normalized = normalizeChampionSelect({ actions: [[
    { actorCellId: 1, type: 'ban', championId: 427, completed: true, isAllyAction: true, pickTurn: 0 },
    { actorCellId: 6, type: 'ban', championId: 523, completed: true, isAllyAction: false, pickTurn: 0 },
  ]] }, 'blue', undefined, { '427': 'Ivern', '523': 'Aphelios' });
  assert.deepEqual(normalized.bans.map((ban) => [ban.champion, ban.order, ban.team]), [['Ivern', 1, 'blue'], ['Aphelios', 2, 'red']]);
  assert.deepEqual(leagueCatalog([{ id: 427, name: ' Ivern ' }, { id: 'bad', name: 'Nope' }]), { '427': 'Ivern' });
});

test('post-game normalizes numeric items, role precedence, advanced stats and bot status', () => {
  const normalized = normalizePostGame({ participants: [{
    riotIdGameName: 'Practice Bot', teamId: 200, championId: 1, championName: 'Annie', detectedTeamPosition: 'MIDDLE', selectedPosition: 'TOP', botPlayer: true,
    kills: 2, deaths: 8, assists: 1, totalMinionsKilled: 90, neutralMinionsKilled: 0, goldEarned: 8000,
    items: [6655, 0], wardsPlaced: 1, damageDealtToObjectives: 0, totalTimeSpentDead: 92,
  }] }, [], [], 100, { '6655': "Luden's Companion" });
  const player = normalized.participants[0];
  assert.equal(player.role, 'MIDDLE');
  assert.equal(player.is_bot, true);
  assert.deepEqual(player.items, [{ id: 6655, slot: 0, name: "Luden's Companion" }]);
  assert.equal((player.advanced_stats as Record<string, unknown>).time_dead_seconds, 92);
  assert.equal((player.advanced_stats as Record<string, unknown>).damage_to_objectives, 0);
});

test('classification and event ownership distinguish non-standard games without retaining raw keys', () => {
  const participants = [{ is_our_team: true, player_id: 'player', is_bot: false }, { is_our_team: false, is_bot: true }];
  assert.equal(classifyCapture(participants, true, 'win', 1200).classification, 'nonstandard_custom');
  const events = normalizeTimelineEvents([{ event_id: '1', sequence: 1, EventName: 'ChampionKill', EventTime: 220, KillerName: 'Roster Player', VictimName: 'Practice Bot', JWT: 'remove-me' }], [{ summonerName: 'Roster Player', team: 'ORDER' }], 'ORDER');
  assert.equal(events[0].team, 'our');
  assert.equal(events[0].occurred_seconds, 220);
  assert.equal('JWT' in events[0], false);
});

test('runes and summoner spells normalize to complete numeric identifiers', () => {
  assert.deepEqual(normalizeRunes({ primaryRuneTree: { id: 8100, displayName: 'Domination' }, secondaryRuneTree: { id: 8200, displayName: 'Sorcery' }, generalRunes: [{ id: 8112 }, { id: 8126 }], statRunes: [{ id: 5008 }, { id: 5008 }, { id: 5001 }] }), {
    primary_tree: 'Domination', secondary_tree: 'Sorcery', runes: [8112, 8126], stat_mods: [5008, 5008, 5001],
  });
  assert.deepEqual(normalizeSummonerSpells({ summonerSpellOne: { id: 4, displayName: 'Flash' }, summonerSpellTwo: { id: 12, displayName: 'Teleport' } }), [
    { id: 4, name: 'Flash', slot: 1 }, { id: 12, name: 'Teleport', slot: 2 },
  ]);
});

test('collector restores an unfinished encrypted-queue payload before pairing', async () => {
  const state: PersistedCaptureState = {
    captureSessionId: 'capture-1',
    clientSessionId: 'client-1',
    lastSnapshot: { gameData: { gameId: 42 } },
    selectedScrim: { id: 'scrim-1', opponent_name: 'Opponent', scheduled_time: '2026-07-26T18:00:00Z', status: 'scheduled' },
    queuedEvents: [{ event_id: 'event-1', sequence: 1 }],
    capturedEvents: [{ event_id: 'event-1', sequence: 1 }],
    recordingArmed: true,
    seenEventIds: ['event-1'],
  };
  const persistence: CollectorPersistence = {
    clear: async () => undefined,
    load: async () => state,
    save: async () => undefined,
  };
  const service = new CollectorService(persistence);
  await service.restore();
  assert.equal(service.getStatus().state, 'retrying');
  assert.equal(service.getStatus().queueDepth, 1);
  assert.equal(service.getStatus().selectedScrim?.id, 'scrim-1');
  assert.equal(service.getStatus().recordingArmed, true);
});

test('capture requires an explicit block and stops when the block changes', () => {
  const service = new CollectorService();
  service.setCredential({ deviceId: 'device-1', credential: 'secret', tenantId: 'tenant-1', label: 'Capture PC' });
  assert.throws(() => service.setRecordingEnabled(true), /Choose a scrim block/);
  service.selectScrim({ id: 'scrim-1', opponent_name: 'Opponent', scheduled_time: '2026-07-26T18:00:00Z', status: 'scheduled' });
  assert.equal(service.getStatus().recordingArmed, false);
  service.setRecordingEnabled(true);
  assert.equal(service.getStatus().recordingArmed, true);
  service.selectScrim({ id: 'scrim-2', opponent_name: 'Next team', scheduled_time: '2026-07-27T18:00:00Z', status: 'scheduled' });
  assert.equal(service.getStatus().recordingArmed, false);
});
