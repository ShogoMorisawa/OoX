import { FunctionCode, Tier } from "@/types/oox";
import { OOX_TIER } from "./tier";

export function getIcon(dominant: FunctionCode, second: FunctionCode): string {
  return `/images/icons/oox_icon_${second}_${dominant}.png`;
}

export function getCellImage(func: FunctionCode): string {
  return `/images/cells/left_${func}.png`;
}

export function getHierarchyCellImage(
  tier: Tier,
  func: FunctionCode,
  isLeft: boolean
): string {
  const side = isLeft ? "left" : "right";

  let tierDir: string;
  switch (tier) {
    case OOX_TIER.DOMINANT:
      tierDir = "king";
      break;
    case OOX_TIER.HIGH:
      tierDir = "knight";
      break;
    case OOX_TIER.MIDDLE:
      tierDir = "citi";
      break;
    case OOX_TIER.LOW:
      return `/images/hie_cells/lost/${side}_lost.png`;
    default:
      tierDir = "lost";
      return `/images/hie_cells/lost/${side}_lost.png`;
  }

  return `/images/hie_cells/${tierDir}/${side}_${func}.png`;
}
