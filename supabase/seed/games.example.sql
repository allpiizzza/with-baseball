-- 경기 수기 등록 템플릿 (Path A)
--
-- 앱에는 관리자 화면이 없다. 경기는 Supabase 대시보드에서 직접 넣는다.
-- 이 파일을 SQL Editor에 붙여넣고 values 목록만 실제 일정으로 바꿔 실행하면 된다.
--
-- external_key 규칙: '{경기일}-{원정팀코드}-{홈팀코드}-{더블헤더순번}'
--   예) 2026-04-01 잠실에서 두산(원정) vs LG(홈) 1차전  ->  '2026-04-01-OB-LG-0'
--       같은 날 같은 카드의 더블헤더 2차전            ->  '2026-04-01-OB-LG-1'
-- 이 규칙만 지키면 몇 번을 다시 실행해도 중복 행이 생기지 않고 갱신만 된다.
-- 크롤러(scripts/import-kbo.ts)도 똑같은 규칙으로 키를 만들기 때문에,
-- 나중에 크롤러를 돌려도 수기로 넣은 행과 충돌하지 않는다.
--
-- 팀 코드
--   LG=LG 트윈스   OB=두산 베어스  HT=KIA 타이거즈  SS=삼성 라이온즈  LT=롯데 자이언츠
--   SK=SSG 랜더스  NC=NC 다이노스  WO=키움 히어로즈  HH=한화 이글스    KT=KT 위즈
--
-- start_time 은 시간 미정이면 null 로 두면 된다.

insert into games (season, game_date, start_time, home_team_id, away_team_id, stadium, external_key)
values
  (2026, '2026-04-01', '18:30', 'LG', 'OB', '잠실',                    '2026-04-01-OB-LG-0'),
  (2026, '2026-04-02', '18:30', 'LG', 'OB', '잠실',                    '2026-04-02-OB-LG-0'),
  (2026, '2026-04-03', '18:30', 'HT', 'SS', '광주-기아 챔피언스 필드', '2026-04-03-SS-HT-0'),
  (2026, '2026-04-04', '17:00', 'HT', 'SS', '광주-기아 챔피언스 필드', '2026-04-04-SS-HT-0'),
  (2026, '2026-04-05', '14:00', 'LT', 'KT', '사직',                    '2026-04-05-KT-LT-0')
on conflict (external_key) do update set
  season       = excluded.season,
  game_date    = excluded.game_date,
  start_time   = excluded.start_time,
  home_team_id = excluded.home_team_id,
  away_team_id = excluded.away_team_id,
  stadium      = excluded.stadium,
  updated_at   = now();
