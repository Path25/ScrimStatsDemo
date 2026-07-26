-- Durable notification generation and operator-only pilot provisioning.

create or replace function public.queue_workspace_notification(
  p_tenant_id uuid,
  p_user_id uuid,
  p_category text,
  p_title text,
  p_body text,
  p_href text,
  p_dedupe_key text,
  p_template_key text default 'workspace_notification',
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
  v_preference public.notification_preferences;
  v_email text;
  v_category_enabled boolean;
begin
  if not exists (select 1 from public.tenant_users where tenant_id = p_tenant_id and user_id = p_user_id) then
    raise exception 'Notification recipient is not a workspace member';
  end if;
  select * into v_preference from public.notification_preferences where tenant_id = p_tenant_id and user_id = p_user_id;
  v_category_enabled := case p_category
    when 'schedule' then coalesce(v_preference.schedule_enabled, true)
    when 'coaching_action' then coalesce(v_preference.coaching_enabled, true)
    when 'integration' then coalesce(v_preference.integration_enabled, true)
    else true end;
  if not v_category_enabled then return null; end if;
  if coalesce(v_preference.in_app_enabled, true) then
    insert into public.workspace_notifications (tenant_id, user_id, category, title, body, href, dedupe_key)
    values (p_tenant_id, p_user_id, p_category, p_title, p_body, p_href, p_dedupe_key)
    on conflict (tenant_id, user_id, dedupe_key) do update set
      title = excluded.title, body = excluded.body, href = excluded.href
    returning id into v_notification_id;
  end if;
  if coalesce(v_preference.email_enabled, true) then
    select email into v_email from public.profiles where id = p_user_id;
    if v_email is not null then
      insert into public.notification_deliveries (
        tenant_id, notification_id, recipient_user_id, recipient_email, channel,
        template_key, dedupe_key, payload
      ) values (
        p_tenant_id, v_notification_id, p_user_id, v_email, 'email', p_template_key,
        p_dedupe_key, p_payload || jsonb_build_object('title', p_title, 'body', p_body, 'href', p_href)
      ) on conflict (tenant_id, channel, dedupe_key) do nothing;
    end if;
  end if;
  return v_notification_id;
end;
$$;
revoke all on function public.queue_workspace_notification(uuid,uuid,text,text,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.queue_workspace_notification(uuid,uuid,text,text,text,text,text,text,jsonb) to service_role;

create or replace function public.notify_coaching_action_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.assignee_user_id is null then return new; end if;
  if tg_op = 'INSERT' then
    perform public.queue_workspace_notification(new.tenant_id, new.assignee_user_id, 'coaching_action',
      'New coaching action', new.title, '/actions', 'action:' || new.id || ':assigned',
      'coaching_action_assigned', jsonb_build_object('action_id', new.id, 'due_at', new.due_at));
  elsif new.status is distinct from old.status then
    perform public.queue_workspace_notification(new.tenant_id, new.assignee_user_id, 'coaching_action',
      'Coaching action updated', new.title || ' is now ' || replace(new.status, '_', ' '), '/actions',
      'action:' || new.id || ':status:' || new.status, 'coaching_action_status', jsonb_build_object('action_id', new.id));
  end if;
  return new;
end;
$$;
revoke all on function public.notify_coaching_action_change() from public, anon, authenticated;

drop trigger if exists coaching_action_notification_trigger on public.coaching_actions;
create trigger coaching_action_notification_trigger after insert or update of status on public.coaching_actions
for each row execute function public.notify_coaching_action_change();

create or replace function public.schedule_scrim_reminders()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.archived_at is not null or new.status = 'completed' then
    update public.notification_reminders set status = 'cancelled'
    where scrim_id = new.id and status = 'pending';
    return new;
  end if;
  if new.status = 'cancelled' then
    update public.notification_reminders set status = 'cancelled' where scrim_id = new.id and status = 'pending';
    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      perform public.queue_workspace_notification(new.tenant_id, member.user_id, 'schedule', 'Scrim cancelled',
        new.opponent_name || ' · ' || to_char(new.starts_at at time zone coalesce(new.timezone, 'UTC'), 'Dy DD Mon HH24:MI'),
        '/scrims/' || new.id, 'scrim:' || new.id || ':cancelled', 'scrim_cancelled', jsonb_build_object('scrim_id', new.id))
      from public.tenant_users member where member.tenant_id = new.tenant_id;
    end if;
    return new;
  end if;
  insert into public.notification_reminders (tenant_id, user_id, scrim_id, reminder_kind, scheduled_for)
  select new.tenant_id, member.user_id, new.id, kind.name,
    new.starts_at - kind.offset_value
  from public.tenant_users member
  cross join (values ('scrim_24h', interval '24 hours'), ('scrim_2h', interval '2 hours')) as kind(name, offset_value)
  left join public.notification_preferences preference on preference.tenant_id = member.tenant_id and preference.user_id = member.user_id
  where member.tenant_id = new.tenant_id
    and coalesce(preference.schedule_enabled, true)
    and ((kind.name = 'scrim_24h' and coalesce(preference.reminder_24h, true)) or (kind.name = 'scrim_2h' and coalesce(preference.reminder_2h, true)))
    and new.starts_at - kind.offset_value > now()
  on conflict (user_id, reminder_kind, scrim_id, coaching_action_id)
  do update set scheduled_for = excluded.scheduled_for, status = 'pending';
  if tg_op = 'UPDATE' and (new.starts_at is distinct from old.starts_at or new.status is distinct from old.status) then
    perform public.queue_workspace_notification(new.tenant_id, member.user_id, 'schedule',
      case when new.status = 'cancelled' then 'Scrim cancelled' else 'Scrim schedule changed' end,
      new.opponent_name || ' · ' || to_char(new.starts_at at time zone coalesce(new.timezone, 'UTC'), 'Dy DD Mon HH24:MI'),
      '/scrims/' || new.id, 'scrim:' || new.id || ':change:' || extract(epoch from new.updated_at)::bigint,
      'scrim_schedule_change', jsonb_build_object('scrim_id', new.id, 'starts_at', new.starts_at))
    from public.tenant_users member where member.tenant_id = new.tenant_id;
  end if;
  return new;
end;
$$;
revoke all on function public.schedule_scrim_reminders() from public, anon, authenticated;

drop trigger if exists scrim_reminder_schedule_trigger on public.scrims;
create trigger scrim_reminder_schedule_trigger after insert or update of starts_at, status, archived_at on public.scrims
for each row execute function public.schedule_scrim_reminders();

create or replace function public.provision_pilot_workspace(
  p_name text, p_slug text, p_owner_email text, p_request_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare v_tenant_id uuid; v_invitation_id uuid; v_token text; v_owner_id uuid;
begin
  if nullif(btrim(p_name), '') is null or nullif(btrim(p_slug), '') is null then raise exception 'Workspace name and slug are required'; end if;
  insert into public.tenants (name, slug, subscription_tier, subscription_status, settings)
  values (btrim(p_name), lower(btrim(p_slug)), 'free', 'active', jsonb_build_object('timezone','Europe/London','managed_pilot',true))
  returning id into v_tenant_id;
  select id into v_owner_id from auth.users where lower(email) = lower(btrim(p_owner_email)) limit 1;
  if v_owner_id is not null then
    insert into public.tenant_users (tenant_id, user_id, role) values (v_tenant_id, v_owner_id, 'owner');
  else
    v_token := encode(gen_random_bytes(24), 'hex');
    insert into public.team_invitations (tenant_id, email, role, token, expires_at, delivery_status)
    values (v_tenant_id, lower(btrim(p_owner_email)), 'owner', v_token, now() + interval '7 days', 'pending')
    returning id into v_invitation_id;
  end if;
  insert into public.pilot_onboarding_items (tenant_id, item_key, label)
  values (v_tenant_id,'owner_access','Owner access confirmed'), (v_tenant_id,'roster','Roster imported'),
    (v_tenant_id,'capture_profile','Capture profile configured'), (v_tenant_id,'first_scrim','First scrim scheduled'),
    (v_tenant_id,'support_handoff','Support contacts confirmed');
  if p_request_id is not null then update public.access_requests set status = 'approved', updated_at = now() where id = p_request_id; end if;
  return jsonb_build_object('tenant_id',v_tenant_id,'invitation_id',v_invitation_id,'token',v_token,'owner_user_id',v_owner_id);
end;
$$;
revoke all on function public.provision_pilot_workspace(text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.provision_pilot_workspace(text,text,text,uuid) to service_role;

grant select, update on public.pilot_onboarding_items, public.support_cases to service_role;
grant select, update on public.access_requests to service_role;
