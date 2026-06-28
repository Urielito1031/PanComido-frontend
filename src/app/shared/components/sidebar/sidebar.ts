import { Component, signal, computed, HostListener, inject, ChangeDetectionStrategy, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MenuItem, UserProfile } from '../../../core/models/domain/menu-item';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { AuthService } from '../../../core/services/auth.service';
import {
  faUsers,
  faCog,
  faChartBar,
  faBox,
  faTruck,
  faReceipt,
  faUtensils,
  faClipboardList,
  faTag,
  faTableCells,
  faRightFromBracket,
  faChevronDown,
  faChevronRight,
  faBell,
  faFireBurner,
  faCarrot,
  faListCheck
} from '@fortawesome/free-solid-svg-icons';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  private readonly authService = inject(AuthService);

  // Íconos de FontAwesome
  readonly faUsers = faUsers;
  readonly faCog = faCog;
  readonly faChartBar = faChartBar;
  readonly faBox = faBox;
  readonly faTruck = faTruck;
  readonly faReceipt = faReceipt;
  readonly faUtensils = faUtensils;
  readonly faClipboardList = faClipboardList;
  readonly faTag = faTag;
  readonly faTableCells = faTableCells;
  readonly faRightFromBracket = faRightFromBracket;
  readonly faChevronDown = faChevronDown;
  readonly faChevronRight = faChevronRight;
  readonly faBell = faBell;
  readonly faFireBurner = faFireBurner;
  readonly faCarrot = faCarrot;
  readonly faListCheck = faListCheck;


  isCollapsed = signal(true);
  isHovered = signal(false);
  expandedMenus = signal<string[]>([]);
  currentRole = input.required<string>();
  userProfile = input.required<UserProfile>();
  onLogout = output<void>();

  // Configuración de menú por rol
  private menuConfig: Record<string, MenuItem[]> = {
    Gerente: [
      {
        label: 'Dashboard',
        icon: 'faChartBar',
        route: 'gerente/dashboard',
        roles: ['Gerente'],
        children: [
          { label: 'Resumen Financiero', icon: '', route: 'gerente/dashboard', fragment: 'kpi-ventas', roles: ['Gerente'] },
          { label: 'Tendencia de Ventas', icon: '', route: 'gerente/dashboard', fragment: 'ventas-calendario', roles: ['Gerente'] },
          { label: 'Platos y Menú', icon: '', route: 'gerente/dashboard', fragment: 'platos-mas-vendidos', roles: ['Gerente'] },
          { label: 'Inventario y Mermas', icon: '', route: 'gerente/dashboard', fragment: 'insumos-vencer', roles: ['Gerente'] },
          { label: 'Personal de Salón', icon: '', route: 'gerente/dashboard', fragment: 'mozos', roles: ['Gerente'] },
        ]
      },
      { label: 'Sistema de avisos', icon: 'faBell', route: 'gerente/avisos', roles: ['Gerente'], dividerAfter: true },
      
      { label: 'Mapa de mesas', icon: 'faTableCells', route: 'gerente/mapa-de-mesas', roles: ['Gerente'] },
      { label: 'Cerrar Caja', icon: 'faReceipt', route: 'gerente/caja', roles: ['Gerente'], dividerAfter: true },
      {
        label: 'Modificar Carta',
        icon: 'faClipboardList',
        route: 'gerente/modificar-carta',
        roles: ['Gerente'],
        children: [
          { label: 'Ver platos', icon: '', route: 'gerente/modificar-carta', roles: ['Gerente'] },
          { label: 'Nuevo plato', icon: '', route: '/staff/gerente/crear-plato', roles: ['Gerente'] }
        ],
        dividerAfter: true
      },
      
      { label: 'Stock/Mercadería', icon: 'faBox', route: 'gerente/stock-mercaderia', roles: ['Gerente'] },
      {
        label: 'Pedidos y Proveedor',
        icon: 'faTruck',
        roles: ['Gerente'],
        children: [
          { label: 'Ver proveedores', icon: '', route: 'gerente/ver-proveedores', roles: ['Gerente'] },
          { label: 'Nuevo proveedor', icon: '', route: '/staff/gerente/nuevo-proveedor', roles: ['Gerente'] }
        ],
        dividerAfter: true
      },
      
      { label: 'Usuarios', icon: 'faUsers', route: 'gerente/usuarios', roles: ['Gerente'] },
      { label: 'Configuración', icon: 'faCog', route: 'gerente/configuracion', roles: ['Gerente'] }
    ],
    Mozo: [
      { label: 'Mesas', icon: 'faTableCells', route: 'mozo/mesas', roles: ['Mozo'] },
      { label: 'Comandas', icon: 'faListCheck', route: 'mozo/comandas', roles: ['Mozo'] },
      { label: 'Llamados', icon: 'faBell', route: 'mozo/llamados', roles: ['Mozo'] }
    ],
    Cocina: [
      { label: 'Comandas', icon: 'faListCheck', route: 'cocina/comandas', roles: ['Cocina'] },
      { label: 'Ingredientes', icon: 'faCarrot', route: 'cocina/ingredientes', roles: ['Cocina'] },
      { label: 'Platos', icon: 'faUtensils', route: 'cocina/platos', roles: ['Cocina'] },
      { label: 'Mise and place', icon: 'faFireBurner', route: 'cocina/mise-and-place', roles: ['Cocina'] }

    ]
  };

  // Computed: Menú filtrado por rol actual
  menuItems = computed(() => {
    const role = this.currentRole();
    return this.menuConfig[role] || [];
  });

  // Computed: Sidebar expandido si está hover o no colapsado
  isExpanded = computed(() => !this.isCollapsed() || this.isHovered());

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Auto-expandir el submenú del item activo al montar el sidebar
    const items = this.menuConfig[this.currentRole()] || [];
    items.forEach(item => {
      if (item.children && this.isParentActive(item) && !this.isSubmenuExpanded(item.label)) {
        this.expandedMenus.update(menus => [...menus, item.label]);
      }
    });
  }


  onMouseEnter(): void {
    if (this.isCollapsed()) {
      this.isHovered.set(true);
    }
  }

  onMouseLeave(): void {
    if (this.isCollapsed()) {
      this.isHovered.set(false);
      this.expandedMenus.set([]);
    }
  }

  toggleSubmenu(label: string): void {
    if (!this.isExpanded()) return;

    this.expandedMenus.update(menus => {
      const index = menus.indexOf(label);
      if (index > -1) {
        return menus.filter(m => m !== label);
      } else {
        return [...menus, label];
      }
    });
  }

  isSubmenuExpanded(label: string): boolean {
    return this.expandedMenus().includes(label);
  }

  isActive(route?: string, fragment?: string): boolean {
    if (!route) return false;
    
    const isRouteActive = this.router.isActive(route, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored'
    });

    if (!isRouteActive) return false;

    // Obtener fragment actual de la URL
    const urlTree = this.router.parseUrl(this.router.url);
    const currentFragment = urlTree.fragment;

    if (fragment) {
      return currentFragment === fragment;
    }

    // Si este item no tiene fragment, pero la URL de la app sí lo tiene,
    // significa que estamos en una sección específica del Dashboard, por lo tanto
    // no se debería marcar como activo el link general/raiz si tiene sub-items.
    if (!fragment && currentFragment) {
      return false;
    }

    return true;
  }

  isParentActive(item: MenuItem): boolean {
    if (!item.children) return false;
    return item.children.some(child => this.isActive(child.route));
  }

  logout(): void {
    this.onLogout.emit();
  }

  getIconComponent(iconName: string): IconProp | undefined {
    const iconMap: Record<string, IconProp> = {
      'faUsers': this.faUsers,
      'faCog': this.faCog,
      'faChartBar': this.faChartBar,
      'faBox': this.faBox,
      'faTruck': this.faTruck,
      'faReceipt': this.faReceipt,
      'faUtensils': this.faUtensils,
      'faClipboardList': this.faClipboardList,
      'faTag': this.faTag,
      'faTableCells': this.faTableCells,
      'faBell': this.faBell,
      'faFireBurner': this.faFireBurner,
      'faCarrot': this.faCarrot,
      'faListCheck': this.faListCheck
    };
    return iconMap[iconName] || undefined;
  }
}
