// Локал сервер дээр тоглоомын өгөгдлийг scripts/update-all.mjs-ээр шинэчилж, сайтын кэшийг цэвэрлэнэ.
// Vercel дээр файл бичих боломжгүй тул тэнд GitHub Actions шинэчилдэг (.github/workflows/update-game-data.yml).
// Server Action эсвэл Route Handler-ээс дуудна (revalidate-д хүсэлтийн контекст хэрэгтэй).
import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { revalidatePath, revalidateTag } from "next/cache";
import { GAME_DATA_TAG, readData } from "./data";
import { getGameMeta } from "./patch";

const run = promisify(execFile);
const STATUS_FILE = "update-status.json";

export type UpdateStatus = {
  running?: boolean;
  lastRunAt?: string;
  lastResult?: "ok" | "error";
  message?: string;
};

/** Vercel (эсвэл файл бичих боломжгүй орчин) дээр ажиллаж байгаа эсэх. */
export const isHosted = () => Boolean(process.env.VERCEL);

/** GitHub Actions-ийн шинэчлэлтийн хуудас (Vercel-ийн системийн хувьсагчаас). */
export function workflowUrl() {
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.VERCEL_GIT_REPO_SLUG;
  return owner && repo ? `https://github.com/${owner}/${repo}/actions/workflows/update-game-data.yml` : null;
}

export function getUpdateStatus(): UpdateStatus {
  return readData<UpdateStatus>(STATUS_FILE, {});
}

async function setStatus(status: UpdateStatus) {
  await writeFile(path.join(process.cwd(), "data", STATUS_FILE), JSON.stringify(status, null, 2));
}

// Өгөгдөл өөрчлөгдсөн эсэхийг мэдэх "хувилбар".
const version = () =>
  `${getGameMeta().gameDataUpdatedAt}|${readData<{ generatedAt?: string }>("matchups.json", {}).generatedAt}`;

// Нэг процесст нэг шинэчлэлт л зэрэг явна.
let current: Promise<UpdateStatus> | null = null;

/** force=false: шинэ патч гарсан бол л баатар/item-ийг, статистикийг 24 цаг тутам. force=true: бүгдийг одоо. */
export function runGameDataUpdate({ force = false } = {}): Promise<UpdateStatus> {
  if (isHosted()) {
    return Promise.resolve({
      lastResult: "error",
      message: "Энд (Vercel) өгөгдлийг GitHub Actions шинэчилдэг — GitHub дээрх workflow-оос ажиллуулна уу.",
    });
  }
  current ??= (async () => {
    const startedAt = new Date().toISOString();
    await setStatus({ ...getUpdateStatus(), running: true });
    try {
      const before = version();
      await run(process.execPath, [path.join("scripts", "update-all.mjs"), ...(force ? ["--force"] : [])], {
        cwd: process.cwd(),
        timeout: 15 * 60 * 1000,
        maxBuffer: 10 * 1024 * 1024,
      });
      const changed = version() !== before;
      if (changed) {
        revalidateTag(GAME_DATA_TAG, { expire: 0 });
        revalidatePath("/", "layout");
      }
      const status: UpdateStatus = {
        lastRunAt: startedAt,
        lastResult: "ok",
        message: changed ? `Шинэчлэгдлээ (патч ${getGameMeta().patch}).` : `Өөрчлөлтгүй (патч ${getGameMeta().patch}).`,
      };
      await setStatus(status);
      return status;
    } catch (e) {
      const status: UpdateStatus = {
        lastRunAt: startedAt,
        lastResult: "error",
        message: (e instanceof Error ? e.message : String(e)).slice(0, 2000),
      };
      await setStatus(status);
      return status;
    }
  })().finally(() => {
    current = null;
  });
  return current;
}
