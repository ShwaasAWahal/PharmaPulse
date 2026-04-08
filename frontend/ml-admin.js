// ============================================================
// PHARMA PULSE – ML ADMIN PANEL
// Sales Prediction | Alternate Medicine | Recommendations
// ============================================================

// ── Shared helpers ────────────────────────────────────────────

function mlShowNotification(message, type = 'info') {
    const colours = { success: '#22C55E', error: '#EF4444', info: '#3B82F6', warning: '#F59E0B' };
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:80px;right:20px;background:${colours[type] || colours.info};
        color:white;padding:.9rem 1.4rem;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.18);
        z-index:9999;max-width:340px;font-weight:500;font-size:.92rem;animation:mlSlideIn .25s ease`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 4000);
}

function mlLoading(containerId, msg = 'Loading…') {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `
        <div style="display:flex;align-items:center;gap:.75rem;padding:2rem;color:#6C757D;font-size:.95rem">
            <div class="ml-spinner"></div> ${msg}
        </div>`;
}

function mlError(containerId, msg) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<div style="padding:1.5rem;color:#EF4444;font-size:.92rem">⚠️ ${msg}</div>`;
}

// ── API calls ─────────────────────────────────────────────────

async function mlApiPost(path, body) {
    return apiService.request(path, { method: 'POST', body });
}

async function mlApiGet(path) {
    return apiService.request(path);
}

// ================================================================
//  1. SALES PREDICTION
// ================================================================

async function displayMLSection() {
    await loadSalesPrediction();
}

async function loadSalesPrediction(horizonDays = 30) {
    // document.getElementById('salesLoadingInit').style.display = 'flex';
    // document.getElementById('salesPredictionResult').style.display = 'none';
    // mlLoading('salesPredictionResult', 'Running sales forecast model…');
    document.getElementById('salesLoadingInit').style.display = 'flex';
    document.getElementById('salesPredictionResult').style.display = 'none';

    try {
        const resp = await mlApiPost('/ml/predict-demand', { horizon_days: horizonDays });
        console.log("ML API response:", resp);
        if (!resp.success) throw new Error(resp.message);

        const { predictions, total_predicted_sales, avg_daily_sales, horizon_days, model_info } = resp;

        // Summary cards
        document.getElementById('spTotalSales').textContent = total_predicted_sales?.toLocaleString('en-IN') ?? '—';
        document.getElementById('spAvgDaily').textContent = avg_daily_sales?.toLocaleString('en-IN') ?? '—';
        document.getElementById('spDays').textContent = horizon_days ?? horizonDays;
        document.getElementById('spModel').textContent = model_info?.model ?? 'Linear Regression';

        // Chart
        renderSalesChart(predictions, horizon_days);

        // Table (first 10 rows)
        renderSalesTable(predictions.slice(0, 10));

        document.getElementById('salesLoadingInit').style.display = 'none';
        document.getElementById('salesPredictionResult').style.display = 'block';

    } catch (e) {
        mlError('salesPredictionResult', 'Could not load predictions. Is the backend running? ' + e.message);
    }
}

function renderSalesChart(predictions, days) {
    const container = document.getElementById('spChartBars');
    if (!container || !predictions?.length) return;

    // Sample up to 30 points evenly
    const step = Math.max(1, Math.floor(predictions.length / 30));
    const sample = predictions.filter((_, i) => i % step === 0).slice(0, 30);
    const maxVal = Math.max(...sample.map(p => p.predicted_sales), 1);

    container.innerHTML = sample.map((p, i) => {
        const pct = ((p.predicted_sales / maxVal) * 100).toFixed(1);
        return `
        <div class="sp-bar-wrap" title="Day ${p.day}: ₹${p.predicted_sales}">
            <div class="sp-bar" style="height:${pct}%" data-val="${p.predicted_sales}"></div>
            <span class="sp-bar-label">D${p.day}</span>
        </div>`;
    }).join('');

    // Animate bars after render
    requestAnimationFrame(() => {
        document.querySelectorAll('.sp-bar').forEach((bar, i) => {
            bar.style.animationDelay = `${i * 30}ms`;
            bar.classList.add('sp-bar-animate');
        });
    });
}

function renderSalesTable(rows) {
    const tbody = document.getElementById('spTableBody');
    if (!tbody) return;
    tbody.innerHTML = rows.map(r => `
        <tr>
            <td style="color:#6C757D">Day ${r.day}</td>
            <td><strong style="color:var(--primary-color)">₹${Number(r.predicted_sales).toLocaleString('en-IN')}</strong></td>
            <td>
                <div style="background:#f0f0f0;border-radius:4px;height:8px;width:120px;overflow:hidden">
                    <div style="width:${Math.min(100, (r.predicted_sales / 500) * 100)}%;height:100%;background:var(--primary-color);border-radius:4px"></div>
                </div>
            </td>
        </tr>`).join('');
}

// Horizon selector event
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('spHorizonSelect')?.addEventListener('change', (e) => {
        loadSalesPrediction(parseInt(e.target.value));
    });

    document.getElementById('spRunBtn')?.addEventListener('click', () => {
        const val = parseInt(document.getElementById('spHorizonSelect')?.value || 30);
        loadSalesPrediction(val);
    });
});

// ================================================================
//  2. ALTERNATE MEDICINE FINDER
// ================================================================

async function searchAlternateMedicines(query) {
    if (!query || query.length < 2) return;

    const suggestBox = document.getElementById('altSuggestBox');
    suggestBox.innerHTML = '<div style="padding:.5rem 1rem;color:#999;font-size:.88rem">Searching…</div>';
    suggestBox.style.display = 'block';

    try {
        const resp = await mlApiGet(`/ml/search-medicine?q=${encodeURIComponent(query)}&limit=8`);
        if (!resp.success || !resp.medicines?.length) {
            suggestBox.innerHTML = '<div style="padding:.5rem 1rem;color:#999;font-size:.88rem">No medicines found.</div>';
            return;
        }

        suggestBox.innerHTML = resp.medicines.map(m => `
            <div class="alt-suggest-item" onclick="selectAltMedicine('${m.name.replace(/'/g, "\\'")}')">
                <span class="alt-suggest-name">${m.name}</span>
                <span class="alt-suggest-meta">${m.manufacturer || ''}</span>
            </div>`).join('');
    } catch (e) {
        suggestBox.style.display = 'none';
    }
}

function selectAltMedicine(name) {
    document.getElementById('altSearchInput').value = name;
    document.getElementById('altSuggestBox').style.display = 'none';
    fetchAlternatives(name);
}

async function fetchAlternatives(name) {
    if (!name) return;
    mlLoading('altResults', 'Finding generic alternatives…');

    try {
        const resp = await mlApiPost('/ml/recommend-generic', { brand_medicine_name: name });

        if (!resp.success) {
            mlError('altResults', resp.message || 'Medicine not found in dataset.');
            return;
        }

        const r = resp.result;
        document.getElementById('altResults').innerHTML = `
            <div class="alt-medicine-card">
                <div class="alt-medicine-header">
                    <div>
                        <h3 class="alt-medicine-title">${r.medicine}</h3>
                        <p class="alt-medicine-sub">${r.composition || 'Composition not available'}</p>
                    </div>
                    <div class="alt-price-badge">₹${r.price ?? '—'}</div>
                </div>

                <div class="alt-meta-row">
                    ${r.manufacturer ? `<span class="alt-tag">🏭 ${r.manufacturer}</span>` : ''}
                    ${r.type ? `<span class="alt-tag">💊 ${r.type}</span>` : ''}
                    ${r.pack_size ? `<span class="alt-tag">📦 ${r.pack_size}</span>` : ''}
                    ${r.is_discontinued ? `<span class="alt-tag alt-tag-warn">⚠️ Discontinued</span>` : ''}
                </div>

                <div class="alt-substitutes">
                    <h4 class="alt-sub-heading">Generic / Substitute Alternatives (${r.alternatives_count})</h4>
                    ${r.alternatives?.length
                ? `<div class="alt-sub-grid">
                            ${r.alternatives.map((a, i) => `
                                <div class="alt-sub-item" style="animation-delay:${i * 60}ms">
                                    <span class="alt-sub-num">${i + 1}</span>
                                    <span class="alt-sub-name">${a}</span>
                                    <button class="alt-copy-btn" onclick="copyToClipboard('${a.replace(/'/g, "\\'")}', this)" title="Copy name">⧉</button>
                                </div>`).join('')}
                          </div>`
                : '<p style="color:#6C757D;font-style:italic;margin-top:.5rem">No substitutes found for this medicine.</p>'
            }
                </div>
            </div>`;
    } catch (e) {
        mlError('altResults', 'Error fetching alternatives: ' + e.message);
    }
}

function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✓';
        btn.style.color = '#22C55E';
        setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1500);
    });
}

// Input debounce
let altDebounce = null;
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('altSearchInput');
    const box = document.getElementById('altSuggestBox');

    input?.addEventListener('input', (e) => {
        clearTimeout(altDebounce);
        const q = e.target.value.trim();
        if (q.length < 2) { box.style.display = 'none'; return; }
        altDebounce = setTimeout(() => searchAlternateMedicines(q), 350);
    });

    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            box.style.display = 'none';
            fetchAlternatives(input.value.trim());
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#altSearchWrapper')) box.style.display = 'none';
    });

    document.getElementById('altSearchBtn')?.addEventListener('click', () => {
        box.style.display = 'none';
        fetchAlternatives(input?.value?.trim());
    });
});

// ================================================================
//  3. RECOMMENDATION SYSTEM (Bought-Together)
// ================================================================

async function loadKnownMedicines() {
    try {
        const resp = await mlApiGet('/ml/known-medicines');
        if (!resp.success) return [];
        return resp.medicines || [];
    } catch { return []; }
}

let recAllMeds = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Pre-load known medicines for datalist
    recAllMeds = await loadKnownMedicines();
    const dl = document.getElementById('recMedDatalist');
    if (dl) dl.innerHTML = recAllMeds.map(m => `<option value="${m}">`).join('');

    document.getElementById('recSearchBtn')?.addEventListener('click', fetchRecommendations);
    document.getElementById('recMedInput')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') fetchRecommendations();
    });
});

async function fetchRecommendations() {
    const input = document.getElementById('recMedInput');
    const name = input?.value?.trim();
    if (!name) { mlShowNotification('Please enter a medicine name.', 'warning'); return; }

    mlLoading('recResults', 'Analysing purchase patterns…');

    try {
        const resp = await mlApiPost('/ml/recommend-together', { medicine_name: name });
        console.log(resp)

        if (!resp.success) {
            mlError('recResults', resp.message || 'No recommendations found.');
            return;
        }

        // const { medicine_name: med, recommendations, total_found } = resp;
        const med = name; // 🔥 always use input
        const { recommendations, total_found } = resp;

        if (!recommendations?.length) {
            document.getElementById('recResults').innerHTML = `
                <div style="padding:2rem;text-align:center;color:#6C757D">
                    <div style="font-size:2.5rem;margin-bottom:.75rem">🔍</div>
                    <p>No frequently bought-together patterns found for <strong>${med}</strong>.</p>
                    <p style="font-size:.88rem;margin-top:.5rem">Try a more common medicine from the dataset.</p>
                </div>`;
            return;
        }

        document.getElementById('recResults').innerHTML = `
            <div class="rec-header">
                <span class="rec-query-badge">📦 ${med}</span>
                <span class="rec-count">${total_found} association rule${total_found !== 1 ? 's' : ''} found</span>
            </div>
            <div class="rec-grid">
                ${recommendations.map((r, i) => {
                    const medName = r.medicine || "Unknown";

                    return `
            <div class="rec-card" style="animation-delay:${i * 70}ms">
                <div class="rec-card-rank">#${i + 1}</div>
                <div class="rec-card-name">${medName}</div>

                <div class="rec-metrics">
                    <div class="rec-metric">
                        <span class="rec-metric-label">Confidence</span>
                        <div class="rec-metric-bar">
                            <div class="rec-metric-fill" style="width:${((r.confidence || 0) * 100).toFixed(0)}%"></div>
                        </div>
                        <span>${(r.confidence * 100).toFixed(1)}%</span>
                    </div>
                </div>

                <button class="rec-add-btn" data-name="${medName || ''}">
                    Also find for this →
                </button>
            </div>`;
                }).join('')}
            </div>`;
    } catch (e) {
        mlError('recResults', 'Error: ' + e.message);
    }
}

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("rec-add-btn")) {

        const name = e.target.dataset.name;
        if (!name || name === "Unknown") {
            console.warn("Invalid medicine name:", name);
            return;
        }

        recAddToSearch(name);;
    }
});

function recAddToSearch(name) {
    if (!name) {
        console.warn("recAddToSearch called with invalid name");
        return;
    }

    const input = document.getElementById('recMedInput');

    if (input) {
        input.value = name;
        fetchRecommendations();
    }
}

// ── ML Status check ───────────────────────────────────────────

async function checkMLStatus() {
    const bar = document.getElementById('mlStatusBar');
    if (!bar) return;
    try {
        const resp = await mlApiGet('/ml/status');
        const { overall, models } = resp;
        const colour = overall === 'ok' ? '#22C55E' : '#F59E0B';
        bar.innerHTML = `
            <span style="color:${colour};font-weight:600">● ML Status: ${overall.toUpperCase()}</span>
            ${Object.entries(models).map(([k, v]) => `
                <span style="margin-left:1rem;font-size:.82rem;color:${v.status === 'ok' ? '#22C55E' : '#EF4444'}">
                    ${k === 'demand_predictor' ? '📈' : k === 'alternate_medicine' ? '💊' : '🛒'} ${v.status}
                </span>`).join('')}`;
    } catch {
        bar.innerHTML = `<span style="color:#EF4444;font-weight:600">● ML backend unreachable</span>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".ml-tab");
    const panels = document.querySelectorAll(".ml-panel");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.panel;

            // Remove active from all
            tabs.forEach(t => t.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active"));

            // Activate clicked tab
            tab.classList.add("active");
            document.getElementById(`panel-${target}`).classList.add("active");
        });
    });
});