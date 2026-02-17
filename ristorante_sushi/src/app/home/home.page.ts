import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, removeOutline, chevronUpOutline, closeOutline, trashOutline, cartOutline } from 'ionicons/icons';
import { ApiService } from '../services/api';
import { CartStore } from '../services/cart.store';
import { Prodotto } from '../interfaces/models';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HomePage implements OnInit {
  
  private api = inject(ApiService);
  public cart = inject(CartStore);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  // Dati
  tavoli = signal<any[]>([]); 
  codiceTavolo = signal('');
  nomeCliente = signal('');
  
  menu = signal<Prodotto[]>([]);
  categorie = computed(() => [...new Set(this.menu().map(p => p.categoria))]);
  categoriaSelezionata = signal<string>('');
  
  // Gestione manuale del carrello
  isModalOpen = signal(false);

  prodottiFiltrati = computed(() => {
    const cat = this.categoriaSelezionata();
    if (!cat) return this.menu();
    return this.menu().filter(p => p.categoria === cat);
  });

  constructor() {
    // REGISTRA LE ICONE QUI
    addIcons({ addOutline, removeOutline, chevronUpOutline, closeOutline, trashOutline, cartOutline });
  }

  ngOnInit() {
    this.caricaDati();
  }

  caricaDati() {
    this.api.getMenu().subscribe(data => {
      this.menu.set(data);
      if (data.length > 0) this.categoriaSelezionata.set(data[0].categoria);
    });

    this.api.getTables().subscribe(data => {
      this.tavoli.set(data);
    });
  }

  cambiaCategoria(e: any) {
    this.categoriaSelezionata.set(e.detail.value);
  }

  getQuantita(id: number) {
    const item = this.cart.items().find(i => i.id === id);
    return item ? item.quantita : 0;
  }

  // Metodo per aprire/chiudere il carrello
  setOpen(isOpen: boolean) {
    this.isModalOpen.set(isOpen);
  }

  async confermaOrdine() {
    if (!this.codiceTavolo() || !this.nomeCliente()) {
      const toast = await this.toastCtrl.create({
        message: 'Manca il Tavolo o il Nome!',
        duration: 2000, color: 'danger', position: 'top'
      });
      toast.present();
      return;
    }

    const payload = {
      codice_tavolo: this.codiceTavolo(),
      nome_cliente: this.nomeCliente(),
      carrello: this.cart.items().map(i => ({ id_prodotto: i.id, quantita: i.quantita }))
    };

    this.api.inviaOrdine(payload).subscribe({
      next: async () => {
        this.setOpen(false); // Chiudi il modale
        
        const alert = await this.alertCtrl.create({
          header: 'Ordine Inviato! 🍣',
          message: 'La cucina ha ricevuto la tua comanda.',
          buttons: ['OK']
        });
        await alert.present();
        
        this.cart.svuotaCarrello();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Errore invio ordine.',
          duration: 2000, color: 'danger'
        });
        toast.present();
      }
    });
  }
}