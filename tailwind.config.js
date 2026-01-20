/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0891b2',
                    hover: '#0e7490',
                    light: '#ecfeff',
                },
                success: {
                    DEFAULT: '#22c55e',
                    light: '#dcfce7',
                },
                warning: {
                    DEFAULT: '#f97316',
                    light: '#ffedd5',
                },
                danger: {
                    DEFAULT: '#ef4444',
                    light: '#fee2e2',
                },
                neutral: {
                    DEFAULT: '#6b7280',
                    light: '#f3f4f6',
                },
                text: {
                    primary: '#111827',
                    secondary: '#4b5563',
                    muted: '#9ca3af',
                },
                border: {
                    DEFAULT: '#e5e7eb',
                    dark: '#d1d5db',
                },
            },
        },
    },
    plugins: [],
}
