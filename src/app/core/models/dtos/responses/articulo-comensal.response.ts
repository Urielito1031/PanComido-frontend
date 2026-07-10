  export interface IngredienteOpcional {
    ingredienteId: number;
    nombre: string;
  }

  export interface ArticuloComensalResponse {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    urlImagen: string | null;
    tiempoPreparacionBase: number | null;
    categoriaPlato: string | null;
    tipoPlato: string | null;
    categoriaBebida: string | null;
    restricciones: string[];
    ingredientesOpcionales: IngredienteOpcional[];
  }