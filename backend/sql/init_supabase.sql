-- TruthSeeker Supabase schema setup
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.claims (
    id uuid primary key default gen_random_uuid(),
    claim_text text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.verification_history (
    id uuid primary key default gen_random_uuid(),
    claim_text text not null,
    verification_result text,
    credibility_score numeric,
    summary text,
    sources jsonb,
    created_at timestamptz not null default now()
);

alter table public.claims enable row level security;
alter table public.verification_history enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'claims'
          and policyname = 'Allow anon insert claims'
    ) then
        create policy "Allow anon insert claims"
        on public.claims
        for insert
        to anon
        with check (true);
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'claims'
          and policyname = 'Allow anon select claims'
    ) then
        create policy "Allow anon select claims"
        on public.claims
        for select
        to anon
        using (true);
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'verification_history'
          and policyname = 'Allow anon select verification history'
    ) then
        create policy "Allow anon select verification history"
        on public.verification_history
        for select
        to anon
        using (true);
    end if;
end $$;
