/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Gentle Clinical palette
        primary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#90CAF9',
          600: '#1E88E5',
          700: '#1976D2',
        },
        accent: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#A5D6A7',
          600: '#43A047',
        },
        neutral: {
          50: '#F8FAF9',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
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