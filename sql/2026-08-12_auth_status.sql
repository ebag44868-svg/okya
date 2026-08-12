-- ============================================================================
-- OKSS 인증 승인 시스템 기반 마이그레이션 (제안 · 아직 실행하지 않음)
-- 실행 위치: Supabase 대시보드 → SQL Editor에서 개발자가 검토 후 수동 실행.
-- 원칙: 비파괴적. 기존 데이터 삭제/변경 없음.
--       기존 사용자는 잠기지 않도록 전부 'approved'로 백필.
--       모든 문장은 재실행 안전(idempotent)하게 작성.
-- 주의: 이 파일을 앱 코드가 자동 실행하지 않는다. 반드시 사람이 검토 후 실행.
-- ============================================================================

-- 1) status 컬럼 추가. 신규 가입 기본값 = 'pending'(승인 대기).
--    현재 앱 코드는 status를 읽지 않으므로, 지금 실행해도 동작에는 영향이 없다.
alter table public.okya_users
  add column if not exists status text not null default 'pending';

-- 2) 상태 변경 시각(nullable timestamptz).
alter table public.okya_users add column if not exists approved_at  timestamptz;
alter table public.okya_users add column if not exists rejected_at  timestamptz;
alter table public.okya_users add column if not exists suspended_at timestamptz;

-- 3) (선택) 가입일 컬럼이 없다면 추가. 이미 있으면 무시.
alter table public.okya_users add column if not exists created_at timestamptz default now();

-- 4) 기존 사용자(= 마이그레이션 시점의 모든 행) 승인 처리 → 잠금 방지.
--    이후 새로 가입하는 행만 기본값 'pending'으로 남는다.
update public.okya_users
  set status = 'approved',
      approved_at = coalesce(approved_at, now())
  where status is distinct from 'approved';

-- 5) 허용값 제약(선택). 이미 있으면 건너뜀.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'okya_users_status_chk') then
    alter table public.okya_users
      add constraint okya_users_status_chk
      check (status in ('pending','approved','rejected','suspended'));
  end if;
end $$;

-- 참고: role 컬럼(student/admin)은 이미 존재. 이 마이그레이션은 role을 건드리지 않는다.
-- 참고: email은 auth.users에 이미 존재(Supabase Auth). okya_users에 별도 저장은 선택사항.

-- ----------------------------------------------------------------------------
-- 롤백 (필요 시에만):
-- alter table public.okya_users drop constraint if exists okya_users_status_chk;
-- alter table public.okya_users drop column if exists created_at;   -- 기존에 없던 경우만
-- alter table public.okya_users drop column if exists suspended_at;
-- alter table public.okya_users drop column if exists rejected_at;
-- alter table public.okya_users drop column if exists approved_at;
-- alter table public.okya_users drop column if exists status;
-- ----------------------------------------------------------------------------
