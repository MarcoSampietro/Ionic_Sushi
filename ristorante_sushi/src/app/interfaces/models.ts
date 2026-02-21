export interface Prodotto {
  id: number;
  nome: string;
  prezzo: number;
  immagine_url: string;
  categoria: string;
}

export interface OrdineRequest {
  codice_tavolo: string;
  nome_cliente: string;
  carrello: { id_prodotto: number; quantita: number }[];
}

export interface CarrelloItem extends Prodotto {
  quantita: number;
}

export interface OrdineTavolo {
  id: number;
  nome_cliente: string;
  data_creazione: string;
  prodotti: { nome: string; quantita: number; stato: string }[];
}