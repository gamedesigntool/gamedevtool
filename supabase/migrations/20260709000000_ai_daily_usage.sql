-- Minimal Secure AI abuse/cost guard.
-- Stores only per-user daily request counts; no prompts, messages, document content, or provider details.

create table if not exists public.ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  request_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date),
  constraint ai_daily_usage_request_count_nonnegative check (request_count >= 0)
);

alter table public.ai_daily_usage enable row level security;

drop policy if exists "Users can read own AI daily usage" on public.ai_daily_usage;

create policy "Users can read own AI daily usage"
on public.ai_daily_usage
for select
to authenticated
using (user_id = auth.uid());

drop function if exists public.try_consume_ai_daily_request(integer);

create or replace function public.try_consume_ai_daily_request()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  current_usage_date date := (timezone('utc', now()))::date;
  daily_request_limit integer := 50;
  consumed_count integer;
begin
  if current_user_id is null then
    return jsonb_build_object(
      'allowed', false,
      'requestCount', 0,
      'requestLimit', daily_request_limit,
      'usageDate', current_usage_date::text,
      'reason', 'unauthorized'
    );
  end if;

  insert into public.ai_daily_usage as usage (
    user_id,
    usage_date,
    request_count
  )
  values (
    current_user_id,
    current_usage_date,
    1
  )
  on conflict (user_id, usage_date)
  do update
    set request_count = usage.request_count + 1,
        updated_at = now()
    where usage.request_count < daily_request_limit
  returning usage.request_count into consumed_count;

  if consumed_count is null then
    select request_count
    into consumed_count
    from public.ai_daily_usage
    where user_id = current_user_id
      and usage_date = current_usage_date;

    return jsonb_build_object(
      'allowed', false,
      'requestCount', coalesce(consumed_count, daily_request_limit),
      'requestLimit', daily_request_limit,
      'usageDate', current_usage_date::text,
      'reason', 'daily_limit_reached'
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'requestCount', consumed_count,
    'requestLimit', daily_request_limit,
    'usageDate', current_usage_date::text
  );
end;
$$;

revoke all on function public.try_consume_ai_daily_request() from public;
grant execute on function public.try_consume_ai_daily_request() to authenticated;
grant select on public.ai_daily_usage to authenticated;
