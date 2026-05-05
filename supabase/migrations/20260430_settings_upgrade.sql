create table if not exists public.user_settings (
    id uuid primary key default gen_random_uuid(),
    user_id text not null unique,
    email_notifications boolean not null default true,
    push_notifications boolean not null default true,
    weekly_report boolean not null default true,
    monthly_report boolean not null default true,
    sound_enabled boolean not null default true,
    sound_volume integer not null default 70 check (sound_volume >= 0 and sound_volume <= 100),
    theme text not null default 'light' check (theme in ('light', 'dark')),
    reduced_motion boolean not null default false,
    currency text not null default 'USD',
    ai_live_enabled boolean not null default true,
    ai_memory_enabled boolean not null default true,
    ai_auto_refresh boolean not null default true,
    ai_include_pending_candidates boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_user_settings_user_id on public.user_settings(user_id);

alter table public.user_settings enable row level security;

drop policy if exists "Users can read own settings" on public.user_settings;
create policy "Users can read own settings"
on public.user_settings for select
using (auth.uid()::text = user_id);

drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings"
on public.user_settings for insert
with check (auth.uid()::text = user_id);

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
on public.user_settings for update
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

grant select, insert, update on public.user_settings to authenticated;
