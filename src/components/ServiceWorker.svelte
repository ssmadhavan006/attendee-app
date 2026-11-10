<script>
  const base = import.meta.env.BASE_URL || '/';
  if ('serviceWorker' in navigator && !import.meta.env.DEV) {
    window.addEventListener('load', () => {
      const swUrl = `${base.replace(/\/+$/, '')}/sw.js`;
      navigator.serviceWorker.register(swUrl, { scope: base }).catch((err) => {
        console.error('ServiceWorker registration failed: ', err);
      });
    });
  }
</script>
