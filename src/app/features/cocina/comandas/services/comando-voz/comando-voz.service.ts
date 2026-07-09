import { Injectable, signal } from '@angular/core';

export interface ComandoVoz {
  mesaNumero: number;
  accion: 'aceptar' | 'llamar-mozo';
  nuevoEstadoId: number
  timestamp: number;
}


@Injectable({
  providedIn: 'root',
})
export class ComandoVozService {
  private recognition: any;

  enEscucha = signal<boolean>(false);
  comandoDetectado = signal<ComandoVoz | null>(null);
  error = signal<string | null>(null);

  constructor() {
    this.iniciarEscuchaApi();
  }

  private ultimoComando: { accion: string; mesaNumero: number; timestamp: number } | null = null;
  private readonly COOLDOWN_MS = 3000;

  private readonly UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  private readonly ESPECIALES: Record<string, number> = {
    diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
    dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
    veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24,
    veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  };
  private readonly DECENAS: Record<string, number> = {
    treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  };

  private normalizarNumeros(frase: string): string {
    const sinTildes = frase.normalize('NFD').replace(/[̀-ͯ]/g, '');
    const conCompuestos = sinTildes.replace(
      /\b(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa) y (uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/g,
      (_, decena, unidad) => String(this.DECENAS[decena] + this.UNIDADES.indexOf(unidad))
    );
    return conCompuestos
      .replace(/\b(cien|ciento)\b/g, '100')
      .replace(/\b[a-z]+\b/g, palabra =>
        palabra in this.ESPECIALES ? String(this.ESPECIALES[palabra]) :
        palabra in this.DECENAS ? String(this.DECENAS[palabra]) :
        this.UNIDADES.includes(palabra) ? String(this.UNIDADES.indexOf(palabra)) : palabra
      );
  }

  private iniciarEscuchaApi() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      this.error.set('El navegador no soporta la API de reconocimiento de voz.');
      return;
    }
    this.recognition = new SpeechRec();
    this.recognition.lang = 'es-AR';
    this.recognition.continuous = true;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: any) => {
      const ultimoIndice = event.results.length - 1;
      const frase = event.results[ultimoIndice][0].transcript.toLowerCase().trim();
      this.procesarFrase(frase);
    }
    this.recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        this.error.set(`Error de micrófono: ${event.error}`);
        this.stop();
      }
    };
    this.recognition.onend = () => {
      // El navegador corta el mic si hay mucho silencio. 
      // Si el cocinero no lo apagó manualmente, lo volvemos a encender automáticamente.
      if (this.enEscucha()) {
        this.recognition.start();
      }
    };

  }
  private procesarFrase(fraseOriginal: string) {
    const frase = this.normalizarNumeros(fraseOriginal);
    console.log('[voz] frase escuchada:', fraseOriginal, '-> normalizada:', frase);
    const ahora = Date.now();
    const matchAceptar =
      frase.match(/mesa (\d+) (?:aceptar(?: comanda)?|aceptada)/) ??
      frase.match(/aceptar comanda mesa (\d+)/);
    const matchLlamarMozo =
      frase.match(/mesa (\d+) llamar (?:al )?mo[sz]o/) ??
      frase.match(/llamar (?:al )?mo[sz]o mesa (\d+)/);

    const match = matchAceptar ?? matchLlamarMozo;
    if (!match) return;

    const accion = matchAceptar ? 'aceptar' : 'llamar-mozo';
    const mesaNumero = Number(match[1]);

    if (this.ultimoComando?.accion === accion &&
      this.ultimoComando?.mesaNumero === mesaNumero &&
      ahora - this.ultimoComando.timestamp < this.COOLDOWN_MS) return;

    this.ultimoComando = { accion, mesaNumero, timestamp: ahora };

    if (matchAceptar) {
      this.comandoDetectado.set({
        mesaNumero: Number(matchAceptar[1]),
        accion: 'aceptar',
        nuevoEstadoId: 2, // EstadoComandaId.EnPreparacion
        timestamp: Date.now(),
      })
    } else if (matchLlamarMozo) {
      this.comandoDetectado.set({
        mesaNumero: Number(matchLlamarMozo[1]),
        accion: 'llamar-mozo',
        nuevoEstadoId: 0,
        timestamp: Date.now(),
      });
    }

  }
  toggleListening() {
    if (this.enEscucha()) {
      this.stop();
    } else {
      this.start();
    }
  }

  private start() {
    if (!this.recognition) return;
    this.enEscucha.set(true);
    this.error.set(null);
    this.recognition.start();
  }

  private stop() {
    if (!this.recognition) return;
    this.enEscucha.set(false);
    this.recognition.stop();
  }
}