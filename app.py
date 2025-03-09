from flask import Flask, jsonify
import requests

app = Flask(__name__)

@app.route("/musica")
def musica():
    url = "https://cast3.midiazdx.com.br:7154/7.html"
    response = requests.get(url)
    data = response.text.split(",")
    
    musica = "Nenhuma música disponível"
    if len(data) > 6:
        musica = data[6].replace("Now On Air:", "").strip()
    
    return jsonify({"musica": musica})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=80)
