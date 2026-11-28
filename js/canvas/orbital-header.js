import { onThemeChange } from '../theme.js';

/* ---------------------------------------------------------------------
 * 5. FULL-WIDTH ORBITAL TRAJECTORY & GROUND-STATION DOWNLINK HEADER
 *    - ResizeObserver-locked native Retina rendering
 *    - IntersectionObserver pause when scrolled out of view
 *    - Primary & Secondary sweeping dashed orbital arcs
 *    - Gliding satellite with live auto-acquisition & hover downlink beam
 *    - 4 interactive ground stations: BLR, GH, STACK, CONNECT
 * ------------------------------------------------------------------- */
export function initOrbitalHeader() {
    const bannerEl = document.getElementById('orbitalHeaderBanner');
    const canvas = document.getElementById('orbitalHeaderCanvas');
    if (!bannerEl || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let isVisible = true;
    let rafId = null;
    let lastTime = performance.now();
    let startTime = lastTime;

    // Damped micro-parallax & hover state
    let pointer = { x: 0, y: 0, normX: 0, normY: 0, active: false };
    let smoothParallax = { x: 0, y: 0 };
    let hoveredStationIdx = -1;
    let lastStationCoords = [];

    // Expanding emerald radar pings spawned on click
    const radarPings = [];

    // Cached live telemetry (updated at 1Hz, zero per-frame allocation)
    const istFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    let lastSecTick = -1;
    let cachedIst = '12.97°N · IST';
    let cachedGhLabel = 'LIVE ACTIVITY ↗';

    function refreshLiveTelemetry(now) {
        const sec = Math.floor(now / 1000);
        if (sec === lastSecTick) return;
        lastSecTick = sec;

        cachedIst = `${istFormatter.format(new Date())} IST`;

        // Reuse github-graph.js sessionStorage cache (zero extra API calls)
        try {
            const raw = sessionStorage.getItem('gh_contrib_manavgpt_v2');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (typeof parsed.total === 'number') {
                    cachedGhLabel = `${parsed.total.toLocaleString()} COMMITS / 1Y`;
                }
            }
        } catch (_) { }
    }

    // Multi-depth celestial starfield (Dark mode) & blueprint reticles
    const STARS = Array.from({ length: 84 }, (_, i) => ({
        u: ((i * 67 + 13) % 100) / 100,
        v: 0.06 + ((i * 37 + 11) % 72) / 100,
        r: i % 13 === 0 ? 1.35 : i % 3 === 0 ? 0.95 : 0.6,
        depth: 0.35 + (i % 4) * 0.22,
        phase: i * 1.43,
    }));

    const CROSSHAIRS = [
        { u: 0.12, v: 0.24 },
        { u: 0.27, v: 0.56 },
        { u: 0.44, v: 0.20 },
        { u: 0.61, v: 0.52 },
        { u: 0.77, v: 0.22 },
        { u: 0.90, v: 0.48 },
    ];

    // 4 interactive ground stations along the lower horizon
    const STATIONS = [
        {
            u: 0.18,
            label: 'BLR',
            getSub: () => cachedIst,
            action: () => {
                const clock = document.getElementById('locationClock');
                if (clock) {
                    clock.click();
                    clock.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            },
        },
        {
            u: 0.39,
            label: 'GH',
            getSub: () => cachedGhLabel,
            action: () => jumpToSection('projects'),
        },
        {
            u: 0.61,
            label: 'STACK',
            getSub: () => 'TS · GO · RUST · PY',
            action: () => jumpToSection('stack'),
        },
        {
            u: 0.82,
            label: 'CONNECT',
            getSub: () => 'HELLO@MANAV.HERE',
            action: () => jumpToSection('connect'),
        },
    ];

    function jumpToSection(id) {
        const navLink = document.querySelector(`nav[aria-label="Primary Navigation"] a[href="#${id}"]`);
        if (navLink) {
            navLink.click();
        } else {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Quadratic Bezier helpers for smooth sweeping orbital trajectories
    function evalQuadBezier(p0, p1, p2, t) {
        const mt = 1 - t;
        return {
            x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
            y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
        };
    }

    function evalQuadTangentAngle(p0, p1, p2, t) {
        const mt = 1 - t;
        const dx = 2 * mt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
        const dy = 2 * mt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
        return Math.atan2(dy, dx);
    }

    function getOrbitalCurves(px, py) {
        const safeBottom = height - 68;
        const primary = {
            p0: { x: -30 + px * 0.4, y: safeBottom + 4 + py * 0.4 },
            p1: { x: width * 0.50 + px * 0.4, y: height * 0.02 + py * 0.4 },
            p2: { x: width + 30 + px * 0.4, y: safeBottom - 16 + py * 0.4 },
        };

        const secondary = {
            p0: { x: -30 + px * 0.25, y: height * 0.34 + py * 0.25 },
            p1: { x: width * 0.46 + px * 0.25, y: height * 0.72 + py * 0.25 },
            p2: { x: width + 30 + px * 0.25, y: height * 0.14 + py * 0.25 },
        };

        // Subtle Earth-horizon curve where the 4 ground stations sit
        const horizon = {
            p0: { x: width * 0.04 + px * 0.15, y: height - 26 + py * 0.15 },
            p1: { x: width * 0.50 + px * 0.15, y: height - 46 + py * 0.15 },
            p2: { x: width * 0.96 + px * 0.15, y: height - 26 + py * 0.15 },
        };

        return { primary, secondary, horizon };
    }

    function drawPrimarySatellite(x, y, angle, elapsedSec, isDark) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, 18);
        halo.addColorStop(0, isDark ? 'rgba(16, 185, 129, 0.26)' : 'rgba(5, 150, 105, 0.16)');
        halo.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isDark ? '#a1a1aa' : '#52525b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -15.5);
        ctx.lineTo(0, 15.5);
        ctx.stroke();

        const wingW = 5.4;
        const wingH = 10.5;
        const wingPositions = [-15.2, 4.7];
        for (let i = 0; i < wingPositions.length; i++) {
            const wy = wingPositions[i];
            const wGrad = ctx.createLinearGradient(-wingW / 2, wy, wingW / 2, wy + wingH);
            if (isDark) {
                wGrad.addColorStop(0, '#27272a');
                wGrad.addColorStop(0.5, '#3f3f46');
                wGrad.addColorStop(1, '#18181b');
            } else {
                wGrad.addColorStop(0, '#3f3f46');
                wGrad.addColorStop(0.5, '#52525b');
                wGrad.addColorStop(1, '#27272a');
            }
            ctx.fillStyle = wGrad;
            ctx.fillRect(-wingW / 2, wy, wingW, wingH);

            ctx.strokeStyle = isDark ? 'rgba(250, 250, 250, 0.42)' : 'rgba(255, 255, 255, 0.65)';
            ctx.lineWidth = 0.65;
            ctx.strokeRect(-wingW / 2, wy, wingW, wingH);

            ctx.beginPath();
            ctx.moveTo(0, wy);
            ctx.lineTo(0, wy + wingH);
            ctx.moveTo(-wingW / 2, wy + wingH * 0.34);
            ctx.lineTo(wingW / 2, wy + wingH * 0.34);
            ctx.moveTo(-wingW / 2, wy + wingH * 0.68);
            ctx.lineTo(wingW / 2, wy + wingH * 0.68);
            ctx.stroke();
        }

        const busGrad = ctx.createLinearGradient(0, -3.5, 0, 3.5);
        if (isDark) {
            busGrad.addColorStop(0, '#fafafa');
            busGrad.addColorStop(0.5, '#d4d4d8');
            busGrad.addColorStop(1, '#71717a');
        } else {
            busGrad.addColorStop(0, '#ffffff');
            busGrad.addColorStop(0.5, '#cbd5e1');
            busGrad.addColorStop(1, '#52525b');
        }
        ctx.fillStyle = busGrad;
        ctx.fillRect(-4.6, -3.1, 9.2, 6.2);
        ctx.strokeStyle = isDark ? '#52525b' : '#3f3f46';
        ctx.lineWidth = 0.7;
        ctx.strokeRect(-4.6, -3.1, 9.2, 6.2);

        ctx.strokeStyle = isDark ? '#e4e4e7' : '#3f3f46';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(4.6, 0);
        ctx.lineTo(7.4, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(8.6, 0, 2.7, Math.PI * 0.65, Math.PI * 1.35);
        ctx.stroke();

        const blink = reducedMotion ? 1 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(elapsedSec * 5.2));
        ctx.fillStyle = isDark
            ? `rgba(16, 185, 129, ${blink.toFixed(2)})`
            : `rgba(5, 150, 105, ${blink.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(1.2, 0, 1.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawMicroBeacon(x, y, elapsedSec, isDark) {
        ctx.save();
        const pulse = reducedMotion ? 0.85 : 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(elapsedSec * 3.8 + 1.4));
        const rGlow = ctx.createRadialGradient(x, y, 0.5, x, y, 8);
        rGlow.addColorStop(0, isDark ? `rgba(16, 185, 129, ${(pulse * 0.45).toFixed(2)})` : `rgba(5, 150, 105, ${(pulse * 0.32).toFixed(2)})`);
        rGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = rGlow;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isDark ? '#e4e4e7' : '#3f3f46';
        ctx.beginPath();
        ctx.arc(x, y, 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawDownlinkBeam(satPt, station, elapsedSec, isDark, isHovered) {
        ctx.save();
        const baseAlpha = isHovered ? (isDark ? 0.55 : 0.48) : (isDark ? 0.28 : 0.24);
        const rgb = isDark ? '16, 185, 129' : '5, 150, 105';

        // Faint conical RF sweep
        const dx = station.x - satPt.x;
        const dy = station.y - satPt.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * (isHovered ? 10 : 6);
        const ny = (dx / len) * (isHovered ? 10 : 6);

        const coneGrad = ctx.createLinearGradient(satPt.x, satPt.y, station.x, station.y);
        coneGrad.addColorStop(0, `rgba(${rgb}, ${(baseAlpha * 0.35).toFixed(3)})`);
        coneGrad.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(satPt.x, satPt.y);
        ctx.lineTo(station.x + nx, station.y + ny);
        ctx.lineTo(station.x - nx, station.y - ny);
        ctx.closePath();
        ctx.fill();

        // Animated dashed carrier beam
        ctx.strokeStyle = `rgba(${rgb}, ${baseAlpha.toFixed(3)})`;
        ctx.lineWidth = isHovered ? 1.15 : 0.9;
        ctx.setLineDash([3, 4]);
        ctx.lineDashOffset = reducedMotion ? 0 : -elapsedSec * 24;
        ctx.beginPath();
        ctx.moveTo(satPt.x, satPt.y);
        ctx.lineTo(station.x, station.y);
        ctx.stroke();

        // Downlink packet traveling from satellite -> ground station
        if (!reducedMotion) {
            const pT = (elapsedSec * 1.15) % 1;
            const px = satPt.x + dx * pT;
            const py = satPt.y + dy * pT;
            ctx.fillStyle = `rgba(${rgb}, ${(isHovered ? 0.95 : 0.72).toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(px, py, isHovered ? 2.1 : 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawFrame(now, dt) {
        if (!width || !height) return;

        refreshLiveTelemetry(now);

        const elapsedSec = reducedMotion ? 8.5 : (now - startTime) * 0.001;
        const isDark = document.documentElement.classList.contains('dark');

        // Damped micro-parallax interpolation
        const targetPx = pointer.active && !reducedMotion ? pointer.normX * 14 : 0;
        const targetPy = pointer.active && !reducedMotion ? pointer.normY * 7 : 0;
        const damp = dt > 0 ? Math.min(1, dt * 6.5) : 1;
        smoothParallax.x += (targetPx - smoothParallax.x) * damp;
        smoothParallax.y += (targetPy - smoothParallax.y) * damp;

        // --- 1. DUAL-MODE SKY / AEROSPACE BLUEPRINT BACKDROP ---
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        if (isDark) {
            bgGrad.addColorStop(0, '#070709');
            bgGrad.addColorStop(0.65, '#09090b');
            bgGrad.addColorStop(1, '#09090b');
        } else {
            bgGrad.addColorStop(0, '#f8f7f4');
            bgGrad.addColorStop(1, '#f8f7f4');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const apexGlow = ctx.createRadialGradient(
            width * 0.5 + smoothParallax.x * 0.5,
            height * 0.32,
            10,
            width * 0.5,
            height * 0.38,
            width * 0.42
        );
        if (isDark) {
            apexGlow.addColorStop(0, 'rgba(16, 185, 129, 0.045)');
            apexGlow.addColorStop(0.6, 'rgba(39, 39, 42, 0.06)');
            apexGlow.addColorStop(1, 'rgba(9, 9, 11, 0)');
        } else {
            apexGlow.addColorStop(0, 'rgba(5, 150, 105, 0.038)');
            apexGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }
        ctx.fillStyle = apexGlow;
        ctx.fillRect(0, 0, width, height);

        // --- 2. ARCHITECTURAL ORBITAL INCLINATION GRID ARCS ---
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(250, 250, 250, 0.045)' : 'rgba(24, 24, 27, 0.065)';
        ctx.lineWidth = 1;
        const gridCenterX = width * 0.5 + smoothParallax.x * 0.25;
        const gridCenterY = height * 4.4 + smoothParallax.y * 0.25;
        const baseRadius = height * 4.05;
        for (let r = 0; r < 3; r++) {
            ctx.beginPath();
            ctx.arc(gridCenterX, gridCenterY, baseRadius + r * 36, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();
        }

        if (!isDark) {
            ctx.strokeStyle = 'rgba(24, 24, 27, 0.075)';
            ctx.lineWidth = 1;
            const tickStep = 48;
            const offset = ((smoothParallax.x * 0.2) % tickStep + tickStep) % tickStep;
            for (let tx = offset; tx < width; tx += tickStep) {
                const major = Math.round(tx / tickStep) % 3 === 0;
                ctx.beginPath();
                ctx.moveTo(tx, 0);
                ctx.lineTo(tx, major ? 7 : 4);
                ctx.stroke();
            }
        }
        ctx.restore();

        // --- 3. TWINKLING STARS (DARK MODE) & + RETICLE CROSSHAIRS ---
        if (isDark) {
            for (let i = 0; i < STARS.length; i++) {
                const st = STARS[i];
                const sx = st.u * width + smoothParallax.x * st.depth;
                const sy = st.v * height + smoothParallax.y * st.depth;
                const bottomFade = Math.max(0, Math.min(1, (height - 28 - sy) / 60));
                if (bottomFade <= 0.01) continue;
                const tw = reducedMotion ? 0.65 : 0.28 + 0.72 * (0.5 + 0.5 * Math.sin(elapsedSec * 1.5 + st.phase));
                ctx.fillStyle = `rgba(244, 244, 245, ${(tw * 0.62 * bottomFade).toFixed(2)})`;
                ctx.beginPath();
                ctx.arc(sx, sy, st.r, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(250, 250, 250, 0.14)' : 'rgba(24, 24, 27, 0.16)';
        ctx.lineWidth = 1;
        for (let i = 0; i < CROSSHAIRS.length; i++) {
            const ch = CROSSHAIRS[i];
            const cx = ch.u * width + smoothParallax.x * 0.45;
            const cy = ch.v * height + smoothParallax.y * 0.45;
            ctx.beginPath();
            ctx.moveTo(cx - 3.5, cy);
            ctx.lineTo(cx + 3.5, cy);
            ctx.moveTo(cx, cy - 3.5);
            ctx.lineTo(cx, cy + 3.5);
            ctx.stroke();
        }
        ctx.restore();

        // --- 4. ORBITAL TRAJECTORY ARCS & GROUND HORIZON ---
        const { primary, secondary, horizon } = getOrbitalCurves(smoothParallax.x, smoothParallax.y);

        // Secondary arc
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(250, 250, 250, 0.075)' : 'rgba(24, 24, 27, 0.085)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(secondary.p0.x, secondary.p0.y);
        ctx.quadraticCurveTo(secondary.p1.x, secondary.p1.y, secondary.p2.x, secondary.p2.y);
        ctx.stroke();
        ctx.restore();

        // Primary sweeping arc
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(250, 250, 250, 0.16)' : 'rgba(24, 24, 27, 0.18)';
        ctx.lineWidth = 1.15;
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.moveTo(primary.p0.x, primary.p0.y);
        ctx.quadraticCurveTo(primary.p1.x, primary.p1.y, primary.p2.x, primary.p2.y);
        ctx.stroke();
        ctx.restore();

        // Subtle ground-station horizon arc
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(250, 250, 250, 0.07)' : 'rgba(24, 24, 27, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(horizon.p0.x, horizon.p0.y);
        ctx.quadraticCurveTo(horizon.p1.x, horizon.p1.y, horizon.p2.x, horizon.p2.y);
        ctx.stroke();
        ctx.restore();

        // Compute satellite & ground station positions
        const satT = reducedMotion ? 0.54 : (elapsedSec * 0.030 + 0.14) % 1.0;
        const satPt = evalQuadBezier(primary.p0, primary.p1, primary.p2, satT);
        const satAngle = evalQuadTangentAngle(primary.p0, primary.p1, primary.p2, satT);

        lastStationCoords = STATIONS.map((st) => {
            const pt = evalQuadBezier(horizon.p0, horizon.p1, horizon.p2, st.u);
            return { ...st, x: pt.x, y: pt.y };
        });

        // Hit-test pointer against ground stations
        hoveredStationIdx = -1;
        if (pointer.active) {
            let bestDist = Infinity;
            for (let i = 0; i < lastStationCoords.length; i++) {
                const st = lastStationCoords[i];
                const d = Math.hypot(st.x - pointer.x, st.y - pointer.y);
                if (d < 46 && d < bestDist) {
                    bestDist = d;
                    hoveredStationIdx = i;
                }
            }
        }
        bannerEl.style.cursor = hoveredStationIdx !== -1 ? 'pointer' : 'default';

        // Determine active downlink target: hovered station, or auto-acquired closest pass
        let activeLinkIdx = hoveredStationIdx;
        if (activeLinkIdx === -1) {
            let bestSatDist = Infinity;
            const maxLockRange = Math.max(150, width * 0.24);
            for (let i = 0; i < lastStationCoords.length; i++) {
                const st = lastStationCoords[i];
                const d = Math.hypot(st.x - satPt.x, st.y - satPt.y);
                if (d < maxLockRange && d < bestSatDist) {
                    bestSatDist = d;
                    activeLinkIdx = i;
                }
            }
        }

        // --- 5. ACTIVE SATELLITE-TO-GROUND DOWNLINK BEAM ---
        if (activeLinkIdx !== -1) {
            drawDownlinkBeam(
                satPt,
                lastStationCoords[activeLinkIdx],
                elapsedSec,
                isDark,
                hoveredStationIdx === activeLinkIdx
            );
        }

        // --- 6. GROUND STATION NODES & TELEMETRY LABELS ---
        for (let i = 0; i < lastStationCoords.length; i++) {
            const st = lastStationCoords[i];
            const isHovered = i === hoveredStationIdx;
            const isLinked = i === activeLinkIdx;
            const rgb = isDark ? '16, 185, 129' : '5, 150, 105';

            if (isLinked) {
                const ringGrad = ctx.createRadialGradient(st.x, st.y, 1, st.x, st.y, isHovered ? 17 : 12);
                ringGrad.addColorStop(0, `rgba(${rgb}, ${isHovered ? 0.42 : 0.24})`);
                ringGrad.addColorStop(1, `rgba(${rgb}, 0)`);
                ctx.fillStyle = ringGrad;
                ctx.beginPath();
                ctx.arc(st.x, st.y, isHovered ? 17 : 12, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = `rgba(${rgb}, ${isHovered ? 0.88 : 0.48})`;
                ctx.lineWidth = isHovered ? 1.15 : 0.9;
                ctx.beginPath();
                ctx.arc(st.x, st.y, isHovered ? 6.5 : 5.2, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Station antenna dot
            ctx.fillStyle = isLinked
                ? isDark
                    ? '#10b981'
                    : '#059669'
                : isDark
                    ? '#09090b'
                    : '#f8f7f4';
            ctx.strokeStyle = isLinked
                ? isDark
                    ? '#10b981'
                    : '#059669'
                : isDark
                    ? 'rgba(250, 250, 250, 0.42)'
                    : 'rgba(24, 24, 27, 0.42)';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.arc(st.x, st.y, isHovered ? 2.9 : 2.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Primary station callsign
            ctx.font = '500 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = isLinked
                ? `rgba(${rgb}, ${isHovered ? 1 : 0.85})`
                : isDark
                    ? 'rgba(161, 161, 170, 0.56)'
                    : 'rgba(113, 113, 122, 0.68)';
            ctx.fillText(st.label, st.x, st.y + 15);

            // Live telemetry sub-readout (shown on hover or auto-lock on desktop)
            if (isHovered || (isLinked && width >= 540)) {
                ctx.font = '500 8.5px "JetBrains Mono", monospace';
                ctx.fillStyle = isHovered
                    ? isDark
                        ? 'rgba(244, 244, 245, 0.86)'
                        : 'rgba(24, 24, 27, 0.82)'
                    : isDark
                        ? 'rgba(161, 161, 170, 0.52)'
                        : 'rgba(113, 113, 122, 0.60)';
                ctx.fillText(st.getSub(), st.x, st.y - 10);
            }
        }

        // --- 7. COUNTER-ORBITING MICRO-SATELLITE ALONG SECONDARY ARC ---
        const secT = reducedMotion ? 0.68 : 1 - ((elapsedSec * 0.022 + 0.25) % 1);
        const secPt = evalQuadBezier(secondary.p0, secondary.p1, secondary.p2, secT);
        ctx.save();
        for (let s = 1; s <= 12; s++) {
            const prevT = secT + s * 0.0055;
            if (prevT > 1) break;
            const pA = evalQuadBezier(secondary.p0, secondary.p1, secondary.p2, prevT - 0.0055);
            const pB = evalQuadBezier(secondary.p0, secondary.p1, secondary.p2, prevT);
            const alpha = (1 - s / 12) * (isDark ? 0.26 : 0.22);
            ctx.strokeStyle = isDark
                ? `rgba(16, 185, 129, ${alpha.toFixed(3)})`
                : `rgba(5, 150, 105, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
        }
        ctx.restore();
        drawMicroBeacon(secPt.x, secPt.y, elapsedSec, isDark);

        // --- 8. PRIMARY GLIDING SATELLITE + FADING EMERALD TRAJECTORY TRAIL ---
        ctx.save();
        const trailSegments = 28;
        const trailSpan = 0.15;
        for (let s = 1; s <= trailSegments; s++) {
            const tA = satT - ((s - 1) / trailSegments) * trailSpan;
            const tB = satT - (s / trailSegments) * trailSpan;
            if (tB < 0) break;
            const pA = evalQuadBezier(primary.p0, primary.p1, primary.p2, tA);
            const pB = evalQuadBezier(primary.p0, primary.p1, primary.p2, tB);
            const fade = Math.pow(1 - s / trailSegments, 1.45);
            const alpha = fade * (isDark ? 0.72 : 0.62);
            ctx.strokeStyle = isDark
                ? `rgba(16, 185, 129, ${alpha.toFixed(3)})`
                : `rgba(5, 150, 105, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1.8 * fade + 0.4;
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
        }
        ctx.restore();

        drawPrimarySatellite(satPt.x, satPt.y, satAngle, elapsedSec, isDark);

        // --- 9. EXPANDING EMERALD TELEMETRY RADAR PINGS (ON CLICK) ---
        for (let i = radarPings.length - 1; i >= 0; i--) {
            const ping = radarPings[i];
            ping.life += dt;
            if (ping.life >= ping.maxLife) {
                radarPings.splice(i, 1);
                continue;
            }
            const p = ping.life / ping.maxLife;
            const eased = 1 - Math.pow(1 - p, 3);
            const radius = 6 + eased * 68;
            const alpha = (1 - p) * (isDark ? 0.62 : 0.52);

            ctx.save();
            ctx.strokeStyle = isDark
                ? `rgba(16, 185, 129, ${alpha.toFixed(3)})`
                : `rgba(5, 150, 105, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.arc(ping.x, ping.y, radius, 0, Math.PI * 2);
            ctx.stroke();

            if (radius > 14) {
                ctx.strokeStyle = isDark
                    ? `rgba(16, 185, 129, ${(alpha * 0.45).toFixed(3)})`
                    : `rgba(5, 150, 105, ${(alpha * 0.4).toFixed(3)})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.arc(ping.x, ping.y, radius * 0.58, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    function resizeOrbital() {
        const rect = bannerEl.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = rect.width;
        height = rect.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        drawFrame(performance.now(), 0);
    }

    bannerEl.addEventListener('mousemove', (e) => {
        const rect = bannerEl.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.normX = (pointer.x / rect.width - 0.5) * 2;
        pointer.normY = (pointer.y / rect.height - 0.5) * 2;
        pointer.active = true;
        if (reducedMotion) drawFrame(performance.now(), 0);
    });

    bannerEl.addEventListener('mouseleave', () => {
        pointer.active = false;
        hoveredStationIdx = -1;
        bannerEl.style.cursor = 'default';
        if (reducedMotion) drawFrame(performance.now(), 0);
    });

    bannerEl.addEventListener('click', (e) => {
        const rect = bannerEl.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        // Check if click landed on a ground station
        const target = lastStationCoords.find((st) => Math.hypot(st.x - cx, st.y - cy) < 46);
        radarPings.push({
            x: target ? target.x : cx,
            y: target ? target.y : cy,
            life: 0,
            maxLife: 1.35,
        });

        if (target && typeof target.action === 'function') {
            target.action();
        }
        if (reducedMotion) drawFrame(performance.now(), 0.2);
    });

    function tick(now) {
        if (!isVisible || reducedMotion) {
            rafId = null;
            return;
        }
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) * 0.001));
        lastTime = now;
        drawFrame(now, dt);
        rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
        if (reducedMotion) {
            drawFrame(performance.now(), 0);
            return;
        }
        if (!rafId && isVisible) {
            lastTime = performance.now();
            rafId = requestAnimationFrame(tick);
        }
    }

    function stopLoop() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    onThemeChange(() => drawFrame(performance.now(), 0));

    if (typeof IntersectionObserver === 'function') {
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isVisible = entry.isIntersecting;
                    if (isVisible) startLoop();
                    else stopLoop();
                });
            },
            { threshold: 0.01 }
        );
        obs.observe(bannerEl);
    } else {
        isVisible = true;
        startLoop();
    }

    if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(resizeOrbital);
        ro.observe(bannerEl);
    } else {
        window.addEventListener('resize', resizeOrbital);
    }

    resizeOrbital();
    startLoop();
}
