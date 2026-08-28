# with-baseball

친구들과 **같이 야구 보러 갈 날**을 정하는 웹앱.

KBO 일정을 팀별로 골라 후보로 담고 → 링크를 공유하면 → 각자 닉네임만 넣고 O·X를 찍고
→ **다 되는 날이 맨 위로** 올라옵니다. 로그인·가입은 없습니다.

- **경기 일정** `/games` — 팀·기간·홈원정·구장 필터. **목록/달력** 두 가지로 볼 수 있고,
  필터와 뷰 상태가 URL에 남아 링크로 그대로 공유됩니다.
- **방 만들기** `/rooms/new` — 후보 경기를 담아 방을 만들고 공유 링크를 받습니다.
- **투표·집계** `/rooms/[slug]` — 닉네임 입력 후 O·△·X. **표**(참가자×경기 매트릭스)와
  **달력**(전원 O인 날이 초록) 두 가지로 봅니다.

---

> 📘 Supabase를 처음 쓴다면 **[docs/supabase.md](docs/supabase.md)** 에 프로젝트 생성부터
> 문제 해결·SQL 치트시트까지 자세히 정리해 뒀습니다. 아래는 요약입니다.

---

## 셋업

### 1. 의존성

```bash
npm install
```

### 2. Supabase 프로젝트 만들기

Supabase는 **Postgres 데이터베이스를 호스팅해주는 서비스**입니다. 이 프로젝트에서 쓰는 기능은
**SQL Editor**(쿼리 실행)와 **Table Editor**(엑셀처럼 행 보기/편집) 둘뿐입니다. 무료 플랜으로
충분합니다.

1. [supabase.com](https://supabase.com) 가입 (GitHub 계정으로 바로 됩니다)
2. **New project** — 이름은 아무거나(`with-baseball`), 리전은 **Northeast Asia (Seoul)**
3. **Database Password**를 정해 적어둡니다. 지금 이 앱에는 필요 없지만 나중에 DB에
   직접 붙을 때 쓰고, **다시 볼 수 없습니다**
4. 프로비저닝에 1~2분 걸립니다

### 3. 키 복사해서 .env.local 만들기

```bash
cp .env.example .env.local
```

대시보드 **Project Settings**에서 두 값을 찾습니다.

| 넣을 값 | 어디에 있나 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Data API** → Project URL (`https://….supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **API Keys** → **secret** 키 (`sb_secret_…`) |

> 💡 예전에 만든 프로젝트라면 secret 키 대신 **Legacy API Keys** 탭의 `service_role` 키
> (`eyJ…`)가 보입니다. 둘은 같은 권한이라 어느 쪽이든 그대로 넣으면 됩니다.
> 같은 화면의 `anon` / `publishable` 키는 이 앱에서 쓰지 않습니다.

> ⚠️ secret(=service_role) 키는 RLS를 우회하는 **마스터 키**입니다. 절대 `NEXT_PUBLIC_`
> 접두사를 붙이거나 깃에 올리지 마세요(`.env.local`은 `.gitignore`에 있습니다).
> 이 앱은 브라우저에서 Supabase에 직접 접근하지 않습니다 — 모든 DB 접근은 서버에서만 일어납니다.

### 4. 테이블 만들기 (SQL Editor)

왼쪽 메뉴의 **SQL Editor** → **New query**. 아래 두 파일을 **순서대로**, 한 번에 하나씩
통째로 복사해 붙여넣고 **Run**을 누릅니다.

1. `supabase/migrations/0001_init.sql` — 테이블 6개와 RLS
2. `supabase/seed/teams.sql` — KBO 10구단

성공하면 `Success. No rows returned` 가 뜹니다. 왼쪽 **Table Editor**에서 `teams` 테이블에
10개 행이 들어있으면 성공입니다.

> 둘 다 몇 번을 다시 실행해도 안전합니다 (`create table if not exists`, `on conflict do update`).

### 5. 경기 넣기

아직 경기가 없으면 화면이 비어 있습니다. 같은 SQL Editor에서
`supabase/seed/games.example.sql` 을 붙여넣고 Run 하면 샘플 5경기가 들어갑니다.
실제 일정을 넣는 방법은 아래 [경기 일정 넣기](#경기-일정-넣기)를 보세요.

### 6. 실행

```bash
npm run dev
```

http://localhost:3000

---

## 경기 일정 넣기

앱에는 관리자 화면이 없습니다. 로그인이 없는 상태에서 관리자 UI를 만들면 결국 공유 시크릿
하나로 지키게 되는데, 그건 보호도 아니고 유지비만 듭니다. 대신 **Supabase 대시보드에서 직접**
넣습니다.

### 방법 A — 수기 등록 (기본)

**여러 건**은 SQL Editor에서. `supabase/seed/games.example.sql` 을 열어 `values` 목록만
실제 일정으로 바꿔 실행하면 됩니다.

```sql
insert into games (season, game_date, start_time, home_team_id, away_team_id, stadium, external_key)
values
  (2026, '2026-04-01', '18:30', 'LG', 'OB', '잠실', '2026-04-01-OB-LG-0')
on conflict (external_key) do update set
  game_date = excluded.game_date, start_time = excluded.start_time,
  stadium = excluded.stadium, updated_at = now();
```

**한두 건**은 Table Editor에서 `games` 행을 직접 추가해도 됩니다.

#### external_key 규칙

`{경기일}-{원정팀}-{홈팀}-{더블헤더순번}` — 예: `2026-04-01-OB-LG-0`

이 규칙만 지키면 **같은 SQL을 몇 번을 다시 실행해도 중복 행이 생기지 않고 갱신만** 됩니다.
아래 크롤러도 똑같은 규칙으로 키를 만들기 때문에, 손으로 넣은 경기와 크롤링한 경기가
섞여도 서로를 덮어쓸 뿐 중복되지 않습니다.

#### 팀 코드

| 코드 | 팀 | 코드 | 팀 |
|---|---|---|---|
| `LG` | LG 트윈스 | `SK` | SSG 랜더스 |
| `OB` | 두산 베어스 | `NC` | NC 다이노스 |
| `HT` | KIA 타이거즈 | `WO` | 키움 히어로즈 |
| `SS` | 삼성 라이온즈 | `HH` | 한화 이글스 |
| `LT` | 롯데 자이언츠 | `KT` | KT 위즈 |

KBO 공식 사이트가 쓰는 코드를 그대로 따랐습니다 (두산=`OB`, KIA=`HT`, SSG=`SK`, 키움=`WO`).

### 방법 B — KBO 일정 크롤러 (선택)

```bash
npm run import:kbo -- --season 2026 --months 4,5,6
```

> ⚠️ KBO는 공개 API를 제공하지 않습니다. 이 스크립트는 일정 페이지가 내부적으로 쓰는 ajax
> 엔드포인트를 호출하므로 **스펙 보장이 없고 언제든 막히거나 형식이 바뀔 수 있습니다.**
> 그래서 앱은 크롤러 없이도 완전히 동작하도록 만들어져 있습니다 — 방법 A만으로 충분합니다.
>
> 응답 파서는 순수 함수(`src/lib/games/kbo.ts`)로 분리해 픽스처로 테스트합니다. 열 위치를
> 고정하지 않고 셀 내용의 모양(날짜·시간·`vs`·구장)으로 필드를 찾기 때문에 열이 하나 늘거나
> 순서가 바뀌어도 통째로 깨지지는 않습니다. 알아보지 못한 행은 경고로 알려줍니다.
>
> 픽스처(`src/lib/games/__tests__/fixtures/kbo-schedule.json`)는 실제 응답을 캡처한 것이
> 아니라 알려진 구조를 재현한 것입니다. 진짜 응답을 받아보게 되면 그 파일로 갈아끼우고
> 테스트를 다시 돌리세요.

---

## 검증

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest — 집계 로직, 달력 그리드, external_key 규칙, KBO 파서
npm run build       # 프로덕션 빌드
```

---

## 설계 메모

**로그인이 없다는 게 무슨 뜻인가.** "나"를 식별하는 건 방마다 발급되는 httpOnly 쿠키
두 개뿐입니다 — 참가자 토큰(내 응답을 다시 고칠 수 있음)과 방장 토큰(후보 경기를 바꿀 수
있음). 브라우저를 바꾸면 다른 사람이 됩니다.

**브라우저는 Supabase에 직접 접근하지 않습니다.** 모든 읽기/쓰기는 Server Component와
Server Action에서 service-role 키로 이뤄지고, 테이블은 RLS deny-by-default로 잠겨 있습니다
(정책이 하나도 없음 = anon 키로는 아무것도 못 함). 로그인 없이 "slug를 아는 사람만"을
RLS로 표현하려면 규칙이 복잡해지는데, 서버를 경유하면 그 복잡도가 사라집니다.

**Server Action은 UI를 거치지 않고 POST로도 호출될 수 있습니다.** 그래서 `castVote` 는
참가자 id를 클라이언트에서 받지 않고 쿠키의 토큰으로 서버가 직접 찾습니다.

**투표는 O·△·X 세 값입니다.** 요청은 O·X였지만 실사용에서 "아마도 될 듯"이 제일 많이
나오고, enum을 나중에 늘리면 마이그레이션이 됩니다.

**모바일이 주 사용 환경입니다.** 링크를 받아 폰에서 O·X를 찍는 게 핵심 플로우라, 모든
조작 요소는 최소 44px 터치 영역을 갖고(O·△·X 버튼은 좁은 화면에서 가로 3등분으로 꽉 채움),
입력 폰트는 16px 이상이라 iOS가 포커스 시 화면을 확대하지 않습니다. 하단 고정 바는
`env(safe-area-inset-bottom)` 으로 홈 인디케이터를 피합니다.

**좁은 화면의 달력은 요약 + 펼치기입니다.** 390px에 7열 × 하루 5경기를 셀에 다 그리면 글자가
세 줄로 깨져 못 읽습니다. 그래서 좁은 화면 셀에는 요약만 두고(일정은 "n경기", 집계는 "O n/N"),
날짜를 누르면 아래에 그 날 상세가 펼쳐집니다(`?date=2026-09-05`). 큰 화면에서는 지금처럼
셀 안에 바로 펼칩니다. 참가자가 늘어 표가 잘리는 경우엔 경기 이름 열을 왼쪽에 고정해
옆으로 밀어도 어느 줄인지 잃지 않게 했습니다.

**목록/달력 전환도 URL에 둡니다** (`?view=calendar&month=2026-09`). 필터와 같은 방식이라
달력을 띄운 화면을 그대로 링크로 던질 수 있고, 뒤로가기도 자연스럽게 동작합니다.
달력 그리드 계산은 `src/lib/calendar.ts` 의 순수 함수로 분리해 테스트합니다 — 날짜 연산은
전부 UTC 기준인데, 로컬 타임존으로 `Date` 를 만들면 서버(UTC)와 브라우저(KST)에서 "오늘"이
달라져 하이드레이션이 어긋나기 때문입니다.

---

## 나중에 붙일 것

스키마를 갈아엎지 않고 얹을 수 있도록 자리를 잡아뒀습니다.

| 기능 | 필요한 작업 |
|---|---|
| 그룹 만들기 | `groups` 테이블 신설 + `rooms.group_id uuid null` 컬럼 추가 |
| 구글 캘린더 연동 | `participant_busy(participant_id, start_at, end_at)` 테이블 + OAuth. freebusy 결과를 캐시해 투표 UI에 "이 시간 일정 있음" 힌트로 표시 |
| 야구 메이트 채팅 | 별도 테이블 + Supabase Realtime. 로그인이 선행돼야 함 |

로그인을 도입하는 시점에 RLS 정책을 제대로 작성하고, 익명 참가자를
`participants.user_id` 로 병합하는 마이그레이션을 씁니다.
