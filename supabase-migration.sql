-- ============================================================
-- Nusantara International Academy — Database Migration
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ============================================================

-- 1. PROFILES TABLE (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text check (role in ('student', 'teacher')) default 'student',
  xp integer default 0,
  rank text default 'Beginner',
  avatar_url text,
  face_descriptor jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- 2. FINANCE BILLS TABLE
create table if not exists public.finance_bills (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  month text not null,
  amount bigint not null,
  status text check (status in ('paid', 'unpaid')) default 'unpaid',
  payment_method text,
  paid_at timestamptz,
  receipt_url text,
  created_at timestamptz default now()
);

alter table public.finance_bills enable row level security;

create policy "Students can view own bills"
  on public.finance_bills for select using (auth.uid() = student_id);

create policy "Teachers can view all bills"
  on public.finance_bills for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

create policy "Students can update own bills"
  on public.finance_bills for update using (auth.uid() = student_id);

create policy "Teachers can manage all bills"
  on public.finance_bills for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

-- 3. ATTENDANCE SESSIONS TABLE
create table if not exists public.attendance_sessions (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  class_name text,
  qr_code_payload text unique not null,
  is_active boolean default true,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.attendance_sessions enable row level security;

create policy "Anyone authenticated can view sessions"
  on public.attendance_sessions for select using (auth.role() = 'authenticated');

create policy "Teachers can create sessions"
  on public.attendance_sessions for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

create policy "Teachers can update own sessions"
  on public.attendance_sessions for update using (auth.uid() = teacher_id);

-- 4. ATTENDANCE LOGS TABLE
create table if not exists public.attendance_logs (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.attendance_sessions(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  check_in_time timestamptz default now(),
  method text check (method in ('qr', 'ai')) default 'qr',
  mood_score integer check (mood_score between 1 and 5),
  readiness_score integer check (readiness_score between 1 and 5),
  notes text,
  unique(session_id, student_id)
);

alter table public.attendance_logs enable row level security;

create policy "Students can view own logs"
  on public.attendance_logs for select using (auth.uid() = student_id);

create policy "Students can insert own logs"
  on public.attendance_logs for insert with check (auth.uid() = student_id);

create policy "Teachers can view all logs"
  on public.attendance_logs for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

-- 5. COURSE PROGRESS TABLE
create table if not exists public.course_progress (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  course_id text not null,
  lesson_id text not null,
  completed boolean default false,
  completed_at timestamptz,
  xp_earned integer default 0,
  unique(student_id, course_id, lesson_id)
);

alter table public.course_progress enable row level security;

create policy "Students can view own progress"
  on public.course_progress for select using (auth.uid() = student_id);

create policy "Students can upsert own progress"
  on public.course_progress for insert with check (auth.uid() = student_id);

create policy "Students can update own progress"
  on public.course_progress for update using (auth.uid() = student_id);

create policy "Teachers can view all progress"
  on public.course_progress for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

-- 6. AUTO-CREATE PROFILE ON SIGNUP (trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. ENABLE REALTIME for attendance_logs (for QR attendance live sync)
alter publication supabase_realtime add table public.attendance_logs;

-- 8. SEED DATA (optional — run after creating test accounts)
-- You can insert demo finance bills after creating student accounts:
--
-- insert into public.finance_bills (student_id, month, amount, status) values
--   ('<student-uuid>', 'January 2026', 2500000, 'paid'),
--   ('<student-uuid>', 'February 2026', 2500000, 'paid'),
--   ('<student-uuid>', 'March 2026', 2500000, 'unpaid'),
--   ('<student-uuid>', 'April 2026', 2500000, 'unpaid'),
--   ('<student-uuid>', 'May 2026', 2500000, 'unpaid');
