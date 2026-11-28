/* ---------------------------------------------------------------------
* 18B. SHARED IST CLOCK & WEBGL 3D EARTH GLOBE (HERO LOCATION)
* ------------------------------------------------------------------- */
           const skyClock = (function () {
               function getISTDate() {
                   const now = new Date();
                   const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
                   return new Date(utcMs + 5.5 * 3600000);
               }

               function getHour() {
                   const ist = getISTDate();
                   return ist.getHours() + ist.getMinutes() / 60 + ist.getSeconds() / 3600;
               }

               function getLightingState(h) {
                   let dayAmount = 0;
                   let goldenAmount = 0;

                   if (h >= 5 && h < 7.5) {
                       const t = (h - 5) / 2.5;
                       dayAmount = t;
                       goldenAmount = Math.sin(t * Math.PI);
                   } else if (h >= 7.5 && h < 16.5) {
                       dayAmount = 1;
                       goldenAmount = 0;
                   } else if (h >= 16.5 && h < 19.5) {
                       const t = (h - 16.5) / 3;
                       dayAmount = 1 - t;
                       goldenAmount = Math.sin(t * Math.PI);
                   }

                   const sunAngle = ((h - 6) / 12) * Math.PI;
                   return { dayAmount, goldenAmount, sunAngle };
               }

               return { getHour, getLightingState };
           })();

           export function initGlobe3D() {
               const canvas = document.getElementById('globe3d');
               if (!canvas) return;

               const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
               const reducedMotion =
                   window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

               function createEarthTexture() {
                   const texCanvas = document.createElement('canvas');
                   texCanvas.width = 256;
                   texCanvas.height = 128;
                   const tctx = texCanvas.getContext('2d');
                   const w = texCanvas.width;
                   const h = texCanvas.height;
                   const img = tctx.createImageData(w, h);
                   const d = img.data;

                   function hash(x, y) {
                       const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
                       return n - Math.floor(n);
                   }

                   function smoothNoise(x, y) {
                       const ix = Math.floor(x);
                       const iy = Math.floor(y);
                       const fx = x - ix;
                       const fy = y - iy;
                       const ux = fx * fx * (3 - 2 * fx);
                       const uy = fy * fy * (3 - 2 * fy);
                       const a = hash(ix, iy);
                       const b = hash(ix + 1, iy);
                       const c = hash(ix, iy + 1);
                       const d1 = hash(ix + 1, iy + 1);
                       return a + (b - a) * ux + (c - a) * uy + (a - b - c + d1) * ux * uy;
                   }

                   function fbm(x, y) {
                       let val = 0;
                       let amp = 0.5;
                       let freq = 1;
                       for (let i = 0; i < 4; i++) {
                           val += amp * smoothNoise(x * freq, y * freq);
                           freq *= 2.02;
                           amp *= 0.5;
                       }
                       return val;
                   }

                   const blobs = [
                       { u: 0.22, v: 0.34, ru: 0.11, rv: 0.14 },
                       { u: 0.29, v: 0.62, ru: 0.065, rv: 0.18 },
                       { u: 0.50, v: 0.26, ru: 0.065, rv: 0.09 },
                       { u: 0.52, v: 0.54, ru: 0.08, rv: 0.18 },
                       { u: 0.66, v: 0.32, ru: 0.16, rv: 0.14 },
                       { u: 0.68, v: 0.45, ru: 0.045, rv: 0.08 },
                       { u: 0.79, v: 0.70, ru: 0.07, rv: 0.08 },
                   ];

                   for (let y = 0; y < h; y++) {
                       const v = y / (h - 1);
                       const latAbs = Math.abs(v - 0.5) * 2;
                       for (let x = 0; x < w; x++) {
                           const u = x / (w - 1);
                           const idx = (y * w + x) * 4;

                           let landMask = 0;
                           for (let b = 0; b < blobs.length; b++) {
                               const bl = blobs[b];
                               let du = Math.abs(u - bl.u);
                               if (du > 0.5) du = 1 - du;
                               const dv = (v - bl.v) / bl.rv;
                               const dist = Math.sqrt((du / bl.ru) ** 2 + dv * dv);
                               if (dist < 1.25) {
                                   landMask = Math.max(landMask, 1 - dist / 1.25);
                               }
                           }

                           const n = fbm(u * 14, v * 7);
                           const elevation = landMask * 0.85 + (n - 0.42) * 0.65;

                           let rCol, gCol, bCol;
                           if (latAbs > 0.86 + (n - 0.5) * 0.08) {
                               rCol = 226; gCol = 236; bCol = 245;
                           } else if (elevation > 0.36) {
                               const t = Math.min(1, (elevation - 0.36) / 0.45);
                               const arid = Math.max(0, 1 - Math.abs(latAbs - 0.28) * 5);
                               rCol = Math.round(58 + t * 85 + arid * 55);
                               gCol = Math.round(126 + t * 35 - arid * 22);
                               bCol = Math.round(68 + t * 20 + arid * 12);
                           } else {
                               const depth = Math.max(0, Math.min(1, (0.36 - elevation) / 0.36));
                               rCol = Math.round(28 - depth * 16);
                               gCol = Math.round(118 - depth * 68);
                               bCol = Math.round(196 - depth * 92);
                           }

                           d[idx] = rCol;
                           d[idx + 1] = gCol;
                           d[idx + 2] = bCol;
                           d[idx + 3] = 255;
                       }
                   }

                   tctx.putImageData(img, 0, 0);
                   return texCanvas;
               }

               if (!gl) return;

               const vsSource = `
                   attribute vec3 aPos;
                   attribute vec2 aTex;
                   uniform float uRot;
                   varying vec2 vTex;
                   varying vec3 vNormal;
                   void main() {
                       float c = cos(uRot);
                       float s = sin(uRot);
                       vec3 rotPos = vec3(
                           aPos.x * c + aPos.z * s,
                           aPos.y,
                           -aPos.x * s + aPos.z * c
                       );
                       vTex = aTex;
                       vNormal = normalize(rotPos);
                       gl_Position = vec4(rotPos.xy, -rotPos.z * 0.5, 1.0);
                   }
               `;

               const fsSource = `
                   precision mediump float;
                   uniform sampler2D uTex;
                   uniform vec3 uLightDir;
                   uniform float uAmbient;
                   uniform float uSpecStrength;
                   uniform vec3 uLightTint;
                   varying vec2 vTex;
                   varying vec3 vNormal;
                   void main() {
                       vec3 texCol = texture2D(uTex, vTex).rgb;
                       vec3 n = normalize(vNormal);
                       float diff = max(0.0, dot(n, normalize(uLightDir)));
                       vec3 viewDir = vec3(0.0, 0.0, 1.0);
                       vec3 halfVec = normalize(normalize(uLightDir) + viewDir);
                       float spec = pow(max(0.0, dot(n, halfVec)), 22.0) * uSpecStrength;
                       vec3 lit = texCol * (uAmbient + diff * 0.85) * uLightTint + vec3(spec) * uLightTint;
                       gl_FragColor = vec4(lit, 1.0);
                   }
               `;

               function compileShader(type, src) {
                   const sh = gl.createShader(type);
                   gl.shaderSource(sh, src);
                   gl.compileShader(sh);
                   return sh;
               }

               const prog = gl.createProgram();
               gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vsSource));
               gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fsSource));
               gl.linkProgram(prog);
               gl.useProgram(prog);

               const latSegs = 24;
               const lonSegs = 36;
               const positions = [];
               const texCoords = [];
               const indices = [];

               for (let y = 0; y <= latSegs; y++) {
                   const v = y / latSegs;
                   const phi = v * Math.PI;
                   const sinPhi = Math.sin(phi);
                   const cosPhi = Math.cos(phi);

                   for (let x = 0; x <= lonSegs; x++) {
                       const u = x / lonSegs;
                       const theta = u * Math.PI * 2;
                       positions.push(sinPhi * Math.cos(theta) * 0.96, cosPhi * 0.96, sinPhi * Math.sin(theta) * 0.96);
                       texCoords.push(1.0 - u, 1.0 - v);
                   }
               }

               for (let y = 0; y < latSegs; y++) {
                   for (let x = 0; x < lonSegs; x++) {
                       const a = y * (lonSegs + 1) + x;
                       const b = a + lonSegs + 1;
                       indices.push(a, b, a + 1, b, b + 1, a + 1);
                   }
               }

               const posBuf = gl.createBuffer();
               gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
               gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
               const aPos = gl.getAttribLocation(prog, 'aPos');
               gl.enableVertexAttribArray(aPos);
               gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

               const texBuf = gl.createBuffer();
               gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
               gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
               const aTex = gl.getAttribLocation(prog, 'aTex');
               gl.enableVertexAttribArray(aTex);
               gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

               const idxBuf = gl.createBuffer();
               gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
               gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

               const texture = gl.createTexture();
               gl.bindTexture(gl.TEXTURE_2D, texture);
               gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, createEarthTexture());
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

               const uRot = gl.getUniformLocation(prog, 'uRot');
               const uLightDir = gl.getUniformLocation(prog, 'uLightDir');
               const uAmbient = gl.getUniformLocation(prog, 'uAmbient');
               const uSpecStrength = gl.getUniformLocation(prog, 'uSpecStrength');
               const uLightTint = gl.getUniformLocation(prog, 'uLightTint');

               gl.enable(gl.DEPTH_TEST);
               gl.viewport(0, 0, canvas.width, canvas.height);

               let rot = 0.6;

               function draw() {
                   const h = skyClock.getHour();
                   const { dayAmount, goldenAmount, sunAngle } = skyClock.getLightingState(h);

                   const lx = -Math.cos(sunAngle) * 0.72;
                   const ly = 0.25 + Math.max(0, Math.sin(sunAngle)) * 0.45;
                   const lz = 0.55 + dayAmount * 0.25;

                   const ambient = 0.14 + dayAmount * 0.22;
                   const spec = 0.12 + dayAmount * 0.28;

                   const nightTint = [0.68, 0.78, 1.05];
                   const dayTint = [1.05, 1.04, 1.0];
                   const goldenTint = [1.22, 0.92, 0.74];

                   const baseR = nightTint[0] + (dayTint[0] - nightTint[0]) * dayAmount;
                   const baseG = nightTint[1] + (dayTint[1] - nightTint[1]) * dayAmount;
                   const baseB = nightTint[2] + (dayTint[2] - nightTint[2]) * dayAmount;

                   const tintR = baseR + (goldenTint[0] - baseR) * goldenAmount * 0.75;
                   const tintG = baseG + (goldenTint[1] - baseG) * goldenAmount * 0.75;
                   const tintB = baseB + (goldenTint[2] - baseB) * goldenAmount * 0.75;

                   gl.clearColor(0, 0, 0, 0);
                   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                   gl.uniform1f(uRot, rot);
                   gl.uniform3f(uLightDir, lx, ly, lz);
                   gl.uniform1f(uAmbient, ambient);
                   gl.uniform1f(uSpecStrength, spec);
                   gl.uniform3f(uLightTint, tintR, tintG, tintB);
                   gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
               }

               function loop() {
                   if (!document.hidden) {
                       if (!reducedMotion) {
                           rot = (rot + 0.025) % (Math.PI * 2);
                       }
                       draw();
                   }
                   requestAnimationFrame(loop);
               }

               draw();
               requestAnimationFrame(loop);
           }
