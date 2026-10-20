
// Variáveis globais
var ultimosResultados = [];
var ultimoTitulo = "";

var MATRICULA = "461554";
var LOGS_API = "https://www.piway.com.br/unoesc/api";

// Registra logs na API
async function registrarLog(metodo, resultado) {
  var texto = String(resultado).substring(0, 120);
  var url = LOGS_API + "/inserir/log/" + MATRICULA + "/iTunes/"
    + encodeURIComponent(metodo) + "/" + encodeURIComponent(texto);

  try {
    await fetch(url);
  } catch (erro) {
    console.log("Não foi possível registrar o log.");
  }
}

// Carrega e exibe os logs
async function carregarListaLogs() {
  var area = document.getElementById("listaLogs");
  area.innerHTML = "<p>Carregando logs...</p>";

  try {
    var resposta = await fetch(LOGS_API + "/logs/" + MATRICULA);
    var dados = await resposta.json();

    if (!resposta.ok || typeof dados === "string") {
      area.innerHTML = "<p>" + (dados || "Erro ao carregar logs.") + "</p>";
      return;
    }

    if (dados.length == 0) {
      area.innerHTML = "<p>Nenhum log registrado ainda.</p>";
      return;
    }

    var html = `<div class="table-responsive">
      <table class="table table-dark table-striped table-sm">
      <thead><tr><th>Data</th><th>API</th><th>Método</th>
      <th>Resultado</th><th></th></tr></thead><tbody>`;

    for (var i = 0; i < dados.length; i++) {
      var log = dados[i];

      html += `<tr>
        <td>${log.log || "—"}</td>
        <td>${log.api || "—"}</td>
        <td>${log.metodo || "—"}</td>
        <td>${log.resultado || "—"}</td>
        <td><button class="btn btn-sm btn-outline-danger"
        onclick="excluirLog(${log.idlog})">Excluir</button></td>
      </tr>`;
    }

    area.innerHTML = html + "</tbody></table></div>";
  } catch (erro) {
    area.innerHTML = "<p>Não foi possível carregar os logs.</p>";
  }
}

// Abre o modal de logs
function vizuLog() {
  var elemento = document.getElementById("modalLogs");
  bootstrap.Modal.getOrCreateInstance(elemento).show();
  carregarListaLogs();
}

// Exclui um log
async function excluirLog(idLog) {
  try {
    await fetch(LOGS_API + "/excluir/log/" + idLog + "/aluno/" + MATRICULA);
    await carregarListaLogs();
  } catch (erro) {
    mostrarMensagem("Não foi possível excluir o log.");
  }
}

// Pesquisa músicas e álbuns
async function pesquisar() {
  var nome = document.getElementById("pesquisa").value.trim();
  var genero = document.getElementById("genero").value;
  var tipo = document.getElementById("tipo").value;
  var limite = document.getElementById("limite").value;
  var termo = nome || genero;

  if (termo == "") {
    mostrarMensagem("Digite um nome ou escolha um gênero.");
    return;
  }

  var endereco = "https://itunes.apple.com/search?term="
    + encodeURIComponent(termo)
    + "&entity=" + tipo + "&limit=" + limite + "&country=BR";

  await consultarAPI(endereco, "Resultados para: " + termo, "pesquisar-" + tipo);
}

// Pesquisa artistas
async function pesquisarArtistas() {
  var nome = document.getElementById("pesquisa").value.trim();
  var limite = document.getElementById("limite").value;

  if (nome == "") {
    mostrarMensagem("Digite o nome de um artista.");
    return;
  }

  var endereco = "https://itunes.apple.com/search?term="
    + encodeURIComponent(nome)
    + "&entity=musicArtist&limit=" + limite + "&country=BR";

  await consultarAPI(endereco, "Artistas encontrados para: " + nome, "pesquisarArtistas");
}

// Busca o artista e depois seus álbuns
async function buscarDiscografia() {
  var nome = document.getElementById("pesquisa").value.trim();
  var limite = document.getElementById("limite").value;

  if (nome == "") {
    mostrarMensagem("Digite o nome de um artista.");
    return;
  }

  mostrarMensagem("Procurando artista...");

  try {
    var urlArtista = "https://itunes.apple.com/search?term="
      + encodeURIComponent(nome)
      + "&entity=musicArtist&limit=1&country=BR";

    var respostaArtista = await fetch(urlArtista);
    var dadosArtista = await respostaArtista.json();

    if (!respostaArtista.ok) throw new Error("Erro ao procurar artista");

    if (dadosArtista.results.length == 0) {
      mostrarMensagem("Artista não encontrado.");
      await registrarLog("buscarDiscografia-artista", "0 artistas encontrados");
      return;
    }

    var artista = dadosArtista.results[0];
    await registrarLog("buscarDiscografia-artista", artista.artistName);

    var urlAlbuns = "https://itunes.apple.com/lookup?id="
      + artista.artistId
      + "&entity=album&limit=" + limite + "&country=BR";

    var respostaAlbuns = await fetch(urlAlbuns);
    var dadosAlbuns = await respostaAlbuns.json();

    if (!respostaAlbuns.ok) throw new Error("Erro ao procurar álbuns");

    var albuns = [];

    for (var i = 0; i < dadosAlbuns.results.length; i++) {
      if (dadosAlbuns.results[i].wrapperType == "collection") {
        albuns.push(dadosAlbuns.results[i]);
      }
    }

    await registrarLog("buscarDiscografia-albuns", albuns.length + " albuns");
    mostrarResultados(albuns, "Discografia de: " + artista.artistName);
  } catch (erro) {
    mostrarMensagem("Não foi possível consultar a discografia. Tente novamente.");
  }
}

// Consulta a API e exibe os resultados
async function consultarAPI(endereco, titulo, metodoLog) {
  mostrarMensagem("Consultando a API do iTunes...");

  try {
    var resposta = await fetch(endereco);

    if (!resposta.ok) throw new Error("Erro na consulta");

    var dados = await resposta.json();
    var qtd = dados.resultCount;

    if (qtd == undefined && dados.results != undefined) {
      qtd = dados.results.length;
    }

    await registrarLog(metodoLog, qtd + " resultados");
    mostrarResultados(dados.results, titulo);
  } catch (erro) {
    mostrarMensagem("Não foi possível consultar a API. Confira a conexão e tente novamente.");
  }
}

// Exibe uma mensagem e limpa os resultados
function mostrarMensagem(texto) {
  document.getElementById("mensagem").innerHTML = texto;
  document.getElementById("quantidade").innerHTML = "";
  document.getElementById("resultados").innerHTML = "";
}

// Exibe os resultados e remove duplicados, se necessário
function mostrarResultados(itens, titulo) {
  ultimosResultados = itens;
  ultimoTitulo = titulo;

  var lista = [];
  var remover = document.getElementById("removerRepetidos").checked;

  if (remover) {
    for (var i = 0; i < itens.length; i++) {
      var id = pegarId(itens[i]);
      var repetido = false;

      for (var j = 0; j < lista.length; j++) {
        if (id == pegarId(lista[j])) repetido = true;
      }

      if (!repetido) lista.push(itens[i]);
    }
  } else {
    lista = itens;
  }

  var area = document.getElementById("resultados");
  area.innerHTML = "";
  document.getElementById("tituloResultados").innerHTML = titulo;

  if (lista.length == 0) {
    document.getElementById("mensagem").innerHTML =
      "Nenhum resultado encontrado. Tente outra pesquisa.";
    document.getElementById("quantidade").innerHTML = "0 resultados";
    return;
  }

  for (var k = 0; k < lista.length; k++) {
    area.innerHTML += criarCartao(lista[k]);
  }

  document.getElementById("mensagem").innerHTML = "Consulta concluída.";
  document.getElementById("quantidade").innerHTML =
    lista.length + " resultados exibidos";
}

// Obtém o ID de música, álbum ou artista
function pegarId(item) {
  if (item.trackId != undefined) return item.trackId;
  if (item.collectionId != undefined) return item.collectionId;
  return item.artistId;
}

// Cria o cartão de cada resultado
function criarCartao(item) {
  var nome = item.trackName || item.collectionName
    || item.artistName || "Nome não informado";

  var artista = item.artistName || "Artista não informado";
  var capa = item.artworkUrl100;
  var previa = item.previewUrl;
  var link = item.trackViewUrl || item.collectionViewUrl || item.artistLinkUrl;

  var cartao = `<div class="col-6 col-md-4 col-lg-3">
    <div class="music-card h-100">`;

  if (capa) {
    cartao += `<img src="${capa}" alt="Capa ou imagem da música">`;
  }

  cartao += `<div class="card-body">
    <h3 class="card-title mt-2">${nome}</h3>
    <p class="card-text">${artista}</p>`;

  cartao += previa
    ? `<audio controls class="w-100 mt-2" src="${previa}"></audio>`
    : `<p class="small text-secondary">Prévia indisponível</p>`;

  if (link) {
    cartao += `<a class="btn btn-sm btn-outline-light w-100 mt-2"
      href="${link}" target="_blank" rel="noopener">Ver no iTunes</a>`;
  }

  return cartao + "</div></div></div>";
}

// Atualiza os resultados quando o filtro mudar
function atualizarRepeticoes() {
  if (ultimosResultados.length > 0) {
    mostrarResultados(ultimosResultados, ultimoTitulo);
  }
}
