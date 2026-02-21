import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ordine } from './models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'https://obscure-pancake-7vx56wjv46pfx46r-5000.app.github.dev/api/staff';

  getOrders(): Observable<Ordine[]> {
    return this.http.get<Ordine[]>(`${this.baseUrl}/orders`);
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>('https://obscure-pancake-7vx56wjv46pfx46r-5000.app.github.dev/api/categories');
  }

  addTable(codiceTavolo: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/table`, { codice_tavolo: codiceTavolo });
  }

  addProduct(prodotto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/product`, prodotto);
  }
  // Nuova firma: richiede anche l'id_prodotto
  updateItemStatus(idOrdine: number, idProdotto: number, nuovoStato: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/order/item/status`, {
      id_ordine: idOrdine,
      id_prodotto: idProdotto,
      stato: nuovoStato
    });
  }
}