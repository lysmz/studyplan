-- Run as database administrator after migrations. Requires two existing Auth users.
-- Every fixture, task mutation and receipt rolls back on success or failure.
do $$
declare
  alice uuid; bob uuid;
  test_group uuid := gen_random_uuid();
  test_task uuid := gen_random_uuid();
  denied_task uuid := gen_random_uuid();
  replica uuid := gen_random_uuid();
  other_replica uuid := gen_random_uuid();
  payload jsonb;
  outcome jsonb;
  stored public.group_tasks;
  affected integer;
begin
  begin
    select id into alice from auth.users order by id limit 1;
    select id into bob from auth.users where id <> alice order by id limit 1;
    if alice is null or bob is null then raise exception 'Upload regression requires two Auth users'; end if;
    insert into public.study_groups (id, name, created_by) values (test_group, 'Disposable upload regression', alice);
    insert into public.group_members (group_id, user_id, role) values (test_group, alice, 'owner');
    payload := jsonb_build_object('group_id', test_group, 'title', 'Alice original', 'created_by', alice,
      'updated_by', bob, 'updated_at', '2000-01-01T00:00:00Z');
    perform set_config('request.jwt.claim.sub', alice::text, true);
    execute 'set local role authenticated';
    outcome := public.upload_group_task(replica, '1', test_task, 'PUT', payload);
    if outcome ->> 'outcome' <> 'accepted' then raise exception 'Owner PUT failed: %', outcome; end if;
    select * into stored from public.group_tasks where id = test_task;
    if stored.updated_by <> alice or stored.updated_at < now() then raise exception 'RPC bypassed audit attribution'; end if;
    outcome := public.upload_group_task(replica, '1', test_task, 'PUT', payload);
    if outcome ->> 'outcome' <> 'already_applied' then raise exception 'Matching PUT replay failed: %', outcome; end if;
    outcome := public.upload_group_task(replica, '1', test_task, 'PUT', payload || '{"title":"Changed payload"}'::jsonb);
    if outcome ->> 'code' <> 'OPERATION_CONFLICT' then raise exception 'Changed operation payload was accepted'; end if;
    outcome := public.upload_group_task(other_replica, '1', test_task, 'PUT', payload);
    if outcome ->> 'code' <> 'TASK_CONFLICT' then raise exception 'Unproven task collision was accepted'; end if;
    outcome := public.upload_group_task(replica, '2', test_task, 'PATCH', jsonb_build_object('group_id', gen_random_uuid()));
    if outcome ->> 'code' <> 'INVALID_TASK' then raise exception 'Immutable task identity was accepted'; end if;
    outcome := public.upload_group_task(replica, '3', test_task, 'PATCH', jsonb_build_object('assignee_id', bob));
    if outcome ->> 'outcome' <> 'rejected' then raise exception 'Non-member assignment was accepted'; end if;

    perform set_config('request.jwt.claim.sub', bob::text, true);
    outcome := public.upload_group_task(replica, '1', test_task, 'PATCH', '{"title":"Unauthorized"}'::jsonb);
    if outcome <> '{"outcome":"rejected","code":"MISSING_OR_INACCESSIBLE"}'::jsonb then
      raise exception 'Hidden PATCH did not produce the opaque outcome: %', outcome;
    end if;
    outcome := public.upload_group_task(replica, '2', denied_task, 'PUT', jsonb_build_object('group_id', test_group, 'title', 'Denied', 'created_by', bob));
    if outcome ->> 'outcome' <> 'rejected' then raise exception 'Non-member PUT was accepted'; end if;
    outcome := public.upload_group_task(replica, '3', test_task, 'DELETE', '{}'::jsonb);
    if outcome ->> 'outcome' <> 'accepted' then raise exception 'Hidden DELETE did not return a safe no-op'; end if;
    if exists (select 1 from private.group_task_upload_receipts where user_id = alice) then
      raise exception 'Cross-user receipts readable';
    end if;
    update private.group_task_upload_receipts set result = '{"outcome":"accepted"}'::jsonb where user_id = alice;
    get diagnostics affected = row_count;
    if affected <> 0 then raise exception 'Cross-user receipt update succeeded'; end if;
    begin
      insert into private.group_task_upload_receipts (user_id, replica_id, operation_id, payload)
      values (alice, replica, '99', '{}'::jsonb);
      raise exception 'Cross-user receipt insertion succeeded';
    exception when insufficient_privilege then null;
    end;
    outcome := public.upload_group_task(replica, '2', denied_task, 'PUT', jsonb_build_object('group_id', test_group, 'title', 'Denied', 'created_by', bob));
    if outcome ->> 'outcome' <> 'rejected' then raise exception 'Rejected replay was accepted'; end if;

    execute 'reset role';
    select * into stored from public.group_tasks where id = test_task;
    if stored.title <> 'Alice original' then raise exception 'Non-member changed hidden task'; end if;
    insert into public.group_members (group_id, user_id, role) values (test_group, bob, 'member');
    execute 'set local role authenticated';
    outcome := public.upload_group_task(replica, '4', test_task, 'PATCH', '{"title":"Bob newer edit","description":null,"status":"done"}'::jsonb);
    if outcome ->> 'outcome' <> 'accepted' then raise exception 'Member PATCH failed: %', outcome; end if;
    select * into stored from public.group_tasks where id = test_task;
    if stored.updated_by <> bob or stored.status <> 'done' or stored.description is not null then raise exception 'Member PATCH data or actor incorrect'; end if;
    perform set_config('request.jwt.claim.sub', alice::text, true);
    outcome := public.upload_group_task(replica, '1', test_task, 'PUT', payload);
    select * into stored from public.group_tasks where id = test_task;
    if stored.title <> 'Bob newer edit' or stored.updated_by <> bob then raise exception 'Replay overwrote newer edit'; end if;

    -- Inject a transaction failure after the RPC returns: neither mutation nor receipt may persist.
    begin
      outcome := public.upload_group_task(replica, '50', test_task, 'PATCH', '{"title":"Must roll back"}'::jsonb);
      if outcome ->> 'outcome' <> 'accepted' then raise exception 'Rollback fixture PATCH failed'; end if;
      raise sqlstate 'ZX002' using message = 'Injected transaction failure';
    exception when sqlstate 'ZX002' then null;
    end;
    if exists (select 1 from private.group_task_upload_receipts where user_id = alice and replica_id = replica and operation_id = '50') then raise exception 'Receipt survived rolled back task mutation'; end if;
    select * into stored from public.group_tasks where id = test_task;
    if stored.title <> 'Bob newer edit' then raise exception 'Task survived rolled back receipt'; end if;

    outcome := public.upload_group_task(replica, '5', test_task, 'DELETE', '{}'::jsonb);
    outcome := public.upload_group_task(replica, '5', test_task, 'DELETE', '{}'::jsonb);
    if outcome ->> 'outcome' <> 'already_applied' then raise exception 'DELETE replay failed'; end if;
    outcome := public.upload_group_task(replica, '6', test_task, 'DELETE', '{}'::jsonb);
    if outcome ->> 'outcome' <> 'accepted' then raise exception 'Absent DELETE failed'; end if;
    outcome := public.upload_group_task(replica, '7', test_task, 'PATCH', '{"title":"Late edit"}'::jsonb);
    if outcome ->> 'code' <> 'MISSING_OR_INACCESSIBLE' then raise exception 'Late PATCH silently accepted'; end if;
    perform set_config('request.jwt.claim.sub', '', true);
    begin
      perform public.upload_group_task(replica, '8', test_task, 'DELETE', '{}'::jsonb);
      raise exception 'Missing Auth identity accepted';
    exception when insufficient_privilege then null;
    end;
    execute 'set local role anon';
    begin
      perform public.upload_group_task(replica, '9', test_task, 'DELETE', '{}'::jsonb);
      raise exception 'Anonymous RPC accepted';
    exception when insufficient_privilege then null;
    end;
    raise sqlstate 'ZX001' using message = 'Rollback successful upload regression';
  exception when sqlstate 'ZX001' then null;
  end;
end;
$$;
