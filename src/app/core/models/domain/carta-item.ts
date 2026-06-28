  export interface CartaItem {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    urlImagen: string | null;
    esPlato: boolean;
    esDestacado: boolean;
    tiempoPreparacionBase: number | null;
    tiempoPreparacionEstimado: number | null;
    tipoPlato: string | null;
    categoriaPlato: string | null;
    categoriaBebida: string | null;
    restricciones: string[];
  }
  