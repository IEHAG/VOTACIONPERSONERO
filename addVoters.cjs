const fs = require("fs");
const csv = require("csv-parser");
const admin = require("firebase-admin");

// Cargar credenciales desde el archivo JSON
const serviceAccount = require("./firebase-credentials.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Leer el CSV y subir los datos a Firebase
fs.createReadStream("addVoters.csv")
  .pipe(csv())
  .on("data", async (row) => {
    try {
      await db.collection("voters").add({
        id: row.id,
        name: row.name,
        voted: row.voted === "true",
      });
      console.log(`Votante ${row.name} agregado.`);
    } catch (error) {
      console.error("Error al subir votante:", error);
    }
  })
  .on("end", () => {
    console.log("Carga de votantes completada.");
  });
