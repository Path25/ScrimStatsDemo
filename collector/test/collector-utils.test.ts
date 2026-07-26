import test from 'node:test';
import assert from 'node:assert/strict';
import { dedupeEvents, resolveRosterTeam, riotIdMatches, toRiotId } from '../src/collector-utils';
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

test('collector restores an unfinished encrypted-queue payload before pairing', async () => {
  const state: PersistedCaptureState = {
    captureSessionId: 'capture-1',
    clientSessionId: 'client-1',
    lastSnapshot: { gameData: { gameId: 42 } },
    selectedScrim: { id: 'scrim-1', opponent_name: 'Opponent', scheduled_time: '2026-07-26T18:00:00Z', status: 'scheduled' },
    queuedEvents: [{ event_id: 'event-1', sequence: 1 }],
    capturedEvents: [{ event_id: 'event-1', sequence: 1 }],
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
});
