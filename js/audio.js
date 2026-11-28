/* ---------------------------------------------------------------------
 * 0. SUBTLE TAKEOFF BACKGROUND MUSIC & MUFFLED RAPTOR RUMBLE SYNTH
 *    - Pure Web Audio API (zero external audio URLs)
 *    - Interstellar-inspired ambient chord swell (D2, A2, D3, E3, F#3, A3)
 *    - Soft muffled Raptor sub-bass ignition rumble (65Hz -> 175Hz -> 55Hz)
 *    - Brief crystalline T-0 ignition telemetry ping (A5 + E6)
 *    - Lazy AudioContext + 0.18 max gain + compressor + smooth re-click fade
 * ------------------------------------------------------------------- */
export const playStarshipTakeoffAudio = (function () {
    let audioCtx = null;
    let noiseBuffer = null;
    let activeSession = null;

    function getAudioContext() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        if (!audioCtx) {
            audioCtx = new AudioCtx();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => { });
        }
        return audioCtx;
    }

    // Cached warm brown/pink-tinted noise buffer for distant Raptor rumble
    function getRumbleNoiseBuffer(ctx) {
        if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
            return noiseBuffer;
        }
        const duration = 6.5;
        const length = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0;
        let b1 = 0;
        let b2 = 0;
        let brown = 0;
        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.997 * b0 + white * 0.029;
            b1 = 0.985 * b1 + white * 0.032;
            b2 = 0.950 * b2 + white * 0.048;
            brown = (brown + 0.028 * white) / 1.028;
            const mixed = (b0 + b1 + b2) * 0.45 + brown * 2.3;
            data[i] = Math.max(-1, Math.min(1, mixed));
        }
        noiseBuffer = buffer;
        return buffer;
    }

    function fadeOutActiveSession() {
        if (!activeSession) return;
        const prev = activeSession;
        activeSession = null;
        clearTimeout(prev.cleanupTimer);
        try {
            const now = prev.ctx.currentTime;
            prev.masterGain.gain.cancelScheduledValues(now);
            prev.masterGain.gain.setValueAtTime(
                Math.max(0.0001, prev.masterGain.gain.value),
                now
            );
            prev.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
            setTimeout(() => {
                prev.sources.forEach((src) => {
                    try {
                        src.stop();
                    } catch (_) { }
                });
                try {
                    prev.masterGain.disconnect();
                } catch (_) { }
            }, 190);
        } catch (_) { }
    }

    return function triggerTakeoffAudio(durationSec) {
        fadeOutActiveSession();
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const burnSec = typeof durationSec === 'number' ? durationSec : 4.0;
            const tailSec = 1.65;
            const totalSec = burnSec + tailSec;
            const now = ctx.currentTime + 0.02;
            const sources = [];

            // Master gain (capped at 0.18) + soft dynamics limiter
            const masterGain = ctx.createGain();
            masterGain.gain.setValueAtTime(0.0001, now);
            masterGain.gain.linearRampToValueAtTime(0.18, now + 0.45);
            masterGain.gain.setValueAtTime(0.18, now + burnSec - 0.15);
            masterGain.gain.exponentialRampToValueAtTime(0.0001, now + totalSec);

            const compressor = ctx.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-16, now);
            compressor.knee.setValueAtTime(22, now);
            compressor.ratio.setValueAtTime(3.5, now);
            compressor.attack.setValueAtTime(0.02, now);
            compressor.release.setValueAtTime(0.25, now);

            masterGain.connect(compressor);
            compressor.connect(ctx.destination);

            // Subtle stereo feedback shimmer for spatial depth
            const shimmerDelay = ctx.createDelay(1.0);
            shimmerDelay.delayTime.setValueAtTime(0.29, now);
            const shimmerFb = ctx.createGain();
            shimmerFb.gain.setValueAtTime(0.32, now);
            const shimmerFilter = ctx.createBiquadFilter();
            shimmerFilter.type = 'lowpass';
            shimmerFilter.frequency.setValueAtTime(1600, now);
            const shimmerWet = ctx.createGain();
            shimmerWet.gain.setValueAtTime(0.28, now);

            shimmerDelay.connect(shimmerFilter);
            shimmerFilter.connect(shimmerFb);
            shimmerFb.connect(shimmerDelay);
            shimmerFilter.connect(shimmerWet);
            shimmerWet.connect(masterGain);

            // --- LAYER 1: INTERSTELLAR-INSPIRED AMBIENT CHORD SWELL ---
            const padFilter = ctx.createBiquadFilter();
            padFilter.type = 'lowpass';
            padFilter.Q.setValueAtTime(1.15, now);
            padFilter.frequency.setValueAtTime(220, now);
            padFilter.frequency.exponentialRampToValueAtTime(1350, now + burnSec * 0.58);
            padFilter.frequency.setValueAtTime(1350, now + burnSec * 0.78);
            padFilter.frequency.exponentialRampToValueAtTime(280, now + totalSec);

            const padBus = ctx.createGain();
            padBus.gain.setValueAtTime(0.0001, now);
            padBus.gain.linearRampToValueAtTime(0.68, now + 0.9);
            padBus.gain.setValueAtTime(0.68, now + burnSec - 0.25);
            padBus.gain.exponentialRampToValueAtTime(0.0001, now + totalSec);

            padBus.connect(padFilter);
            padFilter.connect(masterGain);
            padFilter.connect(shimmerDelay);

            const chordNotes = [
                { freq: 73.42, gain: 0.30, delay: 0.00 },  // D2
                { freq: 110.00, gain: 0.25, delay: 0.04 }, // A2
                { freq: 146.83, gain: 0.22, delay: 0.10 }, // D3
                { freq: 164.81, gain: 0.19, delay: 0.18 }, // E3
                { freq: 185.00, gain: 0.18, delay: 0.28 }, // F#3
                { freq: 220.00, gain: 0.14, delay: 0.42 }, // A3
            ];

            chordNotes.forEach((note) => {
                const startAt = now + note.delay;

                const sineOsc = ctx.createOscillator();
                const sineGain = ctx.createGain();
                sineOsc.type = 'sine';
                sineOsc.frequency.setValueAtTime(note.freq, startAt);
                sineOsc.detune.setValueAtTime(-3.8, startAt);
                sineGain.gain.setValueAtTime(0.0001, startAt);
                sineGain.gain.linearRampToValueAtTime(note.gain, startAt + 0.85);
                sineGain.gain.setValueAtTime(note.gain, now + burnSec - 0.2);
                sineGain.gain.exponentialRampToValueAtTime(0.0001, now + totalSec);
                sineOsc.connect(sineGain);
                sineGain.connect(padBus);
                sineOsc.start(startAt);
                sineOsc.stop(now + totalSec + 0.05);
                sources.push(sineOsc);

                const triOsc = ctx.createOscillator();
                const triGain = ctx.createGain();
                triOsc.type = 'triangle';
                triOsc.frequency.setValueAtTime(note.freq, startAt);
                triOsc.detune.setValueAtTime(4.4, startAt);
                triGain.gain.setValueAtTime(0.0001, startAt);
                triGain.gain.linearRampToValueAtTime(note.gain * 0.38, startAt + 0.95);
                triGain.gain.setValueAtTime(note.gain * 0.38, now + burnSec - 0.25);
                triGain.gain.exponentialRampToValueAtTime(0.0001, now + totalSec);
                triOsc.connect(triGain);
                triGain.connect(padBus);
                triOsc.start(startAt);
                triOsc.stop(now + totalSec + 0.05);
                sources.push(triOsc);
            });

            // --- LAYER 2: MUFFLED RAPTOR SUB-BASS IGNITION RUMBLE ---
            const noiseSrc = ctx.createBufferSource();
            noiseSrc.buffer = getRumbleNoiseBuffer(ctx);

            const rumbleFilter = ctx.createBiquadFilter();
            rumbleFilter.type = 'lowpass';
            rumbleFilter.Q.setValueAtTime(0.95, now);
            rumbleFilter.frequency.setValueAtTime(65, now);
            rumbleFilter.frequency.exponentialRampToValueAtTime(175, now + 0.55);
            rumbleFilter.frequency.setValueAtTime(160, now + burnSec - 0.45);
            rumbleFilter.frequency.exponentialRampToValueAtTime(55, now + totalSec);

            const rumbleGain = ctx.createGain();
            rumbleGain.gain.setValueAtTime(0.0001, now);
            rumbleGain.gain.linearRampToValueAtTime(0.42, now + 0.35);
            rumbleGain.gain.setValueAtTime(0.36, now + burnSec - 0.2);
            rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + totalSec);

            noiseSrc.connect(rumbleFilter);
            rumbleFilter.connect(rumbleGain);
            rumbleGain.connect(masterGain);
            noiseSrc.start(now);
            noiseSrc.stop(now + totalSec + 0.05);
            sources.push(noiseSrc);

            // Gentle 52Hz sub-bass engine thrum
            const subOsc = ctx.createOscillator();
            const subGain = ctx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(52, now);
            subGain.gain.setValueAtTime(0.0001, now);
            subGain.gain.linearRampToValueAtTime(0.22, now + 0.38);
            subGain.gain.setValueAtTime(0.19, now + burnSec - 0.2);
            subGain.gain.exponentialRampToValueAtTime(0.0001, now + totalSec);
            subOsc.connect(subGain);
            subGain.connect(masterGain);
            subOsc.start(now);
            subOsc.stop(now + totalSec + 0.05);
            sources.push(subOsc);

            // --- LAYER 3: BRIEF CRYSTALLINE T-0 TELEMETRY PING (A5 + E6) ---
            [880.0, 1318.51].forEach((freq, idx) => {
                const pingOsc = ctx.createOscillator();
                const pingGain = ctx.createGain();
                pingOsc.type = 'sine';
                pingOsc.frequency.setValueAtTime(freq, now);
                const amp = idx === 0 ? 0.11 : 0.065;
                pingGain.gain.setValueAtTime(0.0001, now);
                pingGain.gain.linearRampToValueAtTime(amp, now + 0.018);
                pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
                pingOsc.connect(pingGain);
                pingGain.connect(masterGain);
                pingGain.connect(shimmerDelay);
                pingOsc.start(now);
                pingOsc.stop(now + 0.95);
                sources.push(pingOsc);
            });

            const cleanupTimer = setTimeout(() => {
                try {
                    masterGain.disconnect();
                } catch (_) { }
                if (activeSession && activeSession.masterGain === masterGain) {
                    activeSession = null;
                }
            }, (totalSec + 0.4) * 1000);

            activeSession = { ctx, masterGain, sources, cleanupTimer };
        } catch (_) {
            // Fail silently in restricted audio environments
        }
    };
})();


/* Subtle Dual-Tone Theme Switch Sound (Web Audio API) */
export const playThemeSwitchSound = (function () {
    let ctx = null;
    return function (toDark) {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!ctx) ctx = new AudioCtx();
            if (ctx.state === 'suspended') ctx.resume().catch(() => { });

            const now = ctx.currentTime;
            const master = ctx.createGain();
            master.gain.setValueAtTime(0.11, now);
            master.connect(ctx.destination);

            // Gentle two-note harmonic (descending for night, ascending for day)
            const notes = toDark ? [523.25, 349.23] : [392.0, 587.33];
            notes.forEach((freq, i) => {
                const start = now + i * 0.055;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, start);

                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.linearRampToValueAtTime(i === 0 ? 0.55 : 0.4, start + 0.014);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);

                osc.connect(gain);
                gain.connect(master);
                osc.start(start);
                osc.stop(start + 0.26);
            });
        } catch (_) {
            // Fail silently in restricted audio environments
        }
    };
})();


/* Subtle Tactile Bookshelf Slide + Settle Sound (Web Audio API) */
export const playBookSlideSound = (function () {
    let ctx = null;
    let slideBuffer = null;
    let lastPlayed = 0;

    function ensureContext() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        if (!ctx) ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => { });
        }
        return ctx;
    }

    // Unlock AudioContext on first user click/keypress so hover audio works smoothly
    function unlockAudio() {
        ensureContext();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
    }
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });

    function getNoiseBuffer(audioCtx) {
        if (slideBuffer && slideBuffer.sampleRate === audioCtx.sampleRate) return slideBuffer;
        const len = Math.floor(audioCtx.sampleRate * 0.2);
        const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + 0.08 * white) / 1.08; // Soft pink/brown tint
            data[i] = last * 2.4;
        }
        slideBuffer = buf;
        return buf;
    }

    return function triggerBookSound() {
        const nowMs = performance.now();
        if (nowMs - lastPlayed < 90) return; // Prevent audio stacking on fast sweeps
        lastPlayed = nowMs;

        try {
            const audioCtx = ensureContext();
            if (!audioCtx || audioCtx.state !== 'running') return;

            const now = audioCtx.currentTime;
            const pitchJitter = 0.94 + Math.random() * 0.12; // Natural variation per book

            // Master cap so it stays whisper-quiet
            const master = audioCtx.createGain();
            master.gain.setValueAtTime(0.15, now);
            master.connect(audioCtx.destination);

            // 1. Soft hardcover/paper brush slide
            const noise = audioCtx.createBufferSource();
            noise.buffer = getNoiseBuffer(audioCtx);

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.Q.setValueAtTime(1.4, now);
            filter.frequency.setValueAtTime(680 * pitchJitter, now);
            filter.frequency.exponentialRampToValueAtTime(320 * pitchJitter, now + 0.11);

            const slideGain = audioCtx.createGain();
            slideGain.gain.setValueAtTime(0.0001, now);
            slideGain.gain.linearRampToValueAtTime(0.45, now + 0.02);
            slideGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

            noise.connect(filter);
            filter.connect(slideGain);
            slideGain.connect(master);
            noise.start(now);
            noise.stop(now + 0.13);

            // 2. Subtle muted shelf settle thud (as the book tucks in)
            const thudStart = now + 0.065;
            const thudOsc = audioCtx.createOscillator();
            const thudGain = audioCtx.createGain();
            thudOsc.type = 'sine';
            thudOsc.frequency.setValueAtTime(148 * pitchJitter, thudStart);
            thudOsc.frequency.exponentialRampToValueAtTime(64 * pitchJitter, thudStart + 0.065);

            thudGain.gain.setValueAtTime(0.0001, thudStart);
            thudGain.gain.linearRampToValueAtTime(0.28, thudStart + 0.008);
            thudGain.gain.exponentialRampToValueAtTime(0.0001, thudStart + 0.075);

            thudOsc.connect(thudGain);
            thudGain.connect(master);
            thudOsc.start(thudStart);
            thudOsc.stop(thudStart + 0.08);
        } catch (_) {
            // Fail silently in restricted audio environments
        }
    };
})();


/* Snow: Rhythmic Web Audio Purr + Floating Hearts */
export const playSnowPurr = (function () {
    let ctx = null;
    let lastPurr = 0;

    return function triggerPurr() {
        const nowMs = performance.now();
        if (nowMs - lastPurr < 1100) return;
        lastPurr = nowMs;

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!ctx) ctx = new AudioCtx();
            if (ctx.state === 'suspended') ctx.resume().catch(() => { });

            const now = ctx.currentTime;
            const duration = 1.35;

            const master = ctx.createGain();
            master.gain.setValueAtTime(0.0001, now);
            master.gain.linearRampToValueAtTime(0.14, now + 0.14);
            master.gain.setValueAtTime(0.14, now + duration - 0.3);
            master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            master.connect(ctx.destination);

            // Warm low-frequency purr carrier (26Hz + 52Hz harmonic)
            const carrier = ctx.createOscillator();
            carrier.type = 'triangle';
            carrier.frequency.setValueAtTime(27, now);

            const overtone = ctx.createOscillator();
            overtone.type = 'sine';
            overtone.frequency.setValueAtTime(54, now);

            // Rhythmic breath LFO (~4.5 Hz) creating inhale/exhale purr pulse
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(4.5, now);

            const lfoDepth = ctx.createGain();
            lfoDepth.gain.setValueAtTime(0.38, now);

            const purrMod = ctx.createGain();
            purrMod.gain.setValueAtTime(0.55, now);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(160, now);

            lfo.connect(lfoDepth);
            lfoDepth.connect(purrMod.gain);

            carrier.connect(filter);
            overtone.connect(filter);
            filter.connect(purrMod);
            purrMod.connect(master);

            carrier.start(now);
            overtone.start(now);
            lfo.start(now);

            carrier.stop(now + duration + 0.04);
            overtone.stop(now + duration + 0.04);
            lfo.stop(now + duration + 0.04);
        } catch (_) {
            // Fail silently in restricted audio environments
        }
    };
})();
