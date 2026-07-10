import { Aviso } from '../../../../core/models/domain/aviso';
import { Plato } from '../../../../core/models/domain/plato';
import { PlatoSugerido } from '../../../../core/models/domain/sugerencia-ia';

export function filtrarAvisos(avisos: Aviso[], searchTerm: string): Aviso[] {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return avisos;

  return avisos.filter(aviso =>
    contiene(aviso.titulo, term) ||
    contiene(aviso.subtitulo, term) ||
    contiene(aviso.info, term)
  );
}

export function filtrarSugerenciasCocina(platos: Plato[], ignoradas: number[], searchTerm: string): Plato[] {
  const term = searchTerm.toLowerCase().trim();

  return platos.filter(plato =>
    !plato.visible &&
    !ignoradas.includes(plato.id) &&
    (
      !term ||
      contiene(plato.nombre, term) ||
      contiene(plato.categoria, term)
    )
  );
}

export function crearPlatoSugeridoRequest(plato: PlatoSugerido) {
  return {
    nombre: plato.nombre,
    descripcion: plato.descripcion,
    precioVentaFinal: 0,
    tiempoPreparacionBase: plato.tiempoPreparacion,
    tipoPlatoId: 2,
    categoriaPlatoId: 2,
    urlImagen: '',
    restriccionesIds: [],
    ingredientes: plato.ingredientesSugeridos.map(ingrediente => ({
      insumoId: ingrediente.insumoId,
      cantidad: ingrediente.cantidad,
      opcional: false
    }))
  };
}

function contiene(valor: string | null | undefined, term: string): boolean {
  return valor?.toLowerCase().includes(term) ?? false;
}
