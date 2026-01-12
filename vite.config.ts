import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler']],
            },
        }),
    ],
    server: {
        host: true,       // hoặc host: '0.0.0.0' để mở cho mạng LAN
        port: 5173,       // port tùy chọn
        strictPort: true, // nếu port đang dùng, báo lỗi thay vì auto đổi
    },
})
