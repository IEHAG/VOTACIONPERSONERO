// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDgE9a4V6e_mizibMPCitbWEdgPKL_yEFM",
    authDomain: "sistema-votacion-hag.firebaseapp.com",
    projectId: "sistema-votacion-hag",
    storageBucket: "sistema-votacion-hag.firebasestorage.app",
    messagingSenderId: "68354077419",
    appId: "1:68354077419:web:ed88361c9a4411f702c4ae",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const candidatesRef = db.collection('candidates');
const votesRef = db.collection('votes');
const studentsRef = db.collection('students');

// Datos de los candidatos
const candidates = [
    { id: 1, name: "Ana María Rodríguez", number: "01", image: "/api/placeholder/300/200", proposals: "Mejorar las zonas verdes, implementar programas de reciclaje, fortalecer el consejo estudiantil." },
    { id: 2, name: "Carlos Eduardo Martínez", number: "02", image: "/api/placeholder/300/200", proposals: "Ampliar la biblioteca, organizar más eventos culturales, mejorar los espacios deportivos." },
    { id: 3, name: "Valentina Gómez Torres", number: "03", image: "/api/placeholder/300/200", proposals: "Crear grupos de estudio, implementar un buzón de sugerencias, mejorar la comunicación institucional." },
    { id: 4, name: "Juan Pablo Sánchez", number: "04", image: "/api/placeholder/300/200", proposals: "Organizar olimpiadas deportivas, renovar los laboratorios, crear un periódico escolar." }
];

// Variables globales
let selectedCandidateId = null;
let currentStudentId = null;
let currentStudentGrade = null;
const adminCredentials = { username: "admin", password: "admin123" };

// Función para inicializar Firebase con los candidatos
async function initializeFirebase() {
    try {
        const snapshot = await candidatesRef.get();
        if (snapshot.empty) {
            for (const candidate of candidates) {
                await candidatesRef.doc(candidate.id.toString()).set({
                    name: candidate.name,
                    number: candidate.number,
                    image: candidate.image,
                    proposals: candidate.proposals,
                    votes: 0
                });
            }
            console.log('Candidatos inicializados correctamente');
        }
    } catch (error) {
        console.error('Error al inicializar Firebase:', error);
    }
}

// Cargar candidatos desde Firestore
async function loadCandidatesFromDB() {
    try {
        candidatesList.innerHTML = '';
        const snapshot = await candidatesRef.get();

        snapshot.forEach(doc => {
            const candidate = doc.data();
            const candidateId = doc.id;
            
            const candidateCard = document.createElement('div');
            candidateCard.className = 'candidate-card';
            candidateCard.dataset.id = candidateId;
            candidateCard.innerHTML = `
                <div class="candidate-image">
                    <img src="${candidate.image}" alt="Foto de ${candidate.name}">
                </div>
                <div class="candidate-info">
                    <div class="candidate-name">${candidate.name}</div>
                    <div class="candidate-number">Tarjetón No. ${candidate.number}</div>
                    <div class="candidate-proposals"><strong>Propuestas:</strong><p>${candidate.proposals}</p></div>
                </div>`;
            
            candidateCard.addEventListener('click', () => selectCandidate(candidateId));
            candidatesList.appendChild(candidateCard);
        });
    } catch (error) {
        console.error('Error al cargar candidatos:', error);
    }
}

// Verificar si el estudiante ya votó
async function checkIfStudentVoted(studentId) {
    try {
        const snapshot = await studentsRef.doc(studentId).get();
        return snapshot.exists && snapshot.data().hasVoted;
    } catch (error) {
        console.error('Error al verificar el estudiante:', error);
        return false;
    }
}

// Iniciar sesión de estudiante
async function loginStudent() {
    const studentId = document.getElementById("studentId").value.trim();
    const studentGrade = document.getElementById("studentGrade").value;
    if (!studentId || !studentGrade) {
        alert('⚠️ Por favor ingresa tu documento de identidad y selecciona tu grado.');
        return;
    }
    if (await checkIfStudentVoted(studentId)) {
        document.getElementById("studentIdError").style.display = 'block';
        return;
    }
    sessionStorage.setItem('currentStudentId', studentId);
    sessionStorage.setItem('currentStudentGrade', studentGrade);
    loginContent.style.display = 'none';
    votingContent.style.display = 'block';
    loadCandidatesFromDB();
}

// Seleccionar candidato
function selectCandidate(id) {
    document.querySelectorAll('.candidate-card.selected').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.candidate-card[data-id="${id}"]`).classList.add('selected');
    selectedCandidateId = id;
    voteBtn.disabled = false;
}

// Mostrar modal de confirmación de voto
async function showConfirmModal() {
    if (!selectedCandidateId) return;
    const candidateDoc = await candidatesRef.doc(selectedCandidateId).get();
    const candidate = candidateDoc.data();
    selectedCandidateConfirm.innerHTML = `<strong>${candidate.name}</strong><br>Tarjetón No. ${candidate.number}`;
    confirmModal.style.display = 'flex';
}

// Registrar voto
async function registerVote() {
    try {
        const candidateRef = candidatesRef.doc(selectedCandidateId);
        await db.runTransaction(async (transaction) => {
            const candidateDoc = await transaction.get(candidateRef);
            transaction.update(candidateRef, { votes: (candidateDoc.data().votes || 0) + 1 });
        });
        await votesRef.add({ candidateId: selectedCandidateId, timestamp: firebase.firestore.FieldValue.serverTimestamp(), studentGrade: currentStudentGrade });
        await studentsRef.doc(currentStudentId).set({ hasVoted: true, grade: currentStudentGrade, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
        confirmModal.style.display = 'none';
        successMessage.style.display = 'block';
        console.log(`Voto registrado para el candidato ID: ${selectedCandidateId}`);
    } catch (error) {
        console.error('Error al registrar voto:', error);
    }
}

// Cargar resultados
async function loadResults() {
    try {
        const candidatesSnapshot = await candidatesRef.get();
        let resultsHTML = '';
        candidatesSnapshot.forEach(doc => {
            const candidate = doc.data();
            resultsHTML += `<div class="result-item"><strong>${candidate.name}</strong> (${candidate.votes || 0} votos)</div>`;
        });
        resultsData.innerHTML = resultsHTML;
    } catch (error) {
        console.error('Error al cargar resultados:', error);
    }
}
