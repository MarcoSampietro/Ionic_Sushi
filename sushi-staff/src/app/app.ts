import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api';
import { Ordine, ProdottoOrdine } from './models';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html', // o './app.component.html' a seconda del tuo file
  styleUrls: ['./app.scss']  // o './app.component.scss'
})
export class App implements OnInit, OnDestroy {
  api = inject(ApiService);
  
  // Stato e Navigazione
  currentTab = signal<'ordini' | 'tavoli' | 'menu'>('ordini');
  ordini = signal<Ordine[]>([]);
  categorie = signal<any[]>([]);
  refreshSubscription!: Subscription;

  // Dati dei Form
  nuovoTavolo = '';
  nuovoProdotto = { nome: '', prezzo: 0, immagine_url: '', id_categoria: null as number | null };

  ngOnInit() {
    this.caricaOrdini();
    this.api.getCategories().subscribe(res => this.categorie.set(res));
    
    // Auto-aggiornamento ogni 10 secondi solo se siamo nella scheda ordini
    this.refreshSubscription = interval(10000).subscribe(() => {
      if (this.currentTab() === 'ordini') this.caricaOrdini();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) this.refreshSubscription.unsubscribe();
  }

  // --- GESTIONE ORDINI ---

  caricaOrdini() {
    this.api.getOrders().subscribe({
      next: (data) => this.ordini.set(data),
      error: (err) => console.error('Errore API:', err)
    });
  }

  avanzaStato(ordine: Ordine, piatto: ProdottoOrdine) {
    let nuovoStato = piatto.stato === 'Inviato' ? 'In preparazione' : 'Consegnato';
    
    this.api.updateItemStatus(ordine.id, piatto.id_prodotto, nuovoStato).subscribe(() => {
      // Ricarica la lista dal server per aggiornare lo schermo e nascondere gli ordini finiti
      this.caricaOrdini();
    });
  }

  // FUNZIONE MANCANTE AGGIUNTA QUI
  isOrdineCompletato(ordine: Ordine): boolean {
    if (!ordine.prodotti || ordine.prodotti.length === 0) return false;
    return ordine.prodotti.every(p => p.stato === 'Consegnato');
  }

  // --- GESTIONE TAVOLI E MENU ---

  salvaTavolo() {
    if (!this.nuovoTavolo) return alert("Inserisci un codice tavolo");
    this.api.addTable(this.nuovoTavolo).subscribe(res => {
      if (res.success) {
        alert("Tavolo aggiunto con successo!");
        this.nuovoTavolo = '';
      } else alert("Errore: " + res.error);
    });
  }

  salvaProdotto() {
    if (!this.nuovoProdotto.nome || !this.nuovoProdotto.id_categoria) {
      return alert("Compila i campi obbligatori (Nome e Categoria)");
    }
    this.api.addProduct(this.nuovoProdotto).subscribe(res => {
      if (res.success) {
        alert("Prodotto aggiunto al menù!");
        this.nuovoProdotto = { nome: '', prezzo: 0, immagine_url: '', id_categoria: null };
      } else alert("Errore: " + res.error);
    });
  }
}