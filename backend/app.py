from flask import Flask, request, jsonify
from flask_cors import CORS
from DatabaseWrapper import DatabaseWrapper

app = Flask(__name__)
CORS(app) 

db = DatabaseWrapper()

@app.route('/api/menu', methods=['GET'])
def get_menu():
    """Restituisce la lista dei prodotti e categorie"""
    menu = db.get_menu()
    return jsonify(menu)

@app.route('/api/order', methods=['POST'])
def create_order():
    """
    Riceve un ordine dal cliente.
    Body atteso (JSON):
    {
        "codice_tavolo": "T1",
        "nome_cliente": "Mario",
        "carrello": [
            {"id_prodotto": 1, "quantita": 2},
            {"id_prodotto": 3, "quantita": 1}
        ]
    }
    """
    data = request.get_json()
    
    # Validazione base
    if not data or 'codice_tavolo' not in data or 'carrello' not in data:
        return jsonify({"error": "Dati mancanti"}), 400

    risultato = db.create_order(
        data['codice_tavolo'], 
        data['nome_cliente'], 
        data['carrello']
    )
    
    return jsonify(risultato)

@app.route('/api/table/<codice_tavolo>/orders', methods=['GET'])
def get_table_orders(codice_tavolo):
    """Restituisce la cronologia degli ordini per un tavolo"""
    orders = db.get_table_orders(codice_tavolo)
    return jsonify(orders)

# ==========================================
#  API STAFF (Angular Dashboard)
# ==========================================

@app.route('/api/staff/orders', methods=['GET'])
def get_all_orders():
    """Restituisce tutti gli ordini attivi per la cucina"""
    ordini = db.get_all_orders()
    return jsonify(ordini)

@app.route('/api/staff/order/status', methods=['POST'])
def update_order_status():
    """
    Aggiorna lo stato di un ordine (es. da 'Inviato' a 'Consegnato').
    Body atteso (JSON):
    {
        "id_ordine": 5,
        "stato": "Consegnato"
    }
    """
    data = request.get_json()
    
    if not data or 'id_ordine' not in data or 'stato' not in data:
        return jsonify({"error": "Dati mancanti"}), 400

    risultato = db.update_order_status(data['id_ordine'], data['stato'])
    return jsonify(risultato)

@app.route('/api/tables', methods=['GET'])
def get_tables():
    tables = db.get_tables()
    return jsonify(tables)

if __name__ == '__main__':
    # Avvia il server sulla porta 5000
    app.run(debug=True, host='0.0.0.0', port=5000)