import { defineConfig } from 'vite';

export default defineConfig({
  /* Rutas relativas en vez de absolutas. Así el sitio compilado
     funciona igual servido desde la raíz de un dominio que desde
     una subcarpeta o una vista previa. */
  base: './',
});
