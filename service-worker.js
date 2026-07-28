/* Service Worker — Biblioteca DeCastro
   Guarda a "casca" do app (index, ícones, manifest) para permitir
   instalar no celular e abrir mesmo com internet instável.
   NÃO intercepta o Google Drive nem o Worker de assinaturas:
   essas chamadas sempre vão à rede (importante para validar acesso). */
const CACHE = "decastro-biblioteca-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Só cuida dos arquivos do próprio app. Drive/Worker passam direto pela rede.
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return resp;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
