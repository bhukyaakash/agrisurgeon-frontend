/**
 * Main Application Logic for AgriSurgeon
 * Handles UI interactions and API communication
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('imageInput');
    const predictBtn = document.getElementById('predictBtn');
    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resultsSection = document.getElementById('resultsSection');
    const temperatureSlider = document.getElementById('temperature');
    const humiditySlider = document.getElementById('humidity');
    const soilMoistureSlider = document.getElementById('soilMoisture');
    const themeToggle = document.getElementById('themeToggle');
    const notification = document.getElementById('notification');
    const navButtons = document.querySelectorAll('.nav-btn');
    const clearPreviewBtn = document.getElementById('clearPreview');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');

    let selectedImage = null;
    let lastPredictionResult = null;

    // ============================================
    // INITIALIZATION
    // ============================================
    initializeApp();

    async function initializeApp() {
        // Check API health
        const health = await apiClient.healthCheck();
        if (health) {
            console.log('✓ Backend connected:', health);
        } else {
            showNotification('⚠️ Backend API not available. Please ensure the server is running.', 'warning');
        }

        // Setup theme
        setupTheme();
        
        // Load prediction history on init
        loadPredictionHistory();
    }

    // ============================================
    // THEME MANAGEMENT
    // ============================================
    function setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.addEventListener('click', toggleTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    // ============================================
    // NAVIGATION
    // ============================================
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            navigateToSection(sectionId);
            
            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    function navigateToSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById('resultsSection').style.display = 'none';

        // Show selected section
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
            section.scrollIntoView({ behavior: 'smooth' });
            
            // Load history if history section is opened
            if (sectionId === 'history') {
                loadPredictionHistory();
            }
        }
    }

    // ============================================
    // IMAGE UPLOAD - DRAG AND DROP
    // ============================================
    dropZone.addEventListener('click', () => imageInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#27ae60';
        dropZone.style.background = 'rgba(46, 204, 113, 0.05)';
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#2ecc71';
        dropZone.style.background = '';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#2ecc71';
        dropZone.style.background = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageSelection(files[0]);
        }
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageSelection(e.target.files[0]);
        }
    });

    function handleImageSelection(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            showNotification('❌ Please select a valid image file', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showNotification('❌ Image size must be less than 10MB', 'error');
            return;
        }

        selectedImage = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            imagePreview.style.display = 'block';
            dropZone.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    clearPreviewBtn.addEventListener('click', clearImagePreview);

    function clearImagePreview() {
        selectedImage = null;
        imageInput.value = '';
        imagePreview.style.display = 'none';
        dropZone.style.display = 'block';
        previewImage.src = '';
    }

    // ============================================
    // SLIDER UPDATES
    // ============================================
    temperatureSlider.addEventListener('input', (e) => {
        document.getElementById('tempValue').textContent = parseFloat(e.target.value).toFixed(1);
    });

    humiditySlider.addEventListener('input', (e) => {
        document.getElementById('humidityValue').textContent = e.target.value;
    });

    if (soilMoistureSlider) {
        soilMoistureSlider.addEventListener('input', (e) => {
            const soilValue = document.getElementById('soilValue');
            if (soilValue) {
                soilValue.textContent = e.target.value;
            }
        });
    }

    // ============================================
    // PREDICTION
    // ============================================
    predictBtn.addEventListener('click', handlePrediction);

    async function handlePrediction() {
        if (!selectedImage) {
            showNotification('❌ Please select an image first', 'error');
            return;
        }

        const temperature = parseFloat(temperatureSlider.value);
        const humidity = parseFloat(humiditySlider.value);
        const soilMoisture = soilMoistureSlider ? parseFloat(soilMoistureSlider.value) : 50.0;

        // Validate ranges
        if (temperature < 10 || temperature > 50) {
            showNotification('❌ Temperature must be between 10-50°C', 'error');
            return;
        }
        if (humidity < 0 || humidity > 100) {
            showNotification('❌ Humidity must be between 0-100%', 'error');
            return;
        }
        if (soilMoisture < 0 || soilMoisture > 100) {
            showNotification('❌ Soil Moisture must be between 0-100%', 'error');
            return;
        }

        // Show loading state
        const spinner = document.getElementById('btnSpinner');
        spinner.classList.remove('hidden');
        predictBtn.disabled = true;

        try {
            // Prepare form data
            const formData = new FormData();
            formData.append('file', selectedImage);
            formData.append('temperature', temperature);
            formData.append('humidity', humidity);
            formData.append('soil_moisture', soilMoisture);

            // Call API
            showNotification('🔄 Analyzing your plant image...', 'info');
            const result = await apiClient.predictDisease(formData);
            
            lastPredictionResult = result;
            displayResults(result);
            showNotification('✅ Prediction complete!', 'success');

        } catch (error) {
            console.error('Error:', error);
            showNotification(`❌ ${error.message}`, 'error');
        } finally {
            spinner.classList.add('hidden');
            predictBtn.disabled = false;
        }
    }

    // ============================================
    // DISPLAY RESULTS
    // ============================================
    function displayResults(data) {
        // Disease Information
        document.getElementById('diseaseName').textContent = data.disease;
        document.getElementById('confidenceText').textContent = `Confidence: ${(data.confidence * 100).toFixed(2)}%`;
        
        // Confidence bar animation
        const confidenceFill = document.getElementById('confidenceFill');
        confidenceFill.style.width = '0%';
        setTimeout(() => {
            confidenceFill.style.width = (data.confidence * 100) + '%';
        }, 100);

        // Environmental info
        document.getElementById('conditionInfo').textContent = 
            `Temperature: ${data.temperature}°C, Humidity: ${data.humidity}%, Soil Moisture: ${data.soil_moisture}%`;
        
        // Risk level
        const riskLevelEl = document.getElementById('riskLevel');
        const riskLevel = data.environmental_risk || 'unknown';
        riskLevelEl.textContent = `Risk Level: ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}`;
        riskLevelEl.className = `risk-level ${riskLevel}`;
        
        // Environmental factor
        const envFactorEl = document.getElementById('envFactor');
        if (envFactorEl) {
            envFactorEl.textContent = `Environmental Influence: ${data.environmental_factor || 'Unknown'}`;
        }

        // Advisory information
        const advisory = data.advisory || {};
        document.getElementById('pathogenType').textContent = advisory.pathogen_type || 'Unknown';
        document.getElementById('urgency').textContent = advisory.severity || 'Medium';
        document.getElementById('cause').textContent = advisory.cause || 'Information not available';
        document.getElementById('cure').textContent = advisory.cure || 'Consult agricultural specialist';
        document.getElementById('prevention').textContent = advisory.prevention || 'Implement standard disease management practices';

        // Show results section
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // ============================================
    // RESULTS ACTIONS
    // ============================================
    clearBtn.addEventListener('click', () => {
        clearImagePreview();
        resultsSection.style.display = 'none';
        navigateToSection('upload');
    });

    downloadBtn.addEventListener('click', downloadReport);

    function downloadReport() {
        if (!lastPredictionResult) {
            showNotification('❌ No prediction data to download', 'error');
            return;
        }

        const report = generateReport(lastPredictionResult);
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
        element.setAttribute('download', `AgriSurgeon_Report_${new Date().toISOString().split('T')[0]}.txt`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        showNotification('✅ Report downloaded successfully!', 'success');
    }

    function generateReport(data) {
        const timestamp = new Date().toLocaleString();
        const advisory = data.advisory || {};

        return `
╔════════════════════════════════════════════════════════════════╗
║           AGRISURGEON - PLANT DISEASE DIAGNOSIS REPORT          ║
╚════════════════════════════════════════════════════════════════╝

Generated: ${timestamp}
Version: 2.0.0

═══════════════════════════════════════════════════════════════
DISEASE IDENTIFICATION
═══════════════════════════════════════════════════════════════
Disease: ${data.disease}
Confidence: ${(data.confidence * 100).toFixed(2)}%

═══════════════════════════════════════════════════════════════
ENVIRONMENTAL CONDITIONS
═══════════════════════════════════════════════════════════════
Temperature: ${data.temperature}°C
Humidity: ${data.humidity}%
Soil Moisture: ${data.soil_moisture}%
Environmental Factor: ${data.environmental_factor || 'Unknown'}
Risk Level: ${(data.environmental_risk || 'unknown').toUpperCase()}

═══════════════════════════════════════════════════════════════
DISEASE ADVISORY
═══════════════════════════════════════════════════════════════
Pathogen Type: ${advisory.pathogen_type || 'Unknown'}
Severity: ${advisory.severity || 'Unknown'}

Cause:
${advisory.cause || 'Information not available'}

Treatment & Cure:
${advisory.cure || 'Consult agricultural specialist'}

Prevention Strategies:
${advisory.prevention || 'Implement standard disease management practices'}

═══════════════════════════════════════════════════════════════
MODEL INFORMATION
═══════════════════════════════════════════════════════════════
Model Version: ${data.model_version || '2.0.0'}
Architecture: MobileNetV3 + SVM Hybrid with IoT Integration
Accuracy: 98.50%

═══════════════════════════════════════════════════════════════
DISCLAIMER
═══════════════════════════════════════════════════════════════
This diagnosis is provided for informational purposes only.
For critical agricultural decisions, please consult with
qualified agricultural specialists and phytopathologists.

╚════════════════════════════════════════════════════════════════╝
        `;
    }

    // ============================================
    // PREDICTION HISTORY
    // ============================================
    async function loadPredictionHistory() {
        try {
            const historyContainer = document.getElementById('historyContainer');
            if (!historyContainer) return;

            const historyData = await apiClient.getHistory();
            
            if (!historyData || historyData.count === 0) {
                historyContainer.innerHTML = '<p class="empty-state">No prediction history yet. Start by analyzing a plant image.</p>';
                return;
            }

            let historyHTML = '<div class="history-grid">';
            
            historyData.history.forEach((entry, index) => {
                historyHTML += `
                    <div class="history-card glass-effect">
                        <div class="history-number">#${index + 1}</div>
                        <div class="history-content">
                            <h4 class="history-disease">${entry.disease}</h4>
                            <div class="history-details">
                                <p><strong>Confidence:</strong> ${(entry.confidence * 100).toFixed(2)}%</p>
                                <p><strong>Temperature:</strong> ${entry.temperature}°C</p>
                                <p><strong>Humidity:</strong> ${entry.humidity}%</p>
                                <p><strong>Soil Moisture:</strong> ${entry.soil_moisture}%</p>
                                <p><strong>Risk Level:</strong> <span class="risk-badge ${entry.environmental_risk}">${entry.environmental_risk}</span></p>
                                <p><strong>Time:</strong> ${new Date(entry.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            historyHTML += '</div>';
            historyContainer.innerHTML = historyHTML;

        } catch (error) {
            console.error('Error loading history:', error);
            const historyContainer = document.getElementById('historyContainer');
            if (historyContainer) {
                historyContainer.innerHTML = '<p class="empty-state error">Error loading history. Please try again.</p>';
            }
        }
    }

    // Clear history button
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all prediction history?')) {
                try {
                    await apiClient.clearHistory();
                    showNotification('✅ History cleared successfully!', 'success');
                    loadPredictionHistory();
                } catch (error) {
                    showNotification('❌ Error clearing history', 'error');
                }
            }
        });
    }

    // ============================================
    // NOTIFICATIONS
    // ============================================
    function showNotification(message, type = 'info') {
        notification.textContent = message;
        notification.style.display = 'block';
        notification.className = `notification ${type}`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }
});
