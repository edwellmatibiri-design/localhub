import { useThemeContext } from "./ThemeProvider";

export function useTheme() {
  const { theme, setTheme } = useThemeContext();
  return { theme, setTheme };
}
