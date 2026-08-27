# Supabase 연동 가이드

이 프로젝트의 데이터베이스는 [Supabase](https://supabase.com)에 있습니다.
Supabase를 처음 쓴다면 이 문서만 따라오면 됩니다.

- [Supabase가 뭔가](#supabase가-뭔가)
- [1. 프로젝트 만들기](#1-프로젝트-만들기)
- [2. 키 두 개 복사하기](#2-키-두-개-복사하기)
- [3. 테이블 만들기](#3-테이블-만들기)
- [4. 경기 데이터 넣기](#4-경기-데이터-넣기)
- [5. 실행하고 확인하기](#5-실행하고-확인하기)
- [이 앱이 Supabase에 붙는 방식](#이-앱이-supabase에-붙는-방식)
- [자주 겪는 문제](#자주-겪는-문제)
- [데이터 다루기 치트시트](#데이터-다루기-치트시트)

---

## Supabase가 뭔가

**Postgres 데이터베이스를 대신 호스팅해주는 서비스**입니다. 서버를 직접 세우거나 백업을
챙길 필요 없이, 웹 화면에서 SQL을 실행하고 데이터를 눈으로 볼 수 있습니다.

이 프로젝트에서 실제로 쓰는 화면은 두 개뿐입니다.

| 화면 | 하는 일 |
|---|---|
| **SQL Editor** | 쿼리를 붙여넣고 실행. 테이블 만들기, 경기 일정 넣기에 씀 |
| **Table Editor** | 엑셀처럼 행을 보고 직접 고침. 데이터 확인·수정에 씀 |

Auth, Storage, Realtime 같은 다른 기능은 지금 쓰지 않습니다.
무료 플랜으로 충분합니다.

---

## 1. 프로젝트 만들기

1. [supabase.com](https://supabase.com) 가입 — GitHub 계정으로 바로 됩니다
2. **New project**
   - **Name**: 아무거나 (`with-baseball`)
   - **Region**: **Northeast Asia (Seoul)** — 가까울수록 응답이 빠릅니다
   - **Database Password**: 정해서 **어딘가 적어두세요.** 이 앱에는 필요 없지만
     나중에 DB에 직접 붙을 때 쓰고, **다시 볼 수 없습니다**
3. 프로비저닝에 1~2분 걸립니다

> 무료 플랜 프로젝트는 **일주일 정도 아무 요청이 없으면 자동으로 일시정지**됩니다.
> 대시보드에서 Restore 버튼 한 번이면 되살아나고 데이터는 그대로입니다.

---

## 2. 키 두 개 복사하기

```bash
cp .env.example .env.local
```

대시보드 왼쪽 아래 **Project Settings**에서 두 값을 찾아 `.env.local`에 채웁니다.

| `.env.local` 변수 | 대시보드 위치 | 생김새 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Data API** → Project URL | `https://abcdefgh.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | **API Keys** → **secret** 키 | `sb_secret_...` |

### 어떤 키를 골라야 하나

Supabase가 키 체계를 바꾸는 중이라 프로젝트를 만든 시점에 따라 화면이 다릅니다.

- **최근에 만든 프로젝트** — **API Keys** 탭에 `publishable` / `secret` 두 종류가 있습니다.
  → **secret** (`sb_secret_...`)
- **예전에 만든 프로젝트** — **Legacy API Keys** 탭에 `anon` / `service_role` 이 있습니다.
  → **service_role** (`eyJ...`)

둘은 같은 `service_role` 권한이라 **어느 쪽이든 `SUPABASE_SERVICE_ROLE_KEY`에 그대로**
넣으면 동작합니다. `anon` / `publishable` 키는 이 앱에서 쓰지 않습니다.

> ⚠️ **secret(=service_role) 키는 RLS를 우회하는 마스터 키입니다.**
> - 절대 `NEXT_PUBLIC_` 접두사를 붙이지 마세요 — 그 순간 브라우저 번들에 실려 나갑니다
> - 깃에 올리지 마세요 (`.env.local`은 `.gitignore`에 있습니다)
> - 실수로 노출했다면 대시보드에서 키를 revoke/rotate 하세요

---

## 3. 테이블 만들기

왼쪽 메뉴 **SQL Editor** → **New query**.
아래 두 파일을 **순서대로**, 한 번에 하나씩 통째로 복사해 붙여넣고 **Run** (⌘/Ctrl+Enter).

| 순서 | 파일 | 내용 |
|---|---|---|
| 1 | `supabase/migrations/0001_init.sql` | 테이블 6개 (`teams` `games` `rooms` `room_games` `participants` `votes`) + RLS |
| 2 | `supabase/seed/teams.sql` | KBO 10구단 |

`Success. No rows returned` 가 뜨면 성공입니다.

**확인**: **Table Editor** → `teams` 테이블에 10개 행이 있으면 됩니다.

> 두 파일 모두 **몇 번을 다시 실행해도 안전합니다.**
> `create table if not exists` / `on conflict do update` 로 쓰여 있습니다.

---

## 4. 경기 데이터 넣기

경기가 없으면 `/games` 화면이 비어 있습니다.

### 빠르게 — 샘플 5경기

SQL Editor에 `supabase/seed/games.example.sql` 을 붙여넣고 Run.

### 실제로 — 시즌 일정 넣기

같은 파일의 `values` 목록만 실제 일정으로 바꿔서 실행합니다.

```sql
insert into games (season, game_date, start_time, home_team_id, away_team_id, stadium, external_key)
values
  (2026, '2026-04-01', '18:30', 'LG', 'OB', '잠실', '2026-04-01-OB-LG-0'),
  (2026, '2026-04-02', '18:30', 'LG', 'OB', '잠실', '2026-04-02-OB-LG-0')
on conflict (external_key) do update set
  season       = excluded.season,
  game_date    = excluded.game_date,
  start_time   = excluded.start_time,
  home_team_id = excluded.home_team_id,
  away_team_id = excluded.away_team_id,
  stadium      = excluded.stadium,
  updated_at   = now();
```

**한두 경기만** 급하게 넣을 땐 Table Editor → `games` → **Insert row** 로 직접 넣어도 됩니다.
그때도 `external_key`는 아래 규칙대로 채워주세요.

### external_key 규칙 (중요)

```
{경기일}-{원정팀코드}-{홈팀코드}-{더블헤더순번}
예: 2026-04-01-OB-LG-0
```

이 규칙만 지키면 **같은 SQL을 몇 번을 다시 실행해도 중복 행이 안 생기고 갱신만** 됩니다.
우천취소로 날짜가 바뀌었을 때도 같은 키로 다시 넣으면 덮어써집니다.

크롤러(`scripts/import-kbo.ts`)도 똑같은 규칙으로 키를 만들기 때문에, 손으로 넣은 경기와
크롤링한 경기가 섞여도 서로를 덮어쓸 뿐 중복되지 않습니다.

### 팀 코드

| 코드 | 팀 | 코드 | 팀 |
|---|---|---|---|
| `LG` | LG 트윈스 | `SK` | SSG 랜더스 |
| `OB` | 두산 베어스 | `NC` | NC 다이노스 |
| `HT` | KIA 타이거즈 | `WO` | 키움 히어로즈 |
| `SS` | 삼성 라이온즈 | `HH` | 한화 이글스 |
| `LT` | 롯데 자이언츠 | `KT` | KT 위즈 |

KBO 공식 사이트가 쓰는 코드를 그대로 따랐습니다 (두산=`OB`, KIA=`HT`, SSG=`SK`, 키움=`WO`).

---

## 5. 실행하고 확인하기

```bash
npm run dev
```

http://localhost:3000 에서:

1. `/games` 에 경기가 뜨는지
2. 팀 칩을 눌러 필터가 먹는지
3. `/rooms/new` 에서 경기를 담아 방이 만들어지는지

---

## 이 앱이 Supabase에 붙는 방식

```
브라우저  ──✕──▶  Supabase        (직접 접근 안 함)
   │
   ▼
Next.js 서버  ───▶  Supabase       (service-role 키로만)
(Server Component / Server Action)
```

**브라우저는 Supabase에 직접 접근하지 않습니다.** 모든 읽기/쓰기는 Next.js 서버에서
`src/lib/supabase/server.ts` 의 클라이언트를 통해서만 일어나고, 그 파일은 `server-only`
를 import 해서 클라이언트 번들에 섞이면 빌드가 깨지도록 해뒀습니다.

**테이블은 RLS deny-by-default로 잠겨 있습니다.** `0001_init.sql` 마지막에 여섯 테이블
모두 `enable row level security` 를 걸어두고 **정책은 하나도 만들지 않았습니다.**
정책이 없다 = anon 키로는 아무것도 읽거나 쓸 수 없다는 뜻입니다. service-role 키만
RLS를 우회하므로 서버만 데이터를 만질 수 있습니다.

**왜 이렇게 했나.** 로그인이 없는 상태에서 "방 링크(slug)를 아는 사람만 그 방을 볼 수
있다"를 RLS 정책으로 표현하려면 규칙이 꽤 복잡해집니다. 서버를 경유하게 만들면 그
복잡도가 통째로 사라지고, 권한 판단을 평범한 코드로 쓸 수 있습니다.

로그인을 도입하는 시점에 여기에 제대로 된 RLS 정책을 작성하고, 익명 참가자를
`participants.user_id` 로 병합하는 마이그레이션을 씁니다.

### 테이블 구조

| 테이블 | 역할 |
|---|---|
| `teams` | KBO 10구단. 이름·약칭·색·홈구장 |
| `games` | 경기. `external_key` 로 중복 방지 |
| `rooms` | 조율 방. `slug`(공유 URL), `owner_token`(방장 식별) |
| `room_games` | 방에 담긴 후보 경기 (N:N) |
| `participants` | 익명 참가자. `nickname`, `edit_token`(본인 식별), `user_id`(지금은 항상 null) |
| `votes` | 참가자 × 경기 → `yes`/`maybe`/`no` |

---

## 자주 겪는 문제

### 화면에 "데이터를 불러오지 못했습니다" 가 뜬다

`.env.local` 이 비었거나 값이 틀렸을 때가 대부분입니다.

```bash
cat .env.local          # 두 값이 다 채워져 있는지
```

- URL 끝에 슬래시(`/`)가 붙어 있으면 지우세요
- 키 앞뒤 공백·따옴표가 섞여 있지 않은지 확인하세요
- **`.env.local` 을 고쳤으면 `npm run dev` 를 껐다 켜야 합니다** (환경변수는 시작할 때 읽습니다)

### `relation "teams" does not exist`

3번 단계(테이블 만들기)를 안 했거나 실패한 상태입니다.
SQL Editor에서 `0001_init.sql` 을 다시 실행하세요.

### `/games` 는 열리는데 경기가 하나도 없다

4번 단계(경기 넣기)를 하세요. `/games` 는 **기본적으로 오늘 이후 경기만** 보여줍니다 —
지난 날짜 경기만 넣었다면 화면의 시작일을 비우거나 과거 날짜로 바꿔보세요.

### 며칠 뒤에 갑자기 연결이 안 된다

무료 플랜은 일주일쯤 요청이 없으면 프로젝트를 일시정지시킵니다.
대시보드에서 **Restore** 하면 데이터 그대로 되살아납니다.

### 처음부터 다시 하고 싶다

```sql
drop table if exists votes, participants, room_games, rooms, games, teams cascade;
```
그다음 3번 단계부터 다시.

---

## 데이터 다루기 치트시트

SQL Editor에 붙여넣어 쓰세요.

```sql
-- 등록된 경기 수와 기간
select count(*) as 경기수, min(game_date) as 시작, max(game_date) as 끝 from games;

-- 특정 팀 경기만 보기 (홈·원정 모두)
select game_date, start_time, away_team_id, home_team_id, stadium
from games
where 'LG' in (home_team_id, away_team_id)
order by game_date;

-- 만들어진 방과 참가자 수
select r.slug, r.title, count(distinct p.id) as 참가자
from rooms r
left join participants p on p.room_id = r.id
group by r.id
order by r.created_at desc;

-- 특정 방의 투표 현황
select g.game_date, p.nickname, v.value
from votes v
join participants p on p.id = v.participant_id
join games g on g.id = v.game_id
where p.room_id = (select id from rooms where slug = '여기에-방-slug')
order by g.game_date, p.nickname;

-- 우천취소 처리
update games set status = 'canceled', updated_at = now()
where external_key = '2026-04-01-OB-LG-0';

-- 특정 시즌 경기 전부 지우기
delete from games where season = 2026;
```

---

## 더 읽을거리

- [Supabase 문서 — API 키](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase 문서 — 새 키 체계로 마이그레이션](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)
- [Supabase 문서 — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
