-- Run as the database administrator. Requires two existing Auth users.
-- The inner subtransaction rolls back all fixtures, including on failure.
do $$
declare
  alice uuid;
  bob uuid;
  test_group uuid := gen_random_uuid();
  test_task uuid := gen_random_uuid();
  stored public.group_tasks;
  before_write timestamptz;
  affected integer;
begin
  begin
    select id into alice from auth.users order by id limit 1;
    select id into bob from auth.users where id <> alice order by id limit 1;
    if alice is null or bob is null then
      raise exception 'Audit regression requires two Auth users';
    end if;
    insert into public.study_groups (id, name, created_by)
    values (test_group, 'Disposable audit regression', alice);
    insert into public.group_members (group_id, user_id, role)
    values (test_group, alice, 'owner');

    perform set_config('request.jwt.claim.sub', alice::text, true);
    execute 'set local role authenticated';
    before_write := clock_timestamp();
    insert into public.group_tasks
      (id, group_id, title, created_by, updated_by, created_at, updated_at)
    values
      (test_task, test_group, 'Audit probe', alice, bob,
       '2020-01-01T00:00:00Z', '2000-01-01T00:00:00Z')
    returning * into stored;
    if stored.updated_by is distinct from alice then
      raise exception 'Forged insert actor was accepted';
    end if;
    if stored.updated_at < before_write or stored.updated_at > clock_timestamp() then
      raise exception 'Insert timestamp is not server acceptance time';
    end if;
    if stored.created_at <> '2020-01-01T00:00:00Z'::timestamptz then
      raise exception 'Client creation time was not preserved';
    end if;

    begin
      update public.group_tasks set created_by = bob where id = test_task;
      raise exception 'Creator mutation was accepted';
    exception when raise_exception then
      if sqlerrm <> 'Group task identity fields cannot be changed' then raise; end if;
    end;
    begin
      update public.group_tasks set created_at = now() where id = test_task;
      raise exception 'Creation timestamp mutation was accepted';
    exception when raise_exception then
      if sqlerrm <> 'Group task identity fields cannot be changed' then raise; end if;
    end;
    begin
      update public.group_tasks set group_id = gen_random_uuid() where id = test_task;
      raise exception 'Group mutation was accepted';
    exception when raise_exception then
      if sqlerrm <> 'Group task identity fields cannot be changed' then raise; end if;
    end;

    perform set_config('request.jwt.claim.sub', bob::text, true);
    update public.group_tasks set title = 'Unauthorized' where id = test_task;
    get diagnostics affected = row_count;
    if affected <> 0 then raise exception 'Non-member changed a task'; end if;
    begin
      insert into public.group_tasks (group_id, title, created_by)
      values (test_group, 'Unauthorized', bob);
      raise exception 'Non-member created a task';
    exception when insufficient_privilege then null;
    end;

    execute 'reset role';
    select * into stored from public.group_tasks where id = test_task;
    if stored.title <> 'Audit probe' or stored.created_by <> alice
       or stored.created_at <> '2020-01-01T00:00:00Z'::timestamptz
       or stored.group_id <> test_group then
      raise exception 'Rejected changes modified the stored row';
    end if;
    insert into public.group_members (group_id, user_id, role)
    values (test_group, bob, 'member');
    execute 'set local role authenticated';
    before_write := clock_timestamp();
    update public.group_tasks
    set title = 'Bob edited', updated_by = alice, updated_at = '2000-01-01T00:00:00Z'
    where id = test_task returning * into stored;
    if stored.updated_by is distinct from bob or stored.title <> 'Bob edited' then
      raise exception 'Forged update actor was accepted';
    end if;
    if stored.updated_at < before_write or stored.updated_at > clock_timestamp() then
      raise exception 'Update timestamp is not server acceptance time';
    end if;

    perform set_config('request.jwt.claim.sub', '', true);
    begin
      insert into public.group_tasks (group_id, title, created_by)
      values (test_group, 'Missing actor', alice);
      raise exception 'Write without an authenticated actor was accepted';
    exception when raise_exception then
      if sqlerrm <> 'Authenticated task actor required' then raise; end if;
    end;
    execute 'set local role anon';
    begin
      insert into public.group_tasks (group_id, title, created_by)
      values (test_group, 'Anonymous', alice);
      raise exception 'Anonymous task creation was accepted';
    exception when insufficient_privilege then null;
    end;

    -- Deliberately roll back this successful test's entire fixture subtransaction.
    raise sqlstate 'ZX001' using message = 'Rollback successful audit regression';
  exception when sqlstate 'ZX001' then null;
  end;
end;
$$;
