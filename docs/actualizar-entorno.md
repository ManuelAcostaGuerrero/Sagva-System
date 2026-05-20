# Guia para actualizar el entorno local

Esta guia define el flujo normal para trabajar con Sagva System.

## 1. Actualizar desde main

Usar cuando quieres traer la version estable del proyecto.

```bash
git fetch origin
git checkout main
git pull origin main
npm install
npm run prisma:generate
npm run db:push
npm run db:seed
npm run dev
```

Abrir:

```text
http://localhost:3000/dashboard
```

## 2. Trabajar en una rama nueva

Usar para cada modulo o mejora nueva.

```bash
git checkout main
git pull origin main
git checkout -b nombre-de-la-rama
```

Ejemplo:

```bash
git checkout -b modulo-inventario
```

## 3. Actualizar una rama de trabajo con main

Usar antes de seguir desarrollando si main cambio.

```bash
git fetch origin
git checkout nombre-de-la-rama
git merge origin/main
npm install
npm run prisma:generate
npm run db:push
npm run dev
```

## 4. Si la rama local quedo desordenada

Usar solo si quieres dejar tu copia local exactamente igual a GitHub.

```bash
git fetch origin
git checkout nombre-de-la-rama
git reset --hard origin/nombre-de-la-rama
npm install
npm run prisma:generate
npm run db:push
npm run dev
```

Advertencia: `git reset --hard` borra cambios locales no guardados.

## 5. Comandos de validacion antes de integrar

```bash
npm run typecheck
npm run build
```

Si alguno falla, no se debe integrar a main hasta corregirlo.

## 6. Flujo recomendado del proyecto

1. Main debe quedar como version estable.
2. Cada modulo nuevo debe hacerse en una rama propia.
3. Antes de integrar una rama, actualizarla con main.
4. Probar rutas principales.
5. Subir version en `package.json` cuando el cambio sea importante.
6. Registrar cambios en `CHANGELOG.md`.
7. Integrar por Pull Request o merge controlado.

## 7. Rutas principales para probar

```text
/dashboard
/seguridad
/seguridad/usuarios
/seguridad/roles
/seguridad/permisos
/caja
/venta/nueva
/venta/abiertas
```
