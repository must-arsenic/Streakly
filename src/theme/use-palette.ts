// The palette for the phone's light or dark setting.
import { useColorScheme } from "react-native";

import { type Palette, tokens } from "./tokens";

export function usePalette(): Palette {
  return useColorScheme() === "dark" ? tokens.dark : tokens.light;
}
