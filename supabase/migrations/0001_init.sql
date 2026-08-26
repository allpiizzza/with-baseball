-- with-baseball 초기 스키마
-- Supabase SQL Editor에 통째로 붙여넣어 실행하세요.

-- ---------------------------------------------------------------------------
-- 팀
-- ---------------------------------------------------------------------------
create table if not exists teams (
  id           text primary key,        -- KBO 팀 코드: 'LG','OB','HT','SS','LT','SK','NC','WO','HH','KT'
  league       text not null default 'KBO',
  name         text not null,           -- 'LG 트윈스'
  short_name   text not null,           -- 'LG'
  color        text not null,           -- 필터 칩/뱃지 색
  home_stadium text,
  sort_order   int  not null default 0
);

-- ---------------------------------------------------------------------------
-- 경기
-- ---------------------------------------------------------------------------
create table if not exists games (
  id           uuid primary key default gen_random_uuid(),
  league       text not null default 'KBO',
  season       int  not null,
  game_date    date not null,
  start_time   time,                                  -- 시간 미정이면 null
  home_team_id text not null references teams(id),
  away_team_id text not null references teams(id),
  stadium      text,
  status       text not null default 'scheduled'
               check (status in ('scheduled', 'postponed', 'canceled', 'finished')),
  source       text not null default 'manual'
               check (source in ('manual', 'crawl')),
  -- '{날짜}-{원정}-{홈}-{더블헤더순번}' 예: '2026-04-01-OB-LG-0'
  -- 수기 등록과 크롤러가 같은 규칙을 쓰므로 서로 덮어써도 중복이 생기지 않는다.
  external_key text not null unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint games_teams_differ check (home_team_id <> away_team_id)
);

create index if not exists games_game_date_idx on games (game_date);
create index if not exists games_home_team_idx on games (home_team_id);
create index if not exists games_away_team_idx on games (away_team_id);

-- ---------------------------------------------------------------------------
-- 조율 방
-- ※ 나중에 그룹 기능을 붙일 땐 groups 테이블 신설 + rooms.group_id uuid null 추가면 된다.
-- ---------------------------------------------------------------------------
create table if not exists rooms (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,    -- 공유 URL에 쓰이는 짧은 id
  title       text not null,
  owner_token uuid not null default gen_random_uuid(),  -- 방장 브라우저 쿠키에 저장
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '90 days')
);

-- 방에 담긴 후보 경기
create table if not exists room_games (
  room_id uuid not null references rooms(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  primary key (room_id, game_id)
);

-- ---------------------------------------------------------------------------
-- 참가자 (익명 — 로그인 없이 닉네임만)
-- ---------------------------------------------------------------------------
create table if not exists participants (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references rooms(id) on delete cascade,
  nickname   text not null,
  edit_token uuid not null default gen_random_uuid(),  -- 쿠키에 저장 → 본인 응답 재수정
  user_id    uuid,                    -- ※ 지금은 항상 null. 로그인 붙일 때 익명 참가자 병합용
  created_at timestamptz not null default now(),
  unique (room_id, nickname)
);

create index if not exists participants_room_idx on participants (room_id);

-- ---------------------------------------------------------------------------
-- 투표
-- ---------------------------------------------------------------------------
create table if not exists votes (
  participant_id uuid not null references participants(id) on delete cascade,
  game_id        uuid not null references games(id) on delete cascade,
  value          text not null check (value in ('yes', 'maybe', 'no')),
  updated_at     timestamptz not null default now(),
  primary key (participant_id, game_id)
);

-- ---------------------------------------------------------------------------
-- RLS: 전 테이블 deny-by-default.
-- 브라우저는 Supabase에 직접 접근하지 않는다. 모든 읽기/쓰기는 Next.js 서버에서
-- service-role 키로 수행한다(service-role은 RLS를 우회). 정책을 하나도 만들지
-- 않았으므로 anon 키로는 아무것도 읽거나 쓸 수 없다.
-- 로그인을 도입하는 시점에 여기에 제대로 된 정책을 작성한다.
-- ---------------------------------------------------------------------------
alter table teams        enable row level security;
alter table games        enable row level security;
alter table rooms        enable row level security;
alter table room_games   enable row level security;
alter table participants enable row level security;
alter table votes        enable row level security;
