import { FunctionCode } from "@/types/oox";

export function getIcon(dominant: FunctionCode, second: FunctionCode): string {
  return `/images/icons/oox_icon_${dominant}_${second}.png`;
}
