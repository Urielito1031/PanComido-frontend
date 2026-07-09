import { Routes } from '@angular/router';

export const COCINA_ROUTES: Routes = [
  { 
    path: 'comandas',
    loadComponent: () => import('./comandas/pages/comanda-page/comanda-page').then(m => m.ComandaPage)
   },
   {
    path: 'mise-and-place',
    loadChildren: () => import('./mise-and-place/mise-and-place.routes').then(m => m.MISE_AND_PLACE_ROUTES)
   }


];