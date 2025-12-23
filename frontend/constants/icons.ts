import { FunctionCode } from "@/types/oox";

const ANIMAL_ICONS: Record<FunctionCode, string> = {
  Ni: "/images/oox_animal_owl.png", // フクロウ
  Ne: "/images/oox_animal_cat.png", // ネコ
  Ti: "/images/oox_animal_spider.png", // クモ
  Te: "/images/oox_animal_bee.png", // ハチ
  Fi: "/images/oox_animal_rabbit.png", // ウサギ
  Fe: "/images/oox_animal_dolphin.png", // イルカ
  Si: "/images/oox_animal_squirrel.png", // リス
  Se: "/images/oox_animal_cheetah.png", // チーター
};

export function getAnimalIcon(functionCode: FunctionCode) {
  return ANIMAL_ICONS[functionCode] || ANIMAL_ICONS["Fi"];
}
