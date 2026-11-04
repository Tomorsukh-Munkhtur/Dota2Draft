-- Сайтын мэдээ. Supabase → SQL Editor дээр нэг удаа ажиллуулна.
create table if not exists public.news (
  id            text primary key,
  source_url    text not null default '',
  author        text not null default '',
  date          timestamptz not null,
  image         text,
  title_en      text not null default '',
  body_en       text not null default '',
  title_mn      text,
  summary_mn    text,
  body_mn       text,
  status        text not null default 'draft' check (status in ('draft', 'published')),
  translated_at timestamptz,
  published_at  timestamptz
);

create index if not exists news_date_idx on public.news (date desc);

-- RLS асаалттай, policy байхгүй: зөвхөн сервер талын service_role түлхүүр уншиж/бичнэ.
-- Нийтийн (anon) түлхүүрээр хэн ч шууд хандаж чадахгүй.
alter table public.news enable row level security;
