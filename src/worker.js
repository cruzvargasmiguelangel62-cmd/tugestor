export default {
  async fetch(request, env, ctx) {
    // Cuando se configura "assets" en wrangler.jsonc, Cloudflare intercepta
    // las peticiones a archivos estáticos antes de llegar aquí.
    // Este worker actúa como fallback (por ejemplo, para 404s en SPAs).
    return new Response("Not Found", { status: 404 });
  }
};