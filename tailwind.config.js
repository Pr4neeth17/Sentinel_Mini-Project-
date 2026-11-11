/** @type {import('tailwindcss').Config} */
const v = (name) => `var(--${name})`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        frame: v("frame"),
        surface: v("surface"),
        raised: v("raised"),
        active: v("active"),
        border: v("border"),
        rule: v("rule"),
        control: v("control"),
        ink: v("text"),
        muted: v("muted"),
        faint: v("faint"),
        accent: v("accent"),
        "accent-fill": v("accent-fill"),
        "accent-soft": v("accent-soft"),
        "accent-ink": v("accent-ink"),
        "on-accent": v("on-accent"),
        danger: v("danger"),
        "danger-soft": v("danger-soft"),
        "danger-ink": v("danger-ink"),
        ok: v("ok"),
        "ok-soft": v("ok-soft"),
        "ok-ink": v("ok-ink"),
        hl: v("hl"),
        "hl-ink": v("hl-ink"),
        primary: v("primary"),
        gridline: v("gridline"),
        "panel-dark": v("panel-dark"),
        "on-primary": v("on-primary"),
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "Inter", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        xs: ["12px", "16px"],
        sm: ["14px", "20px"],
        base: ["16px", "24px"],
        lg: ["20px", "28px"],
        xl: ["28px", "34px"],
        code: ["12.5px", "18px"],
      },
      borderRadius: {
        card: "4px",
        control: "2px",
        sheet: "4px",
      },
    },
  },
  plugins: [],
};
