const fiiData = require("../webscrapping/fii_symbols.js");
const yahooFinance = require("yahoo-finance2").default;
const axios = require("axios");

const alphaVantageApiKey = "FM3NLCHFI1HZNBIS"; // Substitua pela sua chave de API do Alpha Vantage

let fiisCache = [];
let counterFii = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchYahooFinanceData = async (symbol) => {
  try {
    const result = await yahooFinance.quoteSummary(`${symbol}.SA`, {
      modules: ["price", "summaryDetail"],
    });

    if (!result.price || !result.summaryDetail) {
      console.warn(`Dados incompletos para o FII ${symbol} no Yahoo Finance`);
      return null;
    }

    const currentPrice = result.price.regularMarketPrice || 0;
    let dividendYieldAnual = (result.summaryDetail.dividendYield || 0) * 100; // Convertendo para percentual anual

    return {
      currentPrice,
      dividendYieldAnual,
    };
  } catch (error) {
    console.error(
      `Erro ao buscar dados para o FII ${symbol} no Yahoo Finance:`,
      error.message || error
    );
    return null;
  }
};

const fetchAlphaVantageData = async (symbol) => {
  try {
    const response = await axios.get("https://www.alphavantage.co/query", {
      params: {
        function: "TIME_SERIES_DAILY",
        symbol: `${symbol}.SA`,
        apikey: alphaVantageApiKey,
      },
    });

    if (response.data["Time Series (Daily)"]) {
      const lastRefreshed = response.data["Meta Data"]["3. Last Refreshed"];
      const latestData = response.data["Time Series (Daily)"][lastRefreshed];

      const currentPrice = parseFloat(latestData["4. close"]);
      const dividendYieldMensal = 0.5; // Supondo um valor fixo como fallback

      const dividendYieldAnual = dividendYieldMensal * 12 * 100;

      return {
        currentPrice,
        dividendYieldAnual,
      };
    } else {
      console.warn(
        `Dados não encontrados para o FII ${symbol} no Alpha Vantage`
      );
      return null;
    }
  } catch (error) {
    console.error(
      `Erro ao buscar dados para o FII ${symbol} no Alpha Vantage:`,
      error.message || error
    );
    return null;
  }
};

const fetchFiisData = async () => {
  let missingSymbols = [];
  try {
    const fiisData = [];

    for (const fii of fiiData) {
      let yahooData = null;
      let dividendYieldAnual;
      let currentPrice;

      if (fii.dividend_yield !== "N/A" && parseFloat(fii.dividend_yield) > 0) {
        // Se o dividend_yield for válido, use-o
        dividendYieldAnual = parseFloat(fii.dividend_yield.replace(",", "."));
      } else {
        // Tente buscar no Yahoo Finance se o dividend_yield for N/A ou zero
        yahooData = await fetchYahooFinanceData(fii.symbol);
        if (yahooData) {
          dividendYieldAnual = yahooData.dividendYieldAnual;
          currentPrice = yahooData.currentPrice;
        } else {
          // Adiciona à lista de símbolos faltantes para buscar no Alpha Vantage
          missingSymbols.push(fii.symbol);
          continue; // Pula para o próximo FII
        }
      }

      // Caso `currentPrice` não tenha sido definido a partir do Yahoo Finance, inicializa-o como 0
      currentPrice = currentPrice || 0;

      // Converter o dividendYield de anual para mensal
      const dividendYieldMensal =
        Math.pow(1 + dividendYieldAnual / 100, 1 / 12) - 1;
      const monthlyYield = dividendYieldMensal * currentPrice; // Rendimento mensal em R$
      const cotasNecessarias = currentPrice / (monthlyYield || 1); // Evitar divisão por zero
      const valorTotalInvestido = cotasNecessarias * currentPrice;

      fiisData.push({
        symbol: fii.symbol,
        yieldAnual: dividendYieldAnual.toFixed(2), // Mantém o yield anual para referência
        yieldMensal: (dividendYieldMensal * 100).toFixed(2), // Exibe o yield mensal em percentual
        currentPrice: currentPrice.toFixed(2),
        cotasNecessarias: cotasNecessarias.toFixed(2),
        valorTotalInvestido: valorTotalInvestido.toFixed(2),
      });

      counterFii++;
      console.log(fii.symbol, counterFii);
      // Atraso de 2 segundos entre as requisições para evitar "Too Many Requests"
      await delay(2000);
    }

    // Tentar buscar os dados faltantes no Alpha Vantage
    for (const symbol of missingSymbols) {
      const alphaData = await fetchAlphaVantageData(symbol);
      if (alphaData) {
        const dividendYieldMensal =
          Math.pow(1 + alphaData.dividendYieldAnual / 100, 1 / 12) - 1;
        const monthlyYield = dividendYieldMensal * alphaData.currentPrice; // Rendimento mensal em R$
        const cotasNecessarias = alphaData.currentPrice / (monthlyYield || 1); // Evitar divisão por zero
        const valorTotalInvestido = cotasNecessarias * alphaData.currentPrice;

        fiisData.push({
          symbol,
          yieldAnual: alphaData.dividendYieldAnual.toFixed(2),
          yieldMensal: (dividendYieldMensal * 100).toFixed(2),
          currentPrice: alphaData.currentPrice.toFixed(2),
          cotasNecessarias: cotasNecessarias.toFixed(2),
          valorTotalInvestido: valorTotalInvestido.toFixed(2),
        });
      }
      await delay(2000);
    }

    fiisCache = fiisData.sort((a, b) => b.yieldMensal - a.yieldMensal);
  } catch (error) {
    console.error("Erro ao buscar dados dos FIIs:", error.message || error);
  }
  return fiisCache;
};

module.exports = { fetchFiisData };
