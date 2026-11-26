// mapeamento das constantes iniciais da RA
const btnCamera = document.getElementById("btnCamera");
const btnDesligarCamera = document.getElementById("btnDesligarCamera");
const camera = document.getElementById("camera");
const btnIniciarJogada = document.getElementById("btnIniciarJogada");
const contagem = document.getElementById("contagem");
const seletorCamera = document.getElementById("seletorCamera");

//constantes para o canvasra
const canvasRA = document.getElementById("canvasRA");
const contextoRA = canvasRA.getContext("2d");  //interface q traz os metodos do desenho


//constante dos gestos a serem identificados
const gestos = {
    Closed_Fist: "Pedra",
    Open_Palm: "Papel",
    Victory: "Tesoura"
};

//mapeamento das constantes dos dedos a serem reconhecidos pelo landmarks 
//como começa c 0, nao tem o 21 
const conexoesMao = [
    [0, 1], [1, 2], [2, 3], [3, 4],     //polegar
    [0, 5], [5, 6], [6, 7], [7, 8],     //indicador
    [5, 9], [9, 10], [10, 11], [11, 12],   //meio
    [9, 13], [13, 14], [14, 15], [15, 16],  //anelar
    [13, 17], [17, 18], [18, 19], [19, 20], //mindinho
    [0, 17]
];

//variavel da camera em tempo real - transmissao da camera eqt ativa
let streamCamera = null;
//reconhedor pipe
let reconhecedor = null;

//variaveis  de quado e leitura
let quadroRA = null;                                        //armazena o identificador do proxximo processamento agendado
let ultimaLeitura = null;                                   //criada para guardar o ultimo reconhecimento realizado
let ultimoTempoVideo = -1;                                  //evita processar repetidamente a mesma imagem do video

//func para identificar as cameras

async function listarCameras() { 
    
    const dispositivos = await navigator.mediaDevices.enumerateDevices(); //constante para identificar e listar os dispositivos

    seletorCamera.innerHTML = "";   //cria elemento html pelo js e limpa as opções existentes

    let numero = 1;

    dispositivos.forEach(function (dispositivo){       //começo da func que procura os dispositivos de video

        if (dispositivo.kind === "videoinput"){ //informa o tipo de dispositivo

            const opcao = document.createElement("option");

            opcao.value = dispositivo.deviceId;            
            opcao.textContent = dispositivo.label || "Câmera " + numero; //nome do dispositivo

            seletorCamera.appendChild(opcao);      //ap insere criado elemento dentro de outro  

            numero++;
        }
    });

    const track = streamCamera.getVideoTracks()[0];

    seletorCamera.value = track.getSettings().deviceId; //consulta as configurações efetivas da captura
    seletorCamera.hidden = false;
}

//func para trocar de cameras
async function trocarCamera() {
    const idCamera = seletorCamera.value;           //armazena id da camera selecionada 
    desligarCamera();                                    //aplica a funcao para desligar a camera que estava online 
    await iniciarCamera(idCamera);                     // e apos desligar a que estava online, inicia a escolhida 
}

//func real de ativacao da camera
async function iniciarCamera(idCamera = null) {

    btnCamera.disabled = true;
    seletorCamera.disabled = true;
    
    try{  // tenta executar um blc de cod que pode dar erros 

        streamCamera = await navigator.mediaDevices.getUserMedia({
            video: idCamera == null                                           //somente video possui acesso
            ? true
            : {deviceId: {exact: idCamera }},

            audio: false
        });

        camera.srcObject = streamCamera;
        camera.hidden = false;
        btnCamera.hidden = true;           //oculta o btn de camera 
        btnDesligarCamera.hidden = false;        //so depois da camera ligar que esse aparece 
        btnIniciarJogada.hidden = false;

        const track = streamCamera.getVideoTracks()[0];

        const configuracao = track.getSettings();

        if(configuracao.facingMode === "environment"){        //se a configuracao estiver no mode face 
            camera.style.transform = "none";                //determinara o espelhamento
        }else {
            camera.style.transform = "scaleX(-1)";

        } //aqui determina o espelhamento da camera

        canvasRA.style.transform = camera.style.transform;

        await listarCameras();

        quadroRA = requestAnimationFrame(rastrearMao); //aplica animacao apos rastrear mao 
    }
    catch (erro){                         //catch para caso ocorra algum erro ter retorno e nao parecer travado
        console.log(erro);
        desligarCamera();
        alert("Não foi possivel iniciar a câmera.");
    } finally {
        btnCamera.disabled = false;
        seletorCamera.disabled = false;
    }
    
}

function desligarCamera(){                  //func para desligar a camera 
    if (streamCamera === null){                     //encerra a func se nao houver transmissao rolando
        return;
    }

    streamCamera.getTracks().forEach(function (track){                  //aplica o stop para parar o processo utilizando a variavel streamcamera criada
        track.stop();
    });

    streamCamera = null;
    camera.srcObject = null;


    seletorCamera.hidden = true;
    camera.hidden = true;                  //camera ligada
    btnCamera.hidden = false;                   //btn destivado
    btnDesligarCamera.hidden = true;            //btn para desligar ativado

    btnIniciarJogada.hidden = true;
    contagem.textContent = "";

    //caso o user desligue a camera, ou ocorra algum problema na contagem
    clearInterval(intervalo);
    intervalo = null;
    btnIniciarJogada.disabled = false;

    cancelAnimationFrame(quadroRA); //cancela animação ao desligar camera antes de limpar os desenhos 

    quadroRA = null;
    ultimaLeitura = null;
    ultimoTempoVideo = -1;

    contextoRA.clearRect(
    0, 0, canvasRA.width, canvasRA.height     // utiliza a constante que traz os desenhos e apaga o que estava desenhado antes 
    );
}

//mapeamento e evento dos btns
btnCamera.addEventListener("click", function(){
    iniciarCamera();
});

//evento para selecionar camera

seletorCamera.addEventListener("change", trocarCamera);   

btnDesligarCamera.addEventListener("click", desligarCamera); 


//funcao da contagem regressiva, serve para o jogador preparar o gesto
let intervalo = null; // variavel do intervalo criada

function iniciarContagem (){

    if(reconhecedor === null){         //se o reconhecedor nao tiver prontom apresenta essa msg
        contagem.textContent = "Reconhecedor ainda nao pronto."
        return;
    }
    let segundos = 3;

    btnIniciarJogada.disabled = true;

    contagem.textContent = "Prepare seu gesto/jogada: " + segundos;
    
    intervalo = setInterval(function (){           // vai smp executar uma func no intervalo 1000, 1seg

        segundos--; //diminui a unidade da variavel quando a func vai ser executada

        if (segundos > 0){
            contagem.textContent = "Prepare seu gesto/jogada: " + segundos;
        } else {
            clearInterval(intervalo);                     // encerra a execucao repetitiva

            intervalo = null;

            contagem.textContent = "Identificando gesto...";            //saida
            identificarGesto(); //chama func criada

            btnIniciarJogada.disabled = false;
        }
    },  1000);
}

btnIniciarJogada.addEventListener("click", iniciarContagem);  //mapeamento do btn evento para contagem


//func do mediapipe
async function carregarMediaPipe() {
    const {GestureRecognizer, FilesetResolver } = await import(                                 //realiza a importacao oficial
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs"              //gesture reconhece os gestos
    );

    const vision = await FilesetResolver.forVisionTasks(                           //continuacao da importacao
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm"           //file resolver prepara os recursos da biblio
    );

    reconhecedor = await GestureRecognizer.createFromOptions(vision, {            //atributo para reconhecer e juntar os modulos
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "CPU"            //endereço de IA treinada e determina que o modelo vai ser processado na cpu do dispositivo
        }, 

        runningMode: "VIDEO",                       //modo do reconhecimento de video com / 1 mao
        numHands: 1
    });

    console.log("MediaPipe Carregado")   //visualização no devtools pra saber se carregou caso passe do processo 
}

carregarMediaPipe().catch(function (erro) {               //carregamento da func
    console.error("Erro ao carregar MediaPipe:", erro);         //nao carregando apresenta erro no console
});

//func para identificar os gestos
function identificarGesto(){        
    if (reconhecedor === null || camera.readyState < 2){               //se o reconhecedor ja declarado encontrar um estado da camera ou menor q 2 
        console.log("Reconhecedor ou câmera ainda nao pronto.")         // acusa que a camera e o reconhecedor nao estao prontos
        return;
    }

    const leitura = ultimaLeitura;

    if (leitura === null){
        contagem.textContent = "Nenhuma leitura disponivel";
        return;
    }

    console.log(leitura);

        if (leitura.gestures.length === 0 ||         //para interpretacao no console 
        leitura.gestures[0].length === 0) {    
            
        contagem.textContent = "Nenhum gesto identificado, tente novamente.";

        console.log("Nenhum gesto identificado.");
        return;
    }

    const gesto = leitura.gestures[0][0].categoryName;       
    const confianca = leitura.gestures[0][0].score;

    console.log("Gesto:", gesto);
    console.log("Confiança:", confianca); 

    // validador do gesto identificado

    const jogada = gestos[gesto];  //constante para juntar a jogada com o gesto identificado

    if (jogada === undefined || confianca < 0.65){ 
        contagem.textContent = "Gesto invalido, inicie novamente e tente outro"; // saida caso a confiança fique em um nivel baixo de reconhecimento
        return;
    }

    contagem.textContent = "Jogada Identificada: " + jogada;  //usa constante da contagem  para dar saida ao texto 

    console.log("Jogada:", jogada);

    desligarCamera(); //apos identificar, desligamos a camera para iniciar a jogada e sair da RA e ir para RV
    jogar(jogada);

}

//funcao desenho pontos
function desenharPontos(leitura) {   //recebe leitura como paremetro de func

    contextoRA.clearRect(
        0, 0, canvasRA.width, canvasRA.height  //usa a constante que traz os metodos de desenho, utilizando largura e altura nas cordenadas x e y 
    );

    if (leitura.landmarks.length === 0) { // verifica se identificou uma mao
        return;
    }

    const pontos = leitura.landmarks[0]; //declara uma constante que recebe os 21 pontos do landmarks
    desenharConexoes(pontos); //chamamos a func para desenhar as conexoes juntamente com os pontos

    pontos.forEach(function (ponto) { //cria a funcao para calculo e mapeamento dos pontos

        const x = ponto.x * canvasRA.width;
        const y = ponto.y * canvasRA.height;

        contextoRA.beginPath();                         //usa a constante dos metodos de desenho para definir os traços
        contextoRA.arc(x, y, 4, 0, Math.PI * 2);            // add os circulos nas posicoes horizontal e vertical, no raio de 4pixel no angulo radianos inicial 0 com 360° completos no mathpi*2
        contextoRA.fillStyle = "lime";  
        contextoRA.fill();                 //usa a cor add em fillstyle

    });
}

// func de rastreamento de mao

function rastrearMao(){
    if (streamCamera === null){                    // se a camera estiver em transmissao irá prosseguir com o comando
        return;
    }

    if (reconhecedor !== null &&       
        camera.readyState >=2 &&
        camera.currentTime !== ultimoTempoVideo){            // se o reconhecedor estiver rodando, pega o estado real da camera com o tempo diferente do ultimo video

            ultimoTempoVideo = camera.currentTime;                          // logo se o ultimo tempo for o tempo corrido da camera 

            if (canvasRA.width !== camera.videoWidth ||                              // a largura sera diferente de altura e a altura sera diferente de largura no video capturado e acao do canvas
                canvasRA.height !== camera.videoHeight){

                    canvasRA.width = camera.videoWidth;                            // canvas largura sera igual camera largura
                    canvasRA.height = camera.videoHeight;                           //idem 

            }

            ultimaLeitura = reconhecedor.recognizeForVideo(   //a ultima leitura, usa a variavel reconhecedor

                camera,
                performance.now()
            );
            desenharPontos(ultimaLeitura);                //depois chama a func de desenhar pontos em cima da ultima leitura 
        }

        quadroRA = requestAnimationFrame(rastrearMao);                     //aplica no quadro RA a animação de frames utilizando a func rastrear mao
}

function desenharConexoes(pontos){  //func para criar as conexoes juntamente com a funcpontos interligando

    contextoRA.strokeStyle = "lime"; //cor verde igual dos pontos
    contextoRA.lineWidth = 2; //espessura da linha

    conexoesMao.forEach(function (conexao){ //usar o for para realizar as 21 conexoes

        const inicio = pontos[conexao[0]];  // o incio da conexao dos pontos no 0
        const fim = pontos[conexao[1]];     //o fim apos conectar todos os pontos

        contextoRA.beginPath();         //realizar o desenho

        contextoRA.moveTo(             //define o ponto inicial
            inicio.x * canvasRA.width,
            inicio.y * canvasRA.height
        );

        contextoRA.lineTo(                 //define o ponto final da linha 
            fim.x * canvasRA.width,
            fim.y * canvasRA.height
        );

        contextoRA.stroke(); //renderiza o traçado 
        
    });

}