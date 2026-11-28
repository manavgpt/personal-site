/* ---------------------------------------------------------------------
 * 6. ROTATING VERTICAL TEXT-SWAP SUBTITLE (EVERY 2.8s)
 * ------------------------------------------------------------------- */
export function initRoleRotator() {
    const roleItems = document.querySelectorAll('.role-item');
    if (roleItems.length <= 1) return;

    let currentRoleIdx = 0;
    setInterval(() => {
        const prevIdx = currentRoleIdx;
        currentRoleIdx = (currentRoleIdx + 1) % roleItems.length;

        const prevEl = roleItems[prevIdx];
        const nextEl = roleItems[currentRoleIdx];

        prevEl.classList.remove('is-active');
        prevEl.classList.add('is-exiting');

        setTimeout(() => {
            prevEl.classList.remove('is-exiting');
        }, 440);

        nextEl.classList.add('is-active');
    }, 2800);
}


/* ---------------------------------------------------------------------
 * 15. 8-WAY SPRITE AVATAR TRACKING + DIZZY / ANNOYED EASTER EGG
 * ------------------------------------------------------------------- */
export function initInteractiveAvatar() {
    const avatar = document.getElementById('brandAvatar');
    const pill = document.getElementById('avatarPill');
    if (!avatar) return;

    const DIZZY_LINES = [
        'dizzy',
        'whoa',
        'chill',
        'easy there',
        'i can hear sounds',
        'who am i??',
    ];
    const ANNOYED_LINES = [
        "i'm down",
        'stop poking',
        'really?',
        'bruh!',
        'my eyes',
        "bro, i'm literally dead",
        'turned into a ghost',
    ];

    let isReacting = false;
    let reactTimer = null;
    let lastAngle = null;
    let spinAccum = 0;
    let spinDecayTimer = null;
    let clickCount = 0;
    let clickResetTimer = null;

    function triggerReaction(type) {
        if (isReacting) return;
        isReacting = true;
        spinAccum = 0;
        lastAngle = null;
        clickCount = 0;

        const lines = type === 'dizzy' ? DIZZY_LINES : ANNOYED_LINES;
        const msg = lines[Math.floor(Math.random() * lines.length)];

        avatar.classList.remove('is-dizzy', 'is-annoyed');
        void avatar.offsetWidth;
        avatar.classList.add('is-reacting', type === 'dizzy' ? 'is-dizzy' : 'is-annoyed');

        if (pill) {
            pill.textContent = msg;
            pill.classList.add('show');
        }

        clearTimeout(reactTimer);
        reactTimer = setTimeout(() => {
            avatar.classList.remove('is-reacting', 'is-dizzy', 'is-annoyed');
            if (pill) pill.classList.remove('show');
            isReacting = false;
        }, 2200);
    }

    avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isReacting) return;

        clickCount += 1;
        clearTimeout(clickResetTimer);

        if (clickCount >= 2) {
            triggerReaction('annoyed');
        } else {
            clickResetTimer = setTimeout(() => {
                clickCount = 0;
            }, 1100);
        }
    });

    const sheet = new Image();
    sheet.onload = () => {
        avatar.classList.add('sprite-ready');
        initTracking();
    };
    sheet.src = 'images/avatar-sheet.png';

    function initTracking() {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const POSITIONS = {
            '0': '100% 50%',
            '1': '100% 100%',
            '2': '50% 100%',
            '3': '0% 100%',
            '4': '0% 50%',
            '-4': '0% 50%',
            '-3': '0% 0%',
            '-2': '50% 0%',
            '-1': '100% 0%',
        };

        const DEADZONE = 28;
        let lastPos = '50% 50%';
        let rafId = null;
        let mx = 0;
        let my = 0;

        function setPos(pos) {
            if (pos === lastPos) return;
            avatar.style.backgroundPosition = pos;
            lastPos = pos;
        }

        function update() {
            rafId = null;
            if (isReacting) return;

            const rect = avatar.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = mx - cx;
            const dy = my - cy;

            if (Math.hypot(dx, dy) < DEADZONE) {
                setPos('50% 50%');
                lastAngle = null;
                return;
            }

            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const sector = Math.round(angle / 45);
            setPos(POSITIONS[String(sector)] || '50% 50%');

            if (lastAngle !== null) {
                let delta = angle - lastAngle;
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;

                spinAccum += Math.abs(delta);
                clearTimeout(spinDecayTimer);
                spinDecayTimer = setTimeout(() => {
                    spinAccum = 0;
                    lastAngle = null;
                }, 650);

                if (spinAccum >= 900) {
                    triggerReaction('dizzy');
                    return;
                }
            }
            lastAngle = angle;
        }

        window.addEventListener(
            'pointermove',
            (e) => {
                if (e.pointerType !== 'mouse') return;
                mx = e.clientX;
                my = e.clientY;
                if (!rafId) rafId = requestAnimationFrame(update);
            },
            { passive: true }
        );

        document.addEventListener('pointerleave', () => {
            lastAngle = null;
            spinAccum = 0;
            if (!isReacting) setPos('50% 50%');
        });
    }
}


/* ---------------------------------------------------------------------
 * 16. SPIDER-VERSE INTERMITTENT NAME GLITCH EFFECT
 * ------------------------------------------------------------------- */
export function initNameGlitch() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const words = Array.from(document.querySelectorAll('.glitch-word'));
    const trigger = document.getElementById('brandTrigger');
    if (!words.length) return;

    const modes = [
        { cls: 'glitch-slice', dur: 380 },
        { cls: 'glitch-cmy', dur: 440 },
        { cls: 'glitch-comic', dur: 500 },
    ];

    let busy = false;
    let timer = null;

    function fireGlitch(forceBoth) {
        if (busy || document.hidden) return;
        busy = true;

        const mode = modes[Math.floor(Math.random() * modes.length)];
        let targets;

        if (forceBoth) {
            targets = words;
        } else {
            const roll = Math.random();
            if (roll < 0.38) targets = [words[0]];
            else if (roll < 0.76) targets = [words[1]];
            else targets = words;
        }

        targets.forEach((el) => {
            el.classList.remove('glitch-slice', 'glitch-cmy', 'glitch-comic');
            void el.offsetWidth;
            el.classList.add(mode.cls);
        });

        setTimeout(() => {
            targets.forEach((el) => el.classList.remove(mode.cls));
            busy = false;
        }, mode.dur);
    }

    function scheduleNext() {
        clearTimeout(timer);
        const delay = 3000 + Math.random() * 3500;
        timer = setTimeout(() => {
            fireGlitch(false);
            scheduleNext();
        }, delay);
    }

    setTimeout(() => {
        fireGlitch(true);
        scheduleNext();
    }, 1400);

    if (trigger) {
        trigger.addEventListener('mouseenter', () => fireGlitch(false));
    }
}
