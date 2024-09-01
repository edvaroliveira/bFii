from selenium import webdriver
from selenium.webdriver.common.by import By
import time

def get_fii_data():
    # Inicializa o WebDriver usando o ChromeDriver automatizado
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')  # Executa o navegador em modo headless (sem interface)
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1920,1080')
    options.add_argument('--disable-dev-shm-usage')

    driver = webdriver.Chrome(options=options)

    try:
        # URL da página de ranking de FIIs
        url = 'https://www.fundsexplorer.com.br/ranking'

        # Acessa a página
        driver.get(url)

        # Aguarda o carregamento da página
        time.sleep(5)  # Ajuste conforme a velocidade da sua conexão

        # Encontra a tabela que contém os FIIs
        table = driver.find_element(By.XPATH, '//table[contains(@class, "table")]')

        # Encontra todas as linhas da tabela, exceto o cabeçalho
        rows = table.find_elements(By.XPATH, './/tbody/tr')

        fii_data = []

        for row in rows:
            # A coluna que contém o símbolo geralmente é a primeira
            symbol_element = row.find_element(By.XPATH, './/td[1]/a')
            symbol = symbol_element.text.strip()

            # A coluna que contém o dividend yield geralmente é a terceira (ajuste conforme necessário)
            dividend_yield_element = row.find_element(By.XPATH, './/td[7]')
            dividend_yield = dividend_yield_element.text.strip()

            fii_data.append({
                "symbol": symbol,
                "dividend_yield": dividend_yield
            })

        return fii_data

    except Exception as e:
        print(f"Erro ao obter os dados dos FIIs: {e}")
        return []

    finally:
        # Fecha o navegador
        driver.quit()

def save_fii_data_to_file(fii_data):
    # Formata os dados em um array JavaScript e salva em um arquivo .txt
    with open('fii_data.js', 'w') as file:
        file.write('const fiiData = [\n')
        for data in fii_data:
            file.write(f'    {{ symbol: "{data["symbol"]}", dividend_yield: "{data["dividend_yield"]}" }},\n')
        file.write('];\n')
        file.write('module.exports = fiiData;\n')

if __name__ == '__main__':
    fiis = get_fii_data()
    if fiis:
        print(f"Encontrados {len(fiis)} FIIs. Salvando em fii_data.js...")
        save_fii_data_to_file(fiis)
        print("Arquivo salvo com sucesso!")
    else:
        print("Nenhum FII encontrado.")
