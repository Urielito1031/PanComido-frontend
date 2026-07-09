export interface DatosLocal {
  id: number;
  nombre: string;
  direccion: string;
  imagen: string | null;
  colorPrincipal: string | null;
  colorSecundario: string | null;
  familiaTipograficaId: number | null;
  linkResenaGoogleMaps: string | null;
}

export type DatosLocalEditables = Pick<DatosLocal,
  'nombre' |
  'imagen' |
  'colorPrincipal' |
  'colorSecundario' |
  'familiaTipograficaId' |
  'linkResenaGoogleMaps'
>;