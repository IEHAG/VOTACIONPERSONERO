const admin = require("firebase-admin");
const fs = require("fs");

// Inicializa Firebase con las credenciales
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Función para generar votantes de ejemplo
const generateVoters = (count) => {
  let voters = [];
  for (let i = 1; i <= count; i++) {
    voters.push({
      id: `ID-${i}`,
      name: `Votante ${i}`,
      voted: false, // Todos los votantes empiezan sin votar
    });
  }
  return voters;
};

// Agregar 2,000 votantes a Firestore
const addVotersToFirestore = async () => {
  const voters = generateVoters(2000);
  const batch = db.batch();

  voters.forEach((voter, index) => {
    const docRef = db.collection("students").doc(voter.id); // Colección "students"
    batch.set(docRef, voter);

    // Ejecuta en lotes de 500 para evitar límites de Firestore
    if ((index + 1) % 500 === 0) {
      batch.commit();
      console.log(`Agregados ${index + 1} votantes...`);
    }
  });

  await batch.commit();
  console.log("✅ Se agregaron 2,000 votantes a Firestore");
};

addVotersToFirestore();
