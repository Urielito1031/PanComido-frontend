import { Routes } from '@angular/router';

export const MISE_AND_PLACE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/list-page/list-page').then(m => m.ListPage)
  },
]