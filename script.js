var ultimosResultados = [];
var ultimoTitulo = "";

// 1. Pesquisa músicas e álbuns.
async function pesquisar() {
  var nome = document.getElementById("pesquisa").value.trim();
  var genero = document.getElementById("genero").value;
  var tipo = document.getElementById("tipo").value;
  var limite = document.getElementById("limite").value;
  var termo = nome;

  if (termo == "") {
    termo = genero;
  }

  if (termo == "") {
    mostrarMensagem("Digite um nome ou escolha um gênero.");
    return;
  }

  var endereco = "https://itunes.apple.com/search?term=" + encodeURIComponent(termo);
  endereco = endereco + "&entity=" + tipo + "&limit=" + limite + "&country=BR";

  await consultarAPI(endereco, "Resultados para: " + termo);
}

// 2. Pesquisa artistas.
async function pesquisarArtistas() {
  var nome = document.getElementById("pesquisa").value.trim();
  var limite = document.getElementById("limite").value;

  if (nome == "") {
    mostrarMensagem("Digite o nome de um artista.");
    return;
  }

  var endereco = "https://itunes.apple.com/search?term=" + encodeURIComponent(nome);
  endereco = endereco + "&entity=musicArtist&limit=" + limite + "&country=BR";

  await consultarAPI(endereco, "Artistas encontrados para: " + nome);
}

// 3. Procura um artista e depois consulta seus álbuns com lookup.
async function buscarDiscografia() {
  var nome = document.getElementById("pesquisa").value.trim();
  var limite = document.getElementById("limite").value;

  if (nome == "") {
    mostrarMensagem("Digite o nome de um artista.");
    return;
  }

  mostrarMensagem("Procurando artista...");

  try {
    var enderecoArtista = "https://itunes.apple.com/search?term=" + encodeURIComponent(nome);
    enderecoArtista = enderecoArtista + "&entity=musicArtist&limit=1&country=BR";

    var respostaArtista = await fetch(enderecoArtista);
    var dadosArtista = await respostaArtista.json();

    if (respostaArtista.ok == false) {
      throw new Error("Erro ao procurar artista");
    }

    if (dadosArtista.results.length == 0) {
      mostrarMensagem("Artista não encontrado.");
      return;
    }

    var artista = dadosArtista.results[0];
    var enderecoAlbuns = "https://itunes.apple.com/lookup?id=" + artista.artistId;
    enderecoAlbuns = enderecoAlbuns + "&entity=album&limit=" + limite + "&country=BR";

    var respostaAlbuns = await fetch(enderecoAlbuns);
    var dadosAlbuns = await respostaAlbuns.json();

    if (respostaAlbuns.ok == false) {
      throw new Error("Erro ao procurar álbuns");
    }

    var albuns = [];

    for (var i = 0; i < dadosAlbuns.results.length; i++) {
      if (dadosAlbuns.results[i].wrapperType == "collection") {
        albuns.push(dadosAlbuns.results[i]);
      }
    }

    mostrarResultados(albuns, "Discografia de: " + artista.artistName);
  } catch (erro) {
    mostrarMensagem("Não foi possível consultar a discografia. Tente novamente.");
  }
}

// Faz a consulta à API e trata possíveis erros.
async function consultarAPI(endereco, titulo) {
  mostrarMensagem("Consultando a API do iTunes...");

  try {
    var resposta = await fetch(endereco);

    if (resposta.ok == false) {
      throw new Error("Erro na consulta");
    }

    var dados = await resposta.json();
    mostrarResultados(dados.results, titulo);
  } catch (erro) {
    mostrarMensagem("Não foi possível consultar a API. Confira a conexão e tente novamente.");
  }
}

// Mostra uma mensagem na página.
function mostrarMensagem(texto) {
  document.getElementById("mensagem").innerHTML = texto;
  document.getElementById("quantidade").innerHTML = "";
  document.getElementById("resultados").innerHTML = "";
}

// Mostra os resultados e, se solicitado, remove itens repetidos.
function mostrarResultados(itens, titulo) {
  ultimosResultados = itens;
  ultimoTitulo = titulo;

  var lista = [];
  var removerRepetidos = document.getElementById("removerRepetidos").checked;

  if (removerRepetidos == true) {
    for (var i = 0; i < itens.length; i++) {
      var id = pegarId(itens[i]);
      var repetido = false;

      for (var j = 0; j < lista.length; j++) {
        if (id == pegarId(lista[j])) {
          repetido = true;
        }
      }

      if (repetido == false) {
        lista.push(itens[i]);
      }
    }
  } else {
    lista = itens;
  }

  var area = document.getElementById("resultados");
  area.innerHTML = "";
  document.getElementById("tituloResultados").innerHTML = titulo;

  if (lista.length == 0) {
    document.getElementById("mensagem").innerHTML = "Nenhum resultado encontrado. Tente outra pesquisa.";
    document.getElementById("quantidade").innerHTML = "0 resultados";
    return;
  }

  for (var k = 0; k < lista.length; k++) {
    area.innerHTML = area.innerHTML + criarCartao(lista[k]);
  }

  document.getElementById("mensagem").innerHTML = "Consulta concluída.";
  document.getElementById("quantidade").innerHTML = lista.length + " resultados exibidos";
}

// Retorna o identificador de uma música, álbum ou artista.
function pegarId(item) {
  if (item.trackId != undefined) {
    return item.trackId;
  }

  if (item.collectionId != undefined) {
    return item.collectionId;
  }

  return item.artistId;
}

// Monta um cartão para cada resultado.
function criarCartao(item) {
  var nome = item.trackName;
  var artista = item.artistName;
  var capa = item.artworkUrl100;
  var previa = item.previewUrl;
  var link = item.trackViewUrl;

  if (nome == undefined) {
    nome = item.collectionName;
  }
  if (nome == undefined) {
    nome = item.artistName;
  }
  if (nome == undefined) {
    nome = "Nome não informado";
  }
  if (artista == undefined) {
    artista = "Artista não informado";
  }
  if (link == undefined) {
    link = item.collectionViewUrl;
  }
  if (link == undefined) {
    link = item.artistLinkUrl;
  }

  var cartao = `<div class="col-6 col-md-4 col-lg-3"><div class="music-card h-100">`;

  if (capa != undefined) {
    cartao = cartao + `<img src="${capa}" alt="Capa ou imagem da música">`;
  }

  cartao = cartao + `<div class="card-body"><h3 class="card-title mt-2">${nome}</h3>`;
  cartao = cartao + `<p class="card-text">${artista}</p>`;

  if (previa != undefined) {
    cartao = cartao + `<audio controls class="w-100 mt-2" src="${previa}"></audio>`;
  } else {
    cartao = cartao + `<p class="small text-secondary">Prévia indisponível</p>`;
  }

  if (link != undefined) {
    cartao = cartao + `<a class="btn btn-sm btn-outline-light w-100 mt-2" href="${link}" target="_blank" rel="noopener">Ver no iTunes</a>`;
  }

  cartao = cartao + `</div></div></div>`;
  return cartao;
}

// Atualiza a lista quando a caixa de repetidos mudar.
function atualizarRepeticoes() {
  if (ultimosResultados.length > 0) {
    mostrarResultados(ultimosResultados, ultimoTitulo);
  }
}
