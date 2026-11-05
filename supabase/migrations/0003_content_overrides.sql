-- Баатар, item-ийн контентын админ засвар (data/hero-content, data/item-content файлуудын дээр давхарлана)
-- ба админы "Анхаарах зүйлс"-ийн шалгасан тэмдэглэгээ.
-- null талбар = файл дахь анхны текстийг хэрэглэнэ. Supabase → SQL Editor дээр нэг удаа ажиллуулна.

create table if not exists public.hero_content (
  slug          text primary key,
  summary       text,
  lore          text,
  counter_items jsonb,
  counter_tips  jsonb,
  similar       jsonb,
  updated_at    timestamptz not null default now()
);

create table if not exists public.item_content (
  key        text primary key,
  summary    text,
  usage      text,
  abilities  jsonb,
  tips       jsonb,
  good_for   jsonb,
  updated_at timestamptz not null default now()
);

-- Админы "Анхаарах зүйлс"-ээс "Шалгасан" гэж тэмдэглэсэн мөрүүд (ж: "patch:7.41f:hero:axe").
create table if not exists public.admin_reviews (
  key         text primary key,
  reviewed_at timestamptz not null default now()
);

-- RLS асаалттай, policy байхгүй: зөвхөн сервер талын secret түлхүүр хандана.
alter table public.hero_content enable row level security;
alter table public.item_content enable row level security;
alter table public.admin_reviews enable row level security;
