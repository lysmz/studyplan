-- Private upload metadata; not synchronized and not exposed through the Data API.
-- Retain receipts for the prototype lifetime: offline clients can replay old operations.
create table private.group_task_upload_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  replica_id uuid not null,
  operation_id text not null check (operation_id ~ '^[0-9]{1,20}$'),
  payload jsonb not null,
  result jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, replica_id, operation_id)
);
alter table private.group_task_upload_receipts enable row level security;
create policy task_upload_receipts_read_self on private.group_task_upload_receipts
  for select to authenticated using (user_id = (select auth.uid()));
create policy task_upload_receipts_insert_self on private.group_task_upload_receipts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy task_upload_receipts_update_self on private.group_task_upload_receipts
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on private.group_task_upload_receipts from public, anon, authenticated;
grant usage on schema private to authenticated;
grant select on private.group_task_upload_receipts to authenticated;
grant insert (user_id, replica_id, operation_id, payload) on private.group_task_upload_receipts to authenticated;
grant update (result) on private.group_task_upload_receipts to authenticated;

create function public.upload_group_task(
  p_replica_id uuid, p_operation_id text, p_task_id uuid, p_operation text, p_data jsonb
)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  requested_payload jsonb;
  previous_payload jsonb;
  previous_result jsonb;
  outcome jsonb;
  allowed_keys text[];
  affected integer;
begin
  if caller_id is null then raise insufficient_privilege using message = 'Authentication required'; end if;
  if p_replica_id is null or p_task_id is null or p_operation_id is null
     or p_operation_id !~ '^[0-9]{1,20}$'
     or p_operation is null or p_operation not in ('PUT', 'PATCH', 'DELETE')
     or p_data is null or jsonb_typeof(p_data) <> 'object' then
    return jsonb_build_object('outcome', 'rejected', 'code', 'INVALID_TASK');
  end if;
  requested_payload := jsonb_build_object('task_id', p_task_id, 'operation', p_operation, 'data', p_data);
  insert into private.group_task_upload_receipts (user_id, replica_id, operation_id, payload)
  values (caller_id, p_replica_id, p_operation_id, requested_payload)
  on conflict do nothing;
  -- The insert and row lock serialize concurrent duplicates. The receipt commits with the mutation.
  select payload, result into previous_payload, previous_result
  from private.group_task_upload_receipts
  where user_id = caller_id and replica_id = p_replica_id and operation_id = p_operation_id
  for update;
  if previous_payload is distinct from requested_payload then
    return jsonb_build_object('outcome', 'rejected', 'code', 'OPERATION_CONFLICT');
  end if;
  if previous_result is not null then
    if previous_result ->> 'outcome' = 'accepted' then
      return jsonb_build_object('outcome', 'already_applied');
    end if;
    return previous_result;
  end if;

  allowed_keys := case p_operation
    when 'PUT' then array['group_id','title','description','due_date','assignee_id','status','created_by','created_at','updated_by','updated_at']
    when 'PATCH' then array['title','description','due_date','assignee_id','status','updated_by','updated_at']
    else array[]::text[] end;
  if exists (select 1 from jsonb_object_keys(p_data) as keys(key) where not (key = any(allowed_keys))) then
    outcome := jsonb_build_object('outcome', 'rejected', 'code', 'INVALID_TASK');
  else
    begin
      -- Security invoker preserves existing RLS, grants, identity and audit triggers.
      if p_operation = 'PUT' then
        insert into public.group_tasks
          (id, group_id, title, description, due_date, assignee_id, status, created_by, created_at)
        values (p_task_id, (p_data ->> 'group_id')::uuid, p_data ->> 'title',
          p_data ->> 'description', (p_data ->> 'due_date')::timestamptz,
          (p_data ->> 'assignee_id')::uuid, coalesce(p_data ->> 'status', 'open'),
          coalesce((p_data ->> 'created_by')::uuid, caller_id),
          coalesce((p_data ->> 'created_at')::timestamptz, now()));
        -- A task ID collision without a matching receipt is not proof of prior application.
      elsif p_operation = 'PATCH' then
        update public.group_tasks set
          title = case when p_data ? 'title' then p_data ->> 'title' else title end,
          description = case when p_data ? 'description' then p_data ->> 'description' else description end,
          due_date = case when p_data ? 'due_date' then (p_data ->> 'due_date')::timestamptz else due_date end,
          assignee_id = case when p_data ? 'assignee_id' then (p_data ->> 'assignee_id')::uuid else assignee_id end,
          status = case when p_data ? 'status' then p_data ->> 'status' else status end
        where id = p_task_id;
        get diagnostics affected = row_count;
        if affected = 0 then
          outcome := jsonb_build_object('outcome', 'rejected', 'code', 'MISSING_OR_INACCESSIBLE');
        end if;
      else
        -- Absent and inaccessible rows produce the same no-op outcome and reveal no contents.
        delete from public.group_tasks where id = p_task_id;
      end if;
      outcome := coalesce(outcome, jsonb_build_object('outcome', 'accepted'));
    exception
      when unique_violation then
        outcome := jsonb_build_object('outcome', 'rejected', 'code', 'TASK_CONFLICT');
      when insufficient_privilege then
        outcome := jsonb_build_object('outcome', 'rejected', 'code', 'MISSING_OR_INACCESSIBLE');
      when check_violation or foreign_key_violation or not_null_violation
        or invalid_text_representation or invalid_datetime_format or datetime_field_overflow then
        outcome := jsonb_build_object('outcome', 'rejected', 'code', 'INVALID_TASK');
    end;
  end if;
  update private.group_task_upload_receipts set result = outcome
  where user_id = caller_id and replica_id = p_replica_id and operation_id = p_operation_id;
  return outcome;
end;
$$;
revoke all on function public.upload_group_task(uuid, text, uuid, text, jsonb) from public, anon;
grant execute on function public.upload_group_task(uuid, text, uuid, text, jsonb) to authenticated;
