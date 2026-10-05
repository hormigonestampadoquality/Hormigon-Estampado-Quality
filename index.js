export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Servir el HTML principal
    if (path === '/' || path === '/index.html') {
      const html = await env.__STATIC_CONTENT.get('index.html');
      if (html) {
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      // Fallback: leer desde el repositorio
      return new Response('HTML not found', { status: 404 });
    }

    // Servir archivos estáticos (logo, imágenes)
    if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      const asset = await env.__STATIC_CONTENT.get(path.substring(1));
      if (asset) {
        const contentType = path.endsWith('.png') ? 'image/png' : 'image/jpeg';
        return new Response(asset, {
          headers: { 'Content-Type': contentType }
        });
      }
    }

    // API: Proyectos
    if (path === '/api/projects' && request.method === 'GET') {
      const projects = await env.DB.get('projects');
      return new Response(projects || '[]', {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (path === '/api/projects' && request.method === 'POST') {
      const body = await request.json();
      const projects = JSON.parse(await env.DB.get('projects') || '[]');
      projects.push(body);
      await env.DB.put('projects', JSON.stringify(projects));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (path.startsWith('/api/projects/') && request.method === 'DELETE') {
      const id = parseInt(path.split('/').pop());
      const projects = JSON.parse(await env.DB.get('projects') || '[]');
      const trash = JSON.parse(await env.DB.get('trash') || '[]');
      const project = projects.find(p => p.id === id);
      if (project) {
        trash.push({ ...project, deletedAt: new Date().toISOString() });
        await env.DB.put('trash', JSON.stringify(trash));
      }
      const filtered = projects.filter(p => p.id !== id);
      await env.DB.put('projects', JSON.stringify(filtered));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // API: Trash
    if (path === '/api/trash' && request.method === 'GET') {
      const trash = await env.DB.get('trash');
      return new Response(trash || '[]', {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (path === '/api/trash/restore' && request.method === 'POST') {
      const body = await request.json();
      const trash = JSON.parse(await env.DB.get('trash') || '[]');
      const projects = JSON.parse(await env.DB.get('projects') || '[]');
      
      body.ids.forEach(id => {
        const item = trash.find(t => t.id === id);
        if (item) {
          projects.push({ ...item, status: 'active' });
        }
      });
      
      const filteredTrash = trash.filter(t => !body.ids.includes(t.id));
      await env.DB.put('projects', JSON.stringify(projects));
      await env.DB.put('trash', JSON.stringify(filteredTrash));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (path === '/api/trash/delete' && request.method === 'POST') {
      const body = await request.json();
      const trash = JSON.parse(await env.DB.get('trash') || '[]');
      const filtered = trash.filter(t => !body.ids.includes(t.id));
      await env.DB.put('trash', JSON.stringify(filtered));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // API: Inventario
    if (path === '/api/inventory' && request.method === 'GET') {
      const inventory = await env.DB.get('inventory');
      if (!inventory) {
        // Default inventory
        const defaultInventory = [
          { id: 1, name: "Mallas Acma C92", qty: 3, unit: "unid", price: 23900 },
          { id: 2, name: "Estabilizado", qty: 1, unit: "cubo", price: 40000 },
          { id: 3, name: "Retiro de Escombro", qty: 1, unit: "servicio", price: 120000 },
          { id: 4, name: "Plástico Polipropileno", qty: 1, unit: "rollo", price: 37000 },
          { id: 5, name: "Colores", qty: 5, unit: "unid", price: 13900 },
          { id: 6, name: "Desmoldante", qty: 1, unit: "unid", price: 25000 },
          { id: 7, name: "Moldes", qty: 4, unit: "unid", price: 5000 },
          { id: 8, name: "Personal", qty: 1, unit: "servicio", price: 320000 },
          { id: 9, name: "Sello Acrílico", qty: 1, unit: "balde", price: 86000 },
          { id: 10, name: "Brochas", qty: 1, unit: "set", price: 6000 },
          { id: 11, name: "Rodillos", qty: 1, unit: "set", price: 7000 },
          { id: 12, name: "Madera", qty: 1, unit: "global", price: 10000 },
          { id: 13, name: "Tornillos", qty: 1, unit: "caja", price: 8000 },
          { id: 14, name: "Gasolina", qty: 1, unit: "global", price: 50000 },
          { id: 15, name: "TAG", qty: 1, unit: "mensual", price: 20000 },
          { id: 16, name: "Mano de Obra", qty: 1, unit: "servicio", price: 400000 }
        ];
        await env.DB.put('inventory', JSON.stringify(defaultInventory));
        return new Response(JSON.stringify(defaultInventory), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(inventory, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (path === '/api/inventory' && request.method === 'PUT') {
      const body = await request.json();
      await env.DB.put('inventory', JSON.stringify(body));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // API: Tarifas
    if (path === '/api/rates' && request.method === 'GET') {
      const rates = await env.DB.get('rates');
      if (!rates) {
        const defaultRates = [
          { maxM2: 60, price: 34000 },
          { maxM2: 90, price: 33500 },
          { maxM2: 100, price: 32000 },
          { maxM2: 9999, price: 32000 }
        ];
        await env.DB.put('rates', JSON.stringify(defaultRates));
        return new Response(JSON.stringify(defaultRates), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(rates, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (path === '/api/rates' && request.method === 'PUT') {
      const body = await request.json();
      await env.DB.put('rates', JSON.stringify(body));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};