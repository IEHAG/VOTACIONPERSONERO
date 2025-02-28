// script.js

// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDgE9a4V6e_mizibMPCitbWEdgPKL_yEFM",
    authDomain: "sistema-votacion-hag.firebaseapp.com",
    projectId: "sistema-votacion-hag",
    storageBucket: "sistema-votacion-hag.appspot.com",
    messagingSenderId: "68354077419",
    appId: "1:68354077419:web:ed88361c9a4411f702c4ae",
    measurementId: "G-K4JVZDYPT3"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para iniciar sesión
function login() {
    let username = document.getElementById("username").value;
    if (username.trim() !== "") {
        localStorage.setItem("voter", username);
        document.getElementById("login").style.display = "none";
        document.getElementById("voting").style.display = "block";
    } else {
        alert("Por favor, ingrese un usuario válido.");
    }
}

// Función para registrar un voto en Firestore
async function vote(option) {
    let voter = localStorage.getItem("voter");
    if (!voter) {
        alert("Debes iniciar sesión para votar.");
        return;
    }

    try {
        await addDoc(collection(db, "votos"), {
            usuario: voter,
            opcion: option,
            timestamp: new Date()
        });
        alert(`Voto registrado para: ${option}`);
    } catch (error) {
        console.error("Error al guardar el voto:", error);
        alert("Hubo un error al registrar el voto.");
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem("voter");
    document.getElementById("login").style.display = "block";
    document.getElementById("voting").style.display = "none";
}

// Hacer funciones accesibles en el HTML
window.login = login;
window.vote = vote;
window.logout = logout;
