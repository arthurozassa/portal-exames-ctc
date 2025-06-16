const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Viewer PACS simples
router.get('/viewer/:examId', (req, res) => {
    const { examId } = req.params;
    
    // Página simples do visualizador PACS
    const pacsHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visualizador PACS - Exame ${examId}</title>
        <style>
            body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                background: #000;
                color: #fff;
            }
            .pacs-header {
                background: #1a1a1a;
                padding: 10px;
                margin-bottom: 20px;
                border-radius: 5px;
            }
            .pacs-viewer {
                background: #2a2a2a;
                border: 2px solid #444;
                height: 500px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 5px;
                position: relative;
            }
            .image-placeholder {
                text-align: center;
                color: #888;
            }
            .controls {
                margin-top: 20px;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            .btn {
                padding: 8px 16px;
                background: #007acc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .btn:hover {
                background: #005a9e;
            }
            .measurements {
                background: #1a1a1a;
                padding: 15px;
                margin-top: 20px;
                border-radius: 5px;
            }
            .dicom-info {
                background: #1a1a1a;
                padding: 15px;
                margin-top: 20px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="pacs-header">
            <h2>🖼️ Visualizador PACS - Portal de Exames CTC</h2>
            <p>Exame ID: ${examId} | Paciente: Maria Silva Santos</p>
        </div>

        <div class="pacs-viewer">
            <div class="image-placeholder">
                <div style="font-size: 48px; margin-bottom: 20px;">🔬</div>
                <h3>Imagem Médica DICOM</h3>
                <p>Visualizador PACS integrado</p>
                <p style="color: #666; font-size: 12px;">
                    Esta é uma demonstração do visualizador PACS.<br>
                    Em produção, aqui seria exibida a imagem médica real.
                </p>
            </div>
        </div>

        <div class="controls">
            <button class="btn" onclick="zoom('+')">🔍 Zoom +</button>
            <button class="btn" onclick="zoom('-')">🔍 Zoom -</button>
            <button class="btn" onclick="contrast('+')">☀️ Contraste +</button>
            <button class="btn" onclick="contrast('-')">🌙 Contraste -</button>
            <button class="btn" onclick="measure()">📏 Medir</button>
            <button class="btn" onclick="annotate()">✏️ Anotar</button>
            <button class="btn" onclick="resetView()">🔄 Reset</button>
            <button class="btn" onclick="fullscreen()">📺 Tela Cheia</button>
        </div>

        <div class="measurements">
            <h4>📏 Medições</h4>
            <div id="measurements-list">
                <p>• Distância A-B: 12.5 mm</p>
                <p>• Área selecionada: 245.8 mm²</p>
                <p>• Ângulo: 23.4°</p>
            </div>
        </div>

        <div class="dicom-info">
            <h4>📋 Informações DICOM</h4>
            <div>
                <strong>Patient Name:</strong> Silva^Maria^Santos<br>
                <strong>Patient ID:</strong> 12345678900<br>
                <strong>Study Date:</strong> 20250610<br>
                <strong>Modality:</strong> CT<br>
                <strong>Institution:</strong> Centro de Tomografia Computadorizada<br>
                <strong>Series Number:</strong> 1<br>
                <strong>Instance Number:</strong> 1<br>
                <strong>Slice Thickness:</strong> 1.25mm<br>
                <strong>Pixel Spacing:</strong> 0.488281\\0.488281<br>
                <strong>Window Center:</strong> 40<br>
                <strong>Window Width:</strong> 400
            </div>
        </div>

        <script>
            function zoom(direction) {
                console.log('Zoom ' + direction);
                alert('Função de zoom ' + direction + ' ativada');
            }
            
            function contrast(direction) {
                console.log('Contraste ' + direction);
                alert('Ajuste de contraste ' + direction + ' aplicado');
            }
            
            function measure() {
                console.log('Medição');
                alert('Ferramenta de medição ativada');
            }
            
            function annotate() {
                console.log('Anotação');
                alert('Ferramenta de anotação ativada');
            }
            
            function resetView() {
                console.log('Reset view');
                alert('Visualização resetada');
            }
            
            function fullscreen() {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                }
            }
        </script>
    </body>
    </html>
    `;
    
    res.send(pacsHTML);
});

module.exports = router;