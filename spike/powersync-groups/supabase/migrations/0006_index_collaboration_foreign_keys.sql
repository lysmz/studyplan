-- Cover the remaining user foreign keys reported by the Supabase advisor.
create index study_groups_created_by_idx on public.study_groups (created_by);
create index group_tasks_created_by_idx on public.group_tasks (created_by);
create index group_tasks_updated_by_idx on public.group_tasks (updated_by);
