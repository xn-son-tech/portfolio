document.addEventListener("DOMContentLoaded", () => {
    // --- 1. PARTICLES CANVAS BACKGROUND ---
    const canvas = document.getElementById("particles-canvas");
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const maxParticles = 60;

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
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
            ctx.fillStyle = "rgba(0, 242, 254, 0.45)";
            ctx.fill();
        }
    }

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }

    // Draw nodes connectivity
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 242, 254, ${0.15 * (1 - dist / 100)})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
    }

    // Animation Loop
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

    // Window Resize Handler
    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });


    // --- 2. TERMINAL TYPING NAV EMULATOR ---
    const typingCommand = document.getElementById("typing-command");
    const navItems = document.querySelectorAll(".nav-item");
    let isTyping = false;

    // Active link highlighting on scroll
    const sections = document.querySelectorAll("section");
    window.addEventListener("scroll", () => {
        let currentSectionId = "";
        const scrollPosition = window.scrollY + 120; // offset

        sections.forEach((sec) => {
            if (scrollPosition >= sec.offsetTop) {
                currentSectionId = sec.getAttribute("id");
            }
        });

        navItems.forEach((item) => {
            item.classList.remove("active");
            if (item.getAttribute("href") === `#${currentSectionId}`) {
                item.classList.add("active");
            }
        });
    });

    // Handle clicks with simulated typing
    navItems.forEach((item) => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            if (isTyping) return;

            const targetId = this.getAttribute("href");
            const command = this.getAttribute("data-cmd");
            const targetSection = document.querySelector(targetId);

            isTyping = true;
            typingCommand.textContent = "";
            let charIndex = 0;

            // Type effect
            const typingInterval = setInterval(() => {
                if (charIndex < command.length) {
                    typingCommand.textContent += command.charAt(charIndex);
                    charIndex++;
                } else {
                    clearInterval(typingInterval);
                    
                    // Simulate enter key action
                    setTimeout(() => {
                        // Smooth Scroll
                        window.scrollTo({
                            top: targetSection.offsetTop - 70,
                            behavior: "smooth"
                        });
                        
                        // Clear prompt and unlock typing
                        setTimeout(() => {
                            typingCommand.textContent = "";
                            isTyping = false;
                        }, 800);
                    }, 250);
                }
            }, 55);
        });
    });


    // --- 3. DYNAMIC PROJECTS LOADING, GROUPING & FILTERING ---
    const projectsContainer = document.getElementById("projects-container");
    const filterButtons = document.querySelectorAll(".filter-btn");
    let allProjects = [];

    // Fetch projects.json
    fetch("projects.json")
        .then((response) => response.json())
        .then((data) => {
            allProjects = data;
            renderProjects("all");
        })
        .catch((error) => {
            console.error("Error loading projects:", error);
            projectsContainer.innerHTML = `<p style="font-family:var(--font-mono);color:var(--color-red)">[ERROR] Failed to load projects.json database.</p>`;
        });

    // Bind Filter Click Events
    filterButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
            filterButtons.forEach((b) => b.classList.remove("active"));
            this.classList.add("active");
            const filterValue = this.getAttribute("data-filter");
            renderProjects(filterValue);
        });
    });

    // Grouping Definitions
    const GROUP_NAMES = {
        featured: "Featured AI & Research Systems",
        dotnet: "Enterprise .NET Core Architectures",
        fsoft: "FPT Software (Fsoft) Work Experience",
        academic: "Honors & Scientific Researches"
    };

    function renderProjects(filter) {
        projectsContainer.innerHTML = "";

        // Filter all projects
        const filtered = filter === "all" ? allProjects : allProjects.filter((p) => p.filterType === filter);

        // Grouping logic
        const groups = {
            featured: filtered.filter((p) => p.isFeatured),
            dotnet: filtered.filter((p) => p.filterType === "dotnet" && !p.isNationalAward),
            fsoft: filtered.filter((p) => p.filterType === "fsoft"),
            academic: filtered.filter((p) => p.isNationalAward || p.id === "traffic-sign-classification")
        };

        // Render each category group
        Object.keys(groups).forEach((groupKey) => {
            const groupProjects = groups[groupKey];
            if (groupProjects.length === 0) return;

            // Create Group Section container
            const groupSection = document.createElement("div");
            groupSection.className = "project-category-group";

            // Create Header for Group
            const header = document.createElement("h3");
            header.className = "project-category-header";
            header.textContent = GROUP_NAMES[groupKey];
            groupSection.appendChild(header);

            // Featured projects layout (alternating large cards)
            if (groupKey === "featured") {
                groupProjects.forEach((project, idx) => {
                    const card = document.createElement("div");
                    const isReverse = idx % 2 !== 0 ? " reverse-row" : "";
                    card.className = `project-card glass-card fade-in${isReverse}`;
                    card.setAttribute("data-project-id", project.id);

                    const techHTML = project.techStack.map((tech) => `<li>${tech}</li>`).join("");
                    const tagsHTML = project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("");

                    let widgetHTML = getWidgetHTML(project.interactiveType);

                    card.innerHTML = `
                        <div class="project-info">
                            <div class="project-tags">${tagsHTML}</div>
                            <h3 class="project-title">${project.title}</h3>
                            <div class="project-timeline-tag"><i class="fa-regular fa-calendar-days"></i> ${project.timeline}</div>
                            <p class="project-description" style="margin-top: 1rem;">${project.description}</p>
                            <ul class="project-tech-stack">${techHTML}</ul>
                            <div class="clickable-badge"><i class="fa-solid fa-circle-info"></i> Click card for details</div>
                        </div>
                        <div class="project-visual-container">${widgetHTML}</div>
                    `;

                    // Bind click for modal popup (excluding clicks on interactive widgets)
                    card.addEventListener("click", (e) => {
                        if (e.target.closest(".project-visual-container") || e.target.closest("button") || e.target.closest("input") || e.target.closest("label")) {
                            return; // Let widget interact normally
                        }
                        openProjectModal(project);
                    });

                    groupSection.appendChild(card);
                });
            } else {
                // Minor projects layout (grid layout)
                const grid = document.createElement("div");
                grid.className = "minor-projects-grid";

                groupProjects.forEach((project) => {
                    const item = document.createElement("div");
                    
                    // Highlights classes
                    let highlightClass = "";
                    let highlightBadge = "";
                    if (project.isGraduation) {
                        highlightClass = " graduation-highlight";
                        highlightBadge = `<div class="graduation-badge"><i class="fa-solid fa-graduation-cap"></i> Graduation Thesis</div><br>`;
                    } else if (project.isNationalAward) {
                        highlightClass = " national-award-highlight";
                        highlightBadge = `<div class="national-award-badge"><i class="fa-solid fa-trophy"></i> National Scientific Award</div><br>`;
                    }

                    let iconClass = "fa-solid fa-code";
                    if (project.tags.includes("C#") || project.tags.includes("ASP.NET Core API") || project.isGraduation) {
                        iconClass = "fa-solid fa-cubes";
                    } else if (project.tags.includes("Fsoft Work")) {
                        iconClass = "fa-solid fa-building-user";
                    } else if (project.isNationalAward) {
                        iconClass = "fa-solid fa-microchip";
                    }

                    const techHTML = project.techStack.map((tech) => `<li>${tech}</li>`).join("");

                    item.className = `minor-project-card glass-card fade-in${highlightClass}`;
                    item.setAttribute("data-project-id", project.id);
                    item.innerHTML = `
                        <div class="minor-project-header">
                            <i class="${iconClass} project-icon"></i>
                            <div class="project-links">
                                <i class="fa-solid fa-terminal"></i>
                            </div>
                        </div>
                        ${highlightBadge}
                        <h3>${project.title}</h3>
                        <div class="project-timeline-tag"><i class="fa-regular fa-calendar-days"></i> ${project.timeline}</div>
                        <p style="margin-top: 1rem;">${project.description}</p>
                        <ul class="minor-tech">${techHTML}</ul>
                        <div class="clickable-badge"><i class="fa-solid fa-circle-info"></i> Click for details</div>
                    `;

                    // Bind modal click
                    item.addEventListener("click", () => {
                        openProjectModal(project);
                    });

                    grid.appendChild(item);
                });

                groupSection.appendChild(grid);
            }

            projectsContainer.appendChild(groupSection);
        });

        // Re-initialize dynamic event handlers for active widgets
        initTrafficSimulator();
        initAudioSeparator();
        initTelegramBot();
    }

    function getWidgetHTML(type) {
        if (type === "traffic") {
            return `
                <div class="traffic-simulation-visual">
                    <div class="camera-stream-simulator">
                        <div class="stream-header">
                            <span class="live-indicator"><span class="pulse"></span> LIVE - CAMERA 04</span>
                            <span class="density-label">Density: <strong id="traffic-density-val">78% (Heavy Traffic)</strong></span>
                        </div>
                        <div class="camera-grid">
                            <div class="traffic-overlay-box car-box" style="top: 20%; left: 30%; width: 50px; height: 35px;">
                                <span class="box-label">Car: 98%</span>
                            </div>
                            <div class="traffic-overlay-box truck-box" style="top: 45%; left: 60%; width: 70px; height: 50px;">
                                <span class="box-label">Truck: 94%</span>
                            </div>
                            <div class="traffic-overlay-box motorbike-box" style="top: 70%; left: 20%; width: 30px; height: 25px;">
                                <span class="box-label">Motor: 91%</span>
                            </div>
                            <div class="road-grid-lines"></div>
                        </div>
                        <div class="simulation-controls">
                            <button class="btn-visual-action" id="btn-toggle-traffic-simulation"><i class="fa-solid fa-sliders"></i> Simulate Density</button>
                        </div>
                    </div>
                </div>`;
        } else if (type === "bss") {
            return `
                <div class="audio-separator-widget">
                    <div class="widget-header">
                        <span class="widget-title"><i class="fa-solid fa-compact-disc"></i> BSS Audio stems Player</span>
                        <span class="playback-timer" id="player-timer">00:00 / 00:15</span>
                    </div>
                    <div class="audio-waveform-container">
                        <svg class="waveform-svg" viewBox="0 0 300 80" id="waveform-svg">
                            <!-- Waveform bars rendered dynamically -->
                        </svg>
                    </div>
                    <div class="player-controls">
                        <button class="player-btn" id="player-btn-play" title="Play / Pause"><i class="fa-solid fa-play"></i></button>
                    </div>
                    <div class="stems-toggles">
                        <label class="stem-checkbox" id="stem-vocals">
                            <input type="checkbox" checked data-stem="vocals">
                            <span class="stem-label"><i class="fa-solid fa-microphone"></i> Vocals</span>
                        </label>
                        <label class="stem-checkbox" id="stem-drums">
                            <input type="checkbox" checked data-stem="drums">
                            <span class="stem-label"><i class="fa-solid fa-drum"></i> Drums</span>
                        </label>
                        <label class="stem-checkbox" id="stem-bass">
                            <input type="checkbox" checked data-stem="bass">
                            <span class="stem-label"><i class="fa-solid fa-guitar"></i> Bass</span>
                        </label>
                        <label class="stem-checkbox" id="stem-other">
                            <input type="checkbox" checked data-stem="other">
                            <span class="stem-label"><i class="fa-solid fa-sliders"></i> Other</span>
                        </label>
                    </div>
                </div>`;
        } else if (type === "invest-tool") {
            return `
                <div class="telegram-bot-widget">
                    <div class="telegram-widget-header">
                        <div class="bot-info-header">
                            <span class="bot-avatar"><i class="fa-solid fa-robot"></i></span>
                            <div>
                                <h4>InvestTool AI Bot</h4>
                                <span class="bot-status">online | automated</span>
                            </div>
                        </div>
                        <i class="fa-solid fa-paper-plane bot-telegram-logo"></i>
                    </div>
                    <div class="telegram-messages" id="bot-chat-container">
                        <div class="msg bot-msg">
                            Hello! I am InvestTool AI. Click a query below to get an automated report:
                        </div>
                    </div>
                    <div class="telegram-suggested-queries">
                        <button class="suggest-btn" data-query="market">📊 Market Analysis</button>
                        <button class="suggest-btn" data-query="signals">🔑 Check VIP Signals</button>
                        <button class="suggest-btn" data-query="help">ℹ️ Setup Guide</button>
                    </div>
                </div>`;
        }
        return "";
    }


    // --- 4. DETAILS MODAL LOGIC ---
    const modal = document.getElementById("project-details-modal");
    const modalContent = document.getElementById("modal-project-content");
    const modalCloseBtn = document.getElementById("btn-modal-close");
    const modalCloseDot = document.getElementById("modal-close-dot");
    const modalIdArg = document.getElementById("modal-project-id-arg");

    function openProjectModal(project) {
        modalIdArg.textContent = project.id;
        
        let badgesHTML = "";
        if (project.isGraduation) {
            badgesHTML += `<div class="graduation-badge" style="margin-bottom:0.5rem;"><i class="fa-solid fa-graduation-cap"></i> Graduation Project - High Distinction</div> `;
        }
        if (project.isNationalAward) {
            badgesHTML += `<div class="national-award-badge" style="margin-bottom:0.5rem;"><i class="fa-solid fa-trophy"></i> National Scientific Award Winner</div>`;
        }

        const techListHTML = project.techStack.map(tech => `<li>${tech}</li>`).join("");

        modalContent.innerHTML = `
            ${badgesHTML}
            <h2 class="modal-project-title">${project.title}</h2>
            <div class="modal-project-cat">${project.category}</div>
            
            <div class="modal-project-meta">
                <div class="meta-row">
                    <span class="meta-label">Timeline:</span>
                    <span class="meta-val">${project.timeline}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Module:</span>
                    <span class="meta-val">${project.isFeatured ? "Featured System" : "Core Module"}</span>
                </div>
            </div>

            <div class="modal-project-details-text">
                ${project.detailedDescription || project.description}
            </div>

            <div class="modal-project-tech">
                <h4>System Dependencies & Technologies:</h4>
                <ul class="modal-project-tech-list">${techListHTML}</ul>
            </div>
        `;

        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden"; // Prevent scrolling
    }

    function closeProjectModal() {
        modal.classList.add("hidden");
        document.body.style.overflow = ""; // Restore scrolling
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeProjectModal);
    if (modalCloseDot) modalCloseDot.addEventListener("click", closeProjectModal);
    
    // Close on clicking outside modal content
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeProjectModal();
            }
        });
    }


    // --- 5. WIDGET INITIALIZER: TRAFFIC SIMULATOR ---
    function initTrafficSimulator() {
        const toggleTrafficBtn = document.getElementById("btn-toggle-traffic-simulation");
        if (!toggleTrafficBtn) return;

        const trafficDensityVal = document.getElementById("traffic-density-val");
        const cameraGrid = document.querySelector(".camera-grid");

        const trafficStates = [
            {
                density: "32% (Fluid Flow)",
                boxes: [
                    { class: "car-box", top: "30%", left: "40%", w: "50px", h: "35px", label: "Car: 99%" }
                ]
            },
            {
                density: "78% (Heavy Traffic)",
                boxes: [
                    { class: "car-box", top: "20%", left: "30%", w: "50px", h: "35px", label: "Car: 98%" },
                    { class: "truck-box", top: "45%", left: "60%", w: "70px", h: "50px", label: "Truck: 94%" },
                    { class: "motorbike-box", top: "70%", left: "20%", w: "30px", h: "25px", label: "Motor: 91%" }
                ]
            },
            {
                density: "94% (Gridlock Congestion)",
                boxes: [
                    { class: "car-box", top: "15%", left: "10%", w: "50px", h: "35px", label: "Car: 97%" },
                    { class: "car-box", top: "25%", left: "45%", w: "48px", h: "34px", label: "Car: 94%" },
                    { class: "truck-box", top: "45%", left: "60%", w: "70px", h: "50px", label: "Truck: 94%" },
                    { class: "car-box", top: "50%", left: "25%", w: "50px", h: "35px", label: "Car: 91%" },
                    { class: "motorbike-box", top: "70%", left: "20%", w: "30px", h: "25px", label: "Motor: 91%" },
                    { class: "motorbike-box", top: "75%", left: "40%", w: "28px", h: "24px", label: "Motor: 87%" }
                ]
            }
        ];

        let currentTrafficStateIdx = 1;

        toggleTrafficBtn.addEventListener("click", () => {
            currentTrafficStateIdx = (currentTrafficStateIdx + 1) % trafficStates.length;
            const state = trafficStates[currentTrafficStateIdx];

            trafficDensityVal.textContent = state.density;
            
            if (currentTrafficStateIdx === 0) {
                trafficDensityVal.style.color = "var(--color-neon-green)";
            } else if (currentTrafficStateIdx === 1) {
                trafficDensityVal.style.color = "var(--color-yellow)";
            } else {
                trafficDensityVal.style.color = "var(--color-red)";
            }

            const existingBoxes = cameraGrid.querySelectorAll(".traffic-overlay-box");
            existingBoxes.forEach((box) => cameraGrid.removeChild(box));

            state.boxes.forEach((boxData) => {
                const box = document.createElement("div");
                box.className = `traffic-overlay-box ${boxData.class}`;
                box.style.top = boxData.top;
                box.style.left = boxData.left;
                box.style.width = boxData.w;
                box.style.height = boxData.h;

                const label = document.createElement("span");
                label.className = "box-label";
                label.textContent = boxData.label;
                
                box.appendChild(label);
                cameraGrid.appendChild(box);
            });
        });
    }


    // --- 6. WIDGET INITIALIZER: AUDIO SEPARATOR (BSS) ---
    let isPlaying = false;
    let playTimerInterval = null;
    let elapsedSeconds = 0;
    let animationFrameId = null;
    let bars = [];

    function initAudioSeparator() {
        const waveformSvg = document.getElementById("waveform-svg");
        if (!waveformSvg) return;

        const playBtn = document.getElementById("player-btn-play");
        const timerDisplay = document.getElementById("player-timer");
        const stemCheckboxes = document.querySelectorAll(".stem-checkbox input");

        const barCount = 45;
        const barWidth = 4;
        const barGap = 2.5;
        const svgHeight = 80;
        bars = [];
        isPlaying = false;
        elapsedSeconds = 0;

        waveformSvg.innerHTML = "";
        for (let i = 0; i < barCount; i++) {
            const x = i * (barWidth + barGap) + 5;
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", x);
            rect.setAttribute("y", svgHeight / 2 - 2);
            rect.setAttribute("width", barWidth);
            rect.setAttribute("height", 4);
            rect.setAttribute("rx", 2);
            rect.setAttribute("fill", "rgba(255, 255, 255, 0.15)");
            waveformSvg.appendChild(rect);
            bars.push(rect);
        }

        stemCheckboxes.forEach((cb) => {
            const label = cb.parentElement;
            cb.addEventListener("change", function () {
                if (this.checked) {
                    label.classList.add("active-stem");
                } else {
                    label.classList.remove("active-stem");
                }
            });
        });

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        gradient.setAttribute("id", "gradient-mix");
        gradient.setAttribute("x1", "0%");
        gradient.setAttribute("y1", "0%");
        gradient.setAttribute("x2", "100%");
        gradient.setAttribute("y2", "0%");
        
        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", "var(--color-dotnet)");
        
        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", "var(--color-ai)");

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        waveformSvg.appendChild(defs);

        playBtn.addEventListener("click", () => {
            if (isPlaying) {
                pauseAudio();
            } else {
                playAudio();
            }
        });

        function playAudio() {
            isPlaying = true;
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            
            playTimerInterval = setInterval(() => {
                elapsedSeconds++;
                if (elapsedSeconds > 15) {
                    resetAudio();
                } else {
                    const secStr = elapsedSeconds < 10 ? `0${elapsedSeconds}` : elapsedSeconds;
                    timerDisplay.textContent = `00:${secStr} / 00:15`;
                }
            }, 1000);

            animationFrameId = requestAnimationFrame(updateWaveform);
        }

        function pauseAudio() {
            isPlaying = false;
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            clearInterval(playTimerInterval);
            cancelAnimationFrame(animationFrameId);
        }

        function resetAudio() {
            pauseAudio();
            elapsedSeconds = 0;
            timerDisplay.textContent = "00:00 / 00:15";
            bars.forEach((bar) => {
                bar.setAttribute("y", svgHeight / 2 - 2);
                bar.setAttribute("height", 4);
                bar.setAttribute("fill", "rgba(255, 255, 255, 0.15)");
            });
        }

        function updateWaveform(time) {
            if (!isPlaying) return;

            const vocalsOn = document.querySelector('input[data-stem="vocals"]').checked;
            const drumsOn = document.querySelector('input[data-stem="drums"]').checked;
            const bassOn = document.querySelector('input[data-stem="bass"]').checked;
            const otherOn = document.querySelector('input[data-stem="other"]').checked;

            bars.forEach((bar, index) => {
                let heightMultiplier = 0;
                
                if (vocalsOn) {
                    heightMultiplier += Math.sin(time * 0.009 + index * 0.4) * 12 + 10;
                }
                if (drumsOn) {
                    const beat = Math.floor(time / 200) % 4;
                    const hit = (beat === 0 && index % 6 === 0) || (beat === 2 && index % 4 === 0);
                    heightMultiplier += hit ? 28 : Math.sin(time * 0.02 + index) * 4;
                }
                if (bassOn) {
                    heightMultiplier += Math.cos(time * 0.003 + index * 0.15) * 20 + 8;
                }
                if (otherOn) {
                    heightMultiplier += Math.sin(time * 0.005 + index * 0.8) * 8 + 3;
                }

                let barHeight = Math.max(4, Math.min(svgHeight - 10, heightMultiplier));
                
                if (!vocalsOn && !drumsOn && !bassOn && !otherOn) {
                    barHeight = 4;
                }

                const y = svgHeight / 2 - barHeight / 2;
                bar.setAttribute("y", y);
                bar.setAttribute("height", barHeight);
                
                if (vocalsOn && !drumsOn && !bassOn && !otherOn) {
                    bar.setAttribute("fill", "#f43f5e");
                } else if (drumsOn && !vocalsOn && !bassOn && !otherOn) {
                    bar.setAttribute("fill", "#eab308");
                } else if (bassOn && !vocalsOn && !drumsOn && !otherOn) {
                    bar.setAttribute("fill", "#8b5cf6");
                } else if (otherOn && !vocalsOn && !drumsOn && !bassOn) {
                    bar.setAttribute("fill", "#06b6d4");
                } else {
                    bar.setAttribute("fill", "url(#gradient-mix)");
                }
            });

            animationFrameId = requestAnimationFrame(updateWaveform);
        }
    }


    // --- 7. WIDGET INITIALIZER: TELEGRAM BOT SIMULATOR ---
    function initTelegramBot() {
        const botChatContainer = document.getElementById("bot-chat-container");
        if (!botChatContainer) return;

        const queryButtons = document.querySelectorAll(".suggest-btn");

        function appendMessage(text, sender) {
            const msgDiv = document.createElement("div");
            msgDiv.className = `msg ${sender}-msg`;
            msgDiv.innerHTML = text;
            botChatContainer.appendChild(msgDiv);
            botChatContainer.scrollTop = botChatContainer.scrollHeight;
        }

        function simulateBotResponse(query) {
            const typingBubble = document.createElement("div");
            typingBubble.className = "msg bot-msg typing-bubble";
            typingBubble.innerHTML = '<i class="fa-solid fa-ellipsis fa-bounce"></i> System typing...';
            botChatContainer.appendChild(typingBubble);
            botChatContainer.scrollTop = botChatContainer.scrollHeight;

            setTimeout(() => {
                if (botChatContainer.contains(typingBubble)) {
                    botChatContainer.removeChild(typingBubble);
                }
                
                let replyText = "";
                switch (query) {
                    case "market":
                        replyText = `📊 <strong>[AUTOMATED MARKET ANALYSIS REPORT]</strong><br>
                                     📅 Timestamp: 17/06/2026 09:00:00 EST<br>
                                     📈 <strong>VN-Index:</strong> 1,285.50 (Up +12.4 pts)<br>
                                     💡 <strong>AI Analysis:</strong> RSI = 58.6 indicators show a strong bullish momentum. MA20 cross above MA50 confirms mid-term buy index.<br>
                                     🔥 <strong>Action plan:</strong> Overweight technology (FPT, CMG) and public infrastructures. Cut-loss levels established at 1,250 support.`;
                        break;
                    case "signals":
                        replyText = `🔑 <strong>[VIP ALERTS - DETECTED BY CELERY WORKER]</strong><br>
                                     🚀 <strong>Asset:</strong> BTC/USDT<br>
                                     📡 <strong>Signal:</strong> BUY LONG (Consolidation breakout above local range)<br>
                                     🎯 <strong>Entry zone:</strong> $67,250<br>
                                     🏆 <strong>Targets:</strong> T1: $68,500 | T2: $69,800<br>
                                     🛑 <strong>Stop Loss:</strong> $65,700<br>
                                     📊 <em>Average success rate this week: 88.2% (Validated by automated Celery task backend).</em>`;
                        break;
                    case "help":
                        replyText = `ℹ️ <strong>[INVESTTOOL SYSTEM CONFIGURATION GUIDE]</strong><br>
                                     Follow these core steps to initialize the platform:<br>
                                     1. Clone source folders located under <code>D:\\works\\invest_tool</code>.<br>
                                     2. Configure variables in <code>backend/.env</code> (OpenAI APIs, Telegram tokens, Database URLs).<br>
                                     3. Fire command: <code>docker-compose up --build -d</code> to spin up FastAPI backend, Celery workers, Redis broker, and React frontend.<br>
                                     4. Port-forward using Ngrok to receive instant webhooks from Telegram API locally.`;
                        break;
                    default:
                        replyText = "Sorry, I didn't recognize that request. Use the suggestion buttons below.";
                }

                appendMessage(replyText, "bot");
            }, 1200);
        }

        queryButtons.forEach((btn) => {
            btn.addEventListener("click", function () {
                const query = this.getAttribute("data-query");
                const text = this.textContent;
                
                appendMessage(text, "user");
                simulateBotResponse(query);
            });
        });
    }


    // --- 8. SKILLS PROGRESS BARS ANIMATION ON SCROLL ---
    const progressBars = document.querySelectorAll(".skills-list .progress");
    
    progressBars.forEach((bar) => {
        const finalWidth = bar.style.width;
        bar.style.width = "0%";
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    bar.style.width = finalWidth;
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        observer.observe(bar.closest(".skills-card"));
    });


    // --- 9. CONTACT FORM SIMULATION ---
    const contactForm = document.getElementById("contact-form");
    const formSuccessMsg = document.getElementById("form-success-msg");

    if (contactForm) {
        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();
            
            const name = document.getElementById("form-name").value.trim();
            const email = document.getElementById("form-email").value.trim();
            const subject = document.getElementById("form-subject").value.trim();
            const msg = document.getElementById("form-message").value.trim();

            if (name && email && subject && msg) {
                contactForm.classList.add("hidden");
                formSuccessMsg.classList.remove("hidden");
            }
        });
    }

    // --- 10. VISITOR COUNTER TRACKING ---
    function trackVisitor() {
        const namespace = "son-hoang-xuan-portfolio";
        const key = "visits";
        const sessionKey = "visited_session";
        const localFallbackKey = "portfolio_fallback_visits";
        
        const getLocalFallbackCount = () => {
            let count = localStorage.getItem(localFallbackKey);
            if (!count) {
                count = Math.floor(Math.random() * 50) + 120;
                localStorage.setItem(localFallbackKey, count);
            }
            return parseInt(count, 10);
        };
        
        const incrementLocalFallbackCount = () => {
            const current = getLocalFallbackCount();
            const next = current + 1;
            localStorage.setItem(localFallbackKey, next);
            return next;
        };

        const isNewSession = !sessionStorage.getItem(sessionKey);
        
        if (isNewSession) {
            fetch(`https://api.counterapi.dev/v1/${namespace}/${key}/up`)
                .then(response => {
                    if (!response.ok) throw new Error("API response error");
                    return response.json();
                })
                .then(data => {
                    if (data && typeof data.count === "number") {
                        localStorage.setItem("portfolio_last_count", data.count);
                        sessionStorage.setItem(sessionKey, "true");
                        console.log(`[Visitor Counter] Recorded visit. Count: ${data.count}`);
                    } else {
                        throw new Error("Invalid count format");
                    }
                })
                .catch(err => {
                    console.warn("[Visitor Counter] API failed, using fallback. Error:", err);
                    const newCount = incrementLocalFallbackCount();
                    localStorage.setItem("portfolio_last_count", newCount);
                    sessionStorage.setItem(sessionKey, "true");
                });
        } else {
            fetch(`https://api.counterapi.dev/v1/${namespace}/${key}`)
                .then(response => {
                    if (!response.ok) throw new Error("API response error");
                    return response.json();
                })
                .then(data => {
                    if (data && typeof data.count === "number") {
                        localStorage.setItem("portfolio_last_count", data.count);
                        console.log(`[Visitor Counter] Current count: ${data.count}`);
                    }
                })
                .catch(err => {
                    console.warn("[Visitor Counter] API fetch failed, using fallback. Error:", err);
                    const currentCount = getLocalFallbackCount();
                    localStorage.setItem("portfolio_last_count", currentCount);
                });
    }
    trackVisitor();

    // --- 11. SECRET KEYSTROKE TRIGGER FOR ADMIN ---
    let keyBuffer = "";
    document.addEventListener("keydown", (e) => {
        if (e.key.length === 1) {
            keyBuffer += e.key.toLowerCase();
            if (keyBuffer.endsWith("admin")) {
                window.location.href = "admin.html";
            }
            if (keyBuffer.length > 20) {
                keyBuffer = keyBuffer.substring(keyBuffer.length - 10);
            }
        }
    });
});

