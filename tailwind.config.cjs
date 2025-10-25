const withOpacityValue = variable => {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) {
      return `rgb(var(${variable}))`;
    }
    return `rgb(var(${variable}) / ${opacityValue})`;
  };
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx,css,html}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: withOpacityValue("--color-primary-50"),
          100: withOpacityValue("--color-primary-100"),
          200: withOpacityValue("--color-primary-200"),
          300: withOpacityValue("--color-primary-300"),
          400: withOpacityValue("--color-primary-400"),
          500: withOpacityValue("--color-primary-500"),
          600: withOpacityValue("--color-primary-600"),
          700: withOpacityValue("--color-primary-700"),
          800: withOpacityValue("--color-primary-800"),
          900: withOpacityValue("--color-primary-900")
        },
        surface: {
          DEFAULT: withOpacityValue("--color-surface-900"),
          raised: withOpacityValue("--color-surface-800"),
          subtle: withOpacityValue("--color-surface-700")
        },
        accent: withOpacityValue("--color-accent"),
        success: withOpacityValue("--color-success"),
        warning: withOpacityValue("--color-warning"),
        danger: withOpacityValue("--color-danger"),
        foreground: withOpacityValue("--color-foreground"),
        muted: withOpacityValue("--color-muted"),
        background: withOpacityValue("--color-background")
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Clash Display'", "Inter", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 40px rgba(53, 102, 255, 0.25)"
      }
    }
  },
  plugins: []
};
