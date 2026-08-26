-- KBO 10구단 시드. 마이그레이션(0001_init.sql) 실행 후 한 번 돌리면 된다.
-- 팀 코드는 KBO 공식 사이트에서 쓰는 코드를 그대로 따랐다 (두산=OB, KIA=HT, SSG=SK, 키움=WO).

insert into teams (id, name, short_name, color, home_stadium, sort_order) values
  ('LG', 'LG 트윈스',   'LG',  '#C30452', '잠실',                    1),
  ('OB', '두산 베어스', '두산', '#131230', '잠실',                    2),
  ('HT', 'KIA 타이거즈', 'KIA', '#EA0029', '광주-기아 챔피언스 필드', 3),
  ('SS', '삼성 라이온즈', '삼성', '#074CA1', '대구 삼성 라이온즈 파크', 4),
  ('LT', '롯데 자이언츠', '롯데', '#041E42', '사직',                    5),
  ('SK', 'SSG 랜더스',  'SSG', '#CE0E2D', '인천 SSG 랜더스필드',     6),
  ('NC', 'NC 다이노스', 'NC',  '#315288', '창원 NC 파크',            7),
  ('WO', '키움 히어로즈', '키움', '#570514', '고척 스카이돔',           8),
  ('HH', '한화 이글스', '한화', '#FF6600', '대전 한화생명 볼파크',    9),
  ('KT', 'KT 위즈',    'KT',  '#000000', '수원 KT 위즈 파크',      10)
on conflict (id) do update set
  name         = excluded.name,
  short_name   = excluded.short_name,
  color        = excluded.color,
  home_stadium = excluded.home_stadium,
  sort_order   = excluded.sort_order;
