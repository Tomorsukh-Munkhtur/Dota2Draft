import Image from "next/image";
import Link from "next/link";
import type { Item } from "@/lib/heroes";

const RECIPE_IMG = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/recipe.png";
const NODE_W = 88; // нэг зангилааны эзлэх өргөн (px), олон item-тэй үед хэвтээ гүйлгэнэ

type Node = { key: string; name: string; img: string; cost: number; href?: string };

function NodeView({ node, x, y, gold }: { node: Node; x: number; y: number; gold?: boolean }) {
  const body = (
    <>
      <Image
        src={node.img}
        alt={node.name}
        width={64}
        height={47}
        className={`h-[47px] w-16 rounded-sm bg-black ring-2 transition ${
          gold ? "ring-gold/80 shadow-[0_0_10px_rgba(227,180,92,0.35)]" : "ring-white/15"
        } group-hover:ring-white`}
      />
      <span className="mt-1 line-clamp-1 max-w-full text-center text-[10px] leading-tight text-fg/80 group-hover:text-white">
        {node.name}
      </span>
      {node.cost > 0 && <span className="text-[10px] tabular-nums text-gold/80">{node.cost}</span>}
    </>
  );
  const cls = "group absolute flex -translate-x-1/2 -translate-y-[24px] flex-col items-center";
  const style = { left: `${x}%`, top: `${y}%`, width: NODE_W - 8 };
  return node.href ? (
    <Link href={node.href} title={`${node.name}${node.cost ? ` · ${node.cost} алт` : ""}`} className={cls} style={style}>
      {body}
    </Link>
  ) : (
    <div title={node.name} className={cls} style={style}>
      {body}
    </div>
  );
}

const xs = (n: number) => Array.from({ length: n }, (_, i) => ((i + 0.5) / n) * 100);

/**
 * Тоглоомын дэлгүүр шиг item-ийн жорын схем: дээр нь энэ item ордог item-ууд, голд нь өөрөө,
 * доор нь бүрэлдэхүүн (алтан хүрээтэй) ба жор. Зураасаар холбоно.
 */
export default function ItemBuildTree({
  item,
  components,
  recipeCost,
  parents,
}: {
  item: Item;
  components: Item[];
  recipeCost: number;
  parents: Item[];
}) {
  const toNode = (it: Item): Node => ({ key: it.key, name: it.name, img: it.img, cost: it.cost, href: `/items/${it.key}` });
  const top = parents.map(toNode);
  const bottom = [
    ...components.map(toNode),
    ...(recipeCost > 0 ? [{ key: "recipe", name: "Жор (Recipe)", img: RECIPE_IMG, cost: recipeCost }] : []),
  ];
  if (!top.length && !bottom.length) return null;

  // Мөрүүдийн босоо байрлал (px → %). Зангилаа нь зургийн төвөөсөө 24px дээш, 56px доош сунана.
  const rows = (top.length ? 1 : 0) + 1 + (bottom.length ? 1 : 0);
  const height = rows === 3 ? 340 : 230;
  const pct = (px: number) => (px / height) * 100;
  const yTop = pct(40);
  const yMid = pct(rows === 3 ? 170 : top.length ? 170 : 60);
  const yBottom = pct(height - 60);
  const topX = xs(top.length);
  const bottomX = xs(bottom.length);
  const minWidth = Math.max(top.length, bottom.length, 3) * NODE_W;

  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <div className="relative mx-auto" style={{ height, minWidth, maxWidth: Math.max(minWidth, 560) }}>
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          {topX.map((x, i) => (
            <line key={`t${i}`} x1="50%" y1={`${yMid}%`} x2={`${x}%`} y2={`${yTop}%`} className="stroke-white/25" strokeWidth={1.5} />
          ))}
          {bottomX.map((x, i) => (
            <line
              key={`b${i}`}
              x1="50%"
              y1={`${yMid}%`}
              x2={`${x}%`}
              y2={`${yBottom}%`}
              className="stroke-gold/40"
              strokeWidth={1.5}
            />
          ))}
        </svg>

        {top.map((n, i) => (
          <NodeView key={`t${n.key}${i}`} node={n} x={topX[i]} y={yTop} />
        ))}

        {/* Энэ item — голд, томоор */}
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: "50%", top: `${yMid}%` }}
        >
          <Image
            src={item.img}
            alt={item.name}
            width={88}
            height={64}
            className="h-16 w-[88px] rounded bg-black shadow-[0_0_18px_rgba(74,174,232,0.45)] ring-2 ring-int/80"
          />
        </div>

        {bottom.map((n, i) => (
          <NodeView key={`b${n.key}${i}`} node={n} x={bottomX[i]} y={yBottom} gold />
        ))}
      </div>
    </div>
  );
}
