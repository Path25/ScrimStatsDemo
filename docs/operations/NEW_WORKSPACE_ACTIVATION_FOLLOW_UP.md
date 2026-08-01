# New-workspace activation follow-up

## Purpose and boundary

This is a manual, one-to-one support follow-up for a newly created workspace that has not yet recorded any core operational setup. It is not a marketing campaign, plan-upgrade prompt, behavioural-tracking programme, or automated email workflow.

Each send requires Theo's recorded approval for the named recipient and final rendered copy. Do not use this procedure for invitations, billing, password recovery, or any automated sequence.

## Eligibility checklist

All conditions must be true:

- The workspace is between 48 hours and 7 days old.
- It is on Free and has one owner; no active invitation exists.
- No persisted roster, player availability, calendar event, scheduled scrim, recorded game, completed review, coaching action, Solo Queue, Scouting, Draft, or Collector activity exists.
- No prior activation follow-up was sent for the workspace.
- The owner has a valid, service-related contact route and a practical reply/support route is available.

If any condition is false or cannot be verified, do not send. This procedure never uses page navigation or unsaved clicks as evidence.

## Required review before sending

1. PM records the workspace name, creation date, eligibility checks, approved sender, and destination in the private delivery log. Record no message body, credentials, Riot IDs, or gameplay data.
2. Marketing/PM confirms the exact claims match `docs/operations/MESSAGE_LEDGER.md`.
3. Theo approves the specific recipient, rendered message, sender/reply route, and one-time send.
4. Send manually from the approved ProComps/ScrimStats sender. Do not place recipients in a bulk list or reuse invitation/Auth mail flows.

## Approved draft

**Subject:** Need a hand setting up {{workspace_name}}?

Hi {{first_name}},

If you have not had time to set up {{workspace_name}} yet, the quickest way to start is to add your roster, collect availability, and schedule your first practice block.

Once you have a recorded game, ScrimStats can keep the review and follow-up work connected to that practice.

If you would like a hand setting up the first workflow, reply here or reach me on Discord: {{approved_discord_contact_or_invite}}.

Please include {{workspace_name}} in your message so I can help in the right place.

{{approved_workspace_link}}

ScrimStats by ProComps

### Rendered-email design basis

For this manual send, use the same established ScrimStats email frame as the invitation and pilot-workspace emails:

- dark `#060b0f` page, `#0b1319` card, teal `#20d7c0` top rule and CTA;
- ScrimStats by ProComps logo; compact monospace eyebrow `WORKSPACE SUPPORT`;
- title: `Get your first block on the board.`;
- body: the approved copy above, with a teal `Open {{workspace_name}}` CTA to `{{approved_workspace_link}}`;
- optional detail row: `DISCORD SUPPORT` / `{{approved_discord_contact_or_invite}}`;
- existing responsive 600px email layout and ProComps footer.

Use only a verified Discord username, direct-message link, or approved community invite. The contact route is personal support access; it must not imply that the workspace has ScrimStats Discord delivery, `/scrim`, Elite access, or any other product integration.

## Follow-up measurement

Seven days after the approved send, record only:

- whether a roster record or first scheduled scrim now exists;
- whether the delivery was sent or failed, when that is authoritative;
- any customer-initiated reply/request for help.

Report counts only. Do not infer opens, clicks, conversion, retention, or revenue. If no reliable source exists, mark the value unavailable.

## Stop conditions

Stop and escalate to Theo if the recipient objects, the sender/reply route is unclear, eligibility is ambiguous, a second send would be needed, the message would contain a plan/integration claim, or the process needs automation.
