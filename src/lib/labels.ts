// Клиент талд ч ашиглагддаг тул энд JSON өгөгдөл импортлохгүй.
export type Attr = "str" | "agi" | "int" | "all";

export const ATTRS: Attr[] = ["str", "agi", "int", "all"];

// Атрибут, үүргийн нэрийг Монгол тоглогчдын хэрэглэдгээр англиар нь үлдээнэ.
export const ATTR_LABEL: Record<Attr, string> = {
  str: "Strength",
  agi: "Agility",
  int: "Intelligence",
  all: "Universal",
};

export const ATTR_COLOR: Record<Attr, string> = {
  str: "text-str",
  agi: "text-agi",
  int: "text-int",
  all: "text-all",
};

export const ROLE_LABEL: Record<string, string> = {
  Carry: "Carry",
  Support: "Support",
  Nuker: "Nuker",
  Disabler: "Disabler",
  Jungler: "Jungler",
  Durable: "Durable",
  Escape: "Escape",
  Pusher: "Pusher",
  Initiator: "Initiator",
};

/** Тоглоомын дэлгүүрийн табууд — түлхүүр нь Valve-ийн shops.txt-ийн хэсгийн нэр. */
export const SHOP_CATEGORIES = [
  { key: "consumables", label: "Хэрэглээний" },
  { key: "attributes", label: "Үзүүлэлт" },
  { key: "weapons_armor", label: "Зэвсэг ба хуяг" },
  { key: "misc", label: "Бусад" },
  { key: "secretshop", label: "Нууц дэлгүүр" },
  { key: "basics", label: "Дагалдах хэрэгсэл" },
  { key: "support", label: "Support" },
  { key: "defense", label: "Хамгаалалт" },
  { key: "weapons", label: "Зэвсэг" },
  { key: "artifacts", label: "Артефакт" },
] as const;

export const ATTACK_LABEL: Record<string, string> = {
  Melee: "Ойрын",
  Ranged: "Холын",
};
