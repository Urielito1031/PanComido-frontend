# PanComido — Frontend

Frontend Angular del sistema de gestión de restaurante PanComido.

| Stack | Versión |
|-------|---------|
| Angular | 21 |
| Bootstrap | 5 |
| Testing | Vitest |
| Tiempo real | SignalR |

## Arquitectura

```
src/app/
├── core/          → servicios, guards, interceptores, modelos
├── features/      → módulos por rol (cocina, mozo, gerente, comensal)
├── shared/        → componentes reutilizables
├── layouts/       → layouts por rol
└── infra/         → acceso a datos, environment, mocks
```

Componentes standalone, signals para estado reactivo, lazy loading por feature.

## Inicio rápido

```bash
npm install
npm start
```

El frontend se levanta en `http://localhost:4200`.

## Backend

La API está en un repositorio separado: [PanComido](https://github.com/NicoPaone/PanComido). En desarrollo, necesita estar corriendo en `https://localhost:7204`. En producción, apunta a `https://api-pan-comido.azurewebsites.net`.

Para desarrollo sin backend, activá `useMock: true` en `src/environments/environment.development.ts`.
