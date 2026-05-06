-- ============================================================
-- Nusantara International Academy — Expansion Migration
-- ============================================================

-- 1. UPDATE PROFILES ROLE CONSTRAINT
-- Note: In Supabase, you might need to drop and recreate the constraint if it exists.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'teacher', 'parent'));

-- 2. COURSES TABLE
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  cover_image text,
  category text,
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.courses enable row level security;

create policy "Anyone authenticated can view published courses"
  on public.courses for select using (is_published = true or auth.uid() = teacher_id);

create policy "Teachers can manage own courses"
  on public.courses for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
    and auth.uid() = teacher_id
  );

-- 3. LESSONS TABLE
create table if not exists public.lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  content_type text check (content_type in ('text', 'video', 'pdf')) default 'text',
  body_text text,
  video_url text,
  pdf_url text,
  order_index integer default 0,
  xp_reward integer default 10,
  created_at timestamptz default now()
);

alter table public.lessons enable row level security;

create policy "Students can view lessons of enrolled courses"
  on public.lessons for select using (true); -- Simplified for demo, can be narrowed

create policy "Teachers can manage lessons of own courses"
  on public.lessons for all using (
    exists (
      select 1 from public.courses 
      where id = course_id and teacher_id = auth.uid()
    )
  );

-- 4. ASSIGNMENTS TABLE
create table if not exists public.assignments (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  deadline timestamptz,
  attachment_required boolean default false,
  xp_reward integer default 50,
  created_at timestamptz default now()
);

alter table public.assignments enable row level security;

create policy "Authenticated users can view assignments"
  on public.assignments for select using (auth.role() = 'authenticated');

create policy "Teachers can manage assignments"
  on public.assignments for all using (
    exists (
      select 1 from public.courses 
      where id = course_id and teacher_id = auth.uid()
    )
  );

-- 5. QUIZZES (CBT) TABLE
create table if not exists public.quizzes (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  time_limit_minutes integer,
  passing_score integer default 60,
  is_randomized boolean default false,
  created_at timestamptz default now()
);

alter table public.quizzes enable row level security;

create policy "Authenticated users can view quizzes"
  on public.quizzes for select using (auth.role() = 'authenticated');

-- 6. QUESTIONS TABLE
create table if not exists public.questions (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  question_text text not null,
  question_type text check (question_type in ('mcq', 'essay')) default 'mcq',
  options jsonb, -- For MCQ: [{"text": "Option A", "is_correct": true}, ...]
  points integer default 10,
  order_index integer default 0
);

alter table public.questions enable row level security;

-- 7. STUDENT SCORES & SUBMISSIONS
create table if not exists public.student_scores (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  target_id uuid not null, -- references quizzes(id) or assignments(id)
  target_type text check (target_type in ('quiz', 'assignment')) not null,
  score integer,
  feedback text,
  submission_url text,
  is_graded boolean default false,
  graded_at timestamptz,
  created_at timestamptz default now()
);

alter table public.student_scores enable row level security;

create policy "Students can view own scores"
  on public.student_scores for select using (auth.uid() = student_id);

create policy "Teachers can manage all scores"
  on public.student_scores for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

-- 8. PARENT-STUDENT LINKS
create table if not exists public.parent_student_links (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references public.profiles(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(parent_id, student_id)
);

alter table public.parent_student_links enable row level security;

create policy "Parents can view their linked students"
  on public.parent_student_links for select using (auth.uid() = parent_id);

-- 9. ALLOW PARENTS TO VIEW THEIR CHILDREN'S DATA
-- Update attendance_logs policy
create policy "Parents can view their children's logs"
  on public.attendance_logs for select using (
    exists (
      select 1 from public.parent_student_links 
      where parent_id = auth.uid() and student_id = public.attendance_logs.student_id
    )
  );

-- Update finance_bills policy
create policy "Parents can view their children's bills"
  on public.finance_bills for select using (
    exists (
      select 1 from public.parent_student_links 
      where parent_id = auth.uid() and student_id = public.finance_bills.student_id
    )
  );

-- Update student_scores policy
create policy "Parents can view their children's scores"
  on public.student_scores for select using (
    exists (
      select 1 from public.parent_student_links 
      where parent_id = auth.uid() and student_id = public.student_scores.student_id
    )
  );

-- 10. ENABLE REALTIME for new tables
alter publication supabase_realtime add table public.student_scores;
alter publication supabase_realtime add table public.attendance_logs; -- already added in previous, but safe to keep
