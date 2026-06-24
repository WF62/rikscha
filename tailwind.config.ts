import type { Config } from 'tailwindcss';
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rikscha: {
          green: '#2d6a4f',
          light: '#52b788',
          bg: '#f0faf4',
        },
      },
    },
  },
  plugins: [],
};
export default config;
