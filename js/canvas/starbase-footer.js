import { playStarshipTakeoffAudio } from '../audio.js';
import { onThemeChange } from '../theme.js';

/* ---------------------------------------------------------------------
 * 18. HIGH-DPI SPACEX STARBASE — OPEN HORIZON FOOTER
 *     - ResizeObserver-locked native Retina rendering (zero stretch)
 *     - Seamless 110px top fade into var(--bg)
 *     - Highway 4 grounded cleanly along the bottom edge
 *     - Silent 4-Second Raptor Static Fire Ignition on Pad Click
 * ------------------------------------------------------------------- */
export function initStarbaseFooter() {
    const footerEl = document.getElementById('footer');
    const sbCanvas = document.getElementById('starbaseFooterCanvas');
    if (!footerEl || !sbCanvas) return;

    const sctx = sbCanvas.getContext('2d');
    if (!sctx) return;

    const reducedMotion =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let isVisible = false;
    let rafId = null;
    let lastTime = performance.now();
    let startTime = lastTime;

    // 4-second Raptor Static Fire state (silent, no HUD text)
    const STATIC_FIRE_DURATION = 4000;
    let staticFireStart = -10000;
    let staticFireEnd = 0;
    let padHitbox = { x: 0, y: 0, w: 0, h: 0 };

    // Subtle night-sky stars
    const STARS = Array.from({ length: 92 }, (_, i) => ({
        u: ((i * 73 + 17) % 100) / 100,
        v: 0.14 + ((i * 41 + 9) % 68) / 100,
        r: i % 11 === 0 ? 1.45 : i % 3 === 0 ? 1.0 : 0.65,
        phase: i * 1.37,
    }));

    // Wispy coastal daylight clouds
    const CLOUDS = [
        { u: 0.08, v: 0.34, scale: 1.05, speed: 0.0020 },
        { u: 0.30, v: 0.28, scale: 1.15, speed: 0.0015 },
        { u: 0.72, v: 0.32, scale: 1.1, speed: 0.0018 },
        { u: 0.92, v: 0.26, scale: 0.95, speed: 0.0014 },
    ];

    // Volumetric cryo vapor plumes & static-fire deluge steam clouds
    const cryoPuffs = [];
    const steamClouds = [];

    // Highway 4 Vehicles — 5 detailed Cybertrucks & Teslas cruising both lanes
    const VEHICLES = [
        { type: 'cybertruck', lane: 1, u: 0.14, speed: 0.032, finish: 'steel' },
        { type: 'tesla', lane: 1, u: 0.64, speed: 0.032, finish: 'pearl' },
        { type: 'cybertruck', lane: 0, u: 0.28, speed: -0.035, finish: 'steel' },
        { type: 'tesla', lane: 0, u: 0.62, speed: -0.035, finish: 'obsidian' },
        { type: 'tesla', lane: 0, u: 0.94, speed: -0.035, finish: 'silver' },
    ];

    // 9 naturally proportioned engineers strolling along the concrete walkway
    const ENGINEERS = [
        { u: 0.10, dir: 1, speed: 0.0052, jacket: 'emerald', hat: 'white', clipboard: true, pauseTimer: 0, walkPhase: 0.3 },
        { u: 0.21, dir: -1, speed: 0.0046, jacket: 'dark', hat: 'yellow', clipboard: false, pauseTimer: 1.8, walkPhase: 1.4 },
        { u: 0.32, dir: 1, speed: 0.0050, jacket: 'amber', hat: 'white', clipboard: false, pauseTimer: 0, walkPhase: 2.8 },
        { u: 0.43, dir: 1, speed: 0.0044, jacket: 'dark', hat: 'white', clipboard: true, pauseTimer: 2.9, walkPhase: 0.8 },
        { u: 0.51, dir: -1, speed: 0.0048, jacket: 'emerald', hat: 'white', clipboard: false, pauseTimer: 3.6, walkPhase: 2.0 },
        { u: 0.62, dir: -1, speed: 0.0051, jacket: 'dark', hat: 'yellow', clipboard: true, pauseTimer: 1.2, walkPhase: 3.9 },
        { u: 0.72, dir: 1, speed: 0.0054, jacket: 'slate', hat: 'white', clipboard: false, pauseTimer: 0, walkPhase: 4.5 },
        { u: 0.81, dir: -1, speed: 0.0047, jacket: 'amber', hat: 'white', clipboard: false, pauseTimer: 2.2, walkPhase: 1.1 },
        { u: 0.90, dir: 1, speed: 0.0049, jacket: 'emerald', hat: 'white', clipboard: true, pauseTimer: 0.6, walkPhase: 5.2 },
    ];

    function resizeStarbase() {
        const box = footerEl.getBoundingClientRect();
        if (!box.width || !box.height) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = box.width;
        height = box.height;
        sbCanvas.width = Math.round(width * dpr);
        sbCanvas.height = Math.round(height * dpr);
        sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        sctx.imageSmoothingEnabled = true;
        sctx.imageSmoothingQuality = 'high';
        renderFrame(performance.now(), 0);
    }

    // Vertical & horizontal geometry with Highway 4 grounded to the bottom edge
    function getMetrics() {
        const isMobile = width < 640;
        const isWide = width > 960;
        const roadBottom = height - 2;
        const roadTop = height - 38;
        const roadHeight = roadBottom - roadTop;
        const walkwayH = 16;
        const groundY = roadTop - walkwayH;

        const padX = width * 0.5;
        const availableH = Math.max(200, groundY - 76);
        const centerScale = Math.min(1.0, Math.max(0.72, availableH / 260));

        const leftMargin = isWide ? (width - 780) * 0.5 : 0;
        const sideScale = isWide
            ? Math.min(1.02, Math.max(0.84, availableH / 235))
            : centerScale * 0.88;

        return {
            isMobile,
            isWide,
            roadBottom,
            roadHeight,
            roadTop,
            walkwayH,
            groundY,
            padX,
            centerScale,
            sideScale,
            leftMargin,
        };
    }

    function roundRectPath(x, y, w, h, r) {
        const rad = Math.min(r, w / 2, h / 2);
        sctx.beginPath();
        sctx.moveTo(x + rad, y);
        sctx.lineTo(x + w - rad, y);
        sctx.quadraticCurveTo(x + w, y, x + w, y + rad);
        sctx.lineTo(x + w, y + h - rad);
        sctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
        sctx.lineTo(x + rad, y + h);
        sctx.quadraticCurveTo(x, y + h, x, y + h - rad);
        sctx.lineTo(x, y + rad);
        sctx.quadraticCurveTo(x, y, x + rad, y);
        sctx.closePath();
    }

    function drawCloud(cx, cy, sc) {
        sctx.save();
        sctx.translate(cx, cy);
        sctx.scale(sc, sc);
        sctx.fillStyle = 'rgba(244, 244, 245, 0.85)';
        sctx.beginPath();
        sctx.ellipse(0, 0, 38, 8.5, 0, 0, Math.PI * 2);
        sctx.ellipse(-16, -3.5, 22, 7.5, 0, 0, Math.PI * 2);
        sctx.ellipse(14, -4.5, 24, 8, 0, 0, Math.PI * 2);
        sctx.fill();
        sctx.restore();
    }

    function drawGulfAndDunes(groundY, isDark) {
        const waterY = groundY - 18;
        const waterGrad = sctx.createLinearGradient(0, waterY, 0, groundY);
        if (isDark) {
            waterGrad.addColorStop(0, 'rgba(24, 24, 27, 0.72)');
            waterGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.07)');
            waterGrad.addColorStop(1, 'rgba(9, 9, 11, 0.94)');
        } else {
            waterGrad.addColorStop(0, 'rgba(228, 228, 231, 0.55)');
            waterGrad.addColorStop(0.5, 'rgba(209, 250, 229, 0.35)');
            waterGrad.addColorStop(1, 'rgba(244, 244, 245, 0.25)');
        }
        sctx.fillStyle = waterGrad;
        sctx.fillRect(0, waterY, width, 18);

        sctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.75)';
        sctx.fillRect(0, waterY, width, 1);

        sctx.beginPath();
        sctx.moveTo(0, groundY);
        for (let x = 0; x <= width + 50; x += 50) {
            const wave = Math.sin(x * 0.007 + 0.5) * 7 + Math.cos(x * 0.017) * 3;
            sctx.lineTo(x, groundY - 10 - wave);
        }
        sctx.lineTo(width, groundY);
        sctx.closePath();
        sctx.fillStyle = isDark ? '#111114' : '#ececef';
        sctx.fill();

        sctx.fillStyle = isDark ? '#18181b' : '#e4e4e7';
        sctx.fillRect(0, groundY - 5, width, 5);
    }

    function drawPalm(x, groundY, h, lean, elapsedSec, phase, isDark) {
        const sway = reducedMotion ? 0 : Math.sin(elapsedSec * 1.25 + phase) * 3.4;
        const topX = x + lean * 14 + sway * 0.78;
        const topY = groundY - h;
        const ctrlX = x + lean * 5 + sway * 0.25;
        const ctrlY = groundY - h * 0.54;

        sctx.save();
        sctx.lineCap = 'round';

        sctx.strokeStyle = isDark ? '#27272a' : '#71717a';
        sctx.lineWidth = Math.max(3.2, h * 0.055);
        sctx.beginPath();
        sctx.moveTo(x, groundY);
        sctx.quadraticCurveTo(ctrlX, ctrlY, topX, topY);
        sctx.stroke();

        sctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.24)' : 'rgba(5, 150, 105, 0.22)';
        sctx.lineWidth = 1.0;
        sctx.beginPath();
        sctx.moveTo(x - 0.9, groundY);
        sctx.quadraticCurveTo(ctrlX - 0.9, ctrlY, topX - 0.6, topY);
        sctx.stroke();

        const frondScale = Math.min(1.35, Math.max(0.85, h / 60));
        const fronds = [
            { a: -2.72, len: 23 * frondScale, droop: 11 * frondScale },
            { a: -2.22, len: 26 * frondScale, droop: 8.5 * frondScale },
            { a: -1.68, len: 21 * frondScale, droop: 5 * frondScale },
            { a: -1.12, len: 26 * frondScale, droop: 8 * frondScale },
            { a: -0.55, len: 23 * frondScale, droop: 10.5 * frondScale },
            { a: 0.05, len: 18 * frondScale, droop: 11 * frondScale },
        ];

        for (let i = 0; i < fronds.length; i++) {
            const f = fronds[i];
            const ang = f.a + sway * 0.02;
            const ex = topX + Math.cos(ang) * f.len;
            const ey = topY + Math.sin(ang) * f.len + f.droop;
            const cx = topX + Math.cos(ang) * (f.len * 0.56);
            const cy = topY + Math.sin(ang) * (f.len * 0.56) - 3.0;

            sctx.strokeStyle =
                i % 2 === 0
                    ? isDark
                        ? '#1f2937'
                        : '#3f3f46'
                    : isDark
                        ? '#064e3b'
                        : '#52525b';
            sctx.lineWidth = 2.3;
            sctx.beginPath();
            sctx.moveTo(topX, topY);
            sctx.quadraticCurveTo(cx, cy, ex, ey);
            sctx.stroke();

            sctx.strokeStyle =
                i % 2 === 0
                    ? isDark
                        ? 'rgba(16, 185, 129, 0.42)'
                        : 'rgba(5, 150, 105, 0.34)'
                    : isDark
                        ? 'rgba(161, 161, 170, 0.22)'
                        : 'rgba(113, 113, 122, 0.25)';
            sctx.lineWidth = 1.0;
            sctx.beginPath();
            sctx.moveTo(topX, topY - 0.6);
            sctx.quadraticCurveTo(cx, cy - 0.8, ex, ey - 0.4);
            sctx.stroke();
        }
        sctx.restore();
    }

    function drawScrub(x, groundY, w, isDark) {
        sctx.save();
        sctx.fillStyle = isDark ? '#1c2a24' : '#a1a1aa';
        sctx.globalAlpha = isDark ? 0.65 : 0.38;
        sctx.beginPath();
        sctx.ellipse(x, groundY - 2, w * 0.5, 3.6, 0, Math.PI, Math.PI * 2);
        sctx.ellipse(x + w * 0.25, groundY - 2.5, w * 0.35, 4.4, 0, Math.PI, Math.PI * 2);
        sctx.fill();
        sctx.restore();
    }

    function drawFloodlightMast(x, groundY, h, elapsedSec, isDark) {
        sctx.save();
        const topY = groundY - h;

        sctx.strokeStyle = isDark ? '#3f3f46' : '#a1a1aa';
        sctx.lineWidth = 1.6;
        sctx.beginPath();
        sctx.moveTo(x - 3.5, groundY);
        sctx.lineTo(x - 1.2, topY);
        sctx.moveTo(x + 3.5, groundY);
        sctx.lineTo(x + 1.2, topY);
        sctx.stroke();

        sctx.lineWidth = 0.8;
        for (let ry = groundY - 14; ry > topY + 10; ry -= 16) {
            const t = (groundY - ry) / h;
            const halfW = 3.5 - t * 2.3;
            sctx.beginPath();
            sctx.moveTo(x - halfW, ry);
            sctx.lineTo(x + halfW, ry - 8);
            sctx.moveTo(x + halfW, ry);
            sctx.lineTo(x - halfW, ry - 8);
            sctx.stroke();
        }

        sctx.fillStyle = '#52525b';
        sctx.fillRect(x - 8, topY - 4, 16, 4.5);

        if (isDark) {
            sctx.fillStyle = '#ecfdf5';
            sctx.fillRect(x - 6.5, topY - 2.5, 13, 2);

            const cone = sctx.createLinearGradient(x, topY, x + 55, groundY);
            cone.addColorStop(0, 'rgba(209, 250, 229, 0.22)');
            cone.addColorStop(0.55, 'rgba(16, 185, 129, 0.06)');
            cone.addColorStop(1, 'rgba(16, 185, 129, 0)');
            sctx.fillStyle = cone;
            sctx.beginPath();
            sctx.moveTo(x - 6, topY);
            sctx.lineTo(x + 6, topY);
            sctx.lineTo(x + 95, groundY);
            sctx.lineTo(x - 18, groundY);
            sctx.closePath();
            sctx.fill();
        } else {
            sctx.fillStyle = '#d4d4d8';
            sctx.fillRect(x - 6.5, topY - 2.5, 13, 2);
        }

        const pulse = reducedMotion ? 0.9 : 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(elapsedSec * 2.4 + 1.1));
        sctx.fillStyle = `rgba(239, 68, 68, ${pulse.toFixed(2)})`;
        sctx.beginPath();
        sctx.arc(x, topY - 6.5, 1.8, 0, Math.PI * 2);
        sctx.fill();

        sctx.restore();
    }

    function drawMegaBays(baseX, groundY, scale, isWide, elapsedSec, isDark) {
        sctx.save();
        const bay1W = isWide ? Math.min(88, Math.max(66, width * 0.065)) : Math.min(62, Math.max(44, width * 0.08));
        const bay1H = (isWide ? 148 : 96) * scale;
        const bay2W = isWide ? Math.min(72, Math.max(54, width * 0.052)) : Math.min(50, Math.max(36, width * 0.065));
        const bay2H = (isWide ? 116 : 76) * scale;

        function drawSingleBay(x, w, h, label, showDoor, hasCrane) {
            const topY = groundY - h;
            const wallGrad = sctx.createLinearGradient(x, topY, x + w, topY);
            if (isDark) {
                wallGrad.addColorStop(0, '#222226');
                wallGrad.addColorStop(0.76, '#161619');
                wallGrad.addColorStop(1, '#101012');
            } else {
                wallGrad.addColorStop(0, '#fafafa');
                wallGrad.addColorStop(0.78, '#ececef');
                wallGrad.addColorStop(1, '#d4d4d8');
            }
            sctx.fillStyle = wallGrad;
            sctx.fillRect(x, topY, w, h);

            sctx.strokeStyle = isDark ? 'rgba(255,255,255,0.035)' : 'rgba(24,24,27,0.05)';
            sctx.lineWidth = 1;
            for (let rx = x + 6; rx < x + w - 4; rx += 6) {
                sctx.beginPath();
                sctx.moveTo(rx, topY + 2);
                sctx.lineTo(rx, groundY);
                sctx.stroke();
            }

            sctx.fillStyle = isDark ? '#3f3f46' : '#a1a1aa';
            sctx.fillRect(x - 1.5, topY - 2.5, w + 3, 2.5);
            sctx.fillStyle = isDark ? '#27272a' : '#d4d4d8';
            sctx.fillRect(x + 8, topY - 8, 15, 5.5);
            sctx.fillRect(x + w - 21, topY - 10, 11, 7.5);

            if (hasCrane) {
                const cx = x + w * 0.62;
                sctx.strokeStyle = isDark ? '#52525b' : '#71717a';
                sctx.lineWidth = 1.6;
                sctx.beginPath();
                sctx.moveTo(cx, topY - 2.5);
                sctx.lineTo(cx, topY - 24);
                sctx.lineTo(cx + 22, topY - 32);
                sctx.moveTo(cx, topY - 24);
                sctx.lineTo(cx - 10, topY - 18);
                sctx.stroke();

                sctx.fillStyle = isDark ? '#3f3f46' : '#71717a';
                sctx.fillRect(cx - 13, topY - 20, 6, 4);
            }

            const winY1 = topY + 13;
            const winY2 = topY + 27;
            sctx.fillStyle = isDark ? 'rgba(245, 158, 11, 0.42)' : 'rgba(5, 150, 105, 0.28)';
            sctx.fillRect(x + 5, winY1, w - 10, 6.5);
            sctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.36)' : 'rgba(24, 24, 27, 0.16)';
            sctx.fillRect(x + 5, winY2, w - 10, 4.5);

            sctx.fillStyle = isDark ? '#161619' : '#ececef';
            for (let mx = x + 13; mx < x + w - 8; mx += 9) {
                sctx.fillRect(mx, winY1, 1.3, 6.5);
                sctx.fillRect(mx, winY2, 1.3, 4.5);
            }

            if (showDoor) {
                const doorW = Math.min(30, w * 0.44);
                const doorH = Math.min(62 * scale, h * 0.50);
                const doorX = x + (w - doorW) * 0.5;
                const doorY = groundY - doorH;
                sctx.fillStyle = isDark ? '#09090b' : '#27272a';
                sctx.fillRect(doorX, doorY, doorW, doorH);

                const glow = sctx.createLinearGradient(doorX, doorY, doorX, groundY);
                glow.addColorStop(0, isDark ? 'rgba(251, 191, 36, 0.24)' : 'rgba(245, 158, 11, 0.16)');
                glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
                sctx.fillStyle = glow;
                sctx.fillRect(doorX + 1, doorY + 1, doorW - 2, doorH - 1);

                sctx.fillStyle = '#f59e0b';
                sctx.fillRect(doorX + 2, doorY + 5, doorW - 4, 2.2);

                const bW = Math.max(6.5, doorW * 0.28);
                const bX = doorX + (doorW - bW) * 0.5;
                const bGrad = sctx.createLinearGradient(bX, doorY + 10, bX + bW, doorY + 10);
                bGrad.addColorStop(0, '#52525b');
                bGrad.addColorStop(0.45, '#f4f4f5');
                bGrad.addColorStop(1, '#27272a');
                sctx.fillStyle = bGrad;
                sctx.fillRect(bX, doorY + 11, bW, doorH - 11);
            }

            if (label && w >= 52) {
                sctx.font = '600 7px "JetBrains Mono", monospace';
                sctx.fillStyle = isDark ? 'rgba(250, 250, 250, 0.52)' : 'rgba(24, 24, 27, 0.52)';
                sctx.textAlign = 'center';
                sctx.fillText(label, x + w * 0.5, topY + 43);
            }

            sctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(24, 24, 27, 0.12)';
            sctx.lineWidth = 1;
            sctx.strokeRect(x + 0.5, topY + 0.5, w - 1, h - 1);
        }

        drawSingleBay(baseX, bay1W, bay1H, 'MEGA BAY 1', true, isWide);
        drawSingleBay(baseX + bay1W + 6, bay2W, bay2H, 'BAY 2', false, false);

        const pulse = reducedMotion ? 0.9 : 0.22 + 0.78 * (0.5 + 0.5 * Math.sin(elapsedSec * 2.5));
        sctx.fillStyle = `rgba(239, 68, 68, ${pulse.toFixed(2)})`;
        sctx.beginPath();
        sctx.arc(baseX + 3, groundY - bay1H - 4.5, 1.9, 0, Math.PI * 2);
        sctx.fill();

        sctx.restore();
        return baseX + bay1W + bay2W + 16;
    }

    function drawTankFarm(startX, groundY, padX, scale, isWide, elapsedSec, isDark) {
        sctx.save();
        const isCompact = width < 680;
        const vertCount = isCompact ? 3 : isWide ? 5 : 4;
        const spacing = isCompact ? 13 : 15;
        const tankW = isCompact ? 9.5 : 11;

        const bridgeEndX = padX - 44 * scale;
        if (bridgeEndX > startX + 10) {
            const pipeY = groundY - 14 * scale;
            sctx.strokeStyle = isDark ? '#52525b' : '#a1a1aa';
            sctx.lineWidth = 1.7;
            sctx.beginPath();
            sctx.moveTo(startX, pipeY);
            sctx.lineTo(bridgeEndX, pipeY);
            sctx.moveTo(startX, pipeY + 3.5);
            sctx.lineTo(bridgeEndX, pipeY + 3.5);
            sctx.stroke();

            sctx.lineWidth = 1.0;
            for (let px = startX + 12; px < bridgeEndX; px += 28) {
                sctx.beginPath();
                sctx.moveTo(px, pipeY);
                sctx.lineTo(px, groundY);
                sctx.stroke();
            }
        }

        for (let i = 0; i < vertCount; i++) {
            const tx = startX + i * spacing;
            const th = (50 + (i % 2) * 10) * scale;
            const ty = groundY - th;

            const tGrad = sctx.createLinearGradient(tx, ty, tx + tankW, ty);
            if (isDark) {
                tGrad.addColorStop(0, '#52525b');
                tGrad.addColorStop(0.32, '#e4e4e7');
                tGrad.addColorStop(0.68, '#a1a1aa');
                tGrad.addColorStop(1, '#3f3f46');
            } else {
                tGrad.addColorStop(0, '#d4d4d8');
                tGrad.addColorStop(0.32, '#ffffff');
                tGrad.addColorStop(0.7, '#e4e4e7');
                tGrad.addColorStop(1, '#a1a1aa');
            }

            sctx.fillStyle = tGrad;
            sctx.beginPath();
            sctx.ellipse(tx + tankW / 2, ty + 3.5, tankW / 2, 4.8, 0, Math.PI, Math.PI * 2);
            sctx.fill();
            sctx.fillRect(tx, ty + 3.5, tankW, th - 7);

            sctx.fillStyle = isDark ? '#27272a' : '#a1a1aa';
            sctx.fillRect(tx + 1, groundY - 3.5, tankW - 2, 3.5);
        }

        if (!isCompact) {
            const bulletStartX = startX + vertCount * spacing + 6;
            const bulletW = 34;
            const bulletH = 11.5;
            for (let b = 0; b < 2; b++) {
                const by = groundY - 17 - b * 14.5;
                const bGrad = sctx.createLinearGradient(0, by, 0, by + bulletH);
                if (isDark) {
                    bGrad.addColorStop(0, '#e4e4e7');
                    bGrad.addColorStop(0.5, '#a1a1aa');
                    bGrad.addColorStop(1, '#3f3f46');
                } else {
                    bGrad.addColorStop(0, '#ffffff');
                    bGrad.addColorStop(0.55, '#e4e4e7');
                    bGrad.addColorStop(1, '#a1a1aa');
                }
                sctx.fillStyle = bGrad;
                roundRectPath(bulletStartX, by, bulletW, bulletH, bulletH / 2);
                sctx.fill();

                sctx.fillStyle = isDark ? '#3f3f46' : '#71717a';
                sctx.fillRect(bulletStartX + 7, by + bulletH, 2.5, groundY - (by + bulletH));
                sctx.fillRect(bulletStartX + bulletW - 9.5, by + bulletH, 2.5, groundY - (by + bulletH));
            }
        }

        if (!reducedMotion) {
            for (let v = 0; v < 3; v++) {
                const life = ((elapsedSec * 0.34 + v * 0.33) % 1 + 1) % 1;
                const vx = startX + 8 + v * 20 + life * 18;
                const vy = groundY - 58 * scale - life * 18;
                const rad = 3.5 + life * 8;
                const vGrad = sctx.createRadialGradient(vx, vy, 0, vx, vy, rad);
                const alpha = (1 - life) * (isDark ? 0.22 : 0.34);
                vGrad.addColorStop(0, `rgba(228, 228, 231, ${alpha.toFixed(3)})`);
                vGrad.addColorStop(1, 'rgba(228, 228, 231, 0)');
                sctx.fillStyle = vGrad;
                sctx.beginPath();
                sctx.arc(vx, vy, rad, 0, Math.PI * 2);
                sctx.fill();
            }
        }

        sctx.restore();
    }

    function drawMissionControl(x, groundY, scale, isWide, elapsedSec, isDark) {
        sctx.save();
        const w = isWide ? Math.min(132, Math.max(102, width * 0.095)) : Math.min(96, Math.max(76, width * 0.14));
        const h = isWide ? 48 : 38;
        const topY = groundY - h;

        sctx.fillStyle = isDark ? '#18181b' : '#ececef';
        sctx.beginPath();
        sctx.moveTo(x, groundY);
        sctx.lineTo(x + 5, topY);
        sctx.lineTo(x + w, topY);
        sctx.lineTo(x + w, groundY);
        sctx.closePath();
        sctx.fill();

        const deckW = w * 0.46;
        const deckH = isWide ? 28 * scale : 0;
        const deckX = x + w - deckW - 6;
        const deckTopY = topY - deckH;
        if (isWide) {
            sctx.fillStyle = isDark ? '#202024' : '#e4e4e7';
            sctx.fillRect(deckX, deckTopY, deckW, deckH);
            sctx.fillStyle = isDark ? '#3f3f46' : '#a1a1aa';
            sctx.fillRect(deckX - 2, deckTopY - 2, deckW + 4, 2);

            sctx.fillStyle = isDark ? '#09090b' : '#27272a';
            sctx.fillRect(deckX + 5, deckTopY + 6, deckW - 10, 9);
            sctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.78)' : 'rgba(5, 150, 105, 0.65)';
            sctx.fillRect(deckX + 8, deckTopY + 8.5, (deckW - 16) * 0.55, 4);
            sctx.fillStyle = isDark ? 'rgba(245, 158, 11, 0.72)' : 'rgba(217, 119, 6, 0.6)';
            sctx.fillRect(deckX + 8 + (deckW - 16) * 0.62, deckTopY + 8.5, (deckW - 16) * 0.34, 4);

            sctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,27,0.12)';
            sctx.lineWidth = 1;
            sctx.strokeRect(deckX + 0.5, deckTopY + 0.5, deckW - 1, deckH - 1);
        }

        sctx.fillStyle = isDark ? '#3f3f46' : '#a1a1aa';
        sctx.fillRect(x + 2, topY - 2.5, w + 1, 2.5);

        const glassX = x + 10;
        const glassY = topY + 10;
        const glassW = w - 18;
        const glassH = 14;
        sctx.fillStyle = isDark ? '#09090b' : '#27272a';
        sctx.fillRect(glassX, glassY, glassW, glassH);

        sctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.85)' : 'rgba(5, 150, 105, 0.75)';
        sctx.fillRect(glassX + 4, glassY + 3.5, glassW * 0.26, 6);
        sctx.fillStyle = isDark ? 'rgba(228, 228, 231, 0.65)' : 'rgba(161, 161, 170, 0.7)';
        sctx.fillRect(glassX + glassW * 0.35, glassY + 3.5, glassW * 0.26, 6);
        sctx.fillStyle = isDark ? 'rgba(245, 158, 11, 0.82)' : 'rgba(217, 119, 6, 0.72)';
        sctx.fillRect(glassX + glassW * 0.67, glassY + 3.5, glassW * 0.24, 6);

        sctx.fillStyle = isDark ? '#18181b' : '#ececef';
        sctx.fillRect(glassX + glassW * 0.32, glassY, 1.5, glassH);
        sctx.fillRect(glassX + glassW * 0.64, glassY, 1.5, glassH);

        sctx.fillStyle = isDark ? '#09090b' : '#3f3f46';
        sctx.fillRect(x + 10, groundY - 13, 10, 13);

        const mastX = isWide ? deckX + deckW * 0.72 : x + w - 16;
        const mastBaseY = isWide ? deckTopY - 2 : topY - 2.5;
        const mastH = (isWide ? 116 : 54) * scale;
        const mastTopY = mastBaseY - mastH;

        sctx.strokeStyle = isDark ? '#52525b' : '#71717a';
        sctx.lineWidth = 1.4;
        sctx.beginPath();
        sctx.moveTo(mastX - 4.5, mastBaseY);
        sctx.lineTo(mastX - 1.0, mastTopY);
        sctx.moveTo(mastX + 4.5, mastBaseY);
        sctx.lineTo(mastX + 1.0, mastTopY);
        sctx.stroke();

        sctx.lineWidth = 0.85;
        for (let ry = mastBaseY - 12; ry > mastTopY + 8; ry -= 14) {
            const t = (mastBaseY - ry) / mastH;
            const hw = 4.5 - t * 3.5;
            sctx.beginPath();
            sctx.moveTo(mastX - hw, ry);
            sctx.lineTo(mastX + hw, ry - 7);
            sctx.moveTo(mastX + hw, ry);
            sctx.lineTo(mastX - hw, ry - 7);
            sctx.stroke();
        }

        const pulse = reducedMotion ? 0.9 : 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(elapsedSec * 2.6 + 0.6));
        if (isDark) {
            const glow = sctx.createRadialGradient(mastX, mastTopY - 2, 0.5, mastX, mastTopY - 2, 10);
            glow.addColorStop(0, `rgba(239, 68, 68, ${(pulse * 0.75).toFixed(2)})`);
            glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
            sctx.fillStyle = glow;
            sctx.beginPath();
            sctx.arc(mastX, mastTopY - 2, 10, 0, Math.PI * 2);
            sctx.fill();
        }
        sctx.fillStyle = `rgba(239, 68, 68, ${pulse.toFixed(2)})`;
        sctx.beginPath();
        sctx.arc(mastX, mastTopY - 2, 1.9, 0, Math.PI * 2);
        sctx.fill();

        const dishBaseX = isWide ? x + 24 : x + 22;
        const dishBaseY = topY - 2.5;
        const panAngle = reducedMotion ? -0.45 : -0.45 + Math.sin(elapsedSec * 0.6) * 0.30;

        sctx.strokeStyle = isDark ? '#71717a' : '#52525b';
        sctx.lineWidth = 2.2;
        sctx.beginPath();
        sctx.moveTo(dishBaseX, dishBaseY);
        sctx.lineTo(dishBaseX, dishBaseY - 12);
        sctx.stroke();

        sctx.save();
        sctx.translate(dishBaseX, dishBaseY - 13);
        sctx.rotate(panAngle);
        sctx.strokeStyle = isDark ? '#f4f4f5' : '#3f3f46';
        sctx.lineWidth = 2.4;
        sctx.beginPath();
        sctx.arc(0, 0, 10.5, Math.PI * 0.64, Math.PI * 1.36);
        sctx.stroke();
        sctx.lineWidth = 1.2;
        sctx.beginPath();
        sctx.moveTo(-10.5, 0);
        sctx.lineTo(-17, 0);
        sctx.stroke();
        sctx.fillStyle = isDark ? '#10b981' : '#059669';
        sctx.beginPath();
        sctx.arc(-17.5, 0, 1.7, 0, Math.PI * 2);
        sctx.fill();
        sctx.restore();

        sctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,27,0.12)';
        sctx.lineWidth = 1;
        sctx.strokeRect(x + 0.5, topY + 0.5, w - 1, h - 1);

        sctx.restore();
    }

    function drawLaunchComplex(padX, groundY, scale, elapsedSec, isDark, isFiring, fireIntensity) {
        sctx.save();

        const towerW = 28 * scale;
        const towerH = 220 * scale;
        const towerX = padX - towerW - 22 * scale;
        const towerTopY = groundY - towerH;

        const steelMain = isDark ? '#71717a' : '#52525b';
        const steelBright = isDark ? '#a1a1aa' : '#71717a';
        const steelDark = isDark ? '#27272a' : '#3f3f46';

        if (isDark) {
            const floodGrad = sctx.createLinearGradient(padX, groundY, padX, towerTopY - 12);
            if (isFiring) {
                floodGrad.addColorStop(0, `rgba(251, 146, 60, ${(0.42 * fireIntensity).toFixed(2)})`);
                floodGrad.addColorStop(0.5, `rgba(245, 158, 11, ${(0.16 * fireIntensity).toFixed(2)})`);
                floodGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
            } else {
                floodGrad.addColorStop(0, 'rgba(244, 244, 245, 0.10)');
                floodGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.045)');
                floodGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
            }
            sctx.fillStyle = floodGrad;
            sctx.beginPath();
            sctx.moveTo(padX - 72 * scale, groundY);
            sctx.lineTo(towerX - 10, towerTopY);
            sctx.lineTo(padX + 42 * scale, towerTopY);
            sctx.lineTo(padX + 68 * scale, groundY);
            sctx.closePath();
            sctx.fill();
        }

        // --- 1. MECHAZILLA 9-BAY OPEN-LATTICE STEEL TOWER ---
        const bays = 9;
        const bayH = towerH / bays;
        sctx.strokeStyle = isDark ? 'rgba(82, 82, 91, 0.45)' : 'rgba(113, 113, 122, 0.32)';
        sctx.lineWidth = 0.9;
        for (let i = 0; i < bays; i++) {
            const y1 = groundY - i * bayH;
            const y2 = y1 - bayH;
            sctx.beginPath();
            sctx.moveTo(towerX + 5, y1);
            sctx.lineTo(towerX + towerW - 5, y2);
            sctx.moveTo(towerX + towerW - 5, y1);
            sctx.lineTo(towerX + 5, y2);
            sctx.stroke();
        }

        sctx.fillStyle = isDark ? 'rgba(39, 39, 42, 0.72)' : 'rgba(161, 161, 170, 0.36)';
        sctx.fillRect(towerX + towerW * 0.33, towerTopY + 10, towerW * 0.34, towerH - 10);

        sctx.strokeStyle = steelMain;
        sctx.lineWidth = 1.25;
        for (let i = 0; i < bays; i++) {
            const y1 = groundY - i * bayH;
            const y2 = y1 - bayH;
            sctx.beginPath();
            sctx.moveTo(towerX, y2);
            sctx.lineTo(towerX + towerW, y2);
            sctx.moveTo(towerX + 1.5, y1);
            sctx.lineTo(towerX + towerW - 1.5, y2);
            sctx.moveTo(towerX + towerW - 1.5, y1);
            sctx.lineTo(towerX + 1.5, y2);
            sctx.stroke();
        }

        sctx.fillStyle = steelBright;
        sctx.fillRect(towerX, towerTopY, 3, towerH);
        sctx.fillStyle = steelDark;
        sctx.fillRect(towerX + towerW - 3, towerTopY, 3, towerH);

        sctx.fillStyle = steelDark;
        sctx.fillRect(towerX - 3.5, towerTopY - 4.5, towerW + 7, 4.5);
        sctx.fillStyle = steelBright;
        sctx.fillRect(towerX + 3.5, towerTopY - 9, towerW - 7, 4.5);

        const spireX = towerX + towerW * 0.5;
        const spireH = 22 * scale;
        const beaconY = towerTopY - 9 - spireH;
        sctx.strokeStyle = steelBright;
        sctx.lineWidth = 1.5;
        sctx.beginPath();
        sctx.moveTo(spireX, towerTopY - 9);
        sctx.lineTo(spireX, beaconY);
        sctx.stroke();

        const beaconPulse = reducedMotion ? 0.95 : 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(elapsedSec * 2.8));
        if (isDark) {
            const bGlow = sctx.createRadialGradient(spireX, beaconY, 0.5, spireX, beaconY, 12);
            bGlow.addColorStop(0, `rgba(239, 68, 68, ${(beaconPulse * 0.82).toFixed(2)})`);
            bGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
            sctx.fillStyle = bGlow;
            sctx.beginPath();
            sctx.arc(spireX, beaconY, 12, 0, Math.PI * 2);
            sctx.fill();
        }
        sctx.fillStyle = `rgba(239, 68, 68, ${beaconPulse.toFixed(2)})`;
        sctx.beginPath();
        sctx.arc(spireX, beaconY, 2.2, 0, Math.PI * 2);
        sctx.fill();

        // --- 2. ORBITAL LAUNCH MOUNT (OLM) ---
        const olmW = 50 * scale;
        const olmH = 28 * scale;
        const olmX = padX - olmW * 0.5;
        const olmTopY = groundY - olmH;

        sctx.fillStyle = isDark ? '#050507' : '#18181b';
        sctx.fillRect(olmX + 7, olmTopY + 6, olmW - 14, olmH - 6);

        const pierGrad = sctx.createLinearGradient(olmX, olmTopY, olmX + olmW, olmTopY);
        pierGrad.addColorStop(0, isDark ? '#3f3f46' : '#a1a1aa');
        pierGrad.addColorStop(0.5, isDark ? '#27272a' : '#71717a');
        pierGrad.addColorStop(1, isDark ? '#3f3f46' : '#a1a1aa');
        sctx.fillStyle = pierGrad;
        sctx.fillRect(olmX + 2, olmTopY + 5, 9 * scale, olmH - 5);
        sctx.fillRect(olmX + olmW - 2 - 9 * scale, olmTopY + 5, 9 * scale, olmH - 5);

        sctx.fillStyle = '#52525b';
        roundRectPath(olmX - 2.5, olmTopY, olmW + 5, 7.5 * scale, 2.5);
        sctx.fill();
        sctx.fillStyle = isDark ? '#71717a' : '#a1a1aa';
        sctx.fillRect(olmX + 5, olmTopY - 2.2, olmW - 10, 2.4);

        // --- 3. STARSHIP FLIGHT 14 + SUPER HEAVY BOOSTER ---
        const shipW = 19 * scale;
        const boosterH = 104 * scale;
        const interstageH = 7 * scale;
        const upperH = 78 * scale;
        const stackBaseY = olmTopY - 1.5;
        const shipX = padX - shipW * 0.5;

        if (isFiring && fireIntensity > 0.02) {
            const plumeH = (28 + Math.sin(elapsedSec * 52) * 3.5) * scale * fireIntensity;

            const groundWash = sctx.createRadialGradient(padX, groundY, 6, padX, groundY, 130 * scale);
            groundWash.addColorStop(0, `rgba(251, 146, 60, ${(0.45 * fireIntensity).toFixed(2)})`);
            groundWash.addColorStop(0.5, `rgba(249, 115, 22, ${(0.16 * fireIntensity).toFixed(2)})`);
            groundWash.addColorStop(1, 'rgba(249, 115, 22, 0)');
            sctx.fillStyle = groundWash;
            sctx.beginPath();
            sctx.ellipse(padX, groundY, 130 * scale, 34 * scale, 0, Math.PI, Math.PI * 2);
            sctx.fill();

            const plumeGrad = sctx.createLinearGradient(padX, stackBaseY, padX, stackBaseY + plumeH + 12);
            plumeGrad.addColorStop(0, '#ffffff');
            plumeGrad.addColorStop(0.24, '#fef08a');
            plumeGrad.addColorStop(0.55, '#fb923c');
            plumeGrad.addColorStop(0.84, 'rgba(234, 88, 12, 0.55)');
            plumeGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
            sctx.fillStyle = plumeGrad;
            sctx.beginPath();
            sctx.moveTo(shipX + 1.5, stackBaseY);
            sctx.lineTo(shipX + shipW - 1.5, stackBaseY);
            sctx.lineTo(padX + shipW * 0.85, stackBaseY + plumeH + 8);
            sctx.lineTo(padX - shipW * 0.85, stackBaseY + plumeH + 8);
            sctx.closePath();
            sctx.fill();

            sctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            for (let d = 0; d < 3; d++) {
                const dy = stackBaseY + (6 + d * 7) * scale * fireIntensity;
                const dw = Math.max(1.8, (5.0 - d * 1.1) * scale);
                sctx.beginPath();
                sctx.moveTo(padX, dy - 3);
                sctx.lineTo(padX + dw, dy);
                sctx.lineTo(padX, dy + 3);
                sctx.lineTo(padX - dw, dy);
                sctx.closePath();
                sctx.fill();
            }
        }

        const ssGrad = sctx.createLinearGradient(shipX, 0, shipX + shipW, 0);
        if (isDark) {
            ssGrad.addColorStop(0, '#71717a');
            ssGrad.addColorStop(0.26, '#e4e4e7');
            ssGrad.addColorStop(0.48, '#ffffff');
            ssGrad.addColorStop(0.76, '#a1a1aa');
            ssGrad.addColorStop(1, '#3f3f46');
        } else {
            ssGrad.addColorStop(0, '#94a3b8');
            ssGrad.addColorStop(0.28, '#f4f4f5');
            ssGrad.addColorStop(0.48, '#ffffff');
            ssGrad.addColorStop(0.78, '#cbd5e1');
            ssGrad.addColorStop(1, '#52525b');
        }

        const boosterTopY = stackBaseY - boosterH;
        sctx.fillStyle = ssGrad;
        sctx.fillRect(shipX, boosterTopY, shipW, boosterH);

        sctx.fillStyle = isDark ? 'rgba(240, 249, 255, 0.24)' : 'rgba(255, 255, 255, 0.56)';
        sctx.fillRect(shipX + 1, boosterTopY + boosterH * 0.16, shipW - 2, boosterH * 0.28);
        sctx.fillRect(shipX + 1, boosterTopY + boosterH * 0.54, shipW - 2, boosterH * 0.30);

        sctx.strokeStyle = isDark ? 'rgba(24, 24, 27, 0.28)' : 'rgba(71, 85, 105, 0.22)';
        sctx.lineWidth = 0.75;
        for (let wy = boosterTopY + 13; wy < stackBaseY - 6; wy += 13 * scale) {
            sctx.beginPath();
            sctx.moveTo(shipX, wy);
            sctx.lineTo(shipX + shipW, wy);
            sctx.stroke();
        }

        const finY = boosterTopY + 7 * scale;
        sctx.fillStyle = '#18181b';
        sctx.fillRect(shipX - 5.5 * scale, finY, 5.5 * scale, 5 * scale);
        sctx.fillRect(shipX + shipW, finY, 5.5 * scale, 5 * scale);
        sctx.fillRect(shipX + 3 * scale, finY, 3.5 * scale, 5 * scale);
        sctx.fillRect(shipX + shipW - 6.5 * scale, finY, 3.5 * scale, 5 * scale);

        const interstageTopY = boosterTopY - interstageH;
        sctx.fillStyle = '#18181b';
        sctx.fillRect(shipX, interstageTopY, shipW, interstageH);
        sctx.fillStyle = isDark ? '#52525b' : '#71717a';
        for (let vx = shipX + 2; vx < shipX + shipW - 2; vx += 3.4) {
            sctx.fillRect(vx, interstageTopY + 1.5, 1.5, interstageH - 3);
        }

        const upperBaseY = interstageTopY;
        const bodyH = upperH * 0.58;
        const noseH = upperH - bodyH;
        const noseStartY = upperBaseY - bodyH;
        const tipY = upperBaseY - upperH;

        sctx.save();
        sctx.beginPath();
        sctx.moveTo(shipX, upperBaseY);
        sctx.lineTo(shipX, noseStartY);
        sctx.bezierCurveTo(shipX, noseStartY - noseH * 0.55, padX - shipW * 0.14, tipY + noseH * 0.12, padX, tipY);
        sctx.bezierCurveTo(padX + shipW * 0.14, tipY + noseH * 0.12, shipX + shipW, noseStartY - noseH * 0.55, shipX + shipW, noseStartY);
        sctx.lineTo(shipX + shipW, upperBaseY);
        sctx.closePath();

        sctx.fillStyle = ssGrad;
        sctx.fill();
        sctx.clip();

        sctx.fillStyle = isDark ? '#14151a' : '#18181b';
        sctx.fillRect(shipX, tipY, shipW * 0.43, upperH);

        sctx.fillStyle = isDark ? 'rgba(240, 249, 255, 0.22)' : 'rgba(255, 255, 255, 0.48)';
        sctx.fillRect(shipX + shipW * 0.43, upperBaseY - bodyH * 0.72, shipW * 0.57, bodyH * 0.34);

        sctx.font = `700 ${Math.max(6.5, Math.round(7.5 * scale))}px "JetBrains Mono", monospace`;
        sctx.fillStyle = isDark ? '#27272a' : '#3f3f46';
        sctx.textAlign = 'center';
        sctx.fillText('14', shipX + shipW * 0.73, upperBaseY - bodyH * 0.42);
        sctx.restore();

        sctx.fillStyle = '#18181b';
        sctx.beginPath();
        sctx.moveTo(shipX, upperBaseY - 18 * scale);
        sctx.lineTo(shipX - 7 * scale, upperBaseY - 4.5 * scale);
        sctx.lineTo(shipX - 5.5 * scale, upperBaseY - 1 * scale);
        sctx.lineTo(shipX, upperBaseY - 1 * scale);
        sctx.closePath();
        sctx.fill();

        sctx.fillStyle = '#52525b';
        sctx.beginPath();
        sctx.moveTo(shipX + shipW, upperBaseY - 18 * scale);
        sctx.lineTo(shipX + shipW + 7 * scale, upperBaseY - 4.5 * scale);
        sctx.lineTo(shipX + shipW + 5.5 * scale, upperBaseY - 1 * scale);
        sctx.lineTo(shipX + shipW, upperBaseY - 1 * scale);
        sctx.closePath();
        sctx.fill();

        sctx.fillStyle = '#18181b';
        sctx.beginPath();
        sctx.moveTo(shipX + 1.5, noseStartY - 9 * scale);
        sctx.lineTo(shipX - 4.5 * scale, noseStartY + 1.5 * scale);
        sctx.lineTo(shipX, noseStartY + 3.5 * scale);
        sctx.closePath();
        sctx.fill();

        sctx.fillStyle = '#52525b';
        sctx.beginPath();
        sctx.moveTo(shipX + shipW - 1.5, noseStartY - 9 * scale);
        sctx.lineTo(shipX + shipW + 4.5 * scale, noseStartY + 1.5 * scale);
        sctx.lineTo(shipX + shipW, noseStartY + 3.5 * scale);
        sctx.closePath();
        sctx.fill();

        if (isFiring && fireIntensity > 0.05) {
            sctx.fillStyle = `rgba(251, 146, 60, ${(0.24 * fireIntensity).toFixed(2)})`;
            sctx.fillRect(towerX + towerW - 3, groundY - boosterH * 0.9, 3, boosterH * 0.9);
            sctx.fillRect(shipX, stackBaseY - boosterH * 0.45, shipW, boosterH * 0.45);
        }

        // --- 4. CHOPSTICK CATCH ARMS & QD UMBILICAL ARM ---
        const armY = boosterTopY + 16 * scale;
        const armReach = (padX + shipW * 0.5 + 9 * scale) - (towerX + towerW);
        sctx.fillStyle = steelDark;
        sctx.fillRect(towerX + towerW - 3.5, armY - 7 * scale, 7, 16 * scale);
        sctx.fillStyle = steelBright;
        sctx.fillRect(towerX + towerW, armY - 2.8, armReach, 3.6);
        sctx.strokeStyle = steelMain;
        sctx.lineWidth = 1.8;
        sctx.beginPath();
        sctx.moveTo(towerX + towerW + 1, armY + 8 * scale);
        sctx.lineTo(towerX + towerW + armReach * 0.56, armY);
        sctx.stroke();
        sctx.fillStyle = '#18181b';
        sctx.fillRect(shipX - 2.5, armY - 4, 3.5, 5.5);
        sctx.fillRect(shipX + shipW - 1, armY - 4, 3.5, 5.5);

        const qdY = interstageTopY - upperH * 0.16;
        sctx.strokeStyle = steelBright;
        sctx.lineWidth = 2.2;
        sctx.beginPath();
        sctx.moveTo(towerX + towerW, qdY);
        sctx.lineTo(shipX, qdY);
        sctx.stroke();
        sctx.strokeStyle = steelDark;
        sctx.lineWidth = 1.1;
        sctx.beginPath();
        sctx.moveTo(towerX + towerW, qdY + 6);
        sctx.lineTo(shipX - 3, qdY);
        sctx.stroke();

        padHitbox = {
            x: towerX - 16,
            y: towerTopY - spireH - 16,
            w: (padX + olmW * 0.5 + 22) - (towerX - 16),
            h: towerH + spireH + 24,
        };

        sctx.restore();

        return {
            qdVentX: shipX + 1,
            qdVentY: qdY,
            interstageVentX: shipX + shipW,
            interstageVentY: interstageTopY + 3,
            olmVentX: olmX + olmW,
            olmVentY: olmTopY + 6,
            trenchX: padX,
            trenchY: groundY - 4,
        };
    }

    function drawCybertruck(x, y, dir, elapsedSec, isDark) {
        sctx.save();
        sctx.translate(x, y);
        if (dir < 0) sctx.scale(-1, 1);

        if (isDark) {
            const beam = sctx.createLinearGradient(20, -6, 68, -6);
            beam.addColorStop(0, 'rgba(241, 245, 249, 0.30)');
            beam.addColorStop(1, 'rgba(241, 245, 249, 0)');
            sctx.fillStyle = beam;
            sctx.beginPath();
            sctx.moveTo(19, -7.5);
            sctx.lineTo(68, -14);
            sctx.lineTo(68, 1);
            sctx.lineTo(19, -3.5);
            sctx.closePath();
            sctx.fill();
        }

        sctx.fillStyle = isDark ? 'rgba(0,0,0,0.48)' : 'rgba(24,24,27,0.22)';
        sctx.beginPath();
        sctx.ellipse(0, 0.6, 20, 2.4, 0, 0, Math.PI * 2);
        sctx.fill();

        const bodyGrad = sctx.createLinearGradient(0, -15.5, 0, -2.5);
        if (isDark) {
            bodyGrad.addColorStop(0, '#f4f4f5');
            bodyGrad.addColorStop(0.45, '#d4d4d8');
            bodyGrad.addColorStop(1, '#71717a');
        } else {
            bodyGrad.addColorStop(0, '#f8fafc');
            bodyGrad.addColorStop(0.5, '#cbd5e1');
            bodyGrad.addColorStop(1, '#64748b');
        }
        sctx.fillStyle = bodyGrad;
        sctx.beginPath();
        sctx.moveTo(-20, -3.6);
        sctx.lineTo(-20, -9.6);
        sctx.lineTo(-1.8, -15.4);
        sctx.lineTo(20.5, -8.4);
        sctx.lineTo(20.5, -3.6);
        sctx.closePath();
        sctx.fill();

        sctx.strokeStyle = isDark ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.75)';
        sctx.lineWidth = 0.8;
        sctx.beginPath();
        sctx.moveTo(-19.5, -8.4);
        sctx.lineTo(20, -7.7);
        sctx.stroke();

        sctx.fillStyle = '#09090b';
        sctx.beginPath();
        sctx.moveTo(-10, -9.7);
        sctx.lineTo(-1.8, -14.1);
        sctx.lineTo(11, -9.4);
        sctx.closePath();
        sctx.fill();

        sctx.fillStyle = '#ffffff';
        sctx.fillRect(18.2, -8.2, 2.5, 1.6);
        sctx.fillStyle = '#ef4444';
        sctx.fillRect(-20.4, -9.1, 2.1, 1.7);

        const spinAngle = reducedMotion ? 0 : elapsedSec * 14;
        const wheelXs = [-12.2, 12.0];
        for (let i = 0; i < wheelXs.length; i++) {
            const wx = wheelXs[i];
            sctx.fillStyle = '#09090b';
            sctx.beginPath();
            sctx.arc(wx, -3.2, 4.1, 0, Math.PI * 2);
            sctx.fill();
            sctx.fillStyle = '#71717a';
            sctx.beginPath();
            sctx.arc(wx, -3.2, 2.2, 0, Math.PI * 2);
            sctx.fill();
            sctx.strokeStyle = '#e4e4e7';
            sctx.lineWidth = 0.8;
            sctx.beginPath();
            sctx.moveTo(wx - Math.cos(spinAngle) * 1.9, -3.2 - Math.sin(spinAngle) * 1.9);
            sctx.lineTo(wx + Math.cos(spinAngle) * 1.9, -3.2 + Math.sin(spinAngle) * 1.9);
            sctx.stroke();
        }

        sctx.restore();
    }

    function drawTesla(x, y, dir, finish, elapsedSec, isDark) {
        sctx.save();
        sctx.translate(x, y);
        if (dir < 0) sctx.scale(-1, 1);

        if (isDark) {
            const beam = sctx.createLinearGradient(17, -5, 62, -5);
            beam.addColorStop(0, 'rgba(254, 249, 195, 0.26)');
            beam.addColorStop(1, 'rgba(254, 249, 195, 0)');
            sctx.fillStyle = beam;
            sctx.beginPath();
            sctx.moveTo(17, -6.5);
            sctx.lineTo(62, -12);
            sctx.lineTo(62, 1);
            sctx.lineTo(17, -3);
            sctx.closePath();
            sctx.fill();
        }

        sctx.fillStyle = isDark ? 'rgba(0,0,0,0.45)' : 'rgba(24,24,27,0.20)';
        sctx.beginPath();
        sctx.ellipse(0, 0.6, 18, 2.1, 0, 0, Math.PI * 2);
        sctx.fill();

        const palettes = {
            pearl: ['#ffffff', '#cbd5e1'],
            silver: isDark ? ['#a1a1aa', '#52525b'] : ['#94a3b8', '#475569'],
            obsidian: isDark ? ['#3f3f46', '#18181b'] : ['#334155', '#0f172a'],
        };
        const [cTop, cBot] = palettes[finish] || palettes.pearl;
        const grad = sctx.createLinearGradient(0, -13, 0, -2.5);
        grad.addColorStop(0, cTop);
        grad.addColorStop(1, cBot);

        sctx.fillStyle = grad;
        sctx.beginPath();
        sctx.moveTo(-18, -3.4);
        sctx.quadraticCurveTo(-18.8, -7.4, -15.4, -8.3);
        sctx.bezierCurveTo(-10, -13.2, 3, -13.4, 8.8, -8.3);
        sctx.quadraticCurveTo(16.8, -7.8, 18.6, -5.0);
        sctx.lineTo(18.2, -3.2);
        sctx.closePath();
        sctx.fill();

        sctx.fillStyle = '#09090b';
        sctx.beginPath();
        sctx.moveTo(-11.2, -8.5);
        sctx.bezierCurveTo(-7.0, -12.1, 2.2, -12.1, 7.2, -8.4);
        sctx.closePath();
        sctx.fill();

        sctx.fillStyle = '#fef3c7';
        sctx.beginPath();
        sctx.ellipse(16.8, -6.0, 2.0, 0.95, -0.2, 0, Math.PI * 2);
        sctx.fill();
        sctx.fillStyle = '#ef4444';
        sctx.fillRect(-18.2, -7.4, 2.3, 1.4);

        const spinAngle = reducedMotion ? 0 : elapsedSec * 16;
        const wheelXs = [-10.8, 10.6];
        for (let i = 0; i < wheelXs.length; i++) {
            const wx = wheelXs[i];
            sctx.fillStyle = '#09090b';
            sctx.beginPath();
            sctx.arc(wx, -3.0, 3.6, 0, Math.PI * 2);
            sctx.fill();
            sctx.fillStyle = '#94a3b8';
            sctx.beginPath();
            sctx.arc(wx, -3.0, 1.9, 0, Math.PI * 2);
            sctx.fill();
            sctx.strokeStyle = '#e4e4e7';
            sctx.lineWidth = 0.75;
            sctx.beginPath();
            sctx.moveTo(wx - Math.cos(spinAngle) * 1.6, -3.0 - Math.sin(spinAngle) * 1.6);
            sctx.lineTo(wx + Math.cos(spinAngle) * 1.6, -3.0 + Math.sin(spinAngle) * 1.6);
            sctx.stroke();
        }

        sctx.restore();
    }

    function drawEngineer(x, y, eng, isDark) {
        sctx.save();
        sctx.translate(x, y);

        const isWalking = !reducedMotion && eng.pauseTimer <= 0;
        const swing = isWalking ? Math.sin(eng.walkPhase) * 2.8 : 0;

        sctx.fillStyle = isDark ? 'rgba(0,0,0,0.42)' : 'rgba(24,24,27,0.18)';
        sctx.beginPath();
        sctx.ellipse(0, 0, 3.8, 1.1, 0, 0, Math.PI * 2);
        sctx.fill();

        sctx.strokeStyle = isDark ? '#71717a' : '#27272a';
        sctx.lineWidth = 1.6;
        sctx.lineCap = 'round';
        sctx.beginPath();
        sctx.moveTo(-0.8, -6.2);
        sctx.lineTo(-0.8 - swing, -0.4);
        sctx.moveTo(0.8, -6.2);
        sctx.lineTo(0.8 + swing, -0.4);
        sctx.stroke();

        const vestCol =
            eng.jacket === 'emerald'
                ? isDark
                    ? '#10b981'
                    : '#059669'
                : eng.jacket === 'amber'
                    ? '#f59e0b'
                    : eng.jacket === 'slate'
                        ? isDark
                            ? '#a1a1aa'
                            : '#52525b'
                        : isDark
                            ? '#71717a'
                            : '#27272a';
        sctx.fillStyle = vestCol;
        roundRectPath(-2.5, -12.0, 5.0, 6.2, 1.6);
        sctx.fill();

        if (eng.clipboard) {
            sctx.fillStyle = isDark ? '#e4e4e7' : '#52525b';
            sctx.fillRect(eng.dir >= 0 ? 2.4 : -4.0, -10.0, 1.8, 2.8);
        }

        sctx.fillStyle = '#fdba74';
        sctx.beginPath();
        sctx.arc(0, -13.9, 2.0, 0, Math.PI * 2);
        sctx.fill();

        sctx.fillStyle = eng.hat === 'yellow' ? '#facc15' : '#f4f4f5';
        sctx.beginPath();
        sctx.arc(0, -14.5, 2.3, Math.PI, Math.PI * 2);
        sctx.fill();

        sctx.restore();
    }

    function drawWalkwayBollardsAndLamps(groundY, roadTop, isDark) {
        const bollardStep = 58;
        for (let bx = 24; bx < width - 20; bx += bollardStep) {
            sctx.fillStyle = isDark ? '#3f3f46' : '#71717a';
            sctx.fillRect(bx, roadTop - 6.5, 2.2, 5.5);
            sctx.fillStyle = isDark ? '#facc15' : '#eab308';
            sctx.fillRect(bx, roadTop - 5.5, 2.2, 1.2);
        }

        const count = Math.max(4, Math.floor(width / 250));
        const step = width / (count + 1);
        for (let i = 1; i <= count; i++) {
            const lx = step * i;
            sctx.save();
            sctx.strokeStyle = isDark ? '#52525b' : '#71717a';
            sctx.lineWidth = 1.5;
            sctx.beginPath();
            sctx.moveTo(lx, roadTop - 1);
            sctx.lineTo(lx, roadTop - 32);
            sctx.lineTo(lx + 6, roadTop - 32);
            sctx.stroke();

            sctx.fillStyle = isDark ? '#fef9c3' : '#94a3b8';
            sctx.fillRect(lx + 4, roadTop - 32.5, 3.2, 1.6);

            if (isDark) {
                const cone = sctx.createLinearGradient(lx + 5.5, roadTop - 31, lx + 5.5, roadTop + 32);
                cone.addColorStop(0, 'rgba(254, 249, 195, 0.22)');
                cone.addColorStop(1, 'rgba(254, 249, 195, 0)');
                sctx.fillStyle = cone;
                sctx.beginPath();
                sctx.moveTo(lx + 3.5, roadTop - 31);
                sctx.lineTo(lx + 7.5, roadTop - 31);
                sctx.lineTo(lx + 28, roadTop + 32);
                sctx.lineTo(lx - 16, roadTop + 32);
                sctx.closePath();
                sctx.fill();
            }
            sctx.restore();
        }
    }

    function updateSimulation(dt, now, vents) {
        if (reducedMotion) return;

        for (let i = 0; i < VEHICLES.length; i++) {
            const v = VEHICLES[i];
            v.u += v.speed * dt;
            if (v.u > 1.08) v.u -= 1.16;
            if (v.u < -0.08) v.u += 1.16;
        }

        for (let i = 0; i < ENGINEERS.length; i++) {
            const p = ENGINEERS[i];
            if (p.pauseTimer > 0) {
                p.pauseTimer -= dt;
                continue;
            }
            p.u += p.dir * p.speed * dt;
            p.walkPhase += dt * 7.0;

            if (p.u > 0.94) {
                p.u = 0.94;
                p.dir = -1;
            } else if (p.u < 0.06) {
                p.u = 0.06;
                p.dir = 1;
            }

            if (Math.random() < dt * 0.14) {
                p.pauseTimer = 2.0 + Math.random() * 2.8;
            }
        }

        if (vents && Math.random() < dt * 13) {
            const r = Math.random();
            const sx = r < 0.4 ? vents.qdVentX : r < 0.75 ? vents.interstageVentX : vents.olmVentX;
            const sy = r < 0.4 ? vents.qdVentY : r < 0.75 ? vents.interstageVentY : vents.olmVentY;
            cryoPuffs.push({
                x: sx,
                y: sy,
                vx: 16 + Math.random() * 16,
                vy: -5 - Math.random() * 9,
                r: 3 + Math.random() * 3,
                life: 0,
                maxLife: 1.6 + Math.random() * 1.2,
            });
        }

        for (let i = cryoPuffs.length - 1; i >= 0; i--) {
            const pt = cryoPuffs[i];
            pt.life += dt;
            if (pt.life >= pt.maxLife) {
                cryoPuffs.splice(i, 1);
                continue;
            }
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.r += dt * 5.8;
        }

        const isFiring = now < staticFireEnd;
        if (isFiring && vents) {
            for (let s = 0; s < 3; s++) {
                const side = Math.random() > 0.5 ? 1 : -1;
                steamClouds.push({
                    x: vents.trenchX + (Math.random() - 0.5) * 24,
                    y: vents.trenchY - Math.random() * 5,
                    vx: side * (42 + Math.random() * 78),
                    vy: -8 - Math.random() * 24,
                    r: 6 + Math.random() * 6,
                    life: 0,
                    maxLife: 1.2 + Math.random() * 1.1,
                    warm: Math.random() < 0.34,
                });
            }
        }

        for (let i = steamClouds.length - 1; i >= 0; i--) {
            const sc = steamClouds[i];
            sc.life += dt;
            if (sc.life >= sc.maxLife) {
                steamClouds.splice(i, 1);
                continue;
            }
            sc.x += sc.vx * dt;
            sc.y += sc.vy * dt;
            sc.vx *= 0.965;
            sc.r += dt * 13;
        }
    }

    function renderFrame(now, dt) {
        if (!width || !height) return;

        const elapsedSec = reducedMotion ? 12.0 : (now - startTime) * 0.001;
        const isDark = document.documentElement.classList.contains('dark');
        const {
            isMobile,
            isWide,
            roadBottom,
            roadHeight,
            roadTop,
            walkwayH,
            groundY,
            padX,
            centerScale,
            sideScale,
            leftMargin,
        } = getMetrics();

        const isFiring = !reducedMotion && now < staticFireEnd;
        let fireIntensity = 0;
        if (isFiring) {
            const prog = (now - staticFireStart) / STATIC_FIRE_DURATION;
            if (prog < 0.10) fireIntensity = prog / 0.10;
            else if (prog > 0.72) fireIntensity = Math.max(0, (1 - prog) / 0.28);
            else fireIntensity = 1;
        }

        sctx.save();

        if (isFiring && fireIntensity > 0.04) {
            const mag = 1.8 * fireIntensity;
            sctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag * 0.6);
        }

        // --- 1. SEAMLESS ATMOSPHERIC SKY ---
        const skyGrad = sctx.createLinearGradient(0, 0, 0, groundY);
        if (isDark) {
            skyGrad.addColorStop(0, '#09090b');
            skyGrad.addColorStop(0.28, '#09090b');
            skyGrad.addColorStop(0.66, '#0d1117');
            skyGrad.addColorStop(1, '#141923');
        } else {
            skyGrad.addColorStop(0, '#ffffff');
            skyGrad.addColorStop(0.28, '#ffffff');
            skyGrad.addColorStop(0.68, '#f8fafc');
            skyGrad.addColorStop(1, '#eef2f6');
        }
        sctx.fillStyle = skyGrad;
        sctx.fillRect(-4, -4, width + 8, groundY + 8);

        if (isDark) {
            const horGlow = sctx.createRadialGradient(padX, groundY, 20, padX, groundY, width * 0.48);
            horGlow.addColorStop(0, isFiring ? 'rgba(251, 146, 60, 0.34)' : 'rgba(16, 185, 129, 0.09)');
            horGlow.addColorStop(0.55, 'rgba(39, 39, 42, 0.14)');
            horGlow.addColorStop(1, 'rgba(9, 9, 11, 0)');
            sctx.fillStyle = horGlow;
            sctx.fillRect(0, 0, width, groundY);

            for (let i = 0; i < STARS.length; i++) {
                const st = STARS[i];
                const sy = st.v * groundY;
                const topFade = Math.max(0, Math.min(1, (sy - 36) / 110));
                if (topFade <= 0.01) continue;
                const tw = reducedMotion ? 0.65 : 0.28 + 0.72 * (0.5 + 0.5 * Math.sin(elapsedSec * 1.6 + st.phase));
                sctx.fillStyle = `rgba(244, 244, 245, ${(tw * 0.72 * topFade).toFixed(2)})`;
                sctx.beginPath();
                sctx.arc(st.u * width, sy, st.r, 0, Math.PI * 2);
                sctx.fill();
            }
        } else {
            for (let c = 0; c < CLOUDS.length; c++) {
                const cl = CLOUDS[c];
                const cu = ((cl.u + elapsedSec * cl.speed) % 1.24) - 0.12;
                drawCloud(cu * width, cl.v * groundY, cl.scale);
            }
        }

        // --- 2. DISTANT GULF HORIZON & BOCA CHICA DUNES ---
        drawGulfAndDunes(groundY, isDark);

        // --- 3. LEFT & RIGHT BASE WINGS ---
        const leftGutterStart = isWide ? Math.max(18, leftMargin * 0.08) : 14;
        const rightGutterX = isWide
            ? width - leftMargin + Math.max(22, leftMargin * 0.14)
            : width - Math.min(110, width * 0.18);

        const afterMegaX = drawMegaBays(leftGutterStart, groundY, sideScale, isWide, elapsedSec, isDark);
        const tankStartX = isWide
            ? Math.min(afterMegaX + 6, leftMargin + 40)
            : Math.min(afterMegaX + 2, padX - 110);
        drawTankFarm(tankStartX, groundY, padX, centerScale, isWide, elapsedSec, isDark);

        if (isWide) {
            const mastX = Math.max(leftMargin - 18, afterMegaX + 24);
            drawFloodlightMast(mastX, groundY, 188 * sideScale, elapsedSec, isDark);
        }

        drawMissionControl(rightGutterX, groundY, sideScale, isWide, elapsedSec, isDark);

        // --- 4. BOCA CHICA COASTAL PALMS & SCRUB ---
        if (isWide) {
            drawPalm(Math.max(12, leftGutterStart - 12), groundY, 82 * sideScale, -0.85, elapsedSec, 0.4, isDark);
            drawPalm(leftMargin + 18, groundY, 54 * centerScale, 0.75, elapsedSec, 1.5, isDark);
            drawPalm(width - leftMargin - 16, groundY, 56 * centerScale, -0.75, elapsedSec, 2.2, isDark);
            drawPalm(rightGutterX - 16, groundY, 86 * sideScale, -0.8, elapsedSec, 1.1, isDark);
            drawPalm(width - 28, groundY, 96 * sideScale, 0.7, elapsedSec, 2.7, isDark);
            drawPalm(width - 54, groundY, 68 * sideScale, -0.65, elapsedSec, 0.8, isDark);
        } else {
            drawPalm(width * 0.04, groundY, 54 * centerScale, -0.8, elapsedSec, 0.4, isDark);
            drawPalm(width * 0.36, groundY, 48 * centerScale, 0.75, elapsedSec, 1.5, isDark);
            if (!isMobile) {
                drawPalm(width * 0.68, groundY, 52 * centerScale, 0.75, elapsedSec, 2.1, isDark);
            }
            drawPalm(width * 0.94, groundY, 56 * centerScale, -0.75, elapsedSec, 0.9, isDark);
        }
        drawScrub(width * 0.18, groundY, 26, isDark);
        drawScrub(width * 0.42, groundY, 24, isDark);
        drawScrub(width * 0.70, groundY, 26, isDark);
        drawScrub(width * 0.88, groundY, 24, isDark);

        // --- 5. CENTERPIECE: OLM + MECHAZILLA + STARSHIP FLIGHT 14 ---
        const vents = drawLaunchComplex(padX, groundY, centerScale, elapsedSec, isDark, isFiring, fireIntensity);

        updateSimulation(dt, now, vents);

        if (reducedMotion && vents) {
            for (let k = 0; k < 3; k++) {
                const px = vents.interstageVentX + 7 + k * 9;
                const py = vents.interstageVentY - k * 3.5;
                const pr = 5.5 + k * 3;
                const g = sctx.createRadialGradient(px, py, 0, px, py, pr);
                g.addColorStop(0, isDark ? 'rgba(228,228,231,0.40)' : 'rgba(203,213,225,0.55)');
                g.addColorStop(1, 'rgba(228,228,231,0)');
                sctx.fillStyle = g;
                sctx.beginPath();
                sctx.arc(px, py, pr, 0, Math.PI * 2);
                sctx.fill();
            }
        }

        for (let i = 0; i < cryoPuffs.length; i++) {
            const pt = cryoPuffs[i];
            const alpha = (1 - pt.life / pt.maxLife) * (isDark ? 0.40 : 0.50);
            const g = sctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.r);
            g.addColorStop(0, `rgba(241, 245, 249, ${alpha.toFixed(3)})`);
            g.addColorStop(1, 'rgba(241, 245, 249, 0)');
            sctx.fillStyle = g;
            sctx.beginPath();
            sctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
            sctx.fill();
        }

        for (let i = 0; i < steamClouds.length; i++) {
            const sc = steamClouds[i];
            const ratio = sc.life / sc.maxLife;
            const alpha = (1 - ratio) * 0.68;
            const g = sctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, sc.r);
            if (sc.warm && ratio < 0.38) {
                g.addColorStop(0, `rgba(251, 146, 60, ${(alpha * 0.88).toFixed(3)})`);
                g.addColorStop(1, 'rgba(251, 146, 60, 0)');
            } else {
                g.addColorStop(0, `rgba(244, 244, 245, ${alpha.toFixed(3)})`);
                g.addColorStop(1, 'rgba(244, 244, 245, 0)');
            }
            sctx.fillStyle = g;
            sctx.beginPath();
            sctx.arc(sc.x, sc.y, sc.r, 0, Math.PI * 2);
            sctx.fill();
        }

        // --- 6. CONCRETE OBSERVATION WALKWAY & STROLLING ENGINEERS ---
        sctx.fillStyle = isDark ? '#18181b' : '#e4e4e7';
        sctx.fillRect(0, groundY, width, walkwayH);
        sctx.fillStyle = isDark ? '#27272a' : '#d4d4d8';
        sctx.fillRect(0, roadTop - 2, width, 2);

        for (let i = 0; i < ENGINEERS.length; i++) {
            const eng = ENGINEERS[i];
            drawEngineer(eng.u * width, groundY + walkwayH - 3, eng, isDark);
        }

        // --- 7. FULL-WIDTH TWO-LANE HIGHWAY 4 + CYBERTRUCKS & TESLAS ---
        const roadGrad = sctx.createLinearGradient(0, roadTop, 0, roadBottom);
        if (isDark) {
            roadGrad.addColorStop(0, '#141417');
            roadGrad.addColorStop(1, '#0e0e11');
        } else {
            roadGrad.addColorStop(0, '#3f3f46');
            roadGrad.addColorStop(1, '#27272a');
        }
        sctx.fillStyle = roadGrad;
        sctx.fillRect(0, roadTop, width, roadHeight);

        sctx.fillStyle = isDark ? 'rgba(244, 244, 245, 0.16)' : 'rgba(255, 255, 255, 0.36)';
        sctx.fillRect(0, roadTop + 2, width, 1);
        sctx.fillRect(0, roadBottom - 3, width, 1);

        sctx.save();
        sctx.strokeStyle = isDark ? 'rgba(250, 204, 21, 0.55)' : 'rgba(251, 191, 36, 0.88)';
        sctx.lineWidth = 1.5;
        sctx.setLineDash([14, 14]);
        sctx.beginPath();
        sctx.moveTo(0, roadTop + roadHeight * 0.5);
        sctx.lineTo(width, roadTop + roadHeight * 0.5);
        sctx.stroke();
        sctx.restore();

        drawWalkwayBollardsAndLamps(groundY, roadTop, isDark);

        const lane0Y = roadTop + 14;
        const lane1Y = roadTop + 31;
        for (let lane = 0; lane <= 1; lane++) {
            const vy = lane === 0 ? lane0Y : lane1Y;
            for (let i = 0; i < VEHICLES.length; i++) {
                const v = VEHICLES[i];
                if (v.lane !== lane) continue;
                const vx = v.u * width;
                const dir = v.speed >= 0 ? 1 : -1;
                if (v.type === 'cybertruck') {
                    drawCybertruck(vx, vy, dir, elapsedSec, isDark);
                } else {
                    drawTesla(vx, vy, dir, v.finish, elapsedSec, isDark);
                }
            }
        }

        sctx.restore();
    }
    // Click on Starship or Mechazilla triggers 4-second Raptor Static Fire + subtle takeoff audio
    function isPointOnPad(clientX, clientY) {
        const box = sbCanvas.getBoundingClientRect();
        const x = clientX - box.left;
        const y = clientY - box.top;
        return (
            x >= padHitbox.x &&
            x <= padHitbox.x + padHitbox.w &&
            y >= padHitbox.y &&
            y <= padHitbox.y + padHitbox.h
        );
    }

    sbCanvas.addEventListener('mousemove', (e) => {
        sbCanvas.style.cursor = isPointOnPad(e.clientX, e.clientY) ? 'pointer' : 'default';
    });

    sbCanvas.addEventListener('click', (e) => {
        if (isPointOnPad(e.clientX, e.clientY)) {
            const now = performance.now();
            staticFireStart = now;
            staticFireEnd = now + STATIC_FIRE_DURATION;
            playStarshipTakeoffAudio(STATIC_FIRE_DURATION / 1000);
        }
    });

    function tick(now) {
        if (!isVisible || reducedMotion) {
            rafId = null;
            return;
        }
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) * 0.001));
        lastTime = now;
        renderFrame(now, dt);
        rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
        if (reducedMotion) {
            renderFrame(performance.now(), 0);
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

    onThemeChange(() => renderFrame(performance.now(), 0));

    if (typeof IntersectionObserver === 'function') {
        const visibilityObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isVisible = entry.isIntersecting;
                    if (isVisible) startLoop();
                    else stopLoop();
                });
            },
            { threshold: 0.01 }
        );
        visibilityObserver.observe(footerEl);
    } else {
        isVisible = true;
        startLoop();
    }

    if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(() => resizeStarbase());
        ro.observe(footerEl);
    } else {
        window.addEventListener('resize', resizeStarbase);
    }

    resizeStarbase();
}
