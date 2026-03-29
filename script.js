const API_URL = "SUA_URL_AQUI";

async function carregarDados() {
  try {
    const res = await fetch(API_URL, {
      method: "GET",
      mode: "no-cors"
    });

    const text = await res.text();

    // Corrige resposta vazia do no-cors
    const data = JSON.parse(text || "[]");

    dadosGlobais = data;
    atualizarDashboard(data);

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
        <td>${d.D}</td>
        <td>${d.I}</td>
        <td>${d.S}</td>
        <td>${d.C}</td>
      </tr>
    `;
  });

  document.getElementById("tabela").innerHTML = tabela;

  let top = Object.keys(perfis).reduce((a,b)=> perfis[a]>perfis[b]?a:b);
  document.getElementById("topPerfil").innerText = top;

  document.getElementById("mediaD").innerText = (soma.D/data.length).toFixed(1);
  document.getElementById("mediaI").innerText = (soma.I/data.length).toFixed(1);

  criarGrafico(perfis, soma, data.length);
}

function criarGrafico(perfis, soma, total) {

  new Chart(document.getElementById("perfilChart"), {
    type: "doughnut",
    data: { labels:["D","I","S","C"], datasets:[{ data:Object.values(perfis)}]}
  });

  new Chart(document.getElementById("mediaChart"), {
    type: "bar",
    data: {
      labels:["D","I","S","C"],
      datasets:[{ data:[
        soma.D/total,
        soma.I/total,
        soma.S/total,
        soma.C/total
      ]}]
    }
  });

}

function exportarPDF() {
  const element = document.body;
  html2pdf().from(element).save("dashboard-disc.pdf");
}

carregarDados();