import type { VerticalConfig } from "@/lib/types";
import { foodVertical } from "./food";
import { styleVertical } from "./style";
import { diningVertical } from "./dining";

export const verticals: Record<string, VerticalConfig> = {
  food: foodVertical,
  style: styleVertical,
  dining: diningVertical,
};

export const verticalList: VerticalConfig[] = [
  foodVertical,
  styleVertical,
  diningVertical,
];
