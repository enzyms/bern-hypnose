// Tailwind 3 via PostCSS (replaces the deprecated @astrojs/tailwind integration,
// which only injected these two plugins; applyBaseStyles was already false).
module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {}
    }
};
