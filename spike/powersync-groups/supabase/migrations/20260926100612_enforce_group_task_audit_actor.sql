create or replace function private.set_group_task_audit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'Authenticated task actor required';
  end if;
  new.updated_by := actor_id;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

revoke all on function private.set_group_task_audit() from public, anon, authenticated;

drop trigger if exists group_tasks_set_updated_at on public.group_tasks;
create trigger group_tasks_set_audit
before insert or update on public.group_tasks
for each row execute function private.set_group_task_audit();

comment on column public.group_tasks.created_at is
  'Client-reported creation time; immutable after insertion.';
comment on column public.group_tasks.updated_by is
  'Authenticated account whose latest task write was accepted by the server.';
comment on column public.group_tasks.updated_at is
  'Server acceptance time for the latest task write; provisional locally before upload.';
