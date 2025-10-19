/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
        }
      },
      fontFamily: {
        sans: [
          'Inter', 'Segoe UI', 'Roboto', 'Noto Sans',
          'Alibaba Sans', '阿里妈妈方圆体', 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'WenQuanYi Micro Hei',
          'Source Han Sans SC', 'Source Han Sans CN', '思源黑体',
          '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'sans-serif'
        ]
      }
    },
  },
  plugins: [],
}