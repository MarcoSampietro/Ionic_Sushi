import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ordine } from './models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'https://verbose-carnival-v6pjp475j7gp2x9pv-5000.app.github.dev/api/staff'; // Nota il path diverso

  // Recupera tutti gli ordini attivi
  getOrders(): Observable<Ordine[]> {
    return this.http.get<Ordine[]>(`${this.baseUrl}/orders`);
  }

  // Aggiorna lo stato (es. da "Inviato" a "Consegnato")
  updateStatus(idOrdine: number, nuovoStato: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/order/status`, {
      id_ordine: idOrdine,
      stato: nuovoStato
    });
  }
}