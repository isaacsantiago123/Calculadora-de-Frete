// ========================================
// CONFIGURAÇÕES
// ========================================

// Endereço da UNINASSAU utilizada como origem.
// Unidade Fortaleza - Av. Aguanambi, 251.

const origem = {
    latitude: -3.7435,
    longitude: -38.5278
};


// Valor utilizado para calcular a estimativa
// do frete por quilômetro.
//
// Você pode alterar esse valor conforme
// a regra passada pelo professor.

const valorPorKm = 2.50;


// ========================================
// ELEMENTOS DO HTML
// ========================================

const form = document.getElementById("cepForm");

const cepInput = document.getElementById("cep");

const loading = document.getElementById("loading");

const error = document.getElementById("error");

const errorMessage =
    document.getElementById("errorMessage");

const result = document.getElementById("result");

const address =
    document.getElementById("address");

const destination =
    document.getElementById("destination");

const distance =
    document.getElementById("distance");

const price =
    document.getElementById("price");


// ========================================
// FORMATAR CEP
// ========================================

cepInput.addEventListener("input", function () {

    let cep = cepInput.value;

    // Remove tudo que não for número
    cep = cep.replace(/\D/g, "");

    // Limita a 8 números
    cep = cep.substring(0, 8);

    // Adiciona o hífen
    if (cep.length > 5) {

        cep =
            cep.substring(0, 5)
            + "-"
            + cep.substring(5);

    }

    cepInput.value = cep;

});


// ========================================
// SUBMIT DO FORMULÁRIO
// ========================================

form.addEventListener("submit", async function (event) {

    event.preventDefault();


    // ====================================
    // LIMPAR ESTADO ANTERIOR
    // ====================================

    error.classList.add("hidden");

    result.classList.add("hidden");

    loading.classList.remove("hidden");


    try {

        // ====================================
        // PEGAR CEP
        // ====================================

        const cep =
            cepInput.value.replace(/\D/g, "");


        // ====================================
        // VALIDAR CEP
        // ====================================

        if (cep.length !== 8) {

            throw new Error(
                "Digite um CEP válido com 8 números."
            );

        }


        // ====================================
        // 1. CONSULTAR VIACEP
        // ====================================

        const viaCepResponse =
            await fetch(
                `https://viacep.com.br/ws/${cep}/json/`
            );


        if (!viaCepResponse.ok) {

            throw new Error(
                "Não foi possível consultar o CEP."
            );

        }


        const dadosCep =
            await viaCepResponse.json();


        // CEP não encontrado

        if (dadosCep.erro) {

            throw new Error(
                "CEP não encontrado."
            );

        }


        // ====================================
        // MONTAR ENDEREÇO
        // ====================================

        const enderecoCompleto = [

            dadosCep.logradouro,

            dadosCep.bairro,

            dadosCep.localidade,

            dadosCep.uf

        ]
        .filter(Boolean)
        .join(", ");


        // ====================================
        // 2. GEOCODIFICAR ENDEREÇO
        // ====================================

        const enderecoBusca =
            encodeURIComponent(
                `${enderecoCompleto}, Brasil`
            );


        const geocodeResponse =
            await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${enderecoBusca}`,
                {
                    headers: {
                        "Accept-Language": "pt-BR"
                    }
                }
            );


        if (!geocodeResponse.ok) {

            throw new Error(
                "Não foi possível localizar o endereço."
            );

        }


        const locais =
            await geocodeResponse.json();


        if (locais.length === 0) {

            throw new Error(
                "Não foi possível encontrar as coordenadas desse endereço."
            );

        }


        const destino = {

            latitude:
                parseFloat(locais[0].lat),

            longitude:
                parseFloat(locais[0].lon)

        };


        // ====================================
        // 3. CALCULAR DISTÂNCIA COM OSRM
        // ====================================

        const rotaResponse =
            await fetch(
                `https://router.project-osrm.org/route/v1/driving/${origem.longitude},${origem.latitude};${destino.longitude},${destino.latitude}?overview=false`
            );


        if (!rotaResponse.ok) {

            throw new Error(
                "Não foi possível calcular a rota."
            );

        }


        const rota =
            await rotaResponse.json();


        if (
            !rota.routes ||
            rota.routes.length === 0
        ) {

            throw new Error(
                "Não foi encontrada uma rota."
            );

        }


        // Distância vem em metros

        const distanciaMetros =
            rota.routes[0].distance;


        // Converter para quilômetros

        const distanciaKm =
            distanciaMetros / 1000;


        // ====================================
        // 4. CALCULAR PREÇO
        // ====================================

        const valorFrete =
            distanciaKm * valorPorKm;


        // ====================================
        // 5. MOSTRAR RESULTADO
        // ====================================

        address.textContent =
            enderecoCompleto;


        destination.textContent =
            `${dadosCep.localidade} - ${dadosCep.uf}`;


        distance.textContent =
            `${distanciaKm.toFixed(2)} km`;


        price.textContent =
            valorFrete.toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            );


        // ====================================
        // MOSTRAR RESULTADO
        // ====================================

        result.classList.remove("hidden");


    } catch (erro) {

        // ====================================
        // MOSTRAR ERRO
        // ====================================

        errorMessage.textContent =
            erro.message;

        error.classList.remove("hidden");

    } finally {

        // ====================================
        // FINALIZAR LOADING
        // ====================================

        loading.classList.add("hidden");

    }

});