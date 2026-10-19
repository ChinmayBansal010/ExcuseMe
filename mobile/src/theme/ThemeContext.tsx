import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

const darkColors = {
  bg: "#0B0D11",
  panel: "#13171D",
  panel2: "#1B2129",
  border: "#2A323D",
  text: "#F2F3EF",
  muted: "#929BA7",
  accent: "#C4E478",
  blue: "#8FB7E8",
  purple: "#C0A5E8",
  orange: "#E9AE75",
  red: "#E88787",
  green: "#C4E478",
  input: "#0E1116",
  selected: "#1C2517",
  selectedBorder: "#52623C",
  pill: "#20291A",
  code: "#D0D9E6",
};

const lightColors = {
  bg: "#F6F8FC",
  panel: "#FFFFFF",
  panel2: "#EEF2F8",
  border: "#DCE3EE",
  text: "#172033",
  muted: "#5F6B80",
  accent: "#365FC7",
  blue: "#315F9B",
  purple: "#7450A4",
  orange: "#985A22",
  red: "#B33D49",
  green: "#28764A",
  input: "#FBFCFF",
  selected: "#EAF0FF",
  selectedBorder: "#A8BDF0",
  pill: "#E8EEFC",
  code: "#39465C",
};

type ThemeColors = typeof darkColors;
type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const value = useMemo(() => ({
    colors: theme === "dark" ? darkColors : lightColors,
    isDark: theme === "dark",
    toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark"),
    setTheme,
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

export type { ThemeColors };
