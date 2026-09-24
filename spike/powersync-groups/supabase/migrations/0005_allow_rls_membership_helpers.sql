-- RLS policies execute as the authenticated caller and therefore need permission
-- to call the two read-only membership predicates. The private schema is not
-- exposed through the Supabase Data API.
grant usage on schema private to authenticated;
grant execute on function private.is_group_member(uuid, uuid) to authenticated;
grant execute on function private.is_group_owner(uuid, uuid) to authenticated;
