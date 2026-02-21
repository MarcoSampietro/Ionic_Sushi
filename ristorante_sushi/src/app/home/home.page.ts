import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  addOutline, removeOutline, chevronUpOutline, closeOutline, 
  trashOutline, cartOutline, refreshOutline 
} from 'ionicons/icons';
import { ApiService } from '../services/api';
import { CartStore } from '../services/cart.store';
import { Prodotto, OrdineTavolo } from '../interfaces/models';

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

  tavoli = signal<any[]>([]); 
  codiceTavolo = signal('');
  nomeCliente = signal('');
  
  menu = signal<Prodotto[]>([]);
  categorie = computed(() => [...new Set(this.menu().map(p => p.categoria))]);
  categoriaSelezionata = signal<string>('');
  
  isModalOpen = signal(false);
  vistaAttuale = signal<'menu' | 'cronologia'>('menu'); 
  cronologiaOrdini = signal<OrdineTavolo[]>([]); 

  prodottiFiltrati = computed(() => {
    const cat = this.categoriaSelezionata();
    if (!cat) return this.menu();
    return this.menu().filter(p => p.categoria === cat);
  });

  constructor() {
    addIcons({ addOutline, removeOutline, chevronUpOutline, closeOutline, trashOutline, cartOutline, refreshOutline });
  }

  ngOnInit() {
    this.caricaDati();
  }

  caricaDati() {
    this.api.getTables().subscribe(data => this.tavoli.set(data));
    this.api.getMenu().subscribe(data => {
      this.menu.set(data);
      if (data.length > 0) this.categoriaSelezionata.set(data[0].categoria);
    });
  }

  cambiaCategoria(e: any) { this.categoriaSelezionata.set(e.detail.value); }

  getQuantita(id: number) {
    const item = this.cart.items().find(i => i.id === id);
    return item ? item.quantita : 0;
  }

  setOpen(isOpen: boolean) { this.isModalOpen.set(isOpen); }

  cambiaVista(e: any) {
    const nuovaVista = e.detail.value;
    this.vistaAttuale.set(nuovaVista);
    if (nuovaVista === 'cronologia' && this.codiceTavolo()) {
      this.caricaCronologia();
    }
  }

  caricaCronologia() {
    if (!this.codiceTavolo()) return;
    this.api.getOrdiniTavolo(this.codiceTavolo()).subscribe({
      next: (data) => this.cronologiaOrdini.set(data),
      error: (err) => console.error('Errore cronologia', err)
    });
  }

  async confermaOrdine() {
    if (!this.codiceTavolo() || !this.nomeCliente()) {
      const toast = await this.toastCtrl.create({
        message: 'Manca il Tavolo o il tuo Nome!',
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
        this.setOpen(false); 
        this.cart.svuotaCarrello(); 
        this.caricaCronologia();
        this.vistaAttuale.set('cronologia'); 
        
        const alert = await this.alertCtrl.create({
          header: 'Ordine Inviato! 🍣',
          message: 'La cucina ha ricevuto il tuo ordine.',
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Errore di invio.', duration: 3000, color: 'danger'
        });
        toast.present();
      }
    });
  }
}