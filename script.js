// =======================================================
// IMPORTACIONES
// =======================================================

import mammoth from "https://esm.sh/mammoth@1.12.1";

import {
    Document,
    Packer,
    Paragraph
} from "https://esm.sh/docx@9.5.1";


// =======================================================
// DATOS
// =======================================================

const bloques = [
    {
        texto: ``
    }
];


// =======================================================
// ELEMENTOS DEL DOM
// =======================================================

// ---------- Editor ----------

const modoEdicion =
    document.getElementById("modoEdicion");

const listaBloques =
    document.getElementById("listaBloques");

const resumenGeneral =
    document.getElementById("resumenGeneral");


// ---------- Documentos ----------

const archivoWord =
    document.getElementById("archivoWord");

const botonVaciarDocumento =
    document.getElementById("vaciarDocumento");

const guardarDocumento =
    document.getElementById("guardarDocumento");


// ---------- Diálogos ----------

const dialogo =
    document.getElementById("dialogo");

const tituloDialogo =
    document.getElementById("tituloDialogo");

const mensajeDialogo =
    document.getElementById("mensajeDialogo");

const cancelarDialogo =
    document.getElementById("cancelarDialogo");

const confirmarDialogo =
    document.getElementById("confirmarDialogo");


// ---------- Deshacer ----------

const avisoDeshacer =
    document.getElementById("avisoDeshacer");


// ---------- Apariencia ----------

const botonesTema =
    document.querySelectorAll(".temaColor");


// ---------- Configuración ----------

const slider =
    document.getElementById("velocidad");

const valorVelocidad =
    document.getElementById("valorVelocidad");

const selectorCuenta =
    document.getElementById("cuentaRegresiva");

const botonPantallaCompleta =
    document.getElementById("fullscreen");


// ---------- Teleprompter ----------

const modoTeleprompter =
    document.getElementById("modoTeleprompter");

const anterior =
    document.getElementById("bloqueAnterior");

const actual =
    document.getElementById("bloqueActual");

const siguiente =
    document.getElementById("bloqueSiguiente");

const estado =
    document.getElementById("estado");

const barraProgreso =
    document.getElementById("barraProgreso");

const tiempoBloque =
    document.getElementById("tiempoBloque");

const botonAnterior =
    document.getElementById("anterior");

const botonSiguiente =
    document.getElementById("siguiente");

const botonPlayPause =
    document.getElementById("playPause");


// =======================================================
// ESTADO DE LA APLICACIÓN
// =======================================================

// ---------- Editor ----------

let divisionActiva = false;
let indiceDivision = null;


// ---------- Deshacer ----------

let bloqueEliminado = null;
let temporizadorDeshacer = null;


// ---------- Documentos ----------

let archivoWordPendiente = null;


// ---------- Teleprompter ----------

let indice = 0;

let temporizador = null;

let palabrasPorSegundo = 2;

let reproduciendo = false;

let inicioBloque = null;

let animacionProgreso = null;

let tiempoTranscurrido = 0;

let enCuentaRegresiva = false;

let temporizadorCuentaRegresiva = null;

let segundosCuentaRegresiva = 0;

let callbackCuentaRegresiva = null;

let cuentaRegresivaPausada = false;

// =======================================================
// PERSISTENCIA DE BLOQUES
// =======================================================

function guardarBloques() {

    localStorage.setItem(
        "teleprompterBloques",
        JSON.stringify(bloques)
    );

}


function cargarBloques() {

    const guardados =
        localStorage.getItem(
            "teleprompterBloques"
        );

    if (guardados) {

        const bloquesGuardados =
            JSON.parse(guardados);

        bloques.length = 0;

        bloques.push(
            ...bloquesGuardados
        );

    }

    garantizarBloque();

}


function garantizarBloque() {

    if (bloques.length === 0) {

        bloques.push({
            texto: ""
        });

    }

}


// =======================================================
// EDITOR DE BLOQUES
// =======================================================

function contarPalabras(texto) {

    return texto
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .length;

}


function claseContadorPalabras(cantidad) {

    if (cantidad === 0) {
        return "palabrasVacio";
    }

    if (cantidad <= 7) {
        return "palabrasRojo";
    }

    if (cantidad <= 14) {
        return "palabrasAmarillo";
    }

    if (cantidad <= 25) {
        return "palabrasVerde";
    }

    if (cantidad <= 32) {
        return "palabrasAmarillo";
    }

    return "palabrasRojo";

}


function mensajeCantidadPalabras(cantidad) {

    if (
        cantidad > 0 &&
        (cantidad < 15 || cantidad > 25)
    ) {

        return "Idealmente, un bloque debe tener entre 15 y 25 palabras.";

    }

    return "";

}


function mostrarEditor() {

    listaBloques.innerHTML = "";

    bloques.forEach(function(bloque, indice) {

        const contenedor =
            document.createElement("div");

        const cantidadPalabras =
            contarPalabras(bloque.texto);

        const clasePalabras =
            claseContadorPalabras(
                cantidadPalabras
            );

        const claseAcciones =
            divisionActiva
                ? "accionesBloque bloqueado"
                : "accionesBloque";

        contenedor.className =
            "bloqueEditor";

        contenedor.innerHTML = `

            <h3>Bloque ${indice + 1}</h3>

            <div class="contenidoBloque">

                <div class="zonaTexto">

                    <textarea
                        class="textoBloque"
                        data-indice="${indice}"
                        placeholder="Escriba su discurso aquí o cargue un documento Word"
                    >${bloque.texto}</textarea>

                    ${divisionActiva && indiceDivision === indice ? `

                        <div class="mensajeDivision">
                            Haz clic donde quieras dividir el bloque
                        </div>

                        <button
                            class="botonCancelarDivision"
                            data-indice="${indice}">
                            ✕ Cancelar división
                        </button>

                    ` : ""}

                    <div
                        class="contadorPalabras ${clasePalabras}"
                        data-indice="${indice}"
                    >
                        ${cantidadPalabras} palabras
                    </div>

                    <div
                        class="mensajePalabras"
                        data-indice="${indice}"
                    >
                        ${mensajeCantidadPalabras(cantidadPalabras)}
                    </div>

                    <div
                        class="duracionBloque"
                        data-indice="${indice}"
                    >
                        Duración:
                        ${(calcularDuracion(indice) / 1000).toFixed(1)}
                        segundos
                    </div>

                </div>

                <div class="${claseAcciones}">

                    <button
                        class="botonEliminar ${bloques.length === 1 ? "bloqueado" : ""}"
                        data-indice="${indice}"
                        title="${bloques.length === 1
                            ? "No se puede eliminar el último bloque"
                            : "Eliminar bloque"}">
                        X
                    </button>

                    <button
                        class="botonDividir"
                        data-indice="${indice}"
                        title="Dividir bloque">
                        ✂
                    </button>

                    ${indice < bloques.length - 1 ? `

                        <button
                            class="botonUnir"
                            data-indice="${indice}"
                            title="Unir con siguiente">
                            🔗
                        </button>

                    ` : ""}

                    <button
                        class="botonAgregar"
                        data-indice="${indice}"
                        title="Agregar bloque debajo">
                        ＋
                    </button>

                </div>

            </div>

        `;

        listaBloques.appendChild(contenedor);

    });

    actualizarResumen();

}


function actualizarDatosBloque(indice) {

    const bloque =
        bloques[indice];

    const contador =
        document.querySelector(
            `.contadorPalabras[data-indice="${indice}"]`
        );

    const duracion =
        document.querySelector(
            `.duracionBloque[data-indice="${indice}"]`
        );

    const mensaje =
        document.querySelector(
            `.mensajePalabras[data-indice="${indice}"]`
        );

    if (contador) {

        const cantidad =
            contarPalabras(bloque.texto);

        contador.innerText =
            `${cantidad} palabras`;

        contador.classList.remove(
            "palabrasRojo",
            "palabrasAmarillo",
            "palabrasVerde",
            "palabrasVacio"
        );

        contador.classList.add(
            claseContadorPalabras(cantidad)
        );

        if (mensaje) {

            mensaje.innerText =
                mensajeCantidadPalabras(cantidad);

        }

    }

    if (duracion) {

        duracion.innerText =
            `Duración: ${
                (calcularDuracion(indice) / 1000).toFixed(1)
            } segundos`;

    }

    actualizarResumen();

}


function dividirBloque(indice, posicion) {

    const texto =
        bloques[indice].texto;

    const parte1 =
        texto.substring(0, posicion).trim();

    const parte2 =
        texto.substring(posicion).trim();

    if (!parte1 || !parte2) {

        const textarea =
            document.querySelector(
                `.textoBloque[data-indice="${indice}"]`
            );

        mostrarDialogo(
            "No se puede dividir el bloque",
            "Debes dejar texto a ambos lados del punto donde quieres dividirlo.",
            "Entendido",
            false,
            null,
            null,
            textarea
        );

        return false;

    }

    bloques.splice(
        indice,
        1,
        {
            texto: parte1
        },
        {
            texto: parte2
        }
    );

    cancelarDivision();

    guardarBloques();
    mostrarEditor();

    return true;

}


function activarDivision(indice) {

    const textarea =
        document.querySelector(
            `.textoBloque[data-indice="${indice}"]`
        );

    if (!textarea) {
        return;
    }

    divisionActiva = true;
    indiceDivision = indice;

    mostrarEditor();

    const nuevoTextarea =
        document.querySelector(
            `.textoBloque[data-indice="${indice}"]`
        );

    nuevoTextarea.classList.add(
        "modoDivision"
    );

    nuevoTextarea.focus();

    nuevoTextarea.addEventListener(
        "click",
        function dividirAlHacerClick(event) {

            if (!divisionActiva) {
                return;
            }

            const posicion =
                event.target.selectionStart;

            dividirBloque(
                indice,
                posicion
            );

        }
    );

}

function cancelarDivision() {

    divisionActiva = false;
    indiceDivision = null;

}


function unirBloques(indice) {

    const texto1 =
        bloques[indice].texto.trim();

    const texto2 =
        bloques[indice + 1].texto.trim();

    bloques[indice].texto =
        texto1 + "\n\n" + texto2;

    bloques.splice(
        indice + 1,
        1
    );

    garantizarBloque();

    guardarBloques();
    mostrarEditor();

}


// ---------- Eventos del editor ----------

listaBloques.addEventListener(
    "input",
    function(event) {

        if (
            !event.target.classList.contains(
                "textoBloque"
            )
        ) {
            return;
        }

        const indice =
            Number(event.target.dataset.indice);

        bloques[indice].texto =
            event.target.value;

        guardarBloques();

        actualizarDatosBloque(indice);

    }
);


listaBloques.addEventListener(
    "click",
    function(event) {

        // ---------- Cancelar división ----------

        if (
            event.target.classList.contains(
                "botonCancelarDivision"
            )
        ) {

            cancelarDivision();

            mostrarEditor();

            return;

        }


        // ---------- Bloquear acciones durante división ----------

        if (divisionActiva) {
            return;
        }


        // ---------- Dividir ----------

        if (
            event.target.classList.contains(
                "botonDividir"
            )
        ) {

            const indice =
                Number(event.target.dataset.indice);

            activarDivision(indice);

            return;

        }


        // ---------- Unir ----------

        if (
            event.target.classList.contains(
                "botonUnir"
            )
        ) {

            const indice =
                Number(event.target.dataset.indice);

            unirBloques(indice);

            return;

        }


        // ---------- Eliminar ----------

        if (
                event.target.classList.contains(
                    "botonEliminar"
                )
            ) {
            
                if (bloques.length === 1) {
                    return;
                }
            
                const indice =
                    Number(event.target.dataset.indice);

            bloqueEliminado = {

                tipo: "eliminar",

                indice: indice,

                bloque: bloques[indice]

            };

            bloques.splice(
                indice,
                1
            );

            garantizarBloque();

            guardarBloques();

            mostrarEditor();
            mostrarBloque();

            mostrarDeshacer();

            return;

        }


        // ---------- Agregar ----------

        if (
            event.target.classList.contains(
                "botonAgregar"
            )
        ) {

            const indice =
                Number(event.target.dataset.indice);

            bloques.splice(
                indice + 1,
                0,
                {
                    texto: ""
                }
            );

            guardarBloques();
            mostrarEditor();

        }

    }
);


document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape" &&
            divisionActiva
        ) {

            cancelarDivision();

            mostrarEditor();

        }

    }
);


// =======================================================
// VELOCIDAD Y DURACIÓN
// =======================================================

function calcularDuracion(indice) {

    const cantidadPalabras =
        contarPalabras(
            bloques[indice].texto
        );

    if (cantidadPalabras === 0) {
        return 1000;
    }

    const segundos =
        cantidadPalabras / palabrasPorSegundo;

    return segundos * 1000;

}


function actualizarResumen() {

    let totalPalabras = 0;
    let totalMilisegundos = 0;

    bloques.forEach(function(bloque, indice) {

        totalPalabras +=
            contarPalabras(bloque.texto);

        totalMilisegundos +=
            calcularDuracion(indice);

    });

    const totalSegundos =
        Math.round(
            totalMilisegundos / 1000
        );

    const minutos =
        Math.floor(
            totalSegundos / 60
        );

    const segundos =
        totalSegundos % 60;

    const tiempoFormateado =
        `${minutos}:${segundos
            .toString()
            .padStart(2, "0")}`;

    resumenGeneral.innerText =
        `${bloques.length} bloques · ` +
        `${totalPalabras} palabras · ` +
        `Duración estimada: ${tiempoFormateado}`;

}


function actualizarVelocidad() {

    palabrasPorSegundo =
        Number(slider.value);

    valorVelocidad.innerText =
        palabrasPorSegundo.toFixed(1);

}


// ---------- Persistencia de configuración ----------

function cargarConfiguracion() {

    const velocidadGuardada =
        localStorage.getItem(
            "teleprompterVelocidad"
        );

    if (velocidadGuardada !== null) {

        slider.value =
            velocidadGuardada;

    }

    const cuentaGuardada =
        localStorage.getItem(
            "teleprompterCuentaRegresiva"
        );

    if (cuentaGuardada !== null) {

        selectorCuenta.value =
            cuentaGuardada;

    }

    actualizarVelocidad();

}


// ---------- Eventos de configuración ----------

slider.addEventListener(
    "input",
    function() {

        actualizarVelocidad();

        localStorage.setItem(
            "teleprompterVelocidad",
            slider.value
        );

        mostrarEditor();

        if (reproduciendo) {

            clearTimeout(temporizador);

            temporizador = null;

            iniciar();

        }

    }
);


selectorCuenta.addEventListener(
    "change",
    function() {

        localStorage.setItem(
            "teleprompterCuentaRegresiva",
            selectorCuenta.value
        );

    }
);


// =======================================================
// CARGA Y GUARDADO DE DOCUMENTOS WORD
// =======================================================

botonVaciarDocumento.addEventListener(
    "click",
    function() {

        mostrarDialogo(
            "Eliminr todos los bloques",
            "Se eliminarán todos los bloques y su contenido. Podrás deshacer esta acción durante unos segundos.",
            "Eliminar todo",
            true,
            vaciarDocumento
        );

    }
);


function vaciarDocumento() {

    cancelarDivision();

    bloqueEliminado = {

        tipo: "vaciar",

        bloques:
            JSON.parse(
                JSON.stringify(bloques)
            )

    };

    bloques.length = 0;

    garantizarBloque();

    indice = 0;

    guardarBloques();

    mostrarEditor();
    mostrarBloque();

    mostrarDeshacer(
        "Bloques eliminados."
    );

}


archivoWord.addEventListener(
    "change",
    function(event) {

        const archivo =
            event.target.files[0];

        if (!archivo) {
            return;
        }

        archivoWordPendiente =
            archivo;

        mostrarDialogo(
            "¿Reemplazar los bloques actuales?",
            "El documento Word reemplazará el discurso que estás editando actualmente.",
            "Reemplazar",
            true,
            function() {
                cargarDocumentoWord();
            },
            function() {
                archivoWordPendiente = null;
                archivoWord.value = "";
            }
        );

    }
);


async function cargarDocumentoWord() {

    if (!archivoWordPendiente) {
        return;
    }

    cancelarDivision();

    const archivo =
        archivoWordPendiente;

    try {

        const resultado =
            await mammoth.extractRawText({
                arrayBuffer:
                    await archivo.arrayBuffer()
            });

        const texto =
            resultado.value;

        const parrafos =
            texto
                .split(/\n\s*\n/)
                .map(
                    parrafo =>
                        parrafo.trim()
                )
                .filter(
                    parrafo =>
                        parrafo.length > 0
                );

        bloques.length = 0;

        parrafos.forEach(
            function(parrafo) {

                bloques.push({
                    texto: parrafo
                });

            }
        );

        garantizarBloque();

        guardarBloques();

        indice = 0;

        mostrarEditor();
        mostrarBloque();

    }

    catch (error) {

        console.error(
            "Error al cargar el documento:",
            error
        );

        mostrarDialogo(
            "Error",
            "No fue posible cargar el documento Word."
        );

    }

    archivoWordPendiente = null;
    archivoWord.value = "";

}


async function guardarComoWord() {

    const parrafos =
        bloques.map(
            function(bloque) {

                return new Paragraph({
                    text: bloque.texto
                });

            }
        );

    const documento =
        new Document({
            sections: [
                {
                    children: parrafos
                }
            ]
        });

    const blob =
        await Packer.toBlob(
            documento
        );

    const enlace =
        document.createElement("a");

    enlace.href =
        URL.createObjectURL(blob);

    enlace.download =
        "teleprompter.docx";

    enlace.click();

    URL.revokeObjectURL(
        enlace.href
    );

}


guardarDocumento.addEventListener(
    "click",
    guardarComoWord
);


// =======================================================
// APARIENCIA / TEMAS
// =======================================================

function aplicarTema(boton) {

    const fondo =
        boton.dataset.fondo;

    const texto =
        boton.dataset.texto;

    document.documentElement.style
        .setProperty(
            "--color-fondo",
            fondo
        );

    document.documentElement.style
        .setProperty(
            "--color-texto",
            texto
        );

    botonesTema.forEach(
        function(botonTema) {

            botonTema.classList.remove(
                "activo"
            );

        }
    );

    boton.classList.add(
        "activo"
    );

    localStorage.setItem(
        "teleprompterTema",
        boton.dataset.tema
    );

}


function cargarTema() {

    const temaGuardado =
        localStorage.getItem(
            "teleprompterTema"
        );

    let botonTema;

    if (temaGuardado) {

        botonTema =
            document.querySelector(
                `.temaColor[data-tema="${temaGuardado}"]`
            );

    }

    if (!botonTema) {

        botonTema =
            document.querySelector(
                '.temaColor[data-tema="Noche"]'
            );

    }

    if (botonTema) {

        aplicarTema(botonTema);

    }

}


botonesTema.forEach(
    function(boton) {

        boton.addEventListener(
            "click",
            function() {

                aplicarTema(boton);

            }
        );

        const fondo =
            boton.dataset.fondo;

        const texto =
            boton.dataset.texto;

        boton.style.background =
            `linear-gradient(
                135deg,
                ${fondo} 0%,
                ${fondo} 50%,
                ${texto} 50%,
                ${texto} 100%
            )`;

    }
);


// =======================================================
// DIÁLOGOS
// =======================================================

function mostrarDialogo(
    titulo,
    mensaje,
    textoConfirmar = "Entendido",
    mostrarCancelar = false,
    alConfirmar = null,
    alCancelar = null
) {

    tituloDialogo.innerText =
        titulo;

    mensajeDialogo.innerText =
        mensaje;

    confirmarDialogo.innerText =
        textoConfirmar;

    cancelarDialogo.style.display =
        mostrarCancelar
            ? "inline-block"
            : "none";

    dialogo.classList.remove(
        "dialogoOculto"
    );

    confirmarDialogo.onclick =
        function() {

            dialogo.classList.add(
                "dialogoOculto"
            );

            if (alConfirmar) {
                alConfirmar();
            }

        };

    cancelarDialogo.onclick =
        function() {

            dialogo.classList.add(
                "dialogoOculto"
            );

            if (alCancelar) {
                alCancelar();
            }

        };

}


function cerrarDialogo() {

    dialogo.classList.add(
        "dialogoOculto"
    );

}


// =======================================================
// DESHACER
// =======================================================

function mostrarDeshacer(
    mensaje = "Bloque eliminado."
) {

    if (!avisoDeshacer) {
        return;
    }

    avisoDeshacer.innerHTML = `
        ${mensaje}
        <button id="botonDeshacer">
            Deshacer
        </button>
    `;

    avisoDeshacer.classList.add(
        "visible"
    );

    document.getElementById(
        "botonDeshacer"
    ).onclick =
        deshacerEliminacion;

    clearTimeout(
        temporizadorDeshacer
    );

    temporizadorDeshacer =
        setTimeout(
            function() {

                bloqueEliminado = null;

                avisoDeshacer.classList.remove(
                    "visible"
                );

            },
            8000
        );

}


function deshacerEliminacion() {

    if (!bloqueEliminado) {
        return;
    }

    clearTimeout(
        temporizadorDeshacer
    );


    // ---------- Restaurar documento completo ----------

    if (
        bloqueEliminado.tipo === "vaciar"
    ) {

        bloques.length = 0;

        bloques.push(
            ...bloqueEliminado.bloques
        );

    }


    // ---------- Restaurar un solo bloque ----------

    else {

        bloques.splice(
            bloqueEliminado.indice,
            0,
            bloqueEliminado.bloque
        );

    }


    bloqueEliminado = null;

    garantizarBloque();

    guardarBloques();

    indice = 0;

    mostrarEditor();
    mostrarBloque();

    avisoDeshacer.classList.remove(
        "visible"
    );

}


// =======================================================
// TELEPROMPTER
// =======================================================

function mostrarBloque() {

    garantizarBloque();

    if (indice >= bloques.length) {
        indice = bloques.length - 1;
    }

    if (indice < 0) {
        indice = 0;
    }


    // ---------- Bloque anterior ----------

    if (indice > 0) {

        anterior.innerText =
            bloques[indice - 1].texto;

    } else {

        anterior.innerText = "";

    }


    // ---------- Bloque actual ----------

    actual.innerText =
        bloques[indice].texto;


    // ---------- Estado ----------

    estado.innerText =
        `Bloque ${indice + 1} de ${bloques.length}`;


    // ---------- Bloque siguiente ----------

    if (
        indice < bloques.length - 1
    ) {

        siguiente.innerText =
            bloques[indice + 1].texto;

    } else {

        siguiente.innerText = "";

    }

}


function actualizarBotonPlayPause() {

    if (enCuentaRegresiva) {

        if (cuentaRegresivaPausada) {

            botonPlayPause.innerText =
                "▶ Play";

        } else {

            botonPlayPause.innerText =
                "⏸ Pausa";

        }

        return;
    }

    if (reproduciendo) {

        botonPlayPause.innerText =
            "⏸ Pausa";

    } else {

        botonPlayPause.innerText =
            "▶ Play";

    }

}


// ---------- Progreso ----------

function actualizarProgreso() {

    if (
        !reproduciendo ||
        inicioBloque === null
    ) {
        return;
    }

    const duracion =
        calcularDuracion(indice);

    const transcurrido =
        Date.now() - inicioBloque;

    const porcentaje =
        Math.min(
            transcurrido / duracion,
            1
        );

    barraProgreso.style.width =
        `${porcentaje * 100}%`;

    const transcurridoSegundos =
        Math.min(
            transcurrido / 1000,
            duracion / 1000
        );

    const duracionSegundos =
        duracion / 1000;

    tiempoBloque.innerText =
        `${transcurridoSegundos.toFixed(1)} / ` +
        `${duracionSegundos.toFixed(1)} segundos`;

    if (porcentaje < 1) {

        animacionProgreso =
            requestAnimationFrame(
                actualizarProgreso
            );

    }

}


function reiniciarProgreso() {

    cancelAnimationFrame(
        animacionProgreso
    );

    animacionProgreso = null;

    tiempoTranscurrido = 0;

    inicioBloque = null;

    const duracion =
        calcularDuracion(indice);

    barraProgreso.style.width =
        "0%";

    tiempoBloque.innerText =
        `0.0 / ${
            (duracion / 1000).toFixed(1)
        } segundos`;

}


// ---------- Reproducción ----------

function iniciar() {

    if (temporizador) {
        return;
    }

    reproduciendo = true;

    actualizarBotonPlayPause();

    const duracion =
        calcularDuracion(indice);

    inicioBloque =
        Date.now() - tiempoTranscurrido;

    actualizarProgreso();

    temporizador =
        setTimeout(
            function() {

                temporizador = null;

                tiempoTranscurrido = 0;

                if (
                    indice < bloques.length - 1
                ) {

                    indice++;

                    tiempoTranscurrido = 0;

                    mostrarBloque();

                    iniciar();

                } else {

                    reproduciendo = false;

                    actualizarBotonPlayPause();

                }

            },
            duracion - tiempoTranscurrido
        );

}


function pausar() {

    if (!reproduciendo) {
        return;
    }

    tiempoTranscurrido =
        Date.now() - inicioBloque;

    clearTimeout(
        temporizador
    );

    temporizador = null;

    reproduciendo = false;

    actualizarBotonPlayPause();

    cancelAnimationFrame(
        animacionProgreso
    );

}


// ---------- Cuenta regresiva ----------

function cuentaRegresiva(callback) {

    segundosCuentaRegresiva =
        parseInt(selectorCuenta.value);

    if (segundosCuentaRegresiva === 0) {

        callback();
        return;

    }

    enCuentaRegresiva = true;
    cuentaRegresivaPausada = false;
    callbackCuentaRegresiva = callback;

    botonAnterior.disabled = true;
    botonSiguiente.disabled = true;

    actualizarBotonPlayPause();

    mostrarSegundoCuentaRegresiva();

    temporizadorCuentaRegresiva =
        setInterval(function() {

            if (cuentaRegresivaPausada) {
                return;
            }

            segundosCuentaRegresiva--;

            if (segundosCuentaRegresiva > 0) {

                mostrarSegundoCuentaRegresiva();

            } else {

                clearInterval(
                    temporizadorCuentaRegresiva
                );

                temporizadorCuentaRegresiva = null;

                enCuentaRegresiva = false;
                cuentaRegresivaPausada = false;

                botonAnterior.disabled = false;
                botonSiguiente.disabled = false;

                mostrarBloque();

                actualizarBotonPlayPause();

                callbackCuentaRegresiva();

                callbackCuentaRegresiva = null;

            }

        }, 1000);

}

function mostrarSegundoCuentaRegresiva() {

    actual.innerText =
        segundosCuentaRegresiva;

    anterior.innerText = "";
    siguiente.innerText = "";

}


// ---------- Pantalla completa ----------

async function iniciarPantallaCompleta() {

    // Cancelar modo división de bloque
    cancelarDivision();
  
    // Detener cualquier reproducción anterior
    pausar();

    // Comenzar siempre desde el primer bloque
    indice = 0;

    // Reiniciar progreso
    barraProgreso.style.width =
        "0%";

    tiempoBloque.innerText =
        `0.0 / ${
            (calcularDuracion(indice) / 1000).toFixed(1)
        } segundos`;

    modoEdicion.classList.add(
        "oculto"
    );

    modoTeleprompter.style.display =
        "block";

    mostrarBloque();

    if (!document.fullscreenElement) {

        await document.documentElement.requestFullscreen();

    }

    cuentaRegresiva(
        function() {

            iniciar();

        }
    );

}


// ---------- Cambio de pantalla completa ----------

document.addEventListener(
    "fullscreenchange",
    function() {

        if (!document.fullscreenElement) {

            modoTeleprompter.style.display = "none";

            modoEdicion.classList.remove("oculto");

            pausar();

            reiniciarProgreso();

            enCuentaRegresiva = false;
            cuentaRegresivaPausada = false;
            segundosCuentaRegresiva = 0;
            callbackCuentaRegresiva = null;

            botonAnterior.disabled = false;
            botonSiguiente.disabled = false;

            actualizarBotonPlayPause();

            cancelarDivision();
            mostrarEditor();
        }
    }
);


// ---------- Botón siguiente ----------

botonSiguiente.onclick =
    function() {

        if (enCuentaRegresiva) {
            return;
        }

        if (
            indice < bloques.length - 1
        ) {

            const estabaReproduciendo =
                reproduciendo;

            clearTimeout(
                temporizador
            );

            temporizador = null;

            cancelAnimationFrame(
                animacionProgreso
            );

            reproduciendo = false;

            indice++;

            mostrarBloque();

            reiniciarProgreso();

            actualizarBotonPlayPause();

            if (estabaReproduciendo) {

                iniciar();

            }

        }

    };


// ---------- Botón anterior ----------

botonAnterior.onclick =
    function() {

        if (enCuentaRegresiva) {
            return;
        }

        if (indice > 0) {

            const estabaReproduciendo =
                reproduciendo;

            clearTimeout(
                temporizador
            );

            temporizador = null;

            cancelAnimationFrame(
                animacionProgreso
            );

            reproduciendo = false;

            indice--;

            mostrarBloque();

            reiniciarProgreso();

            actualizarBotonPlayPause();

            if (estabaReproduciendo) {

                iniciar();

            }

        }

    };


// ---------- Play / pausa ----------

botonPlayPause.onclick = function () {

    if (enCuentaRegresiva) {

        cuentaRegresivaPausada =
            !cuentaRegresivaPausada;

        actualizarBotonPlayPause();

        return;

    }

    if (reproduciendo) {

        pausar();

    } else {

        iniciar();

    }

};


// ---------- Teclado ----------

document.addEventListener(
    "keydown",
    function(event) {

        if (
            !document.fullscreenElement
        ) {
            return;
        }

        if (
            event.key === "ArrowLeft"
        ) {

            event.preventDefault();

            botonAnterior.click();

        }

        else if (
            event.key === "ArrowRight"
        ) {

            event.preventDefault();

            botonSiguiente.click();

        }

        else if (
            event.code === "Space"
        ) {

            event.preventDefault();

            botonPlayPause.click();

        }

    }
);


// ---------- Pantalla completa ----------

botonPantallaCompleta.onclick =
    iniciarPantallaCompleta;


// =======================================================
// INICIALIZACIÓN
// =======================================================

cargarBloques();

cargarTema();

cargarConfiguracion();

mostrarEditor();

mostrarBloque();

actualizarBotonPlayPause();
