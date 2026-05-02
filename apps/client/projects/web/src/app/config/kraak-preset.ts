import { definePreset, palette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import {
  BRAND_NAVY,
  BRAND_BLUE,
  BRAND_CYAN,
  BRAND_GOLD,
  BRAND_GRAY,
  BRAND_WHITE,
  NEUTRAL,
} from '@kraak/tokens';

// Palettes g\u00E9n\u00E9r\u00E9es \u00E0 partir des jetons de marque KRAAK
const navy = palette(BRAND_NAVY);
const blue = palette(BRAND_BLUE);
const cyan = palette(BRAND_CYAN);
const gold = palette(BRAND_GOLD);

export const KraakPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '4px',
      sm: '6px',
      md: '0.75rem', // --radius-btn
      lg: '1rem',
      xl: '1.25rem', // --radius-card
    },
    navy,
    blue,
    cyan,
    gold,
  },
  semantic: {
    // Palette primaire \u2192 navy
    primary: {
      50: '{navy.50}',
      100: '{navy.100}',
      200: '{navy.200}',
      300: '{navy.300}',
      400: '{navy.400}',
      500: '{navy.500}',
      600: '{navy.600}',
      700: '{navy.700}',
      800: '{navy.800}',
      900: '{navy.900}',
      950: '{navy.950}',
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{cyan.500}',
      offset: '2px',
    },
    formField: {
      borderRadius: '{border.radius.md}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{navy.600}',
          contrastColor: BRAND_WHITE,
          hoverColor: '{navy.700}',
          activeColor: '{navy.800}',
        },
        highlight: {
          background: '{gold.100}',
          focusBackground: '{gold.200}',
          color: '{navy.800}',
          focusColor: '{navy.900}',
        },
        surface: {
          0: NEUTRAL[0],
          50: NEUTRAL[50],
          100: NEUTRAL[100],
          200: NEUTRAL[200],
          300: NEUTRAL[300],
          400: NEUTRAL[400],
          500: NEUTRAL[500],
          600: NEUTRAL[600],
          700: NEUTRAL[700],
          800: NEUTRAL[800],
          900: NEUTRAL[900],
          950: NEUTRAL[950],
        },
        text: {
          color: '{surface.900}',
          hoverColor: '{surface.800}',
          mutedColor: BRAND_GRAY,
          hoverMutedColor: '{surface.600}',
        },
        content: {
          background: '{surface.0}',
          hoverBackground: '{surface.50}',
          borderColor: '{surface.200}',
          color: '{text.color}',
          hoverColor: '{text.hover.color}',
        },
      },
    },
  },
  components: {
    button: {
      root: {
        borderRadius: '{border.radius.md}',
      },
    },
    card: {
      root: {
        borderRadius: '{border.radius.xl}',
      },
    },
  },
});
