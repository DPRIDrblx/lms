-- ============================================================
-- Nusantara International Academy — Advanced Expansion (Chapters, TU, Events)
-- ============================================================

-- 1. UPDATE PROFILES ROLE CONSTRAINT FOR "TU"
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'teacher', 'parent', 'tu'));

-- 2. CHAPTERS TABLE
create table if not exists public.chapters (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  order_index integer default 0,
  created_at timestamptz default now()
);

alter table public.chapters enable row level security;
create policy "Authenticated users can view chapters" on public.chapters for select using (auth.role() = 'authenticated');
create policy "Teachers can manage chapters" on public.chapters for all using (
  exists (select 1 from public.courses where id = course_id and teacher_id = auth.uid())
);

-- 3. LINK LESSONS, QUIZZES, ASSIGNMENTS TO CHAPTERS
alter table public.lessons add column if not exists chapter_id uuid references public.chapters(id) on delete set null;
alter table public.quizzes add column if not exists chapter_id uuid references public.chapters(id) on delete set null;
alter table public.assignments add column if not exists chapter_id uuid references public.chapters(id) on delete set null;

-- 4. OFFLINE GRADING SUPPORT
alter table public.student_scores drop constraint if exists student_scores_target_type_check;
alter table public.student_scores add constraint student_scores_target_type_check 
  check (target_type in ('quiz', 'assignment', 'offline'));

alter table public.student_scores add column if not exists task_name text; -- For offline tasks

-- 5. SCHOOL EVENTS TABLE
create table if not exists public.school_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  event_date date not null,
  start_time time,
  category text check (category in ('academic', 'holiday', 'sports', 'ceremony')) default 'academic',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.school_events enable row level security;
create policy "Anyone can view school events" on public.school_events for select using (true);
create policy "TU and Teachers can manage events" on public.school_events for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('tu', 'teacher'))
);

-- 6. FINANCE BILLS (ENHANCED FOR TU)
-- Already exists, but we'll ensure TU can manage them
create policy "TU can manage all bills" on public.finance_bills for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'tu')
);

-- 7. ENABLE REALTIME FOR NEW TABLES
alter publication supabase_realtime add table public.chapters;
alter publication supabase_realtime add table public.school_events;
alter publication supabase_realtime add table public.lessons; -- already there usually
alter publication supabase_realtime add table public.quizzes;
alter publication supabase_realtime add table public.assignments;
