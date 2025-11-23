import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/reservation-widget.js',
            formats: ['es']
        },
        rollupOptions: {
            input: {
                main: 'index.html',
                admin: 'admin.html'
            }
        }
    }
});
