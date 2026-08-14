// ===============================
// MusicMash
// Algoritmo de comparación A/B + Elo
// Basado en CourseMash
// ===============================

// ===============================
// 1. Géneros musicales
// ===============================

const musicas = [
  "Pop",
  "Rock",
  "Reggaetón",
  "Salsa",
  "Jazz",
  "Hip-Hop",
  "Electrónica",
  "Música Clásica",
  "Country",
  "Indie"
];

// ===============================
// 2. Tipos de oyente
// ===============================

const segmentos = {

  "J":"Jóvenes",

  "A":"Adultos",

  "E":"Para entrenar",

  "R":"Para relajarse",

  "F":"Amantes de festivales"

};

// ===============================
// 3. Contextos
// ===============================

const contextos = {

 "E":"¿Qué música prefieres para hacer ejercicio?",

 "R":"¿Qué música escucharías para relajarte?",

 "V":"¿Qué música pondrías durante un viaje?",

 "P":"¿Qué música pondrías en una fiesta?"

};

// ===============================
// Configuración Elo
// ===============================

const RATING_INICIAL = 1000;

const K = 32;

// ===============================
// LocalStorage
// ===============================

const STORAGE_KEY = "musicmash_state";

// ===============================

function crearEstado(){

    const buckets={};

    for(const s of Object.keys(segmentos)){

        for(const c of Object.keys(contextos)){

            const key=s+"__"+c;

            buckets[key]={};

            musicas.forEach(m=>{

                buckets[key][m]=RATING_INICIAL;

            });

        }

    }

    return{

        buckets,

        votes:[]

    };

}

// ===============================

function cargarEstado(){

    const raw=localStorage.getItem(STORAGE_KEY);

    if(!raw){

        return crearEstado();

    }

    return JSON.parse(raw);

}

let state=cargarEstado();

function guardarEstado(){

    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));

}

// ===============================
// Elo
// ===============================

function expectedScore(ra,rb){

    return 1/(1+Math.pow(10,(rb-ra)/400));

}

function updateElo(bucket,a,b,winner){

    const ra=bucket[a];

    const rb=bucket[b];

    const ea=expectedScore(ra,rb);

    const eb=expectedScore(rb,ra);

    const sa=(winner==="A")?1:0;

    const sb=(winner==="B")?1:0;

    bucket[a]=ra+K*(sa-ea);

    bucket[b]=rb+K*(sb-eb);

}

// ===============================

function randomPair(){

    let a=musicas[Math.floor(Math.random()*musicas.length)];

    let b=a;

    while(a===b){

        b=musicas[Math.floor(Math.random()*musicas.length)];

    }

    return[a,b];

}

// ===============================

function bucketKey(s,c){

    return s+"__"+c;

}

// ===============================

function top10(bucket){

    return Object.entries(bucket)

    .sort((a,b)=>b[1]-a[1])

    .slice(0,10);

}

// ===============================
// Elementos HTML
// ===============================

const segmentSelect=document.getElementById("segmentSelect");

const contextSelect=document.getElementById("contextSelect");

const labelA=document.getElementById("labelA");

const labelB=document.getElementById("labelB");

const question=document.getElementById("question");

const topBox=document.getElementById("topBox");

let actualA;

let actualB;

// ===============================

function llenarSelect(select,obj){

    select.innerHTML="";

    for(const k in obj){

        let op=document.createElement("option");

        op.value=k;

        op.textContent=obj[k];

        select.appendChild(op);

    }

}

llenarSelect(segmentSelect,segmentos);

llenarSelect(contextSelect,contextos);

// ===============================

function nuevoDuelo(){

    [actualA,actualB]=randomPair();

    labelA.textContent=actualA;

    labelB.textContent=actualB;

    question.textContent=contextos[contextSelect.value];

}

// ===============================

function mostrarRanking(){

    const bucket=state.buckets[
        bucketKey(
            segmentSelect.value,
            contextSelect.value
        )
    ];

    const lista=top10(bucket);

    topBox.innerHTML="";

    lista.forEach((m,i)=>{

        topBox.innerHTML+=`

        <div class="toprow">

            <span>${i+1}. ${m[0]}</span>

            <strong>${m[1].toFixed(1)}</strong>

        </div>

        `;

    });

}

// ===============================

function votar(ganador){

    const key=bucketKey(

        segmentSelect.value,

        contextSelect.value

    );

    const bucket=state.buckets[key];

    updateElo(

        bucket,

        actualA,

        actualB,

        ganador

    );

    state.votes.push({

        fecha:new Date().toLocaleString(),

        segmento:segmentos[segmentSelect.value],

        contexto:contextos[contextSelect.value],

        A:actualA,

        B:actualB,

        ganador:ganador==="A"?actualA:actualB

    });

    guardarEstado();

    mostrarRanking();

    nuevoDuelo();

}

// ===============================

document.getElementById("btnA").onclick=()=>votar("A");

document.getElementById("btnB").onclick=()=>votar("B");

document.getElementById("btnNewPair").onclick=()=>nuevoDuelo();

document.getElementById("btnShowTop").onclick=()=>mostrarRanking();

// ===============================

document.getElementById("btnReset").onclick=()=>{

    if(confirm("¿Desea borrar todo el ranking?")){

        state=crearEstado();

        guardarEstado();

        mostrarRanking();

        nuevoDuelo();

    }

};

// ===============================

document.getElementById("btnExport").onclick=()=>{

    if(state.votes.length===0){

        alert("No hay votos.");

        return;

    }

    const encabezados=Object.keys(state.votes[0]);

    const filas=[encabezados.join(",")];

    state.votes.forEach(v=>{

        filas.push(encabezados.map(c=>`"${v[c]}"`).join(","));

    });

    const blob=new Blob(

        [filas.join("\n")],

        {type:"text/csv"}

    );

    const enlace=document.createElement("a");

    enlace.href=URL.createObjectURL(blob);

    enlace.download="MusicMash_Votos.csv";

    enlace.click();

};

// ===============================

segmentSelect.onchange=mostrarRanking;

contextSelect.onchange=()=>{

    mostrarRanking();

    question.textContent=contextos[contextSelect.value];

};

// ===============================

nuevoDuelo();

mostrarRanking();
