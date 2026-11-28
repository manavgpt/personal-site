/* ---------------------------------------------------------------------
 * 1. STRUCTURED PORTFOLIO DATA
 * ------------------------------------------------------------------- */
export const PROJECTS = [
    {
        id: 'pulsedb',
        title: 'PulseDB',
        tagline: 'Distributed Event Streamer',
        category: 'Backend',
        status: 'LIVE',
        year: '2026',
        description:
            'High-throughput append-only event log with Raft-based partition replication and sub-2ms consumer fan-out.',
        tags: ['Go', 'gRPC', 'Raft'],
        problem:
            'Standard message brokers introduce heavy JVM memory overhead and complex operational tuning for small-to-mid-scale telemetry pipelines.',
        architecture:
            'Built a zero-dependency segmented log storage engine in Go using memory-mapped I/O, binary framing over gRPC streams, and deterministic Raft leader election across 3-node clusters.',
        metrics: [
            'Sustains 64,000 events/sec per node with 1.6ms p99 tail latency',
            '42MB idle memory footprint vs. 1.2GB+ on comparable JVM brokers',
            'Automated crash recovery verified across 500+ fault-injection runs',
        ],
    },
    {
        id: 'vektor',
        title: 'Vektor',
        tagline: 'Local Semantic Code Search',
        category: 'AI / Systems',
        status: 'OSS',
        year: '2026',
        description:
            'AST-aware hybrid code search CLI combining tree-sitter chunking, local ONNX embeddings, and HNSW indexing.',
        tags: ['Rust', 'ONNX', 'Tree-sitter'],
        problem:
            'Grep fails when searching by architectural intent, while cloud code-search tools require uploading proprietary repositories to third-party servers.',
        architecture:
            'Parses multi-language repositories into semantic function/class AST nodes via Tree-sitter, embeds locally using quantized ONNX models, and queries a single-file HNSW vector index.',
        metrics: [
            'Indexes 120k LOC monorepos in under 14 seconds on Apple Silicon',
            'Sub-18ms hybrid lexical + vector query response completely offline',
            '1.4k+ GitHub stars and adopted by 12 open-source maintainer teams',
        ],
    },
    {
        id: 'cadence',
        title: 'Cadence',
        tagline: 'Real-time Collaborative API Tester',
        category: 'Fullstack',
        status: 'LIVE',
        year: '2025',
        description:
            'Browser-native API workbench with CRDT-synced request collections, live latency histograms, and edge replay.',
        tags: ['TypeScript', 'Next.js', 'WebSockets'],
        problem:
            'Bloated desktop API clients slow down team onboarding and make sharing live debugging sessions across backend and frontend engineers painful.',
        architecture:
            'Uses Yjs CRDT state sync over lightweight WebSocket rooms, backed by PostgreSQL snapshots and an isolated edge proxy for CORS-free HTTP/GraphQL inspection.',
        metrics: [
            'Real-time multiplayer editing with <35ms state convergence',
            '98/100 Lighthouse performance score with zero heavy client bundles',
            'Processes 180k+ proxied developer test requests monthly',
        ],
    },
    {
        id: 'relay',
        title: 'Relay',
        tagline: 'Edge Webhook Router',
        category: 'Backend',
        status: 'LIVE',
        year: '2025',
        description:
            'Fault-tolerant webhook ingestion gateway with HMAC signature verification, exponential backoff, and dead-letter replay.',
        tags: ['TypeScript', 'Redis', 'PostgreSQL'],
        problem:
            'Downstream webhook spikes frequently overwhelm application APIs, causing silent drops and billing/sync inconsistencies.',
        architecture:
            'Ingests webhooks at the edge, validates cryptographic signatures immediately, buffers payloads in Redis Streams, and dispatches with per-tenant rate limits and circuit breakers.',
        metrics: [
            '99.99% delivery reliability across 2.4M simulated burst webhooks',
            'Zero dropped events during downstream 15-minute outage drills',
            'One-click dead-letter queue inspection and selective replay UI',
        ],
    },
];

export const EXPERIENCE = [
    {
        id: 'exp-1',
        company: 'Linearity Cloud',
        role: 'Software Engineer, Core Systems',
        period: '2025 — Present',
        location: 'San Francisco, CA',
        bullets: [
            'Architected a Go & Redis distributed rate-limiter handling 45k req/sec across 14 edge regions, cutting p99 API latency by 36%.',
            'Built an internal semantic log-triage assistant using Python and pgvector, reducing average incident root-cause time by 28%.',
            'Led migration of core billing webhooks to an idempotent outbox pattern, eliminating duplicate invoice retries.',
        ],
    },
    {
        id: 'exp-2',
        company: 'Verve Analytics',
        role: 'Full-Stack Engineering Intern',
        period: 'May 2024 — Aug 2024',
        location: 'Remote',
        bullets: [
            'Engineered a virtualized real-time query inspector in React & TypeScript capable of rendering 50,000+ rows at 60 FPS.',
            'Optimized slow PostgreSQL analytical queries via partial composite indexes, improving dashboard load times from 2.4s to 310ms.',
        ],
    },
    {
        id: 'exp-3',
        company: 'Open-Source Collective',
        role: 'Core Maintainer & Contributor',
        period: '2023 — 2024',
        location: 'Distributed',
        bullets: [
            'Maintained TypeScript SDKs and CLI tooling used by 8,000+ weekly developers, authoring automated CI benchmark suites.',
            'Shipped zero-allocation JSON stream parsers and memory-leak patches across community Rust and Node.js packages.',
        ],
    },
];

export const STACK = [
    { name: 'TypeScript', category: 'Languages', slug: 'typescript' },
    { name: 'Go', category: 'Languages', slug: 'go' },
    { name: 'Python', category: 'Languages', slug: 'python' },
    { name: 'Rust', category: 'Languages', slug: 'rust', invertDark: true },
    { name: 'Next.js', category: 'Frontend', slug: 'nextdotjs', invertDark: true },
    {
        name: 'SQL',
        category: 'Languages',
        svg: `<svg class="w-3.5 h-3.5 opacity-85 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`,
    },
    { name: 'React', category: 'Frontend', slug: 'react', boostLight: true },
    { name: 'Tailwind CSS', category: 'Frontend', slug: 'tailwindcss' },
    { name: 'HTML5 Canvas', category: 'Frontend', slug: 'html5' },
    { name: 'Node.js', category: 'Backend', slug: 'nodedotjs' },
    { name: 'PostgreSQL', category: 'Backend', slug: 'postgresql' },
    { name: 'Redis', category: 'Backend', slug: 'redis' },
    {
        name: 'gRPC',
        category: 'Backend',
        svg: `<svg class="w-3.5 h-3.5 opacity-85 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/><path d="M3 12h18"/></svg>`,
    },
    { name: 'Docker', category: 'AI & Infra', slug: 'docker' },
    { name: 'PyTorch', category: 'AI & Infra', slug: 'pytorch' },
    { name: 'Gemini / OpenAI', category: 'AI & Infra', slug: 'googlegemini' },
    { name: 'Linux / eBPF', category: 'AI & Infra', slug: 'linux', boostLight: true },
];

export const NOTES = [
    {
        id: 'raft-lessons',
        date: 'Nov 2026',
        title: 'Designing Deterministic Fault Injection for Raft Logs',
        readTime: '6 min',
        paragraphs: [
            'Testing distributed consensus with real wall-clock timers and live TCP sockets makes bugs nearly impossible to reproduce. A race condition that surfaces once in 10,000 runs will disappear the moment you attach a debugger.',
            'By abstracting the network transport and monotonic clock behind a seeded deterministic simulator, we can compress hours of cluster partitions, packet reordering, and node restarts into a 400ms unit test.',
            'Whenever an invariant fails—such as two leaders committing conflicting entries at the same log index—the simulator prints a single 64-bit seed that replays the exact failure sequence deterministically.',
        ],
        code: `// Deterministic simulation step loop\nfor tick := 0; tick < maxTicks; tick++ {\n  sim.deliverReadyPackets(tick)\n  for _, node := range sim.nodes {\n    node.Step(tick)\n  }\n  sim.assertElectionSafety()\n}`,
    },
    {
        id: 'hybrid-search',
        date: 'Aug 2026',
        title: 'Why Pure Vector Search Fails on Codebases (and How Hybrid Fixes It)',
        readTime: '5 min',
        paragraphs: [
            'Dense embeddings excel at conceptual queries like "where do we verify JWT expiry?", but they struggle badly with exact identifiers, error codes, and camelCase symbol names.',
            'Combining BM25 lexical scoring with HNSW cosine similarity via Reciprocal Rank Fusion (RRF) consistently outperforms either method alone—without requiring brittle weight tuning across repositories.',
            'In Vektor, chunking strictly on Tree-sitter AST boundaries (functions, structs, traits) rather than arbitrary 500-token sliding windows lifted top-5 retrieval precision by 24%.',
        ],
        code: `// Reciprocal Rank Fusion (k = 60)\nfn rrf_score(bm25_rank: usize, vec_rank: usize) -> f32 {\n    (1.0 / (60.0 + bm25_rank as f32)) +\n    (1.0 / (60.0 + vec_rank as f32))\n}`,
    },
    {
        id: 'tail-latency',
        date: 'May 2026',
        title: 'Eliminating p99 Tail Latency Spikes in Webhook Workers',
        readTime: '4 min',
        paragraphs: [
            'Averages hide pain. When a webhook worker pool shares a single unpartitioned queue, one slow downstream tenant timing out at 30 seconds can exhaust worker concurrency and stall healthy tenants.',
            'Switching to fair per-tenant virtual queues in Redis with strict 4-second connect/read timeouts and jittered exponential backoff isolated slow consumers completely.',
            'Before adding more servers, always instrument your queue wait time separately from handler execution time—90% of mysterious p99 spikes are queueing theory problems, not CPU bottlenecks.',
        ],
        code: `// Full-jitter exponential backoff\nconst maxDelay = Math.min(CAP_MS, BASE_MS * 2 ** attempt);\nconst sleepMs = Math.floor(Math.random() * maxDelay);`,
    },
];

/* Interactive 3D Bookshelf Data (Set coverImg to a local path anytime) */
export const BOOKS = [
    {
        id: 'steve-jobs',
        num: '01',
        title: 'Steve Jobs',
        author: 'Walter Isaacson',
        category: 'Biography · Product Craft',
        year: '2011',
        coverImg: null,
        spineBg: '#18181b',
        spineInk: '#f4f4f5',
        capBg: '#27272a',
        capInk: '#e4e4e7',
        backBg: '#111113',
        takeaways: [
            'End-to-end integration of hardware, software, and typography creates products that feel inevitable rather than assembled.',
            'Saying no to a hundred good ideas is the prerequisite for shipping one enduring design.',
            'Craft lives in the parts users rarely inspect—treating the back of the fence with the same care as the front.',
        ],
        quote: 'Design is not just what it looks like and feels like. Design is how it works.',
        coverHtml: `
            <div class="w-full h-full flex flex-col justify-between p-4 select-none relative overflow-hidden"
                 style="background: radial-gradient(circle at 52% 44%, #f4f4f5 0%, #d4d4d8 52%, #a1a1aa 100%); color: #09090b;">
                <div class="relative z-10 text-center pt-0.5">
                    <div class="text-[17px] font-bold tracking-tight leading-none" style="font-family: Inter, sans-serif;">
                        Steve Jobs
                    </div>
                    <div class="text-[8.5px] font-medium tracking-wide opacity-65 mt-1">
                        by Walter Isaacson
                    </div>
                </div>
                <!-- Minimalist High-Contrast Editorial Portrait Silhouette -->
                <div class="relative z-10 flex-1 flex items-end justify-center overflow-hidden">
                    <svg viewBox="0 0 160 190" class="w-[144px] h-auto" aria-hidden="true">
                        <defs>
                            <linearGradient id="sjShade" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#27272a" />
                                <stop offset="100%" stop-color="#09090b" />
                            </linearGradient>
                        </defs>
                        <!-- Turtleneck Shoulders -->
                        <path d="M12 190 C18 148, 42 138, 60 134 L100 134 C118 138, 142 148, 148 190 Z" fill="#09090b" />
                        <rect x="61" y="122" width="38" height="20" rx="4" fill="#18181b" />
                        <!-- Stylized Head & Shadow Plane -->
                        <ellipse cx="80" cy="76" rx="34" ry="44" fill="#e4e4e7" stroke="#27272a" stroke-width="1.2" />
                        <path d="M80 32 C102 32, 114 52, 114 76 C114 100, 100 120, 80 120 C88 106, 90 54, 80 32 Z" fill="rgba(24,24,27,0.18)" />
                        <!-- Iconic Round Wireframe Glasses -->
                        <circle cx="65" cy="72" r="11.5" fill="rgba(255,255,255,0.35)" stroke="#18181b" stroke-width="1.8" />
                        <circle cx="95" cy="72" r="11.5" fill="rgba(255,255,255,0.22)" stroke="#18181b" stroke-width="1.8" />
                        <line x1="76.5" y1="72" x2="83.5" y2="72" stroke="#18181b" stroke-width="1.6" />
                        <!-- Subtle Stubble & Chin Contour -->
                        <path d="M53 88 C55 110, 68 121, 80 121 C92 121, 105 110, 107 88 C100 104, 60 104, 53 88 Z" fill="rgba(24,24,27,0.28)" />
                        <!-- Contemplative Hand Silhouette -->
                        <path d="M68 136 L74 110 C75 107, 81 107, 81 112 L79 138 Z" fill="#3f3f46" opacity="0.7" />
                    </svg>
                </div>
            </div>
        `,
    },
    {
        id: 'sapiens',
        num: '02',
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        category: 'History · Systems Thinking',
        coverImg: null,
        spineBg: '#f4f4f5',
        spineInk: '#18181b',
        capBg: '#18181b',
        capInk: '#fafafa',
        backBg: '#e4e4e7',
        takeaways: [
            'Large-scale human cooperation depends on shared abstractions—protocols, currencies, and narratives—much like distributed consensus.',
            'The Scientific Revolution accelerated when institutions admitted ignorance and paired observation with mathematical modeling.',
            'Technological leaps consistently reshape daily life faster than cultural norms can adapt.',
        ],
        quote: 'History is something that very few people have been doing while everyone else was ploughing fields and carrying water buckets.',
        coverHtml: `
            <div class="w-full h-full flex flex-col justify-between p-4 select-none relative overflow-hidden"
                 style="background: linear-gradient(180deg, #fafaf9 0%, #f4f4f0 100%); color: #18181b;">
                <!-- Subtle Thumbprint Arcs Watermark -->
                <svg viewBox="0 0 180 260" class="absolute inset-0 w-full h-full opacity-[0.09] pointer-events-none" aria-hidden="true">
                    <g fill="none" stroke="#991b1b" stroke-width="1.2">
                        <ellipse cx="90" cy="145" rx="22" ry="34" />
                        <ellipse cx="90" cy="145" rx="34" ry="50" />
                        <ellipse cx="90" cy="145" rx="46" ry="66" />
                        <ellipse cx="90" cy="145" rx="58" ry="82" />
                        <ellipse cx="90" cy="145" rx="70" ry="98" />
                    </g>
                </svg>
                <div class="relative z-10 text-center pt-1">
                    <div class="text-[7px] font-mono uppercase tracking-[0.14em] text-[#b91c1c] font-semibold">
                        International Bestseller
                    </div>
                    <div class="text-[11px] font-medium tracking-tight text-[#27272a] mt-1.5">
                        Yuval Noah Harari
                    </div>
                </div>
                <div class="relative z-10 text-center my-auto">
                    <div class="text-[31px] font-bold tracking-tight leading-none" style="color: #b91c1c; font-family: Georgia, serif;">
                        Sapiens
                    </div>
                    <div class="w-10 h-[1.5px] bg-[#18181b]/20 mx-auto my-2.5"></div>
                    <div class="text-[11.5px] leading-snug font-medium text-[#27272a]" style="font-family: Georgia, serif;">
                        A Brief History<br/>of Humankind
                    </div>
                </div>
                <div class="relative z-10 text-center border-t border-[#18181b]/15 pt-2">
                    <div class="text-[7px] font-mono uppercase tracking-[0.14em] text-[#71717a]">
                        Tenth Anniversary Edition
                    </div>
                </div>
            </div>
        `,
    },
    {
        id: 'siddhartha',
        num: '03',
        title: 'Siddhartha',
        author: 'Hermann Hesse',
        category: 'Philosophy · Literature',
        year: '1922',
        coverImg: null,
        spineBg: '#283044',
        spineInk: '#f4f4f5',
        capBg: '#f4f1ea',
        capInk: '#1e2436',
        backBg: '#1b2130',
        takeaways: [
            'Wisdom cannot be transferred solely through doctrine; it has to be forged through direct iteration and lived experience.',
            'Detachment from noise—listening like the river—clarifies what actually matters in both craft and life.',
            'Seeking too obsessively blinds you to what is already present; clarity arrives when you observe without forcing.',
        ],
        quote: 'Wisdom is not communicable. The wisdom which a wise man tries to communicate always sounds foolish.',
        coverHtml: `
            <div class="w-full h-full flex flex-col justify-between p-4 select-none relative overflow-hidden"
                 style="background: linear-gradient(180deg, #1e2436 0%, #2d3654 48%, #3c3a5c 76%, #1f2438 100%); color: #f8f5ee;">
                <!-- Framed Literary Border -->
                <div class="absolute inset-2.5 border border-[#e5c88a]/30 pointer-events-none"></div>
                <div class="relative z-10 text-center pt-1.5">
                    <div class="text-[6.5px] font-mono uppercase tracking-[0.2em] text-[#e5c88a]/80">
                        Classic Edition
                    </div>
                    <div class="text-[9.5px] tracking-[0.18em] uppercase mt-2 text-[#f8f5ee]/85">
                        Hermann Hesse
                    </div>
                    <div class="text-[13px] tracking-[0.09em] uppercase font-semibold mt-1 text-[#f3dfb0]" style="font-family: Georgia, serif;">
                        Siddhartha
                    </div>
                </div>
                <!-- Serene Dusk Sun & Concentric River Horizon -->
                <div class="relative z-10 flex-1 flex items-center justify-center">
                    <svg viewBox="0 0 150 130" class="w-[132px] h-auto" aria-hidden="true">
                        <circle cx="75" cy="58" r="24" fill="#e5c88a" opacity="0.22" />
                        <circle cx="75" cy="58" r="14" fill="#f3dfb0" opacity="0.72" />
                        <g fill="none" stroke="#e5c88a" stroke-width="1" opacity="0.45">
                            <path d="M16 84 Q45 76 75 84 T134 84" />
                            <path d="M22 94 Q48 87 75 94 T128 94" />
                            <path d="M32 104 Q53 98 75 104 T118 104" />
                            <path d="M46 114 Q60 110 75 114 T104 114" />
                        </g>
                    </svg>
                </div>
                <div class="relative z-10 text-center pb-1">
                    <div class="text-[7px] font-mono tracking-[0.16em] uppercase text-[#e5c88a]/65">
                        An Indian Poem
                    </div>
                </div>
            </div>
        `,
    },
    {
        id: '1984',
        num: '04',
        title: 'Nineteen Eighty-Four',
        author: 'George Orwell',
        category: 'Classic · Dystopian Fiction',
        year: '1949',
        coverImg: null,
        spineBg: '#111113',
        spineInk: '#f4f4f5',
        capBg: '#f4f4f5',
        capInk: '#111113',
        backBg: '#09090b',
        takeaways: [
            'Control over language directly constrains the space of thoughts a society—or an engineering org—can express.',
            'Centralized, unaccountable information systems inevitably optimize for narrative preservation over ground truth.',
            'Privacy and verifiable records are foundational infrastructure for independent thought.',
        ],
        quote: 'Who controls the past controls the future. Who controls the present controls the past.',
        coverHtml: `
            <div class="w-full h-full flex flex-col justify-between p-4 select-none relative overflow-hidden"
                 style="background: radial-gradient(circle at 50% 48%, #27272a 0%, #111113 62%, #09090b 100%); color: #fafafa;">
                <!-- Brutalist Surveillance Aperture Rings -->
                <svg viewBox="0 0 180 260" class="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
                    <circle cx="90" cy="136" r="66" fill="none" stroke="rgba(220,38,38,0.28)" stroke-width="1" />
                    <circle cx="90" cy="136" r="48" fill="none" stroke="rgba(220,38,38,0.45)" stroke-width="1.5" stroke-dasharray="4 4" />
                    <circle cx="90" cy="136" r="24" fill="rgba(220,38,38,0.16)" stroke="rgba(239,68,68,0.65)" stroke-width="1.2" />
                    <circle cx="90" cy="136" r="6" fill="#dc2626" opacity="0.85" />
                </svg>
                <div class="relative z-10 text-center pt-1">
                    <div class="text-[11px] font-semibold tracking-wide text-[#e4e4e7]">
                        George Orwell
                    </div>
                </div>
                <div class="relative z-10 text-center my-auto px-1">
                    <div class="text-[20px] font-bold tracking-tight leading-[1.08] text-white">
                        Nineteen<br/>Eighty-Four
                    </div>
                    <div class="mt-2 inline-block px-2 py-0.5 bg-[#dc2626] text-[7.5px] font-mono uppercase tracking-[0.16em] text-white">
                        Annotated Edition
                    </div>
                </div>
                <div class="relative z-10 flex items-center justify-between border-t border-white/15 pt-2 text-[7px] font-mono uppercase tracking-[0.14em] text-[#a1a1aa]">
                    <span>Modern Classics</span>
                    <span class="text-[#ef4444]">1949</span>
                </div>
            </div>
        `,
    },
    {
        id: 'zero-to-one',
        num: '05',
        title: 'Zero to One',
        author: 'Peter Thiel',
        category: 'Startups · Contrarian Strategy',
        coverImg: null,
        spineBg: '#09090b',
        spineInk: '#fafafa',
        capBg: '#fafafa',
        capInk: '#09090b',
        backBg: '#050507',
        takeaways: [
            'Vertical progress (0 → 1) comes from proprietary technology that is 10x better, not incremental copying (1 → n).',
            'Great companies are built around a specific technical or market secret that few others currently agree with.',
            'Definite optimism—designing a concrete future and engineering toward it—beats passive hedging.',
        ],
        quote: 'Every moment in business happens only once. The next Bill Gates will not build an operating system.',
        coverHtml: `
            <div class="w-full h-full flex flex-col justify-between p-4 select-none relative overflow-hidden"
                 style="background: linear-gradient(160deg, #141417 0%, #09090b 65%, #050507 100%); color: #fafafa;">
                <!-- Minimalist Swiss 0 -> 1 Geometric Axis -->
                <svg viewBox="0 0 180 260" class="absolute inset-0 w-full h-full opacity-25 pointer-events-none" aria-hidden="true">
                    <line x1="22" y1="215" x2="158" y2="215" stroke="#fafafa" stroke-width="0.9" />
                    <line x1="22" y1="215" x2="22" y2="55" stroke="#fafafa" stroke-width="0.9" />
                    <path d="M22 215 Q95 212 152 64" fill="none" stroke="#10b981" stroke-width="1.8" />
                    <circle cx="152" cy="64" r="3" fill="#10b981" />
                </svg>
                <div class="relative z-10 flex items-center justify-between">
                    <span class="px-1.5 py-0.5 bg-white text-[#09090b] font-mono text-[8px] font-bold tracking-wider">
                        0 → 1
                    </span>
                </div>
                <div class="relative z-10 my-auto">
                    <div class="text-[20px] font-bold tracking-tight leading-tight text-white">
                        Zero to One
                    </div>
                    <div class="text-[9.5px] leading-relaxed text-[#a1a1aa] mt-2">
                        Notes on Startups, or How to Build the Future
                    </div>
                </div>
                <div class="relative z-10 border-t border-white/15 pt-2 flex items-center justify-between text-[8px] font-mono uppercase tracking-[0.12em] text-[#d4d4d8]">
                    <span>Peter Thiel</span>
                    <span class="text-[#10b981]">↗</span>
                </div>
            </div>
        `,
    },
    {
        id: 'stillness-is-the-key',
        num: '06',
        title: 'Stillness Is the Key',
        author: 'Ryan Holiday',
        category: 'Philosophy · Stoicism',
        year: '2019',
        coverImg: null,
        spineBg: '#0f2922',
        spineInk: '#f4f4f5',
        capBg: '#f4f1ea',
        capInk: '#0f2922',
        backBg: '#091b16',
        takeaways: [
            'Clarity under pressure requires actively guarding mental, spiritual, and physical stillness—not just working harder.',
            'Slowing down to observe before reacting separates signal from noise in both engineering decisions and daily life.',
            'Building deliberate routines—journaling, walking, unplugging—creates the space where deep work actually happens.',
        ],
        quote: 'Stillness is what aims the archer’s arrow. It inspires new ideas. It sharpens perspective and illuminates connections.',
        coverHtml: `
            <div class="w-full h-full flex flex-col justify-between p-4 select-none relative overflow-hidden"
                 style="background: linear-gradient(170deg, #13352c 0%, #0d241e 58%, #071713 100%); color: #f4f1ea;">
                <!-- Subtle Classical Border -->
                <div class="absolute inset-2.5 border border-[#d6c297]/25 pointer-events-none"></div>
                <div class="relative z-10 text-center pt-1">
                    <div class="text-[7px] font-mono uppercase tracking-[0.18em] text-[#d6c297]/80">
                        Ryan Holiday
                    </div>
                </div>
                <div class="relative z-10 text-center my-auto px-1">
                    <div class="text-[20px] font-semibold tracking-tight leading-[1.12] text-[#f8f5ee]" style="font-family: Georgia, serif;">
                        Stillness<br/>Is the Key
                    </div>
                    <!-- Minimalist Key & Concentric Ripple Motif -->
                    <svg viewBox="0 0 120 56" class="w-[88px] h-auto mx-auto mt-3" aria-hidden="true">
                        <circle cx="60" cy="28" r="22" fill="none" stroke="#d6c297" stroke-width="0.7" opacity="0.28" />
                        <circle cx="60" cy="28" r="14" fill="none" stroke="#10b981" stroke-width="0.8" opacity="0.45" />
                        <!-- Key -->
                        <circle cx="44" cy="28" r="5.5" fill="none" stroke="#f4f1ea" stroke-width="1.5" />
                        <line x1="49.5" y1="28" x2="77" y2="28" stroke="#f4f1ea" stroke-width="1.5" stroke-linecap="round" />
                        <line x1="70" y1="28" x2="70" y2="33" stroke="#f4f1ea" stroke-width="1.5" stroke-linecap="round" />
                        <line x1="75" y1="28" x2="75" y2="32" stroke="#f4f1ea" stroke-width="1.5" stroke-linecap="round" />
                    </svg>
                </div>
                <div class="relative z-10 text-center border-t border-[#d6c297]/20 pt-2">
                    <div class="text-[7px] font-mono uppercase tracking-[0.14em] text-[#d6c297]/75">
                        Mind · Spirit · Body
                    </div>
                </div>
            </div>
        `,
    },
];
