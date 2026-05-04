# CoffeeLife — Panel de Administración

Panel de administración construido con **React + Vite + Axios**.

---

## 🚀 Cómo correr el proyecto

```bash
npm install
npm run dev
```

El frontend corre en `http://localhost:5173` y apunta al backend en `http://localhost:3333`.  
Para cambiar la URL del backend, edita `src/services/api.js`.

---

## 📁 Estructura del proyecto

```
src/
├── App.jsx                        ← Punto de entrada, enrutador de páginas
├── main.jsx                       ← Monta React en el DOM
├── index.css                      ← Reset y estilos globales
│
├── context/
│   └── AuthContext.jsx            ← Estado de sesión del admin (user, logout)
│
├── services/
│   └── api.js                     ← Instancia de Axios configurada al backend
│
├── layouts/
│   ├── AdminLayout.jsx            ← Layout principal: sidebar + área de contenido
│   └── AdminLayout.css
│
├── components/
│   ├── Sidebar.jsx                ← Barra de navegación vertical
│   └── Sidebar.css
│
└── pages/
    ├── Dashboard/
    │   ├── Dashboard.jsx          ✅ Funcional (esqueleto listo)
    │   └── Dashboard.css
    │
    ├── Administrador/
    │   ├── Administrador.jsx      ✅ CRUD completo conectado al backend
    │   └── Administrador.css
    │
    ├── Perfil/                    🔴 Por implementar
    ├── Experto/                   🔴 Por implementar
    ├── Campesino/                 🔴 Por implementar
    └── Categorias/                🔴 Por implementar
```

---

## ➕ Cómo agregar una nueva página

1. Crea la carpeta y componente: `src/pages/Perfil/Perfil.jsx`
2. En `App.jsx`: descomenta el import y agrégalo al objeto `PAGES`
3. En `Sidebar.jsx`: cambia `ready: false` → `ready: true` en el ítem correspondiente

---

## 🔌 Conexión al backend

Todos los requests van a través de `src/services/api.js` (Axios).

```js
import api from '../../services/api'

const res = await api.get('/mi-endpoint')
const res = await api.post('/mi-endpoint', { dato: 'valor' })
const res = await api.put('/mi-endpoint/1', { dato: 'valor' })
const res = await api.delete('/mi-endpoint/1')
```

---

## 🔐 Autenticación (pendiente)

El usuario admin está **hardcodeado** en `src/context/AuthContext.jsx` (objeto `mockUser`).

Cuando el backend de login esté listo:
1. Crear `src/pages/Login/Login.jsx` con el formulario
2. Conectarlo al endpoint `/login` usando `authService.js`
3. Guardar el token con `localStorage.setItem('cl_token', token)`
4. Agregar el token a los headers de Axios en `api.js`:
   ```js
   api.interceptors.request.use(config => {
     const token = localStorage.getItem('cl_token')
     if (token) config.headers.Authorization = `Bearer ${token}`
     return config
   })
   ```
5. Reemplazar el `mockUser` en `AuthContext.jsx` por la llamada real al endpoint `/me`

---

## 📋 Estado de las páginas

| Página          | Key            | Estado              |
|-----------------|----------------|---------------------|
| Dashboard       | `dashboard`    | 🟡 Esqueleto listo  |
| Administrador   | `administrador`| ✅ Funcional        |
| Perfil          | `perfil`       | 🔴 Por implementar  |
| Experto         | `experto`      | 🔴 Por implementar  |
| Campesino       | `campesino`    | 🔴 Por implementar  |
| Categorías      | `categorias`   | 🔴 Por implementar  |
