drop table if exists poll_votes;
drop table if exists poll_options;
drop table if exists polls;
drop table if exists votes;
drop table if exists questions cascade;
create table questions (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  author text,
  created_at timestamptz default now()
);
create table votes (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz default now(),
  unique (question_id, voter_id)
);
create index votes_question_id_idx on votes(question_id);
create index questions_fts_idx
on questions
using gin (to_tsvector('english', body));
create table polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  description text,
  created_at timestamptz default now(),
  closed_at timestamptz
);
create table poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_text text not null,
  created_at timestamptz default now()
);
create table poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_option_id uuid not null references poll_options(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz default now(),
  unique (poll_option_id, voter_id)
);
create index poll_votes_poll_option_id_idx
on poll_votes(poll_option_id);
create index poll_options_poll_id_idx
on poll_options(poll_id);
insert into questions (body, author, created_at)
select body, author, now() - (n || ' minutes')::interval
from (
  values
    (1,  'How do I deploy to Vercel?', 'Priya'),
    (2,  'What''s the difference between server and client components?', 'Marcus'),
    (3,  'When should I add a database index?', 'Aisha'),
    (4,  'How does Postgres full-text search work?', 'Diego'),
    (5,  'Why did my in-memory data vanish on restart?', 'Lena'),
    (6,  'Should I store a vote count or count vote rows?', 'Sam'),
    (7,  'What is a unique constraint good for?', 'Priya'),
    (8,  'How do I prevent double voting?', 'Noah'),
    (9,  'What''s the difference between SSR and hydration?', 'Aisha'),
    (10, 'How does optimistic UI actually work?', 'Marcus'),
    (11, 'When do I really need pagination?', 'Ravi'),
    (12, 'Offset vs cursor pagination — which one?', 'Lena'),
    (13, 'How do I debounce a search input?', 'Diego'),
    (14, 'Why must secrets stay on the server?', 'Sam'),
    (15, 'What is row-level security in Supabase?', 'Noah'),
    (16, 'How does connection pooling help on Vercel?', 'Priya'),
    (17, 'What is a GIN index and when do I use it?', 'Ravi'),
    (18, 'How do foreign keys protect my data?', 'Aisha'),
    (19, 'When should I move counts into a cache?', 'Marcus'),
    (20, 'How do I run a database migration safely?', 'Lena'),
    (21, 'What does on delete cascade actually do?', 'Diego'),
    (22, 'How do I seed test data quickly?', 'Sam'),
    (23, 'Why is my Vercel function cold starting?', 'Noah'),
    (24, 'How do I scale reads with replicas?', 'Ravi'),
    (25, 'What''s the best way to add auth later?', 'Priya')
) as seed(n, body, author);
insert into polls (question, description)
values
(
  'What is your preferred database?',
  'Help us understand which database you use most'
),
(
  'Best deployment platform?',
  'Where do you deploy your apps?'
);
insert into poll_options (poll_id, option_text)
values
(
  (select id from polls where question = 'What is your preferred database?' limit 1),
  'PostgreSQL'
),
(
  (select id from polls where question = 'What is your preferred database?' limit 1),
  'MongoDB'
),
(
  (select id from polls where question = 'What is your preferred database?' limit 1),
  'MySQL'
),
(
  (select id from polls where question = 'What is your preferred database?' limit 1),
  'Firebase'
),
(
  (select id from polls where question = 'Best deployment platform?' limit 1),
  'Vercel'
),
(
  (select id from polls where question = 'Best deployment platform?' limit 1),
  'Netlify'
),
(
  (select id from polls where question = 'Best deployment platform?' limit 1),
  'AWS'
),
(
  (select id from polls where question = 'Best deployment platform?' limit 1),
  'Azure'
);
insert into poll_votes (poll_option_id, voter_id)
values
(
  (select id from poll_options where option_text = 'PostgreSQL' limit 1),
  'voter_db_1'
),
(
  (select id from poll_options where option_text = 'PostgreSQL' limit 1),
  'voter_db_2'
),
(
  (select id from poll_options where option_text = 'PostgreSQL' limit 1),
  'voter_db_3'
),
(
  (select id from poll_options where option_text = 'MongoDB' limit 1),
  'voter_db_4'
),
(
  (select id from poll_options where option_text = 'MongoDB' limit 1),
  'voter_db_5'
),
(
  (select id from poll_options where option_text = 'MySQL' limit 1),
  'voter_db_6'
),
(
  (select id from poll_options where option_text = 'Vercel' limit 1),
  'voter_plat_1'
),
(
  (select id from poll_options where option_text = 'Vercel' limit 1),
  'voter_plat_2'
),
(
  (select id from poll_options where option_text = 'Vercel' limit 1),
  'voter_plat_3'
),
(
  (select id from poll_options where option_text = 'Vercel' limit 1),
  'voter_plat_4'
),
(
  (select id from poll_options where option_text = 'Netlify' limit 1),
  'voter_plat_5'
),
(
  (select id from poll_options where option_text = 'Netlify' limit 1),
  'voter_plat_6'
),
(
  (select id from poll_options where option_text = 'AWS' limit 1),
  'voter_plat_7'
),
(
  (select id from poll_options where option_text = 'Azure' limit 1),
  'voter_plat_8'
);