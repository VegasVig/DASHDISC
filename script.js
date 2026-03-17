const API_URL = "https://script.google.com/macros/s/AKfycbzTGljP3Oj1YKJMbQicmSeC5t_13zGtCQmiTt3sS7FCoeKsmQaBHb7AsAvIxQnjogqR/exec";

async function carregarDados() {
  const res = await fetch(API_URL);
  const data = await res.json();

  let total = data.length;

  document.getElementById("total").innerText = total;

  let perfis = { D: 0, I: 0, S: 0, C: 0 };

  let interno = { D: 0, I: 0, S: 0, C: 0 };
  let recrutamento = { D: 0, I: 0, S: 0, C: 0 };

  let soma = { D: 0, I: 0, S: 0, C: 0 };

  data.forEach(item => {
    let p = item.perfil;

    perfis[p]++;
    soma.D += item.D;
    soma.I += item.I;
    soma.S += item.S;
    soma.C += item.C;

    if (item.tipo === "interno") interno[p]++;
    else recrutamento[p]++;
  });

  // Perfil mais comum
  let top = Object.keys(perfis).reduce((a, b) => perfis[a] > perfis[b] ? a : b);
  document.getElementById("topPerfil").innerText = top;

  // Última data
  document.getElementById("ultima").innerText = data[data.length - 1]?.data;

  criarGraficoPerfis(perfis);
  criarGraficoMedia(soma, total);
  criarGraficoComparacao(interno, recrutamento);
}

function criarGraficoPerfis(perfis) {
  new Chart(document.getElementById("perfilChart"), {
    type: "doughnut",
    data: {
      labels: ["D", "I", "S", "C"],
      datasets: [{
        data: Object.values(perfis),
      }]
    }
  });
}

function criarGraficoMedia(soma, total) {
  new Chart(document.getElementById("mediaChart"), {
    type: "bar",
    data: {
      labels: ["D", "I", "S", "C"],
      datasets: [{
        data: [
          soma.D / total,
          soma.I / total,
          soma.S / total,
          soma.C / total
        ]
      }]
    }
  });
}

function criarGraficoComparacao(interno, recrutamento) {
  new Chart(document.getElementById("comparacaoChart"), {
    type: "bar",
    data: {
      labels: ["D", "I", "S", "C"],
      datasets: [
        {
          label: "Interno",
          data: Object.values(interno)
        },
        {
          label: "Recrutamento",
          data: Object.values(recrutamento)
        }
      ]
    }
  });
}

carregarDados();