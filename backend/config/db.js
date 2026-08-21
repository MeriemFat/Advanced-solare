import mongoose from "mongoose";

export async function connectDB() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ ERREUR CRITIQUE : La variable MONGODB_URI n'est pas configurée dans Render (onglet Environment) !");
    throw new Error("MONGODB_URI is not defined");
  }

  // Supprimer d'éventuels guillemets superflus collés dans Render
  uri = uri.trim().replace(/^["']|["']$/g, "");

  const safeTarget = uri.includes("@") ? uri.split("@")[1].split("?")[0] : "local";
  console.log(`📡 Tentative de connexion à MongoDB Atlas (${safeTarget})...`);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 20000,
  });
  console.log("✅ Connexion à MongoDB Atlas réussie !");
}
