require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function listModels() {
    // Asegúrate de que GEMINI_API_KEY esté bien escrita en tu .env
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        // El método .list() devuelve un iterador de modelos
        const models = await client.models.list();
        console.log("--- Modelos Disponibles ---");
        for await (const model of models) {
            console.log(`Nombre: ${model.name}`);
        }
    } catch (e) {
        console.error("Error al listar modelos:", e);
    }
}
listModels();