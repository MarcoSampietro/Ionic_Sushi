export interface ProdottoOrdine {
    id_prodotto: number;
    nome: string;
    quantita: number;
    stato: string;
}

export interface Ordine {
    id: number;
    nome_cliente: string;
    codice_tavolo: string;
    data_creazione: string;
    prodotti: ProdottoOrdine[];
}