-- Collaboration slice for the Local-First migration prototype.
-- Group creation and invitations are intentionally online RPC operations.
-- Group tasks are the only client-writable synchronized table in this scope.

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_]{3,40}$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  discoverable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create unique index group_members_one_owner_idx
  on public.group_members (group_id)
  where role = 'owner';
create index group_members_user_id_idx on public.group_members (user_id);
create index group_members_group_id_idx on public.group_members (group_id);

create table public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (inviter_id <> invitee_id),
  check ((status = 'pending' and responded_at is null) or (status <> 'pending' and responded_at is not null))
);

create unique index group_invitations_one_pending_idx
  on public.group_invitations (group_id, invitee_id)
  where status = 'pending';
create index group_invitations_invitee_idx on public.group_invitations (invitee_id, status);
create index group_invitations_inviter_idx on public.group_invitations (inviter_id, status);

create table public.group_tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text check (description is null or char_length(description) <= 4000),
  due_date timestamptz,
  assignee_id uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'done')),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index group_tasks_group_id_idx on public.group_tasks (group_id);
create index group_tasks_assignee_id_idx on public.group_tasks (assignee_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.protect_profile_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id or new.created_at <> old.created_at then
    raise exception 'Profile identity fields cannot be changed';
  end if;
  return new;
end;
$$;

create or replace function private.protect_group_task_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
     or new.group_id <> old.group_id
     or new.created_by <> old.created_by
     or new.created_at <> old.created_at then
    raise exception 'Group task identity fields cannot be changed';
  end if;
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();
create trigger profiles_protect_identity
before update on public.profiles
for each row execute function private.protect_profile_identity();
create trigger study_groups_set_updated_at
before update on public.study_groups
for each row execute function private.set_updated_at();
create trigger group_tasks_set_updated_at
before update on public.group_tasks
for each row execute function private.set_updated_at();
create trigger group_tasks_protect_identity
before update on public.group_tasks
for each row execute function private.protect_group_task_identity();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_username text;
  generated_username text;
  generated_display_name text;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, ''), '@', 1), ''),
    '[^a-z0-9_]+', '_', 'g'
  ));
  base_username := trim(both '_' from base_username);
  if char_length(base_username) < 3 then
    base_username := 'user';
  end if;
  base_username := left(base_username, 31);
  generated_username := base_username || '_' || left(replace(new.id::text, '-', ''), 8);
  generated_display_name := left(coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(split_part(coalesce(new.email, ''), '@', 1)), ''),
    'User'
  ), 80);

  insert into public.profiles (id, username, display_name)
  values (new.id, generated_username, generated_display_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function private.handle_new_auth_user();

insert into public.profiles (id, username, display_name)
select
  users.id,
  'user_' || left(replace(users.id::text, '-', ''), 8),
  left(coalesce(
    nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(split_part(coalesce(users.email, ''), '@', 1)), ''),
    'User'
  ), 80)
from auth.users as users
on conflict (id) do nothing;

create or replace function private.is_group_member(requested_group_id uuid, requested_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = requested_group_id and user_id = requested_user_id
  );
$$;

create or replace function private.is_group_owner(requested_group_id uuid, requested_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = requested_group_id and user_id = requested_user_id and role = 'owner'
  );
$$;

alter table public.profiles enable row level security;
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invitations enable row level security;
alter table public.group_tasks enable row level security;

create policy profiles_read_safe_directory
on public.profiles for select to authenticated
using (discoverable or id = (select auth.uid()));
create policy profiles_update_self
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy study_groups_read_members
on public.study_groups for select to authenticated
using (private.is_group_member(id, (select auth.uid())));

create policy group_members_read_members
on public.group_members for select to authenticated
using (private.is_group_member(group_id, (select auth.uid())));

create policy group_invitations_read_participants
on public.group_invitations for select to authenticated
using (inviter_id = (select auth.uid()) or invitee_id = (select auth.uid()));

create policy group_tasks_read_members
on public.group_tasks for select to authenticated
using (private.is_group_member(group_id, (select auth.uid())));
create policy group_tasks_insert_members
on public.group_tasks for insert to authenticated
with check (
  private.is_group_member(group_id, (select auth.uid()))
  and created_by = (select auth.uid())
  and (assignee_id is null or private.is_group_member(group_id, assignee_id))
);
create policy group_tasks_update_members
on public.group_tasks for update to authenticated
using (private.is_group_member(group_id, (select auth.uid())))
with check (
  private.is_group_member(group_id, (select auth.uid()))
  and (assignee_id is null or private.is_group_member(group_id, assignee_id))
);
create policy group_tasks_delete_members
on public.group_tasks for delete to authenticated
using (private.is_group_member(group_id, (select auth.uid())));

create or replace function public.create_group_with_owner(p_name text, p_description text default null)
returns public.study_groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  created_group public.study_groups;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;
  if char_length(btrim(p_name)) not between 1 and 120 then
    raise exception 'Group name must contain 1 to 120 characters';
  end if;

  insert into public.study_groups (name, description, created_by)
  values (btrim(p_name), nullif(btrim(p_description), ''), caller_id)
  returning * into created_group;

  insert into public.group_members (group_id, user_id, role)
  values (created_group.id, caller_id, 'owner');
  return created_group;
end;
$$;

create or replace function public.search_invitable_profiles(p_group_id uuid, p_query text)
returns table (id uuid, username text, display_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_query text := btrim(coalesce(p_query, ''));
begin
  if caller_id is null then raise exception 'Authentication required'; end if;
  if not private.is_group_owner(p_group_id, caller_id) then
    raise exception 'Only the group owner can search for invitees';
  end if;
  if char_length(normalized_query) < 2 then
    raise exception 'Search query must contain at least 2 characters';
  end if;

  return query
  select profiles.id, profiles.username, profiles.display_name
  from public.profiles as profiles
  where profiles.discoverable
    and profiles.id <> caller_id
    and (profiles.username ilike '%' || normalized_query || '%'
      or profiles.display_name ilike '%' || normalized_query || '%')
    and not exists (
      select 1 from public.group_members as members
      where members.group_id = p_group_id and members.user_id = profiles.id
    )
    and not exists (
      select 1 from public.group_invitations as invitations
      where invitations.group_id = p_group_id
        and invitations.invitee_id = profiles.id
        and invitations.status = 'pending'
    )
  order by profiles.display_name, profiles.username
  limit 20;
end;
$$;

create or replace function public.send_group_invitation(p_group_id uuid, p_invitee_id uuid)
returns public.group_invitations
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  created_invitation public.group_invitations;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;
  if not private.is_group_owner(p_group_id, caller_id) then
    raise exception 'Only the group owner can invite users';
  end if;
  if p_invitee_id = caller_id then raise exception 'You cannot invite yourself'; end if;
  if not exists (select 1 from public.profiles where id = p_invitee_id and discoverable) then
    raise exception 'Invitee is not available';
  end if;
  if private.is_group_member(p_group_id, p_invitee_id) then
    raise exception 'User is already a group member';
  end if;

  insert into public.group_invitations (group_id, inviter_id, invitee_id)
  values (p_group_id, caller_id, p_invitee_id)
  returning * into created_invitation;
  return created_invitation;
exception
  when unique_violation then
    raise exception 'A pending invitation already exists for this user';
end;
$$;

create or replace function public.respond_group_invitation(p_invitation_id uuid, p_response text)
returns public.group_invitations
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  invitation public.group_invitations;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;
  if p_response not in ('accepted', 'declined') then
    raise exception 'Response must be accepted or declined';
  end if;

  select * into invitation
  from public.group_invitations
  where id = p_invitation_id
  for update;

  if not found or invitation.invitee_id <> caller_id then
    raise exception 'Invitation not found';
  end if;
  if invitation.status <> 'pending' then
    raise exception 'Invitation has already been answered';
  end if;

  if p_response = 'accepted' then
    insert into public.group_members (group_id, user_id, role)
    values (invitation.group_id, caller_id, 'member')
    on conflict (group_id, user_id) do nothing;
  end if;

  update public.group_invitations
  set status = p_response, responded_at = now()
  where id = invitation.id
  returning * into invitation;
  return invitation;
end;
$$;

revoke all on schema private from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
revoke all on public.profiles, public.study_groups, public.group_members,
  public.group_invitations, public.group_tasks from anon;
revoke all on public.profiles, public.study_groups, public.group_members,
  public.group_invitations, public.group_tasks from authenticated;

grant usage on schema public to authenticated;
grant select on public.profiles, public.study_groups, public.group_members,
  public.group_invitations, public.group_tasks to authenticated;
grant update (username, display_name, discoverable) on public.profiles to authenticated;
grant insert, update, delete on public.group_tasks to authenticated;

revoke all on function public.create_group_with_owner(text, text) from public, anon;
revoke all on function public.search_invitable_profiles(uuid, text) from public, anon;
revoke all on function public.send_group_invitation(uuid, uuid) from public, anon;
revoke all on function public.respond_group_invitation(uuid, text) from public, anon;
grant execute on function public.create_group_with_owner(text, text) to authenticated;
grant execute on function public.search_invitable_profiles(uuid, text) to authenticated;
grant execute on function public.send_group_invitation(uuid, uuid) to authenticated;
grant execute on function public.respond_group_invitation(uuid, text) to authenticated;

grant select on public.profiles, public.study_groups, public.group_members,
  public.group_invitations, public.group_tasks to powersync_role;

alter publication powersync add table public.profiles;
alter publication powersync add table public.study_groups;
alter publication powersync add table public.group_members;
alter publication powersync add table public.group_invitations;
alter publication powersync add table public.group_tasks;
