-- Enable pgcrypto for gen_random_uuid
create extension if not exists pgcrypto;

create table if not exists public.glucose_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  glucose_mgdl integer not null,
  logged_at timestamptz not null default now(),
  meal_tag text null check (
    meal_tag in (
      'fasting',
      'before_breakfast',
      'after_breakfast',
      'before_lunch',
      'after_lunch',
      'before_dinner',
      'after_dinner',
      'before_meal',
      'after_meal',
      'bedtime',
      'other'
    )
  ),
  insulin_units numeric null,
  carbs_grams numeric null,
  notes text null,
  created_at timestamptz not null default now(),
  constraint glucose_positive check (glucose_mgdl > 0),
  constraint insulin_nonnegative check (insulin_units is null or insulin_units >= 0),
  constraint carbs_nonnegative check (carbs_grams is null or carbs_grams >= 0)
);

alter table public.glucose_logs enable row level security;

create policy "Users can select own glucose logs"
  on public.glucose_logs
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own glucose logs"
  on public.glucose_logs
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own glucose logs"
  on public.glucose_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own glucose logs"
  on public.glucose_logs
  for delete
  using (auth.uid() = user_id);

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  constraint emergency_contacts_name_nonempty check (length(trim(name)) > 0),
  constraint emergency_contacts_phone_nonempty check (length(trim(phone)) > 0)
);

alter table public.emergency_contacts enable row level security;

drop policy if exists "Users can select own emergency contacts" on public.emergency_contacts;
drop policy if exists "Users can insert own emergency contacts" on public.emergency_contacts;
drop policy if exists "Users can update own emergency contacts" on public.emergency_contacts;
drop policy if exists "Users can delete own emergency contacts" on public.emergency_contacts;

create policy "Users can select own emergency contacts"
  on public.emergency_contacts
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own emergency contacts"
  on public.emergency_contacts
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own emergency contacts"
  on public.emergency_contacts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own emergency contacts"
  on public.emergency_contacts
  for delete
  using (auth.uid() = user_id);
