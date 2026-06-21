export interface ConfiguracionVisual { 
  id: number;
  nombre: string;
  imagen: string | null;
  colorPrincipal: string;
  colorSecundario: string;
  direccion: string;
  familiaTipograficaId: number | null;
  familiaCategoria: string | null;
  tipografiaTitulo: string | null;
  tipografiaCuerpo: string | null;
}