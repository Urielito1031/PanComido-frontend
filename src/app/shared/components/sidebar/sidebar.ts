import { Component, signal, computed, HostListener, inject, ChangeDetectionStrategy, input, output, OnInit, OnDestroy } from '@angular/core';
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
  faListCheck,
  faBrain,
  faExclamationTriangle,
  faCalendarTimes,
  faStar,
  faPlus,
  faWarehouse,
  faList,
  faCalendarAlt,
  faWineGlass,
  faClock,
  faMagic,
  faFileAlt,
  faComments
} from '@fortawesome/free-solid-svg-icons';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
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
  readonly faBrain = faBrain;
  readonly faExclamationTriangle = faExclamationTriangle;
  readonly faCalendarTimes = faCalendarTimes;
  readonly faStar = faStar;
  readonly faPlus = faPlus;
  readonly faWarehouse = faWarehouse;
  readonly faList = faList;
  readonly faCalendarAlt = faCalendarAlt;
  readonly faWineGlass = faWineGlass;
  readonly faClock = faClock;
  readonly faMagic = faMagic;
  readonly faFileAlt = faFileAlt;
  readonly faComments = faComments;

  currentTime = signal(new Date());
  private timeIntervalId?: any;

  formattedTime = computed(() => {
    const d = this.currentTime();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  });

  formattedTimeMini = computed(() => {
    const d = this.currentTime();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  formattedDate = computed(() => {
    const d = this.currentTime();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const str = d.toLocaleDateString('es-AR', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

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
        route: '/staff/gerente/dashboard',
        roles: ['Gerente'],
        children: [
          { label: 'Resumen Financiero', icon: 'faReceipt', route: '/staff/gerente/dashboard', fragment: 'kpi-ventas', roles: ['Gerente'] },
          { label: 'Tendencia de Ventas', icon: 'faChartBar', route: '/staff/gerente/dashboard', fragment: 'ventas-calendario', roles: ['Gerente'] },
          { label: 'Platos y Menú', icon: 'faUtensils', route: '/staff/gerente/dashboard', fragment: 'platos-mas-vendidos', roles: ['Gerente'] },
          { label: 'Inventario y Mermas', icon: 'faBox', route: '/staff/gerente/dashboard', fragment: 'insumos-vencer', roles: ['Gerente'] },
          { label: 'Personal de Salón', icon: 'faUsers', route: '/staff/gerente/dashboard', fragment: 'mozos', roles: ['Gerente'] },
          { label: 'Satisfacción de Clientes', icon: 'faComments', route: '/staff/gerente/dashboard', fragment: 'satisfaccion-comensal', roles: ['Gerente'] }
        ]
      },
      { label: 'Reportes', icon: 'faFileAlt', route: '/staff/gerente/reportes', roles: ['Gerente'] },
      {
        label: 'Sistema de avisos',
        icon: 'faBell',
        route: '/staff/gerente/avisos',
        roles: ['Gerente'],
        children: [
          { label: 'Sugerencias de IA', icon: 'faBrain', route: '/staff/gerente/avisos', fragment: 'sugerencias-ia', roles: ['Gerente'] },
          { label: 'Stock crítico', icon: 'faExclamationTriangle', route: '/staff/gerente/avisos', fragment: 'seccion-stock', roles: ['Gerente'] },
          { label: 'Vencimientos próximos', icon: 'faCalendarTimes', route: '/staff/gerente/avisos', fragment: 'seccion-vencimientos', roles: ['Gerente'] }
        ],
        dividerAfter: true
      },
      
      { label: 'Mapa de mesas', icon: 'faTableCells', route: '/staff/gerente/mapa-de-mesas', roles: ['Gerente'] },
      { label: 'QR Fila Virtual', icon: 'faUsers', route: '/staff/gerente/qr-fila-virtual', roles: ['Gerente'] },
      { label: 'Cerrar Caja', icon: 'faReceipt', route: '/staff/gerente/caja', roles: ['Gerente'], dividerAfter: true },
      {
        label: 'Modificar Carta',
        icon: 'faClipboardList',
        route: '/staff/gerente/modificar-carta',
        roles: ['Gerente'],
        children: [
          { label: 'Destacados', icon: 'faStar', route: '/staff/gerente/modificar-carta', fragment: 'seccion-recomendados', roles: ['Gerente'] },
          { label: 'Platos', icon: 'faUtensils', route: '/staff/gerente/modificar-carta', fragment: 'seccion-platos', roles: ['Gerente'] },
          { label: 'Bebidas', icon: 'faWineGlass', route: '/staff/gerente/modificar-carta', fragment: 'seccion-bebidas', roles: ['Gerente'] },
          { label: 'Nuevo plato', icon: 'faPlus', route: '/staff/gerente/crear-plato', roles: ['Gerente'] }
        ],
        dividerAfter: true
      },
      
      {
        label: 'Stock/Mercadería',
        icon: 'faBox',
        route: '/staff/gerente/stock-mercaderia',
        roles: ['Gerente'],
        children: [
          { label: 'Insumos', icon: 'faList', route: '/staff/gerente/stock-mercaderia', fragment: 'productos', roles: ['Gerente'] },
          { label: 'Bodegas', icon: 'faWarehouse', route: '/staff/gerente/stock-mercaderia', fragment: 'bodegas', roles: ['Gerente'] },
          { label: 'Lotes/Vencimientos', icon: 'faCalendarAlt', route: '/staff/gerente/stock-mercaderia', fragment: 'lotes', roles: ['Gerente'] }
        ]
      },
      {
        label: 'Pedidos y Proveedor',
        icon: 'faTruck',
        route: '/staff/gerente/ver-proveedores',
        roles: ['Gerente'],
        children: [
          { label: 'Ver proveedores', icon: 'faUsers', route: '/staff/gerente/ver-proveedores', roles: ['Gerente'] },
          { label: 'Pedido sugerido', icon: 'faMagic', route: '/staff/gerente/realizar-pedido-sugerido', roles: ['Gerente'] },
          { label: 'Nuevo proveedor', icon: 'faPlus', route: '/staff/gerente/nuevo-proveedor', roles: ['Gerente'] }
        ],
        dividerAfter: true
      },
      
      { label: 'Usuarios', icon: 'faUsers', route: '/staff/gerente/usuarios', roles: ['Gerente'] },
      { label: 'Configuración', icon: 'faCog', route: '/staff/gerente/configuracion', roles: ['Gerente'] }
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

    this.currentTime.set(new Date());
    if (typeof window !== 'undefined') {
      this.timeIntervalId = setInterval(() => {
        this.currentTime.set(new Date());
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.timeIntervalId) {
      clearInterval(this.timeIntervalId);
    }
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
      'faListCheck': this.faListCheck,
      'faBrain': this.faBrain,
      'faExclamationTriangle': this.faExclamationTriangle,
      'faCalendarTimes': this.faCalendarTimes,
      'faStar': this.faStar,
      'faPlus': this.faPlus,
      'faWarehouse': this.faWarehouse,
      'faList': this.faList,
      'faCalendarAlt': this.faCalendarAlt,
      'faWineGlass': this.faWineGlass,
      'faMagic': this.faMagic,
      'faFileAlt': this.faFileAlt,
      'faComments': this.faComments
    };
    return iconMap[iconName] || undefined;
  }
}
