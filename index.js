//declaração das constantes =operador getmetodoqueprocuraid

const btnPedra = document.getElementById("btnPedra");
const btnPapel = document.getElementById("btnPapel");
const btnTesoura = document.getElementById("btnTesoura");
const resultado = document.getElementById("resultado");

//constantes da realidade virtual e interação com os objetos
const objPedra = document.getElementById("objPedra");
const objPapel = document.getElementById("objPapel");
const objTesoura = document.getElementById("objTesoura");
const btnNovamente = document.getElementById("btnNovamente");

//constantes para a scena
const painelVR = document.getElementById("painelVR");
const cenaVR = document.getElementById("cenaVR");
const grupoObjetos = document.getElementById("grupoObjetos");
const giroAutomatico = document.getElementById("giroAutomatico");

//identificar btns no nav console
console.log(btnPedra);
console.log(btnPapel);
console.log(btnTesoura);
console.log(btnNovamente);

//identificar objetos
console.log(objPedra);
console.log(objPapel);
console.log(objTesoura);

//identificar funcs e execucao
console.log(sortearJogada());

//teste rapido:
console.log(compararJogadas("Pedra", "Tesoura"));
console.log(compararJogadas("Pedra", "Papel"));
console.log(compararJogadas("Pedra", "Pedra"));

// func caso escolher pedra
btnPedra.addEventListener("click", function () {
    jogar("Pedra");
});

// func caso escolher papel
btnPapel.addEventListener("click", function () {
    jogar("Papel");
});

// func caso escolher tesoura
btnTesoura.addEventListener("click", function () {
    jogar("Tesoura");
});


//sorteio da jogada maquina
function sortearJogada() {
    const opcoes = ["Pedra", "Papel", "Tesoura"]; //array 3indice
    const indice = Math.floor(Math.random() * opcoes.length);
    //math random pra gerar número aleatorio maior q 0 menor q 1
    //flor para arredondar p baixo o n° * por 3
    
    return opcoes[indice];
    //func retornando
}

//determinando vencedor fucs
function compararJogadas(jogador, maquina) {
    //se for o msm, empata
    if (jogador === maquina) {
        return "empate";
    }

    //se na regra do jogo, jogador sair vencedor
    if (
        (jogador === "Pedra" && maquina === "Tesoura") ||
        (jogador === "Papel" && maquina === "Pedra") ||
        (jogador === "Tesoura" && maquina === "Papel")
    ) {
        //retorna jogador
        return "jogador";
    }

    //se nao, retorna maquina
    return "maquina";
}


function jogar(jogador) {
    const maquina = sortearJogada();                              //usa func sortear jogada pra saber a jogada da maquina
    const vencedor = compararJogadas(jogador, maquina);           //usa func comparar jogadas para saber vecendor

    resultado.textContent = "Jogador: " + jogador +
        " | Máquina: " + maquina +
        " | Resultado: " + vencedor;                        //saida pra quem ganhou

        //se o vencedor for o jogador, exibe o objeto jogador
    if (vencedor === "jogador") { 
        exibirObjeto(jogador);
        //se o vencedor for a maquina, exibe o objeto maquina
    } else if (vencedor === "maquina") {
        exibirObjeto(maquina);
        //se for empate nao mostra nenhum objeto
    } else {
        exibirObjeto(null);
    }
}

//entrada da realidade virtual e interação com os objetos
//func para exibir objetos
function exibirObjeto(jogada) {
    //quando é executado um objeto que bate com a declaração, os outros não apareceram
    objPedra.setAttribute("visible", jogada === "Pedra"); //utiliza constante ja declarada, aplicando atributo de visualização com o obejto informado
    objPapel.setAttribute("visible", jogada === "Papel"); 
    objTesoura.setAttribute("visible", jogada === "Tesoura");

    painelVR.hidden = jogada === null;

    //nas jogadas irá apresentar os objetos 
    if (jogada !== null) {
        cenaVR.resize();
    }

    console.log("Objeto recebido:", jogada);
}

//btn pra jogar novamente
btnNovamente.addEventListener("click", function () {
    exibirObjeto(null);
    resultado.textContent = "Aguardando sua jogada...";   //saida após o click
});

//giro 360
let arrastando = false; //bloqueia o arrastar para ficar fixo no objeto
let ultimoX = 0;
let ultimoY = 0;

cenaVR.addEventListener("pointerdown", function (evento) { //adiciona evento func
    //para saber quando o usuário ta girando a scena
    //se girar  permite mover
    if (evento.target !== cenaVR.canvas || 
        evento.button !== 0 ||
        !evento.isPrimary ||
        pincaAtiva) {
        return;
    }

    arrastando = true;

    giroAutomatico.emit("pausarGiro"); // config que se caso o usr interagir para o giro automatico

    ultimoX = evento.clientX;
    ultimoY = evento.clientY;

    cenaVR.setPointerCapture(evento.pointerId);
});

//identifica o deslocamento do mouse click ou dedo 
cenaVR.addEventListener("pointermove", function (evento) { //cria evento de func pra isso
    if (!arrastando || !evento.isPrimary || pincaAtiva) {
        return;
    }


    const rotacao = grupoObjetos.getAttribute("rotation");

    grupoObjetos.setAttribute("rotation", { //atributo da sensibilidade da rotacao nos eixos
        x: rotacao.x + (evento.clientY - ultimoY) * 0.5,
        y: rotacao.y + (evento.clientX - ultimoX) * 0.5,
        z: rotacao.z
    });

    ultimoX = evento.clientX;
    ultimoY = evento.clientY;
});

cenaVR.addEventListener("lostpointercapture", function () { // func para identificar Identifica quando termina a captura do ponteiro.
    arrastando = false;

    if(!pincaAtiva) {
    giroAutomatico.emit("retomarGiro"); //retoma o giro depois que o usr para de interagir
    }
});

//começo da func para conseguir zoom mobile e desktop

let zoom = 1; //variavel zomm 100% tmh original

function aplicarZoom(valor) {  //nova func para aplicar o zomm
    zoom = Math.max(0.6, Math.min (1.5, valor)); //config ajustada usando o maximo do zoom em 0.6 e o min em 1.5 
    //sai de 100% para 160% 

    grupoObjetos.setAttribute("scale", { //chama func de objeto e aplica escala nos eixos x,y,z
        x: zoom,
        y: zoom,
        z: zoom
    });
}

// zoom para desktop

cenaVR.addEventListener("wheel", function (evento) {      //adiciona mais um evento wheel para reconhecer rolagem do mouse, ou gesto de zoom
    //se o evento for a cenavr, aplica o zoom caso tenha interação
    if (evento.target !== cenaVR.canvas) {
        return;
    }

    //impede q o scrool dentro da area movimenta a pag
    evento.preventDefault(); 

    //utilizando Math.sign com delta para aplicar densidade do scrool interacao
    aplicarZoom(zoom - Math.sign(evento.deltaY) * 0.08);

}, { passive: false}); //permite usar preventdefault

// zoom no celular 

let distanciaAnterior = 0; //variavel para indicar o começo da distancia 
let pincaAtiva = false;  //variavel para indicar se o movimento ta sendo feito no celular 

//criacao da func para distanciar os dedos, aumentando zoom 
function distanciaDedos(dedos){
    return Math.hypot(                            //hypot dentro do math para ter a chamada do movimento dos dedos  
        dedos[1].clientX - dedos[0].clientX,      // espaço de aumento de zoom
        dedos[1].clientY - dedos[0].clientY
    );
}

cenaVR.addEventListener("touchstart", function (evento){ //criacao de evento do touch para o inicio da interação
    if (evento.touches.length === 2){    //utilizando touchlenght para indicar dois simultaneos
        pincaAtiva = true;
        arrastando = false;

        distanciaAnterior = distanciaDedos(evento.touches); //criação da variavel de distancia anterior para conversar com a distancia dedos
        giroAutomatico.emit("pausarGiro");  //chamada da função do giro utilizando emit pra pausar
    }

});

cenaVR.addEventListener("touchmove", function (evento){  //continuação do evento, esse criado para a movimentação e zoom
    if (!pincaAtiva || evento.touches.length !== 2){ // se a pinca func escolhida para simular zoom estivar ativa, vai realizar a movimentação
        return;
    }

    const distanciaAtual = distanciaDedos(evento.touches);
    const diferenca = distanciaAtual - distanciaAnterior; // constante para que a diferença converse com a distancia atual

    aplicarZoom(zoom + diferenca * 0.005);  // aplicação do zoom com diferença 

    distanciaAnterior = distanciaAtual;
});

function finalizarPinca(evento){                        //func para finalizar a interação por celular 
    if(pincaAtiva && evento.touches.length === 0){         //se nao houver toques
        pincaAtiva = false;                                 // desativa a func
        distanciaAnterior = 0;                              // e volta a posição anterior retomando o giro
        giroAutomatico.emit("retomarGiro")
    }
}

cenaVR.addEventListener("touchend", finalizarPinca);    //evento que chama a função para encerrar 
cenaVR.addEventListener("touchcancel", finalizarPinca);  


