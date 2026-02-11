# Friending - Init

## 1. Resumen del proyecto y proposito
Friending es una app web para adolescentes orientada a crear amistades de forma segura. Incluye perfiles, descubrimiento de personas, un flujo de "amigos" con mensaje unico inicial y un panel admin con permisos y menus dinamicos. El proyecto esta preparado para crecer con backend cuando se conecte.

## 2. Estructura de carpetas y que hace cada una
- `src/app`: nucleo de la app (estado, router, i18n, permisos).
- `src/components`: componentes UI reutilizables (layout, nav, cards, etc.).
- `src/pages`: pantallas principales (home, discover, profile, admin, etc.).
- `src/styles`: estilos globales y por secciones.
- `src/utils`: utilidades (formato, validacion, sanitize, rich text).
- `src/services`: logica de dominio reutilizable (moderacion, cola offline).
- `src/security`: proteccion de ciberseguridad local (SecurityGuard, secureStore).
- `scripts`: pruebas tecnicas simples (permisos).
- `src/controllers`, `src/models`, `src/routes`, `src/middlewares`, `src/config`: reservadas para backend futuro.

## 3. Archivos principales y su funcion
- `index.html`: entrypoint de la app.
- `src/index.js`: arranque de la app.
- `src/app/app.js`: orquestador (render, eventos, rutas).
- `src/app/state/store.js`: estado global, auth, permisos, menus admin, logs, restricciones.
- `src/app/state/storage.js`: persistencia versionada con migraciones.
- `src/app/i18n.js`: traducciones y textos.
- `src/app/permissions.js`: permisos declarativos por ruta y accion.
- `src/components/nav.js`: navegacion (incluye menus dinamicos y avatar).
- `src/pages/profile.js`: perfil de usuario con acceso a configuracion.
- `src/pages/userSettings.js`: configuracion de usuario.
- `src/pages/admin.js`: panel admin (permisos, menus, historial, seguridad).
- `src/services/moderationSystem.js`: moderacion inteligente (bots, spam, toxicidad, perfiles falsos).
- `src/services/offlineQueue.js`: cola local de acciones con reintentos.
- `src/security/securityGuard.js`: guardian de seguridad (rate limits, brute force, validacion).
- `src/security/secureStore.js`: cifrado local basico de datos sensibles.
- `src/utils/validation.js`: validacion centralizada de formularios.
- `src/utils/sanitize.js`: sanitizacion uniforme de inputs.
- `scripts/permissions.test.mjs`: pruebas de regresion de permisos.

## 4. Flujo de la aplicacion
1. Home -> Sign in / Sign up / Demo.
2. Sign up -> crea cuenta -> onboarding -> discover.
3. Discover -> like/pass -> crea "amigos".
4. Amigos -> mensaje unico -> compartir contacto si ambos aceptan.
5. Perfil -> editar datos y abrir configuracion (engranaje).
6. Admin -> permisos, menus, historial, seguridad y gestion de admins.
7. Moderacion y seguridad se aplican en registro, login, mensajes, likes, passes, vistas de perfil y uploads.

## 5. Funciones/componentes clave y donde encontrarlos
- Estado y permisos: `src/app/state/store.js`
- Enrutado: `src/app/router.js`
- Permisos declarativos: `src/app/permissions.js`
- Validacion centralizada: `src/utils/validation.js`
- Sanitizacion: `src/utils/sanitize.js`
- Render de rich text: `src/utils/richText.js`
- Menus dinamicos: `src/components/nav.js`, `src/pages/menu.js`
- Panel admin: `src/pages/admin.js`
- Configuracion usuario: `src/pages/userSettings.js`
- Moderacion: `src/services/moderationSystem.js`
- Seguridad: `src/security/securityGuard.js`
- Cola offline: `src/services/offlineQueue.js`
- Secure store: `src/security/secureStore.js`

## 6. Notas importantes para desarrollo futuro
- Persistencia actual es `localStorage` con versionado y migraciones.
- Permisos existen pero varias pantallas son placeholders.
- El panel admin ya controla menus reales de navegacion.
- Si cambias credenciales seed, limpia `localStorage` para ver efecto.
- Moderacion y seguridad operan en cliente; si agregas backend, replica la logica en servidor.
- La cola offline esta lista para integrarse con endpoints reales.
- Errores globales del cliente se registran en seguridad y telemetria.
