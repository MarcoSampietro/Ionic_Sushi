export interface ProdottoOrdine {
    nome: string;
    quantita: number;
}

export interface Ordine {
    id: number;
    nome_cliente: string;
    codice_tavolo: string;
    stato: string;        // 'Inviato', 'In preparazione', 'Consegnato'
    data_creazione: string;
    prodotti: ProdottoOrdine[];
}