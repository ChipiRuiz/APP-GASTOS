// Permite abrir la app sin conexión: guarda la app y la librería de Supabase.
// La app se pide primero a internet (para recibir cambios) y si no hay, sale de lo guardado.
const C='gastos-v1';
const CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  if(u.origin===location.origin){
    const key=r.mode==='navigate'?'index.html':r;
    const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(key,cp))}return res});
    // Con señal débil no espera más de 4 segundos: abre lo guardado.
    const slow=new Promise(ok=>setTimeout(ok,4000)).then(()=>caches.match(key,{ignoreSearch:true}));
    e.respondWith(Promise.race([net.catch(()=>caches.match(key,{ignoreSearch:true})),slow.then(hit=>hit||net)]));
    return;
  }
  if(u.hostname==='cdn.jsdelivr.net'){
    e.respondWith(caches.match(r).then(hit=>{const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>hit);return hit||net}));
  }
});
