// Configuración de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "sistema-votacion-hag.firebaseapp.com",
    projectId: "sistema-votacion-hag",
    storageBucket: "sistema-votacion-hag.appspot.com",
    messagingSenderId: "68354077419",
    appId: "1:68354077419:web:ed88361c9a4411f702c4ae",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const candidatesRef = db.collection("candidates");
const votesRef = db.collection("votes");
const studentsRef = db.collection("students");

let selectedCandidateId = null;
let currentStudentId = null;

// Función para cargar candidatos desde Firestore
async function loadCandidatesFromDB() {
    const candidatesList = document.getElementById("candidatesList");
    candidatesList.innerHTML = "";

    const snapshot = await candidatesRef.get();
    snapshot.forEach(doc => {
        const candidate = doc.data();
        const candidateId = doc.id;

        const candidateCard = document.createElement("div");
        candidateCard.className = "candidate-card";
        candidateCard.dataset.id = candidateId;
        candidateCard.innerHTML = `<h3>${candidate.name}</h3>`;

        candidateCard.addEventListener("click", () => selectCandidate(candidateId));
        candidatesList.appendChild(candidateCard);
    });
}

// Verificar si el estudiante ya votó
async function checkIfStudentVoted(studentId) {
    const snapshot = await studentsRef.doc(studentId).get();
    return snapshot.exists && snapshot.data().hasVoted;
}

// Iniciar sesión de estudiante
document.getElementById("loginBtn").addEventListener("click", async () => {
    const studentId = document.getElementById("studentId").value.trim();
    const studentGrade = document.getElementById("studentGrade").value;

    if (!studentId || !studentGrade) {
        alert("⚠️ Ingresa tu documento y grado.");
        return;
    }

    if (await checkIfStudentVoted(studentId)) {
        document.getElementById("studentIdError").style.display = "block";
        return;
    }

    sessionStorage.setItem("currentStudentId", studentId);
    document.getElementById("loginContent").style.display = "none";
    document.getElementById("votingContent").style.display = "block";
    loadCandidatesFromDB();
});

// Seleccionar candidato
function selectCandidate(id) {
    document.querySelectorAll(".candidate-card.selected").forEach(el => el.classList.remove("selected"));
    document.querySelector(`.candidate-card[data-id="${id}"]`).classList.add("selected");
    selectedCandidateId = id;
    document.getElementById("voteBtn").disabled = false;
}

// Registrar voto
document.getElementById("voteBtn").addEventListener("click", async () => {
    if (!selectedCandidateId) return;

    try {
        const studentId = sessionStorage.getItem("currentStudentId");

        await db.runTransaction(async (transaction) => {
            const candidateRef = candidatesRef.doc(selectedCandidateId);
            const candidateDoc = await transaction.get(candidateRef);
            transaction.update(candidateRef, { votes: (candidateDoc.data().votes || 0) + 1 });
        });

        await votesRef.add({
            candidateId: selectedCandidateId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        await studentsRef.doc(studentId).set({
            hasVoted: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        document.getElementById("successMessage").style.display = "block";
    } catch (error) {
        console.error("Error al votar:", error);
    }
});

// Cerrar sesión
document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("currentStudentId");
    location.reload();
});
