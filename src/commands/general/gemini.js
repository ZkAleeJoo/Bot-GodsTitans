const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ia')
        .setDescription('Pregunta algo a Zenith (Respuestas breves)')
        .addStringOption(option =>
            option.setName('ask')
                .setDescription('¿Qué quieres saber?')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const prompt = interaction.options.getString('ask');
        const apiKey = process.env.GEMINI_API_KEY;

        try {
            const client = new GoogleGenAI({ apiKey: apiKey });

            const response = await client.models.generateContent({
                model: 'models/gemini-2.5-flash',
                systemInstruction: "Eres Gengar, el asistente de un servidor de plugins. Tu respuesta DEBE ser extremadamente concisa, directa y profesional. No saludes a menos que sea necesario, ve al grano. Si el usuario te pide código, da solo lo esencial.",
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });

            const text = response.text;

            if (!text) throw new Error("Sin respuesta");

            if (text.length > 2000) {
                const chunks = text.match(/[\s\S]{1,1900}(?=\s|$)/g) || [text.substring(0, 1900)];
                for (let i = 0; i < chunks.length; i++) {
                    if (i === 0) await interaction.editReply(chunks[i]);
                    else await interaction.followUp(chunks[i]);
                }
            } else {
                await interaction.editReply(text);
            }

        } catch (error) {
            console.error('Error:', error);
            await interaction.editReply('⚠️ Hubo un error. Intenta con una pregunta más corta.');
        }
    },
};