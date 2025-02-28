// script.js

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

// Función para registrar un voto
function vote(option) {
    alert(`Voto registrado para: ${option}`);
    localStorage.setItem("vote", option);
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem("voter");
    localStorage.removeItem("vote");
    document.getElementById("login").style.display = "block";
    document.getElementById("voting").style.display = "none";
}
