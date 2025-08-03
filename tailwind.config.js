/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        washi: '#F5F1EE', // 和纸色
        'linen-gray': '#E8E1D9', // 亚麻灰
        'moss-green': '#A5C9B9', // 苔藓绿
        'moss-dark': '#8DAF9F', // 深苔藓绿
      },
      fontFamily: {
        'lxgw-wenkai': ['LXGW WenKai', 'serif'],
        'ibm-plex-sans': ['IBM Plex Sans', 'sans-serif'],
      },
      boxShadow: {
        wabi: '0 2px 12px rgba(165, 201, 185, 0.15)', // 浅绿色柔影
        depth: '2px 4px 12px rgba(0, 0, 0, 0.08)', // 深度阴影
      },
    },
  },
  plugins: [],
}