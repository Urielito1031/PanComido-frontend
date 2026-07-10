import { Routes } from '@angular/router';

export const COCINA_ROUTES: Routes = [
  { 
    path: 'comandas',
    loadComponent: () => import('./comandas/pages/comanda-page/comanda-page').then(m => m.ComandaPage)
   },
   {
    path: 'mise-and-place',
    loadChildren: () => import('./mise-and-place/mise-and-place.routes').then(m => m.MISE_AND_PLACE_ROUTES)
   },
   {
    path: 'ingredientes',
    loadComponent: () => import('../gerente/stock-mercaderia/page/insumo/insumo-page').then(m => m.InsumoPage)
   },
   {
    path: 'platos',
    loadComponent: () => import('../gerente/crear-plato/pages/crear-plato').then(m => m.CrearPlatoPage)
   }

];