// The palette for the chosen theme: "system" follows the phone's light or dark setting.
import { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

import type { Theme } from "@/lib/store";

import { type Palette, tokens } from "./tokens";

export const ThemeChoice = createContext<Theme>("system");

export function useScheme(): "light" | "dark" {
  const choice = useContext(ThemeChoice);
  const phone = useColorScheme();
  if (choice === "light" || choice === "dark") return choice;
  return phone === "dark" ? "dark" : "light";
}

export function usePalette(): Palette {
  return useScheme() === "dark" ? tokens.dark : tokens.light;
}

export function useHabitColours(): readonly string[] {
  return useScheme() === "dark" ? tokens.habit.dark : tokens.habit.light;
}
