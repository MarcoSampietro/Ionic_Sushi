import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseWrapper:

    def __init__(self):
        # Configurazione basata sul tuo snippet
        self.db_config = {
            'host': os.getenv('DB_HOST'),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD'),
            'database': os.getenv('DB_NAME'),
            'port': int(os.getenv('DB_PORT')),
            # Usiamo DictCursor per avere i risultati come dizionari {chiave: valore}
            'cursorclass': pymysql.cursors.DictCursor 
        }
        # Crea le tabelle se non esistono all'avvio
        self.create_table()

    def connect(self):
        """Stabilisce la connessione al database"""
        return pymysql.connect(**self.db_config)

    def create_table(self):
        """Crea la struttura del database se non esiste"""
        connection = self.connect()
        try:
            with connection.cursor() as cursor:
                # 1. Categorie
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS categorie (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nome VARCHAR(50) NOT NULL
                );
                """)

                # 2. Prodotti
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS prodotti (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nome VARCHAR(100) NOT NULL,
                    prezzo DECIMAL(10, 2) NOT NULL,
                    immagine_url TEXT,
                    id_categoria INT,
                    FOREIGN KEY (id_categoria) REFERENCES categorie(id) ON DELETE SET NULL
                );
                """)

                # 3. Tavoli
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS tavoli (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    codice_tavolo VARCHAR(20) NOT NULL UNIQUE
                );
                """)

                # 4. Ordini (Testata)
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS ordini (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    id_tavolo INT NOT NULL,
                    nome_cliente VARCHAR(50) NOT NULL,
                    stato VARCHAR(50) DEFAULT 'Inviato',
                    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (id_tavolo) REFERENCES tavoli(id) ON DELETE CASCADE
                );
                """)

                # 5. Dettaglio Ordini
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS dettaglio_ordini (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    id_ordine INT NOT NULL,
                    id_prodotto INT NOT NULL,
                    quantita INT DEFAULT 1,
                    FOREIGN KEY (id_ordine) REFERENCES ordini(id) ON DELETE CASCADE,
                    FOREIGN KEY (id_prodotto) REFERENCES prodotti(id) ON DELETE CASCADE
                );
                """)
                
                connection.commit()
                print("Tabelle verificate/create con successo.")
        except Exception as e:
            print(f"Errore nella creazione tabelle: {e}")
        finally:
            connection.close()

    # ==========================================
    #  METODI PER L'APP CLIENTE
    # ==========================================

    def get_menu(self):
        """Ritorna tutti i prodotti con il nome della categoria"""
        connection = self.connect()
        try:
            with connection.cursor() as cursor:
                sql = """
                SELECT p.id, p.nome, p.prezzo, p.immagine_url, c.nome as categoria 
                FROM prodotti p 
                LEFT JOIN categorie c ON p.id_categoria = c.id
                """
                cursor.execute(sql)
                return cursor.fetchall()
        finally:
            connection.close()

    def create_order(self, codice_tavolo, nome_cliente, carrello):
        """
        Crea un ordine completo.
        carrello: lista di dizionari [{'id_prodotto': 1, 'quantita': 2}, ...]
        """
        connection = self.connect()
        try:
            with connection.cursor() as cursor:
                # 1. Trovo l'ID del tavolo dal codice
                cursor.execute("SELECT id FROM tavoli WHERE codice_tavolo = %s", (codice_tavolo,))
                tavolo = cursor.fetchone()
                
                if not tavolo:
                    return {"error": "Codice tavolo non valido"}

                tavolo_id = tavolo['id']

                # 2. Creo l'ordine (testata)
                sql_ordine = "INSERT INTO ordini (id_tavolo, nome_cliente) VALUES (%s, %s)"
                cursor.execute(sql_ordine, (tavolo_id, nome_cliente))
                order_id = cursor.lastrowid

                # 3. Inserisco i dettagli (prodotti)
                sql_dettaglio = "INSERT INTO dettaglio_ordini (id_ordine, id_prodotto, quantita) VALUES (%s, %s, %s)"
                
                for item in carrello:
                    cursor.execute(sql_dettaglio, (order_id, item['id_prodotto'], item['quantita']))
                
                connection.commit()
                return {"success": True, "order_id": order_id}
        except Exception as e:
            connection.rollback()
            return {"error": str(e)}
        finally:
            connection.close()

    # ==========================================
    #  METODI PER LO STAFF
    # ==========================================

    def get_all_orders(self):
        """Recupera tutti gli ordini per la dashboard dello staff"""
        connection = self.connect()
        try:
            with connection.cursor() as cursor:
                # Recupera info generali ordine + codice tavolo
                sql = """
                SELECT o.id, o.nome_cliente, o.stato, o.data_creazione, t.codice_tavolo
                FROM ordini o
                JOIN tavoli t ON o.id_tavolo = t.id
                ORDER BY o.data_creazione DESC
                """
                cursor.execute(sql)
                orders = cursor.fetchall()

                # Per ogni ordine, recuperiamo i piatti (opzionale, ma utile per lo staff)
                for order in orders:
                    sql_items = """
                    SELECT p.nome, d.quantita 
                    FROM dettaglio_ordini d
                    JOIN prodotti p ON d.id_prodotto = p.id
                    WHERE d.id_ordine = %s
                    """
                    cursor.execute(sql_items, (order['id'],))
                    order['prodotti'] = cursor.fetchall()

                return orders
        finally:
            connection.close()

    def update_order_status(self, order_id, nuovo_stato):
        """Aggiorna lo stato (es. da 'Inviato' a 'Consegnato')"""
        connection = self.connect()
        try:
            with connection.cursor() as cursor:
                sql = "UPDATE ordini SET stato = %s WHERE id = %s"
                cursor.execute(sql, (nuovo_stato, order_id))
                connection.commit()
                return {"success": True}
        except Exception as e:
            return {"error": str(e)}
        finally:
            connection.close()

    def get_tables(self):
        connection = self.connect()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT id, codice_tavolo FROM tavoli")
                return cursor.fetchall()
        finally:
            connection.close()