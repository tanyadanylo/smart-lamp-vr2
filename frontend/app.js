const BACKEND_URL = '';

const toggleNightMode = document.getElementById('toggle-night-mode');
const thresholdSection = document.getElementById('threshold-section');
const sliderThreshold = document.getElementById('slider-threshold');
const thresholdVal = document.getElementById('threshold-val');

const btnToggleAnalytics = document.getElementById('btn-toggle-analytics');
const dashboardSection = document.getElementById('dashboard-section');

const btnOpenAddPreset = document.getElementById('btn-open-add-preset');
const btnCloseAddPreset = document.getElementById('btn-close-add-preset');
const presetModal = document.getElementById('preset-modal');
const formAddPreset = document.getElementById('form-add-preset');

const presetBrightness = document.getElementById('preset-brightness');
const presetBrightnessVal = document.getElementById('preset-brightness-val');
const presetsList = document.getElementById('presets-list');

toggleNightMode.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    thresholdSection.style.display = isEnabled ? 'block' : 'none';
    try {
        await fetch(`${BACKEND_URL}/api/nightmode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: isEnabled, threshold: parseInt(sliderThreshold.value) })
        });
    } catch (error) { console.error("Помилка:", error); }
});

sliderThreshold.addEventListener('input', (e) => thresholdVal.innerText = `${e.target.value}%`);

sliderThreshold.addEventListener('change', async (e) => {
    if(toggleNightMode.checked) {
        await fetch(`${BACKEND_URL}/api/nightmode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true, threshold: parseInt(e.target.value) })
        });
    }
});

let selectedColorCmd = "COLOR_WHITE";

document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedColorCmd = btn.getAttribute('data-cmd');
        document.querySelectorAll('.color-btn').forEach(b => b.style.outline = 'none');
        btn.style.outline = '3px solid white';
    });
});

btnToggleAnalytics.addEventListener('click', () => {
    const isHidden = dashboardSection.style.display === 'none';
    dashboardSection.style.display = isHidden ? 'flex' : 'none';
    btnToggleAnalytics.innerText = isHidden ? 'Hide Analytics' : 'Show Analytics';
    if (isHidden) fetchSensorData();
});

btnOpenAddPreset.addEventListener('click', () => presetModal.style.display = 'flex');
btnCloseAddPreset.addEventListener('click', () => presetModal.style.display = 'none');
presetBrightness.addEventListener('input', (e) => presetBrightnessVal.innerText = `${e.target.value}%`);

async function sendCommand(actionType) {
    try {
        await fetch(`${BACKEND_URL}/api/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: actionType })
        });
    } catch (error) { console.error("Помилка:", error); }
}

async function fetchPresets() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/presets`);
        const presets = await response.json();
        presetsList.innerHTML = ''; 
        if (presets.length === 0) {
            presetsList.innerHTML = '<p style="color: #888;">No presets found.</p>';
            return;
        }
        presets.forEach(preset => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            card.style.borderLeftColor = preset.color;
            card.innerHTML = `
                <button class="delete-preset-icon" onclick="deletePreset(${preset.id}, event)">✕</button>
                <div class="preset-info">
                    <span>${preset.name}</span>
                    <span class="preset-brightness-text">${preset.brightness}%</span>
                </div>
                <button class="apply-btn" onclick="applyPreset('${preset.color}')">Apply</button>
            `;
            presetsList.appendChild(card);
        });
    } catch (error) { console.error("Помилка:", error); }
}

formAddPreset.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('preset-name').value;
    const brightness = document.getElementById('preset-brightness').value;

    try {
        await fetch(`${BACKEND_URL}/api/presets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color: selectedColorCmd, brightness })
        });
        presetModal.style.display = 'none';
        document.getElementById('preset-name').value = '';
        fetchPresets(); 
    } catch (error) { console.error("Помилка:", error); }
});

window.deletePreset = async (id, event) => {
    event.stopPropagation();
    await fetch(`${BACKEND_URL}/api/presets/${id}`, { method: 'DELETE' });
    fetchPresets();
};

window.applyPreset = (command) => {
    sendCommand(command); 
};

let lightChart = null;
async function fetchSensorData() {
    if (dashboardSection.style.display === 'none') return;
    try {
        const response = await fetch(`${BACKEND_URL}/api/sensor`);
        let data = await response.json();
        
        if (!data || data.length === 0) return;

        const labels = data.map((_, index) => {
            const minAgo = Math.floor((data.length - index) * 10 / 60);
            return minAgo > 0 ? `${minAgo}m ago` : `${(data.length - index) * 10}s ago`;
        });
        
        const values = data.map(item => item.light_level_percent);

        if (!lightChart) {
            const ctx = document.getElementById('lightChart').getContext('2d');
            lightChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Light Level (%)',
                        data: values,
                        borderColor: '#00bfff',
                        backgroundColor: 'rgba(0, 191, 255, 0.2)',
                        borderWidth: 2,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { min: 0, max: 100, ticks: { color: '#888' }, grid: { color: '#333' } },
                        x: { 
                            ticks: { 
                                color: '#888', 
                                maxRotation: 0, 
                                autoSkip: true,
                                maxTicksLimit: 5 
                            }, 
                            grid: { display: false } 
                        }
                    },
                    plugins: { legend: { display: true, labels: { color: '#888' } } }
                }
            });
        } else {
            lightChart.data.labels = labels;
            lightChart.data.datasets[0].data = values;
            lightChart.update();
        }
    } catch (error) { console.error("Помилка аналітики:", error); }
}

fetchPresets();
setInterval(fetchSensorData, 10000);