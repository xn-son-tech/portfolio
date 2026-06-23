function initAdmin() {
    // --- 1. PARTICLES CANVAS BACKGROUND ---
    const canvas = document.getElementById("particles-canvas");
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const maxParticles = 40; // Less particles for admin screen performance

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 2 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx = -this.vx;
            if (this.y < 0 || this.y > height) this.vy = -this.vy;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 242, 254, 0.3)";
            ctx.fill();
        }
    }

    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 242, 254, ${0.1 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach((p) => {
            p.update();
            p.draw();
        });
        drawConnections();
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });


    // --- 2. AUTHENTICATION SHIELD ---
    const loginScreen = document.getElementById("login-screen");
    const dashboardScreen = document.getElementById("dashboard-screen");
    const loginForm = document.getElementById("login-form");
    const adminPasscode = document.getElementById("admin-passcode");
    const authError = document.getElementById("auth-error");
    const btnLogout = document.getElementById("btn-logout");

    // Check existing authorization session
    if (sessionStorage.getItem("admin_authenticated") === "true") {
        unlockDashboard();
    }

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const enteredPassword = adminPasscode.value.trim();

        // Passcode verification
        if (enteredPassword === "admin") {
            sessionStorage.setItem("admin_authenticated", "true");
            authError.textContent = "";
            adminPasscode.value = "";
            unlockDashboard();
        } else {
            authError.textContent = "[ERROR] Access Denied: Invalid credentials.";
            adminPasscode.value = "";
            adminPasscode.focus();
            // Blinking red alert effect on card
            const loginCard = document.querySelector(".login-card");
            loginCard.style.borderColor = "var(--color-red)";
            setTimeout(() => {
                loginCard.style.borderColor = "rgba(239, 68, 68, 0.2)";
            }, 1000);
        }
    });

    btnLogout.addEventListener("click", () => {
        sessionStorage.removeItem("admin_authenticated");
        location.reload();
    });


    // --- 3. DIAGNOSTICS & SYSTEM DASHBOARD ---
    let totalVisitorsCount = 0;
    let trafficChartInstance = null;
    let sourcesChartInstance = null;

    function unlockDashboard() {
        loginScreen.classList.add("hidden");
        dashboardScreen.classList.remove("hidden");
        
        // Fetch values
        loadVisitorStats();
        
        // Init graphs
        initCharts();
        
        // Init access feed
        startAccessLogFeed();
    }

    function loadVisitorStats() {
        const namespace = "son-hoang-xuan-portfolio";
        const key = "visits";
        const fallbackKey = "portfolio_fallback_visits";

        // Read total from localStorage first for instant display
        const lastLocalCount = parseInt(localStorage.getItem("portfolio_last_count"), 10) || 120;
        updateCountsUI(lastLocalCount);

        // Fetch real-time count
        fetch(`https://api.counterapi.dev/v1/${namespace}/${key}`)
            .then(res => {
                if (!res.ok) throw new Error("API error");
                return res.json();
            })
            .then(data => {
                if (data && typeof data.count === "number") {
                    totalVisitorsCount = data.count;
                    localStorage.setItem("portfolio_last_count", totalVisitorsCount);
                    updateCountsUI(totalVisitorsCount);
                    updateTimelineChart(totalVisitorsCount);
                }
            })
            .catch(err => {
                console.warn("[Admin Dashboard] API failed, using fallback count. Error:", err);
                // Fallback to localStorage values
                let fallbackCount = parseInt(localStorage.getItem(fallbackKey), 10);
                if (!fallbackCount) {
                    fallbackCount = lastLocalCount;
                }
                totalVisitorsCount = fallbackCount;
                updateCountsUI(fallbackCount);
                updateTimelineChart(fallbackCount);
            });
    }

    function updateCountsUI(count) {
        document.getElementById("dashboard-visitors-count").textContent = count;
        // Unique sessions estimation (85% of total views)
        const sessions = Math.round(count * 0.85);
        document.getElementById("dashboard-sessions-count").textContent = sessions;
    }


    // --- 4. CHART.JS CONFIGURATION ---
    function initCharts() {
        const ctxTraffic = document.getElementById("trafficChart").getContext("2d");
        const ctxSources = document.getElementById("sourcesChart").getContext("2d");

        // Dynamic gradient for line chart
        const gradientLine = ctxTraffic.createLinearGradient(0, 0, 0, 250);
        gradientLine.addColorStop(0, "rgba(0, 242, 254, 0.4)");
        gradientLine.addColorStop(1, "rgba(7, 10, 19, 0)");

        // 7 Days visitor trends
        const labels = getPast7DaysLabels();
        const dummyData = generateDailyDistribution(totalVisitorsCount || 120);

        trafficChartInstance = new Chart(ctxTraffic, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Page Views',
                    data: dummyData,
                    borderColor: '#00f2fe',
                    borderWidth: 2,
                    backgroundColor: gradientLine,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#00f2fe',
                    pointHoverBackgroundColor: '#9061f9',
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.04)' },
                        ticks: { color: '#64748b', font: { family: 'Fira Code', size: 10 } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.04)' },
                        ticks: { color: '#64748b', font: { family: 'Fira Code', size: 10 } }
                    }
                }
            }
        });

        // Traffic sources doughnut chart
        sourcesChartInstance = new Chart(ctxSources, {
            type: 'doughnut',
            data: {
                labels: ['LinkedIn', 'GitHub', 'Direct Link', 'Google Search'],
                datasets: [{
                    data: [35, 25, 30, 10],
                    backgroundColor: ['#9061f9', '#00f2fe', '#10b981', '#fbbf24'],
                    borderColor: '#070a13',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Inter', size: 11 },
                            padding: 15
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    function getPast7DaysLabels() {
        const days = [];
        const locale = "en-US";
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }));
        }
        return days;
    }

    function generateDailyDistribution(total) {
        // Distribute total count into 7 chunks with randomized variance
        const distribution = [0.10, 0.12, 0.15, 0.11, 0.16, 0.18, 0.18];
        return distribution.map(pct => Math.round(total * pct));
    }

    function updateTimelineChart(total) {
        if (!trafficChartInstance) return;
        const distribution = generateDailyDistribution(total);
        trafficChartInstance.data.datasets[0].data = distribution;
        trafficChartInstance.update();
    }


    // --- 5. REAL-TIME LOG FEED SIMULATOR ---
    const terminalFeed = document.getElementById("terminal-feed");
    const btnToggleLog = document.getElementById("btn-toggle-log");
    const btnClearLog = document.getElementById("btn-clear-log");
    
    let isLogFeedActive = true;
    let logFeedInterval = null;

    const mockVisitors = [
        { ip: "113.190.48.204", city: "Hanoi", country: "VN", path: "/index.html", ref: "LinkedIn", ua: "Chrome/Windows" },
        { ip: "14.162.144.91", city: "Ho Chi Minh", country: "VN", path: "/index.html", ref: "Direct", ua: "Safari/iOS" },
        { ip: "104.244.75.12", city: "San Francisco", country: "US", path: "/Resume .NET - Son Hoang Xuan.pdf", ref: "LinkedIn", ua: "Chrome/Mac" },
        { ip: "207.46.13.84", city: "Seattle", country: "US", path: "/index.html", ref: "Google Search", ua: "Googlebot/2.1" },
        { ip: "185.190.140.5", city: "London", country: "UK", path: "/index.html", ref: "GitHub", ua: "Firefox/Linux" },
        { ip: "135.180.32.77", city: "Toronto", country: "CA", path: "/index.html", ref: "LinkedIn", ua: "Edge/Windows" },
        { ip: "116.14.92.115", city: "Singapore", country: "SG", path: "/index.html", ref: "Direct", ua: "Chrome/Android" },
        { ip: "210.12.80.35", city: "Tokyo", country: "JP", path: "/index.html", ref: "GitHub", ua: "Chrome/Linux" }
    ];

    const mockActions = [
        { text: "GET /index.html", type: "ok", code: "200 OK" },
        { text: "GET /projects.json", type: "ok", code: "200 OK" },
        { text: "GET /Resume .NET - Son Hoang Xuan.pdf", type: "info", code: "200 OK [CV Download]" },
        { text: "POST /contact-form (Execute Send)", type: "warn", code: "200 Message Dispatched" },
        { text: "GET /invalid-endpoint", type: "err", code: "404 Not Found" }
    ];

    function startAccessLogFeed() {
        // Add starting logs
        for (let i = 0; i < 5; i++) {
            appendRandomLog();
        }

        // Loop to append logs periodically
        logFeedInterval = setInterval(() => {
            if (isLogFeedActive) {
                appendRandomLog();
            }
        }, 3000);
    }

    function appendRandomLog(customIp = null, customAction = null) {
        const visitor = customIp ? { ip: customIp, city: "Local Sim", country: "DEV", ref: "Dashboard Control", ua: "Developer Console" } : mockVisitors[Math.floor(Math.random() * mockVisitors.length)];
        const action = customAction || mockActions[Math.floor(Math.random() * mockActions.length)];
        
        const timestamp = new Date().toLocaleTimeString();
        const logLine = document.createElement("div");
        logLine.className = "log-line";
        
        let typeClass = "log-ok";
        if (action.type === "warn") typeClass = "log-warn";
        if (action.type === "err") typeClass = "log-err";
        if (action.type === "info") typeClass = "log-info";

        logLine.innerHTML = `
            <span class="log-time">[${timestamp}]</span> 
            <span class="log-ip">${visitor.ip}</span> 
            (<span style="color:var(--text-secondary)">${visitor.city}, ${visitor.country}</span>) 
            - <span class="log-info">${visitor.ref}</span> 
            - <span class="${typeClass}">${action.text}</span> 
            [<span style="font-weight:bold">${action.code}</span>] 
            <span style="color:var(--text-muted)">- ${visitor.ua}</span>
        `;
        
        terminalFeed.appendChild(logLine);

        // Limit lines to 100
        while (terminalFeed.childNodes.length > 100) {
            terminalFeed.removeChild(terminalFeed.firstChild);
        }

        // Autoscroll to bottom
        terminalFeed.scrollTop = terminalFeed.scrollHeight;
    }

    btnToggleLog.addEventListener("click", () => {
        isLogFeedActive = !isLogFeedActive;
        if (isLogFeedActive) {
            btnToggleLog.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Feed';
            btnToggleLog.style.color = "var(--text-secondary)";
            btnToggleLog.style.borderColor = "var(--border-color)";
        } else {
            btnToggleLog.innerHTML = '<i class="fa-solid fa-play"></i> Resume Feed';
            btnToggleLog.style.color = "var(--color-neon-green)";
            btnToggleLog.style.borderColor = "var(--color-neon-green)";
        }
    });

    btnClearLog.addEventListener("click", () => {
        terminalFeed.innerHTML = "";
    });


    // --- 6. SETTINGS & DIAGNOSTIC CONTROLS ---
    const btnSimulateVisit = document.getElementById("btn-simulate-visit");
    const btnExportData = document.getElementById("btn-export-data");
    const btnResetCounter = document.getElementById("btn-reset-counter");

    btnSimulateVisit.addEventListener("click", () => {
        // Increment visitor count UI
        totalVisitorsCount++;
        updateCountsUI(totalVisitorsCount);
        updateTimelineChart(totalVisitorsCount);
        
        // Log the simulated visit in the feed
        const simIps = ["127.0.0.1", "192.168.1.50", "localhost"];
        const ip = simIps[Math.floor(Math.random() * simIps.length)];
        appendRandomLog(ip, { text: "GET /index.html", type: "ok", code: "200 OK (Simulated Visit)" });
        
        // Flash visual success
        btnSimulateVisit.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
        btnSimulateVisit.style.borderColor = "var(--color-neon-green)";
        setTimeout(() => {
            btnSimulateVisit.style.backgroundColor = "";
            btnSimulateVisit.style.borderColor = "";
        }, 600);
    });

    btnExportData.addEventListener("click", () => {
        const textLogs = Array.from(terminalFeed.querySelectorAll(".log-line")).map(el => el.innerText);
        const report = {
            timestamp: new Date().toISOString(),
            total_visits: totalVisitorsCount,
            unique_sessions: Math.round(totalVisitorsCount * 0.85),
            active_logs: textLogs
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `portfolio_admin_report_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    btnResetCounter.addEventListener("click", () => {
        const check = confirm("[WARNING] You are about to reset the visitor counter back to zero. This action updates CounterAPI database. Do you wish to execute?");
        if (check) {
            const namespace = "son-hoang-xuan-portfolio";
            const key = "visits";
            const fallbackKey = "portfolio_fallback_visits";

            // Update local fallback
            localStorage.setItem(fallbackKey, "0");
            localStorage.setItem("portfolio_last_count", "0");
            totalVisitorsCount = 0;
            updateCountsUI(0);
            updateTimelineChart(0);

            // Attempt to trigger CounterAPI set reset
            fetch(`https://api.counterapi.dev/v1/${namespace}/${key}/set?count=0`)
                .then(res => {
                    console.log("[Visitor Counter] Sent reset request to API");
                    appendRandomLog("SYSTEM", { text: "SET CounterAPI visits = 0", type: "warn", code: "200 Reset Dispatched" });
                })
                .catch(err => {
                    console.error("[Visitor Counter] Failed to reset API counter, local state reset completed:", err);
                    appendRandomLog("SYSTEM", { text: "SET Local counter = 0 (API unreachable)", type: "err", code: "500 API Reset Failed" });
                });
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdmin);
} else {
    initAdmin();
}
