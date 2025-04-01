// Variáveis globais para controle
let dadosMusica = {}; // Armazena os dados da música atual
let nextCheckTime = 0; // Define o tempo da próxima checagem
let isFirstUpdate = true; // Flag para identificar a primeira atualização
let flagEnviado = false; // Flag para indicar se a notificação foi disparada

// Função para atualizar os players na página
function atualizarPlayers() {
    let elementos = [
        { 
            titulo: "play_titulo_1", artista: "play_artista_1", capa: "play_capa_1", 
            album: "play_album_1", ano: "play_ano_1"
        }
    ];

    console.log("Atualizando Player com dados:", dadosMusica);

    elementos.forEach(el => {
        let tituloElem = document.getElementById(el.titulo);
        let artistaElem = document.getElementById(el.artista);
        let capaElem = document.getElementById(el.capa);
        let albumElem = document.getElementById(el.album);
        let anoElem = document.getElementById(el.ano);

        if (tituloElem) tituloElem.innerText = dadosMusica.titulo || "Carregando...";
        if (artistaElem) artistaElem.innerText = dadosMusica.artista || "Carregando...";
        if (capaElem) capaElem.src = dadosMusica.capa || "https://popfi.online/popfi-player/covers/default_cover.webp";
        if (albumElem) albumElem.innerText = dadosMusica.album || "Desconhecido";
        if (anoElem) anoElem.innerText = dadosMusica.ano || "Desconhecido";
    });

    document.dispatchEvent(new CustomEvent("musicaAtualizada", { detail: dadosMusica }));
}

// Função para buscar os dados da música no JSON
function calcularProximaChecagem() {
    fetch("https://popfi.online/popfi-player/json/nowplaying.json")
        .then(response => response.json())
        .then(data => {
            let newSong = data.detalhado;
            let now = Math.floor(Date.now() / 1000); // Convertendo para segundos

            console.log("JSON atualizado:", newSong);

            // Converter a hora de geração para timestamp em segundos
            let [dataPart, horaPart] = newSong.hora_geracao.split(" ");
            let [ano, mes, dia] = dataPart.split("-").map(Number);
            let [hora, minuto, segundo] = horaPart.split(":").map(Number);
            let horaGeracao = Math.floor(new Date(ano, mes - 1, dia, hora, minuto, segundo).getTime() / 1000);

            // Cálculo do tempo restante em segundos
            let tempoDecorrido = horaGeracao - now; // Deve ser um número negativo em segundos
            let tempoRestante = tempoDecorrido + newSong.duracao - 10; // Soma com duração da música adicionei para começar faltando 10 segundos a verficação

            console.log(`Tempo decorrido: ${tempoDecorrido}s`);
            console.log(`Tempo restante: ${tempoRestante}s`);

            if (tempoRestante <= 0) {
                console.log("Música já mudou! Buscando nova música agora...");
                calcularProximaChecagem(); // Busca imediatamente pois a música já acabou
                return;
            }

            if (isFirstUpdate || newSong.titulo !== dadosMusica.titulo) {
                dadosMusica = newSong;
                atualizarPlayers();

                nextCheckTime = now + tempoRestante;
                flagEnviado = false;
                isFirstUpdate = false;

                console.log("Nova música detectada:", newSong.titulo);
            } else {
                console.log("Música ainda tocando.");
            }
        })
        .catch(error => {
            console.log('Erro ao buscar os dados:', error);
        });
}

// Função para verificar se a música está quase terminando ou se precisa atualizar
function verificarNovaMusica() {
    let now = Math.floor(Date.now() / 1000); // Convertendo para segundos
    let tempoRestante = nextCheckTime - now;

    if (!flagEnviado && tempoRestante <= 10 && tempoRestante > 0) {
        fetch("https://popfi.online/popfi-player/json/nowplaying.json")
            .then(response => response.json())
            .then(data => {
                let newSong = data.detalhado;
                if (newSong.titulo !== dadosMusica.titulo) {
                    console.log("Música mudando nos últimos 10 segundos, disparando evento!");
                    document.dispatchEvent(new Event("musicaQuaseTerminando"));
                    flagEnviado = true;
                }
            })
            .catch(error => console.log("Erro ao verificar mudança nos últimos segundos:", error));
    }
    
    if (now >= nextCheckTime) {
        console.log("Tempo esgotado, buscando nova música...");
        calcularProximaChecagem();
    }
}

// Inicia a primeira checagem e configura o intervalo de verificação
calcularProximaChecagem();
setInterval(verificarNovaMusica, 5 * 1000); // Verifica a cada 5 segundos
