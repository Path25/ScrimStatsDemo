# Incident and recovery procedure

## Triage

1. Capture the support reference, workspace, affected route, time, and user role.
2. Check browser reporting, Vercel logs, Supabase Auth/API/Edge logs, notification attempts, and operator audit events using the same correlation ID.
3. Classify impact: availability, delivery, permission, cross-tenant exposure, integrity, or data loss.
4. Disable the smallest affected integration or workflow. Do not remove historical evidence.

## Recovery

- Restore archived scrims and roster records through their recovery paths.
- Revoke compromised workspace membership or device access without deleting the Auth user.
- Rotate exposed provider or worker credentials, then verify old credentials fail.
- Retry idempotent invitation and notification deliveries from their tracked records.
- For database recovery, use the current Supabase backup/PITR procedure and validate tenant isolation before reopening access.

## Communication

- Update `/status` for a confirmed user-facing incident.
- Contact affected pilot owners with scope, workaround, and the next update time.
- Record material decisions and resolution in immutable operator audit events.
- Complete a post-incident review before promoting the affected workflow again.
