const API_URL = "https://script.google.com/macros/s/AKfycbz9sfBA6YpjsxsPQSY8eePEorHuNOW4RU5_1mozauKWAFd2xf74r7aTjMSyoUMAOHok/exec";

let dadosGlobais = [];

async function carregarDados() {
  try {
    const res = await fetch(API_URL + "?t=" + new Date().getTime()); // evita cache
    const data = await res.json();

    dadosGlobais = data || [];
    atualizarDashboard(dadosGlobais);

  } catch (erro) {
    console.error("Erro ao carregar:", erro);
    alert("Erro ao conectar com API");
  }
}

function filtrar() {
  const nome = document.getElementById("busca").value.toLowerCase();
  const inicio = document.getElementById("dataInicio").value;
  const fim = document.getElementById("dataFim").value;

  let filtrado = dadosGlobais.filter(item => {
    if (!item.nome) return false;

    let matchNome = item.nome.toLowerCase().includes(nome);

    let data = new Date(item.data);
    let matchData = true;

    if (inicio) matchData = data >= new Date(inicio);
    if (fim) matchData = data <= new Date(fim);

    return matchNome && matchData;
  });

  atualizarDashboard(filtrado);
}

function atualizarDashboard(data) {

  // ✅ ORDENA POR NOME (A → Z)
  data.sort((a, b) => {
    if (!a.nome) return 1;
    if (!b.nome) return -1;
    return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
  });

  document.getElementById("total").innerText = data.length;

  let perfis = {D:0,I:0,S:0,C:0};
  let soma = {D:0,I:0,S:0,C:0};

  let tabela = "";

  data.forEach(d => {
    if (!d.nome) return;

    perfis[d.perfil] = (perfis[d.perfil] || 0) + 1;

    soma.D += Number(d.D) || 0;
    soma.I += Number(d.I) || 0;
    soma.S += Number(d.S) || 0;
    soma.C += Number(d.C) || 0;

    tabela += `
      <tr>
        <td>${d.nome}</td>
        <td>${d.perfil}</td>
        <td>${d.D}</td>
        <td>${d.I}</td>
        <td>${d.S}</td>
        <td>${d.C}</td>
      </tr>
    `;
  });

  document.getElementById("tabela").innerHTML = tabela;

  let total = data.length || 1;

  let top = Object.keys(perfis).reduce((a,b)=> perfis[a]>perfis[b]?a:b, "D");
  document.getElementById("topPerfil").innerText = top;

  document.getElementById("mediaD").innerText = (soma.D/total).toFixed(1);
  document.getElementById("mediaI").innerText = (soma.I/total).toFixed(1);

  criarGrafico(perfis, soma, total);
}

function criarGrafico(perfis, soma, total) {

  // 🔥 destrói gráfico anterior (evita bug duplicado)
  if (window.chart1) window.chart1.destroy();
  if (window.chart2) window.chart2.destroy();

  window.chart1 = new Chart(document.getElementById("perfilChart"), {
    type: "doughnut",
    data: {
      labels:["D","I","S","C"],
      datasets:[{ data:Object.values(perfis) }]
    }
  });

  window.chart2 = new Chart(document.getElementById("mediaChart"), {
    type: "bar",
    data: {
      labels:["D","I","S","C"],
      datasets:[{
        data:[
          soma.D/total,
          soma.I/total,
          soma.S/total,
          soma.C/total
        ]
      }]
    }
  });
}

function exportarPDF() {
  const element = document.body;
  html2pdf().from(element).save("dashboard-disc.pdf");
}

carregarDados();