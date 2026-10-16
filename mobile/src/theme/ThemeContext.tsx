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
  bg: "#F5F5F0",
  panel: "#FFFFFF",
  panel2: "#ECEFE7",
  border: "#DCE1D6",
  text: "#20251D",
  muted: "#687164",
  accent: "#536D2C",
  blue: "#315F9B",
  purple: "#7450A4",
  orange: "#985A22",
  red: "#B33D49",
  green: "#3F762D",
  input: "#FAFBF8",
  selected: "#EDF3E4",
  selectedBorder: "#A8BC8D",
  pill: "#E7EEDC",
  code: "#394337",
};

type ThemeColors = typeof darkColors;
type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
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
