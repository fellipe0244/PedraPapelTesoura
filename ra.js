// mapeamento das constantes iniciais da RA
const btnCamera = document.getElementById("btnCamera");
const btnDesligarCamera = document.getElementById("btnDesligarCamera");
const camera = document.getElementById("camera");
const btnIniciarJogada = document.getElementById("btnIniciarJogada");
const contagem = document.getElementById("contagem");
const seletorCamera = document.getElementById("seletorCamera");

//constante dos gestos a serem identificados
const gestos = {
    Closed_Fist: "Pedra",
    Open_Palm: "Papel",
    Victory: "Tesoura"
};

//variavel da camera em tempo real - transmissao da camera eqt ativa
let streamCamera = null;
//reconhedor pipe
let reconhecedor = null;

//func para identificar as cameras

async function listarCameras() { 
    
    const dispositivos = await navigator.mediaDevices.enumerateDevices(); //constante para identificar e listar os dispositivos

    seletorCamera.innerHTML = "";   //cria elemento html pelo js

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
    const idCamera = seletorCamera.value;
    desligarCamera();
    await iniciarCamera(idCamera);
}

//func real de ativacao da camera
async function iniciarCamera(idCamera = null) {

    btnCamera.disabled = true;
    seletorCamera.disabled = true;
    
    try{  // o inicio da funcao chamando as constantes mapeadas 

        streamCamera = await navigator.mediaDevices.getUserMedia({
            video: idCamera == null                                           //somente video possui acesso
            ? true
            : {deviceId: {exact: idCamera }},

            audio: false
        });

        camera.srcObject = streamCamera;
        camera.hidden = false;
        btnCamera.hidden = true;           //btn camera habilitado
        btnDesligarCamera.hidden = false;        //so depois da camera ligar que esse aparece 
        btnIniciarJogada.hidden = false;

        const track = streamCamera.getVideoTracks()[0];

        const configuracao = track.getSettings();

        if(configuracao.facingMode === "environment"){
            camera.style.transform = "none";
        }else {
            camera.style.transform = "scaleX(-1)";

        }

        await listarCameras();
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
    if (streamCamera === null){                     //retorna se caso a camera tiver ligada
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
}

//mapeamento e evento dos btns
btnCamera.addEventListener("click", function(){
    iniciarCamera();
});

//evento para selecionar camera

seletorCamera.addEventListener("change", trocarCamera);

btnDesligarCamera.addEventListener("click", desligarCamera);


//funcao da contagem regressiva, necessaria para a demora minima do carregamento e reconhecimento pipline e toda a logica do codigo
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
            delegate: "CPU"            //endereço de IA treinada
        }, 

        runningMode: "VIDEO",                       //modo do reconhecimento com 1 gesto/ 1 mao
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

    const leitura = reconhecedor.recognizeForVideo(       // aqui chama a leitura do reconhecedor por video
        camera,
        performance.now()
    );

    console.log(leitura);

        if (leitura.gestures.length === 0 ||         //para interpretacao no console 
        leitura.gestures[0].length === 0) {
        console.log("Nenhum gesto identificado.");
        return;
    }

    const gesto = leitura.gestures[0][0].categoryName;      
    const confianca = leitura.gestures[0][0].score;

    console.log("Gesto:", gesto);
    console.log("Confiança:", confianca); 

    // validador do gesto identificado

    const jogada = gestos[gesto];  //constante para juntar a jogada com o gesto identificado

    if (jogada === undefined || confianca < 0.55){
        contagem.textContent = "Gesto invalido, inicie novamente e tente outro"; // saida caso a confiança fique em um nivel baixo de reconhecimento
        return;
    }

    contagem.textContent = "Jogada Identificada: " + jogada;

    console.log("Jogada:", jogada);

}