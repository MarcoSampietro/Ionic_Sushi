import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from './api';
import { Ordine } from './models';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit, OnDestroy {
  api = inject(ApiService);
  
  // Usiamo i signals per la lista ordini
  ordini = signal<Ordine[]>([]);
  
  // Per gestire l'auto-refresh
  refreshSubscription!: Subscription;

  ngOnInit() {
    this.caricaOrdini();

    // Aggiorna automaticamente ogni 10 secondi (polling)
    this.refreshSubscription = interval(10000).subscribe(() => {
      this.caricaOrdini();
    });
  }

  ngOnDestroy() {
    // Pulisce l'intervallo quando si chiude la pagina
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  caricaOrdini() {
    this.api.getOrders().subscribe({
      next: (data) => {
        this.ordini.set(data);
      },
      error: (err) => console.error('Errore API Staff:', err)
    });
  }

  cambiaStato(ordine: Ordine, nuovoStato: string) {
    this.api.updateStatus(ordine.id, nuovoStato).subscribe(() => {
      // Aggiorna la UI localmente subito per reattività
      this.ordini.update(list => 
        list.map(o => o.id === ordine.id ? { ...o, stato: nuovoStato } : o)
      );
    });
  }

  // Helper per calcolare il colore della card in base allo stato
  getClassByStatus(stato: string): string {
    switch(stato) {
      case 'Inviato': return 'border-red-500 bg-red-50';
      case 'In preparazione': return 'border-yellow-500 bg-yellow-50';
      case 'Consegnato': return 'border-green-500 bg-green-50 opacity-60';
      default: return 'border-gray-200';
    }
  }
}