import {
  Hct,
  MaterialDynamicColors,
  Variant,
  DynamicScheme,
  customColor,
  hexFromArgb,
} from "@material/material-color-utilities";

export function themeFromSourceColor2(source, customColors = []) {
  return {
    source,
    schemes: {
      light: new DynamicScheme({
        isDark: false,
        sourceColorHct: Hct.fromInt(source),
        variant: Variant.EXPRESSIVE,
        contrastLevel: 0.0,
      }),
      dark: new DynamicScheme({
        isDark: true,
        sourceColorHct: Hct.fromInt(source),
        variant: Variant.EXPRESSIVE,
        contrastLevel: 0.0,
      }),
    },
    customColors: customColors.map((c) => customColor(source, c)),
  };
}

export function applyTheme(theme, options) {
  const target = options?.target || document.body;
  const isDark = options?.dark ?? false;

  const scheme = isDark ? theme.schemes.dark : theme.schemes.light;
  setSchemeProperties(target, scheme);

  if (options?.brightnessSuffix) {
    setSchemeProperties(target, theme.schemes.dark, "-dark");
    setSchemeProperties(target, theme.schemes.light, "-light");
  }

  if (options?.paletteTones) {
    const tones = options?.paletteTones ?? [];
    const palettes = scheme;

    const paletteMap = {
      primary: palettes.primaryPalette,
      secondary: palettes.secondaryPalette,
      tertiary: palettes.tertiaryPalette,
      neutral: palettes.neutralPalette,
      neutralVariant: palettes.neutralVariantPalette,
      error: palettes.errorPalette,
    };

    for (const [key, palette] of Object.entries(paletteMap)) {
      const paletteKey = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      for (const tone of tones) {
        const token = `--md-ref-palette-${paletteKey}-${tone}`;
        const color = hexFromArgb(palette.tone(tone));
        target.style.setProperty(token, color);
      }
    }
  }
}

function setSchemeProperties(target, scheme, suffix = "") {
  for (const [key, dynamicColor] of Object.entries(MaterialDynamicColors)) {
    if (dynamicColor && typeof dynamicColor.getArgb === "function") {
      const argb = dynamicColor.getArgb(scheme);
      const colorHex = hexFromArgb(argb);

      const token = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

      target.style.setProperty(`--md-sys-color-${token}${suffix}`, colorHex);
    }
  }
}
