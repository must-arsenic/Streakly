// The design tokens: the one place a raw colour or size lives (`pnpm lint` checks). DESIGN.md's
// tokens go here, light and dark.
export const tokens = {
  light: { bg: "#ffffff", surface: "#f4f4f6", text: "#111114", muted: "#5c5f66", accent: "#2f5bea", onAccent: "#ffffff", border: "#dcdde2", danger: "#c0362c" },
  dark: { bg: "#0b0b0c", surface: "#1a1b1e", text: "#f2f2f4", muted: "#a3a6ad", accent: "#7d9bff", onAccent: "#0b0b0c", border: "#2c2e33", danger: "#ff7a6e" },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 6, md: 12, lg: 20 },
  type: { body: 16, small: 13, title: 24, heading: 20 },
} as const;

export type Palette = { [K in keyof (typeof tokens)["light"]]: string };
