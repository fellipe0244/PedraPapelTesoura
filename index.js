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
    if (evento.target !== cenaVR.canvas || evento.button !== 0) {
        return;
    }

    arrastando = true;
    ultimoX = evento.clientX;
    ultimoY = evento.clientY;

    cenaVR.setPointerCapture(evento.pointerId);
});

//identifica o deslocamento do mouse click ou dedo 
cenaVR.addEventListener("pointermove", function (evento) { //cria evento de func pra isso
    if (!arrastando || !evento.isPrimary) {
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
    
});
