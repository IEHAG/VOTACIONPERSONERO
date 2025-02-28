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

// Referencias a Firestore
const db = firebase.firestore();
const candidatesRef = db.collection('candidates');
const votesRef = db.collection('votes');
const studentsRef = db.collection('students');

// Datos de los candidatos (en una aplicación real, estos vendrían de Firestore)
const candidates = [
    {
        id: 1,
        name: "Ana María Rodríguez",
        number: "01",
        image: "/api/placeholder/300/200",
        proposals: "Mejorar las zonas verdes, implementar programas de reciclaje, fortalecer el consejo estudiantil."
    },
    {
        id: 2,
        name: "Carlos Eduardo Martínez",
        number: "02",
        image: "/api/placeholder/300/200",
        proposals: "Ampliar la biblioteca, organizar más eventos culturales, mejorar los espacios deportivos."
    },
    {
        id: 3,
        name: "Valentina Gómez Torres",
        number: "03",
        image: "/api/placeholder/300/200",
        proposals: "Crear grupos de estudio, implementar un buzón de sugerencias, mejorar la comunicación institucional."
    },
    {
        id: 4,
        name: "Juan Pablo Sánchez",
        number: "04",
        image: "/api/placeholder/300/200",
        proposals: "Organizar olimpiadas deportivas, renovar los laboratorios, crear un periódico escolar."
    }
];

// Variables globales
let selectedCandidateId = null;
let currentStudentId = null;
let currentStudentGrade = null;
const adminCredentials = {
    username: "admin",
    password: "admin123"
};

// Elementos DOM - Login
const loginContent = document.getElementById('loginContent');
const votingContent = document.getElementById('votingContent');
const studentId = document.getElementById('studentId');
const studentGrade = document.getElementById('studentGrade');
const loginBtn = document.getElementById('loginBtn');
const adminLoginBtn = document.getElementById('adminLoginBtn');
adminLoginBtn.addEventListener('click', showAdminModal);
const studentIdError = document.getElementById('studentIdError');

// Elementos DOM - Admin
const adminPanel = document.getElementById('adminPanel');
const studentModal = document.getElementById('studentModal');
const adminUsername = document.getElementById('adminUsername');
const adminPassword = document.getElementById('adminPassword');
const adminLoginError = document.getElementById('adminLoginError');
const confirmAdminBtn = document.getElementById('confirmAdminBtn');
const cancelAdminBtn = document.getElementById('cancelAdminBtn');
const showResultsBtn = document.getElementById('showResultsBtn');
const downloadResultsBtn = document.getElementById('downloadResultsBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const resultsContainer = document.getElementById('resultsContainer');
const resultsData = document.getElementById('resultsData');
const gradeParticipation = document.getElementById('gradeParticipation');

// Elementos DOM - Votación
const candidatesList = document.getElementById('candidatesList');
const voteBtn = document.getElementById('voteBtn');
const resetBtn = document.getElementById('resetBtn');
const logoutBtn = document.getElementById('logoutBtn');
const confirmModal = document.getElementById('confirmModal');
const selectedCandidateConfirm = document.getElementById('selectedCandidateConfirm');
const confirmVoteBtn = document.getElementById('confirmVoteBtn');
const cancelVoteBtn = document.getElementById('cancelVoteBtn');
const successMessage = document.getElementById('successMessage');
const finishVoteBtn = document.getElementById('finishVoteBtn');

// Iniciar Firebase con datos de candidatos
async function initializeFirebase() {
    try {
        // Comprobar si los candidatos ya existen
        const snapshot = await candidatesRef.get();
        if (snapshot.empty) {
            // Si no existen, agregar los candidatos iniciales
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
                    <div class="candidate-proposals">
                        <strong>Propuestas:</strong>
                        <p>${candidate.proposals}</p>
                    </div>
                </div>
            `;

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
    const id = studentId.value.trim();
    const grade = studentGrade.value;

    if (!id || !grade) {
        alert('Por favor ingresa tu documento de identidad y selecciona tu grado.');
        return;
    }

    // Verificar si el estudiante ya votó
    const hasVoted = await checkIfStudentVoted(id);
    if (hasVoted) {
        studentIdError.style.display = 'block';
        return;
    }

    // Guardar información del estudiante actual
    currentStudentId = id;
    currentStudentGrade = grade;

    // Ocultar login y mostrar votación
    loginContent.style.display = 'none';
    votingContent.style.display = 'block';

    // Cargar candidatos
    loadCandidatesFromDB();
}

// Seleccionar candidato
function selectCandidate(id) {
    // Eliminar selección anterior
    const previousSelected = document.querySelector('.candidate-card.selected');
    if (previousSelected) {
        previousSelected.classList.remove('selected');
    }

    // Seleccionar nuevo candidato
    const candidateCard = document.querySelector(`.candidate-card[data-id="${id}"]`);
    candidateCard.classList.add('selected');

    // Actualizar el ID seleccionado
    selectedCandidateId = id;

    // Habilitar el botón de votar
    voteBtn.classList.remove('btn-disabled');
    voteBtn.disabled = false;
}

// Mostrar modal de confirmación
async function showConfirmModal() {
    if (!selectedCandidateId) return;

    try {
        const candidateDoc = await candidatesRef.doc(selectedCandidateId).get();
        const candidate = candidateDoc.data();

        selectedCandidateConfirm.innerHTML = `
            <strong>${candidate.name}</strong><br>
            Tarjetón No. ${candidate.number}
        `;

        confirmModal.style.display = 'flex';
    } catch (error) {
        console.error('Error al mostrar confirmación:', error);
    }
}

// Registrar voto en Firebase
async function registerVote() {
    try {
        // Incrementar el contador de votos del candidato
        const candidateRef = candidatesRef.doc(selectedCandidateId);
        await db.runTransaction(async (transaction) => {
            const candidateDoc = await transaction.get(candidateRef);
            const currentVotes = candidateDoc.data().votes || 0;
            transaction.update(candidateRef, { votes: currentVotes + 1 });
        });

        // Guardar registro del voto
        await votesRef.add({
            candidateId: selectedCandidateId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            studentGrade: currentStudentGrade
        });

        // Marcar al estudiante como votante
        await studentsRef.doc(currentStudentId).set({
            hasVoted: true,
            grade: currentStudentGrade,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Ocultar el modal y el contenido de votación
        confirmModal.style.display = 'none';
        document.querySelector('.instructions').style.display = 'none';
        document.querySelector('h2').style.display = 'none';
        candidatesList.style.display = 'none';
        document.querySelector('.buttons').style.display = 'none';

        // Mostrar mensaje de éxito
        successMessage.style.display = 'block';

        console.log(`Voto registrado para el candidato ID: ${selectedCandidateId}`);
    } catch (error) {
        console.error('Error al registrar voto:', error);
        alert('Error al registrar el voto. Por favor intenta nuevamente.');
    }
}

// Finalizar votación
function finishVoting() {
    // Resetear variables
    currentStudentId = null;
    currentStudentGrade = null;
    selectedCandidateId = null;

    // Ocultar votación y mostrar login
    votingContent.style.display = 'none';
    loginContent.style.display = 'block';

    // Resetear formulario
    studentId.value = '';
    studentGrade.value = '';
    studentIdError.style.display = 'none';

    // Ocultar mensaje de éxito
    successMessage.style.display = 'none';

    // Mostrar elementos de votación
    document.querySelector('.instructions').style.display = 'block';
    document.querySelector('h2').style.display = 'block';
    candidatesList.style.display = 'grid';
    document.querySelector('.buttons').style.display = 'flex';

    // Deshabilitar botón de votar
    voteBtn.classList.add('btn-disabled');
    voteBtn.disabled = true;
}

// Mostrar modal de administrador
function showAdminModal() {
    adminUsername.value = '';
    adminPassword.value = '';
    adminLoginError.style.display = 'none';
    studentModal.style.display = 'flex';
}

// Iniciar sesión de administrador
function loginAdmin() {
    const username = adminUsername.value.trim();
    const password = adminPassword.value.trim();

    if (username === adminCredentials.username && password === adminCredentials.password) {
        // Cerrar modal
        studentModal.style.display = 'none';

        // Mostrar panel de administrador
        loginContent.style.display = 'none';
        votingContent.style.display = 'none';
        adminPanel.style.display = 'block';
    } else {
        adminLoginError.style.display = 'block';
    }
}

// Cargar resultados
async function loadResults() {
    try {
        const candidatesSnapshot = await candidatesRef.get();
        let totalVotes = 0;
        let candidatesResults = [];

        // Obtener votos por candidato
        candidatesSnapshot.forEach(doc => {
            const candidate = doc.data();
            totalVotes += candidate.votes || 0;
            candidatesResults.push({
                id: doc.id,
                name: candidate.name,
                number: candidate.number,
                votes: candidate.votes || 0
            });
        });

        // Ordenar candidatos por número de votos
        candidatesResults.sort((a, b) => b.votes - a.votes);

        // Generar HTML de resultados
        let resultsHTML = '';
        candidatesResults.forEach(candidate => {
            const percentage = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0;
            resultsHTML += `
                <div class="result-item">
                    <div>
                        <strong>${candidate.name}</strong> (Tarjetón No. ${candidate.number})
                        <div class="result-bar-container">
                            <div class="result-bar" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    <div>
                        <strong>${candidate.votes}</strong> votos (${percentage}%)
                    </div>
                </div>
            `;
        });

        resultsData.innerHTML = resultsHTML;

        // Cargar participación por grado
        const votesSnapshot = await votesRef.get();
        const gradeStats = {
            6: 0,
            7: 0,
            8: 0,
            9: 0,
            10: 0,
            11: 0
        };

        votesSnapshot.forEach(doc => {
            const vote = doc.data();
            if (vote.studentGrade in gradeStats) {
                gradeStats[vote.studentGrade]++;
            }
        });

        // Mostrar participación por grado
        let participationHTML = '';
        for (const grade in gradeStats) {
            participationHTML += `<p>Grado ${grade}: ${gradeStats[grade]} votos</p>`;
        }
        gradeParticipation.innerHTML = participationHTML;

    } catch (error) {
        console.error('Error al cargar resultados:', error);
    }
}