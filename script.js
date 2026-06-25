const API_URL = "https://script.google.com/macros/s/AKfycbykKmtbqyLrNcpCY8K579YEzE6xU_TmPlsHHuYgFUSzK_DldOZZwccgKPDJxiABzJIh/exec";

let dadosGlobais = [];
let abaAtual = "interno";

let chartPerfil = null;
let chartMedia = null;

// Candidato pendente de contratação
let candidatoPendente = null;

// =====================
// FETCH
// =====================
async function carregarDados() {
  try {
    const res = await fetch(API_URL);

    if (!res.ok) throw new Error("Erro na API");

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

  // Mostra/oculta coluna "Ação" apenas no recrutamento
  document.getElementById("colAcao").style.display = tipo === "recrutamento" ? "" : "none";

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
    if (fim) matchData = matchData && data <= new Date(fim);

    // Oculta já contratados na aba de recrutamento
    let matchContratado = !(abaAtual === "recrutamento" && item.contratado);

    return matchTipo && matchNome && matchData && matchContratado;
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
  data.sort((a, b) => a.nome.localeCompare(b.nome));

  document.getElementById("total").innerText = data.length;

  let perfis = { D: 0, I: 0, S: 0, C: 0 };
  let soma   = { D: 0, I: 0, S: 0, C: 0 };
  let tabela = "";

  data.forEach(d => {
    perfis[d.perfil]++;
    soma.D += d.D;
    soma.I += d.I;
    soma.S += d.S;
    soma.C += d.C;

    // Botão de contratar só aparece na aba recrutamento
    const btnContratar = abaAtual === "recrutamento"
      ? `<td><button class="btn-contratar" onclick="abrirModal(${JSON.stringify(d).replace(/"/g, '&quot;')})">✅ Contratar</button></td>`
      : "";

    tabela += `
      <tr>
        <td>${d.nome}</td>
        <td>${d.perfil}</td>
        <td>${d.D}%</td>
        <td>${d.I}%</td>
        <td>${d.S}%</td>
        <td>${d.C}%</td>
        ${btnContratar}
      </tr>
    `;
  });

  document.getElementById("tabela").innerHTML = tabela;

  let total = data.length || 1;
  document.getElementById("percD").innerText = ((perfis.D / total) * 100).toFixed(1) + "%";
  document.getElementById("percI").innerText = ((perfis.I / total) * 100).toFixed(1) + "%";
  document.getElementById("percS").innerText = ((perfis.S / total) * 100).toFixed(1) + "%";
  document.getElementById("percC").innerText = ((perfis.C / total) * 100).toFixed(1) + "%";

  let top = Object.keys(perfis).reduce((a, b) => perfis[a] > perfis[b] ? a : b);
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
      labels: ["D", "I", "S", "C"],
      datasets: [{ data: Object.values(perfis) }]
    }
  });

  chartMedia = new Chart(document.getElementById("mediaChart"), {
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

// =====================
// MODAL DE CONTRATAÇÃO
// =====================
function abrirModal(candidato) {
  candidatoPendente = candidato;
  document.getElementById("modalNome").innerText = candidato.nome;
  document.getElementById("modalContratar").style.display = "flex";
}

function fecharModal() {
  candidatoPendente = null;
  document.getElementById("modalContratar").style.display = "none";
}

async function confirmarContratacao() {
  if (!candidatoPendente) return;

  const btn = document.querySelector(".btn-confirmar");
  btn.disabled = true;
  btn.innerText = "Processando...";

  try {
    const payload = {
      tipo: "contratar",
      linha: candidatoPendente.linha, // índice da linha na planilha (enviado pela API)
      nome: candidatoPendente.nome,
      emailUsuario: candidatoPendente.email,
      predominante: candidatoPendente.perfil,
      D_count: candidatoPendente.D_count,
      D_perc: candidatoPendente.D,
      I_count: candidatoPendente.I_count,
      I_perc: candidatoPendente.I,
      S_count: candidatoPendente.S_count,
      S_perc: candidatoPendente.S,
      C_count: candidatoPendente.C_count,
      C_perc: candidatoPendente.C,
      respostas: candidatoPendente.respostas || ""
    };

    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.status === "success") {
      // Marca localmente como contratado para sumir da lista sem reload
      const idx = dadosGlobais.findIndex(d => d.linha === candidatoPendente.linha);
      if (idx !== -1) dadosGlobais[idx].contratado = true;

      fecharModal();
      mostrarToast(`✅ ${candidatoPendente.nome} contratado(a) com sucesso!`, "success");
      aplicarFiltroAtual();
    } else {
      mostrarToast("❌ Erro: " + (result.message || "tente novamente"), "error");
    }

  } catch (e) {
    console.error(e);
    mostrarToast("❌ Falha na conexão com a API", "error");
  }

  btn.disabled = false;
  btn.innerText = "Contratar";
}

// =====================
// TOAST
// =====================
function mostrarToast(msg, tipo) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.className = "toast " + tipo;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 4000);
}

// =====================
// PDF
// =====================
function exportarPDF() {
  html2pdf().from(document.body).save("dashboard-disc.pdf");
}

// =====================
// FECHAR MODAL CLICANDO FORA
// =====================
document.addEventListener("click", function(e) {
  const overlay = document.getElementById("modalContratar");
  if (e.target === overlay) fecharModal();
});

// =====================
// START
// =====================
carregarDados();