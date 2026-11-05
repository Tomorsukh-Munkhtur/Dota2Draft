-- Нүүр хуудасны слайд (баннер) ба патчийн орчуулгын засвар. Supabase → SQL Editor дээр нэг удаа ажиллуулна.

create table if not exists public.banners (
  id           uuid primary key default gen_random_uuid(),
  title        text not null default '',
  subtitle     text not null default '',
  image_url    text not null,
  link_url     text not null default '',
  button_label text not null default '',
  sort_order   integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Админ засварласан патчийн тэмдэглэлийн орчуулга (машин орчуулгаас давуу эрхтэй).
create table if not exists public.patch_translations (
  en         text primary key,
  mn         text not null,
  updated_at timestamptz not null default now()
);

-- RLS асаалттай, policy байхгүй: зөвхөн сервер талын secret түлхүүр хандана.
alter table public.banners enable row level security;
alter table public.patch_translations enable row level security;

-- Баннерын зураг (нийтэд нээлттэй уншина, зөвхөн сервер байршуулна). 5MB хүртэл.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('banners', 'banners', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;
