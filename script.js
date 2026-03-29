const API_URL = "https://script.google.com/macros/s/AKfycbzwWdhrj4pgd52M_1sslbSU4fN112XxcuR70KkvsqTzprAIeOkqWPIOJfow6q5rG-N4/exec";

let dadosGlobais = [];
let abaAtual = "interno";

let chartPerfil = null;
let chartMedia = null;

// =====================
// FETCH
// =====================
async function carregarDados() {
  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      throw new Error("Erro na API");
    }

    const data = await res.json();

    dadosGlobais = data;

    aplicarFiltroAtual();

  } catch (erro) {
    console.error("Erro ao carregar:", erro);
    alert("Erro ao conectar com API");
  }
}

// =====================
// TROCAR ABA
// =====================
function trocarAba(tipo) {
  abaAtual = tipo;

  document.querySelectorAll(".aba").forEach(btn => btn.classList.remove("ativa"));
  event.target.classList.add("ativa");

  aplicarFiltroAtual();
}

// =====================
// FILTRO CENTRAL
// =====================
function aplicarFiltroAtual() {

  const nome = document.getElementById("busca").value.toLowerCase();
  const inicio = document.getElementById("dataInicio").value;
  const fim = document.getElementById("dataFim").value;

  let filtrado = dadosGlobais.filter(item => {

    let matchTipo = item.tipo === abaAtual;

    let matchNome = item.nome.toLowerCase().includes(nome);

    let data = new Date(item.data);
    let matchData = true;

    if (inicio) matchData = data >= new Date(inicio);
    if (fim) matchData = data <= new Date(fim);

    return matchTipo && matchNome && matchData;
  });

  atualizarDashboard(filtrado);
}

// =====================
// BOTÃO FILTRAR
// =====================
function filtrar() {
  aplicarFiltroAtual();
}

// =====================
// DASHBOARD
// =====================
function atualizarDashboard(data) {

  // ORDENA ALFABETICAMENTE
  data.sort((a, b) => a.nome.localeCompare(b.nome));

  document.getElementById("total").innerText = data.length;

  let perfis = {D:0,I:0,S:0,C:0};
  let soma = {D:0,I:0,S:0,C:0};

  let tabela = "";

  data.forEach(d => {
    perfis[d.perfil]++;
    soma.D += d.D;
    soma.I += d.I;
    soma.S += d.S;
    soma.C += d.C;

    tabela += `
      <tr>
        <td>${d.nome}</td>
        <td>${d.perfil}</td>
        <td>${d.D}%</td>
        <td>${d.I}%</td>
        <td>${d.S}%</td>
        <td>${d.C}%</td>
      </tr>
    `;
  });

  document.getElementById("tabela").innerHTML = tabela;

  let total = data.length || 1;

  // PERCENTUAIS
  document.getElementById("percD").innerText = ((perfis.D/total)*100).toFixed(1)+"%";
  document.getElementById("percI").innerText = ((perfis.I/total)*100).toFixed(1)+"%";
  document.getElementById("percS").innerText = ((perfis.S/total)*100).toFixed(1)+"%";
  document.getElementById("percC").innerText = ((perfis.C/total)*100).toFixed(1)+"%";

  // PERFIL DOMINANTE
  let top = Object.keys(perfis).reduce((a,b)=> perfis[a]>perfis[b]?a:b);
  document.getElementById("topPerfil").innerText = top;

  criarGrafico(perfis, soma, total);
}

// =====================
// GRÁFICOS
// =====================
function criarGrafico(perfis, soma, total) {

  if (chartPerfil) chartPerfil.destroy();
  if (chartMedia) chartMedia.destroy();

  chartPerfil = new Chart(document.getElementById("perfilChart"), {
    type: "doughnut",
    data: {
      labels: ["D","I","S","C"],
      datasets: [{
        data: Object.values(perfis)
      }]
    }
  });

  chartMedia = new Chart(document.getElementById("mediaChart"), {
    type: "bar",
    data: {
      labels: ["D","I","S","C"],
      datasets: [{
        data: [
          soma.D/total,
          soma.I/total,
          soma.S/total,
          soma.C/total
        ]
      }]
    }
  });
}

// =====================
// PDF
// =====================
function exportarPDF() {
  html2pdf().from(document.body).save("dashboard-disc.pdf");
}

// =====================
// START
// =====================
carregarDados();