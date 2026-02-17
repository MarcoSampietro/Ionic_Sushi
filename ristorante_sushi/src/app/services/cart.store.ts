import { Injectable, signal, computed } from '@angular/core';
import { Prodotto, CarrelloItem } from '../interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class CartStore {
  
  // 1. Lo stato: un segnale che contiene la lista degli articoli
  readonly items = signal<CarrelloItem[]>([]);

  // 2. Computed: calcola il totale automaticamente quando 'items' cambia
  readonly totale = computed(() => 
    this.items().reduce((acc, item) => acc + (item.prezzo * item.quantita), 0)
  );

  // 3. Computed: conta il numero totale di pezzi
  readonly pezziTotali = computed(() => 
    this.items().reduce((acc, item) => acc + item.quantita, 0)
  );

  // --- AZIONI ---

  aggiungiProdotto(prodotto: Prodotto) {
    this.items.update(currentItems => {
      const itemEsistente = currentItems.find(i => i.id === prodotto.id);
      
      if (itemEsistente) {
        // Se esiste, crea una nuova lista aggiornando la quantità
        return currentItems.map(i => 
          i.id === prodotto.id ? { ...i, quantita: i.quantita + 1 } : i
        );
      } else {
        // Se non esiste, lo aggiunge
        return [...currentItems, { ...prodotto, quantita: 1 }];
      }
    });
  }

  rimuoviProdotto(prodottoId: number) {
    this.items.update(currentItems => {
      const item = currentItems.find(i => i.id === prodottoId);
      
      if (item && item.quantita > 1) {
        return currentItems.map(i => 
          i.id === prodottoId ? { ...i, quantita: i.quantita - 1 } : i
        );
      } else {
        return currentItems.filter(i => i.id !== prodottoId);
      }
    });
  }

  svuotaCarrello() {
    this.items.set([]);
  }
}