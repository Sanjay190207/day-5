-- Day 5 schema — run this once in the Supabase SQL Editor.
-- It resets to a clean slate (drops the previous experiment), creates the
-- tables in the shape the guide uses (votes as ROWS, not a column), adds the
-- indexes, and seeds 25 questions so pagination and search have volume.

-- ── reset ──────────────────────────────────────────────────────────────────
drop table if exists votes;
drop table if exists questions cascade;
drop function if exists increment_question_votes(uuid);
-- End of reset section

-- Start of questions table creation

-- ── questions (Feature 1) ────────────────────────────────────────────────────
create table questions (
  id          uuid primary key default gen_random_uuid(),
  body        text not null,
  author      text,
  created_at  timestamptz default now()
);

-- ── votes (Feature 3) ────────────────────────────────────────────────────────
-- one row per vote; the FK guarantees a vote points at a real question, and
-- the unique constraint enforces one vote per voter per question.
create table votes (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references questions(id) on delete cascade,
  voter_id     text not null,
  created_at   timestamptz default now(),
  unique (question_id, voter_id)
);

create index votes_question_id_idx on votes (question_id);

-- ── full-text search index (Feature 5) ───────────────────────────────────────
-- GIN = Generalized INverted index: the word → documents map behind search.
create index questions_fts_idx on questions using gin (to_tsvector('english', body));

-- ── seed (~25 questions, spaced out in time so ordering is stable) ───────────
insert into questions (body, author, created_at) values
  ('How do I deploy to Vercel?', 'Priya', now() - '25 minutes'::interval),
  ('What is the difference between server and client components?', 'Marcus', now() - '24 minutes'::interval),
  ('When should I add a database index?', 'Aisha', now() - '23 minutes'::interval),
  ('How does Postgres full-text search work?', 'Diego', now() - '22 minutes'::interval),
  ('Why did my in-memory data vanish on restart?', 'Lena', now() - '21 minutes'::interval),
  ('Should I store a vote count or count vote rows?', 'Sam', now() - '20 minutes'::interval),
  ('What is a unique constraint good for?', 'Priya', now() - '19 minutes'::interval),
  ('How do I prevent double voting?', 'Noah', now() - '18 minutes'::interval),
  ('What is the difference between SSR and hydration?', 'Aisha', now() - '17 minutes'::interval),
  ('How does optimistic UI actually work?', 'Marcus', now() - '16 minutes'::interval),
  ('When do I really need pagination?', 'Ravi', now() - '15 minutes'::interval),
  ('Offset vs cursor pagination - which one?', 'Lena', now() - '14 minutes'::interval),
  ('How do I debounce a search input?', 'Diego', now() - '13 minutes'::interval),
  ('Why must secrets stay on the server?', 'Sam', now() - '12 minutes'::interval),
  ('What is row-level security in Supabase?', 'Noah', now() - '11 minutes'::interval),
  ('How does connection pooling help on Vercel?', 'Priya', now() - '10 minutes'::interval),
  ('What is a GIN index and when do I use it?', 'Ravi', now() - '9 minutes'::interval),
  ('How do foreign keys protect my data?', 'Aisha', now() - '8 minutes'::interval),
  ('When should I move counts into a cache?', 'Marcus', now() - '7 minutes'::interval),
  ('How do I run a database migration safely?', 'Lena', now() - '6 minutes'::interval),
  ('What does on delete cascade actually do?', 'Diego', now() - '5 minutes'::interval),
  ('How do I seed test data quickly?', 'Sam', now() - '4 minutes'::interval),
  ('Why is my Vercel function cold starting?', 'Noah', now() - '3 minutes'::interval),
  ('How do I scale reads with replicas?', 'Ravi', now() - '2 minutes'::interval),
  ('What is the best way to add auth later?', 'Priya', now() - '1 minutes'::interval);
