# Dota 2 Draft

Шинэ тоглогчдод зориулсан Dota 2-ын монгол сайт:

- **Драфт туслах** (`/draft`) — Captain's Mode (7.40+ дараалал, цаг хэмжигчтэй) болон чөлөөт/Ranked All Pick горим. Баатар бүрт: хэнд ялдаг/ялагддаг, хэнтэй сайн хамтардаг, ойролцоо баатрууд, эсрэг авах item. Одоогийн драфтад тохирох пик ба бан санал болгоно.
- **Баатрууд** (`/heroes`) — 127 баатрын skill, talent (Valve-ийн албан ёсны текст, Google Translate-ийн монгол орчуулгатай — `data/abilities-mn.json`, админ `/admin/skills`-ээс засна), монгол түүх, матчап, counter item, эсрэг тоглох зөвлөгөө, одоогийн том патчийн өөрчлөлтүүд.
- **Item-ууд** (`/items`, `/items/neutral`) — дэлгүүрийн item, neutral item, enchantment бүрийн монгол танилцуулга, чадварын орчуулга, хэрэглэх заавар, тохирох баатрууд, жор, патчийн өөрчлөлт.
- **Мэдээ** (`/news`) — админ `/admin` хэсгээс өөрөө бичиж нэмнэ. Steam-ийн албан мэдээг татаж засаад нийтэлж бас болно.
- **Патчийн өөрчлөлт** (`/patch`, `/patch/<хувилбар>`) — одоогийн том патчийн дэд патч бүрийн баатар, item, neutral item-ийн өөрчлөлт. dota2.com-оос автоматаар татаж, Google Translate-ийн үнэгүй хаягаар монгол руу орчуулна (`data/patch-notes-mn.json`). Админ `/admin/patch` хэсгээс орчуулгыг засна — засвар нь машин орчуулгаас давуу.
- **Нүүр хуудасны слайд** — админ `/admin/banners` хэсгээс зураг, гарчиг, холбоос оруулна. Баннер байхгүй үед драфт, патч, мэдээ, баатар, item-ийн автомат слайдууд харагдана.

Сайтын толгой ба хөлд одоогийн өгөгдөл Dota 2-ын аль патчийнх болохыг харуулна; дээр нь дарахад тухайн патчийн өөрчлөлт нээгдэнэ.

## Ажиллуулах

```bash
npm install
cp .env.example .env.local   # ADMIN_PASSWORD (заавал), ANTHROPIC_API_KEY (заавал биш)
npm run dev                  # http://localhost:3000
```

Админ хэсэг: `/admin`, нууц үг нь `.env.local` дахь `ADMIN_PASSWORD`. Сольсны дараа серверээ дахин асаана.

## Байршуулалт (GitHub + Vercel + Supabase)

- **GitHub** — код, монгол контент, тоглоомын өгөгдөл (`data/`). `.github/workflows/update-game-data.yml` 3 цаг тутам шинэ патч шалгаж, статистикийг өдөрт нэг шинэчлээд өөрчлөлтийг commit хийнэ. GitHub → Actions → "Тоглоомын өгөгдөл шинэчлэх" → Run workflow-оор гараар ч ажиллуулна.
- **Vercel** — GitHub repo-г импортлоно; commit бүрт (Actions-ийн commit ч мөн) өөрөө дахин deploy хийнэ. Environment Variables: `ADMIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (заавал биш: `ANTHROPIC_API_KEY`).
- **Supabase** — мэдээ (`news`), слайд (`banners` + `banners` storage bucket), патчийн орчуулгын засвар (`patch_translations`). `supabase/migrations/` доторх `0001_news.sql`, `0002_banners_patch_translations.sql`-ийг дарааллаар нь SQL Editor дээр нэг удаа ажиллуулна. Хүснэгтэд RLS асаалттай бөгөөд policy байхгүй тул зөвхөн серверийн `service_role` түлхүүр хандана. Локал мэдээг хуулах: `npm run news:import`.

Supabase-ийн хувьсагч тохируулаагүй үед мэдээ локал `data/news.json` файлд хадгалагдана (зөвхөн локалд).

## Автомат шинэчлэлт (локал сервер)

Vercel дээр GitHub Actions шинэчилдэг. Локал сервер ажиллаж байх үед (`src/instrumentation.ts`) асаад 1 минутын дараа, дараа нь 3 цаг тутам:

1. dota2.com-оос хамгийн сүүлийн патчийг шалгана. Шинэ патч гарсан бол баатар, skill, talent, item, neutral item, enchantment, патчийн тэмдэглэлийг дахин татна.
2. Ялах/ялагдах статистик 24 цагаас хуучирсан бол OpenDota-гаас шинэчилнэ.
3. Өөрчлөлт орсон бол сайтын кэшийг цэвэрлэж, шинэ өгөгдлийг шууд харуулна (дахин build хийх шаардлагагүй).

Админ хэсгийн "Одоо шинэчлэх" товчоор гараар ч ажиллуулж болно. Унтраах бол `.env.local`-д `AUTO_UPDATE=off`.

Шинэ баатар эсвэл item гарвал монгол текст (`data/hero-content`, `data/item-content`) автоматаар үүсэхгүй — тэдгээр нь англи тайлбартай харагдана.

## Өгөгдлийн командууд

| Команд | Юу хийдэг |
| --- | --- |
| `npm run data:update` | Автомат шинэчлэлттэй ижил: шинэ патч гарсан бол `data:game`, статистик 24 цагаас хуучирсан бол `data:matchups` (`-- --force`: бүгдийг) |
| `npm run data:game` | dota2.com datafeed-ээс патч, баатар, skill, talent, item (одоогийн жагсаалтыг OpenDota-гийн сүүлийн 45 хоногийн про тоглолтоос, дэлгүүрийн ангиллыг Valve-ийн `shops.txt`-ээс), патчийн тэмдэглэл татна. `--if-new-patch` өгвөл патч өөрчлөгдөөгүй үед юу ч хийхгүй. Төгсгөлд нь орчуулаагүй патчийн мөр, skill-ийн текстийг Google Translate-ээр орчуулна (`scripts/lib/gtranslate.mjs`; тогтсон нэр томьёо нь `GLOSSARY`-д) |
| `npm run data:matchups` | OpenDota-гийн ranked тоглолтуудаас (анхдагч 400k, `MATCHES=1000000`) ялалт/хамтын статистик тооцоолно |
| `npm run news:sync` | Steam-ийн шинэ мэдээг ноорог болгон нэмнэ. `-- --translate` нэмбэл Claude API-аар орчуулна |

## Бүтэц

- `data/` — бүх өгөгдөл JSON-оор: `heroes.json`, `hero-abilities.json`, `items.json`, `matchups.json`, `patch-notes.json`, `patches.json` (патч бүрийн өөрчлөлт), `patch-notes-mn.json`, `abilities-mn.json` (машин орчуулга), `meta.json` (патч, шинэчилсэн огноо), `news.json`.
- `data/hero-content/<slug>.json`, `data/item-content/<key>.json` — монгол текстүүд. Гараар засаж болно.
- `src/lib/data.ts` — JSON-ийг ажиллах үед уншина (файл солигдвол дахин уншина).
- `src/lib/updater.ts`, `src/lib/autoUpdate.ts`, `src/app/api/game-data/update` — автомат шинэчлэлт.
- `src/lib/draft.ts` — CM дараалал ба санал болгох тооцоо. Давуу тал = бодит ялалтын хувь − хоёр баатрын ерөнхий ялалтын хувиас хүлээгдэх хувь (цөөн тоглолттой хосыг 0 руу татна).
- `src/lib/translate.ts` — Steam мэдээг Claude API-аар орчуулах (заавал биш).
