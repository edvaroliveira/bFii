import requests
from bs4 import BeautifulSoup

def get_fii_symbols():
    # URL do Funds Explorer que lista os FIIs
    url = 'https://www.fundsexplorer.com.br/ranking'

    # Cabeçalhos para a requisição, incluindo User-Agent
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36'
    }

    # Fazendo a requisição HTTP para obter o conteúdo da página
    response = requests.get(url, headers=headers)

    # Verificando se a requisição foi bem-sucedida
    if response.status_code != 200:
        print(f"Failed to retrieve the webpage. Status code: {response.status_code}")
        return []

    # Analisando o conteúdo da página
    soup = BeautifulSoup(response.content, 'html.parser')

    # Buscando todas as tags que contêm os símbolos dos FIIs
    symbols = []

    # Exemplo: Os símbolos dos FIIs estão em uma tabela com a classe ".ticker"
    for symbol in soup.select('td.ticker'):
        symbols.append(symbol.text.strip())

    return symbols

if __name__ == '__main__':
    fiis = get_fii_symbols()
    if fiis:
        print(f"Found {len(fiis)} FIIs:")
        for fii in fiis:
            print(fii)
    else:
        print("No FIIs found.")
