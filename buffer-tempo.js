// Variáveis globais para controle
let dadosMusica = {};
let nextCheckTime = 0;
let playerIniciado = false; // Flag para saber se o player já começou
let player = document.getElementById("audioPlayer"); // ID do player de áudio

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
    if (!playerIniciado) {
        console.log("Player pausado. Aguardando play para buscar dados.");
        return;
    }

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

            // Cálculo do tempo restante
            let tempoDecorrido = horaGeracao - now;
            let tempoRestante = tempoDecorrido + newSong.duracao - 10;

            console.log(`Tempo restante: ${tempoRestante}s`);

            if (tempoRestante <= 0) {
                console.log("Música já mudou! Buscando nova música agora...");
                calcularProximaChecagem();
                return;
            }

            if (newSong.titulo !== dadosMusica.titulo) {
                dadosMusica = newSong;
                atualizarPlayers();
                nextCheckTime = now + tempoRestante;

                console.log("Nova música detectada:", newSong.titulo);
            } else {
                console.log("Música ainda tocando.");
            }
        })
        .catch(error => {
            console.log('Erro ao buscar os dados:', error);
        });
}

// Listener para iniciar a verificação apenas quando o usuário der play
player.addEventListener("play", function () {
    if (!playerIniciado) {
        console.log("Player iniciado, começando a buscar dados.");
        playerIniciado = true;
        calcularProximaChecagem(); // Agora pode iniciar a contagem normalmente
        setInterval(calcularProximaChecagem, 5 * 1000); // Faz a checagem a cada 5s
    }
});

// Listener para pausar a atualização se o usuário pausar a música
player.addEventListener("pause", function () {
    console.log("Player pausado. Parando atualização.");
    playerIniciado = false;
});
