import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prodotto, OrdineRequest } from '../interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'https://verbose-carnival-v6pjp475j7gp2x9pv-5000.app.github.dev/api'; // Indirizzo del tuo Flask

  getMenu(): Observable<Prodotto[]> {
    return this.http.get<Prodotto[]>(`${this.baseUrl}/menu`);
  }

  inviaOrdine(ordine: OrdineRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/order`, ordine);
  }
  
  getTables(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tables`);
  }
}