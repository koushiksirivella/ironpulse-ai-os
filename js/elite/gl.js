/* ============================================================
   gl.js — the hero's glass object.

   NOT a stock MeshPhysicalMaterial on a torus. This is a custom
   GLSL fragment shader raymarching a signed-distance field and
   computing refraction in two bounces against a procedural
   environment that matches the page gradient exactly.

   Why raymarched and not a mesh: the thing being studied is
   "real rendered light beats a blur filter". A raymarcher gives
   genuine entry/exit refraction with no model to ship.

   Monochrome by construction. There are no per-channel offsets
   anywhere in here — splitting the IOR per channel is chromatic
   aberration and would put a rainbow on a page that has no hue.

   Shares silk's single raf. Never calls requestAnimationFrame.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('gl');
  if (!canvas) return;
  var gl = canvas.getContext('webgl2', {
    antialias: false, depth: false, stencil: false,
    alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance'
  });
  if (!gl) { canvas.style.display = 'none'; return; }

  var VERT = [
    '#version 300 es',
    'in vec2 p; out vec2 uv;',
    'void main(){ uv = p; gl_Position = vec4(p, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 uv; out vec4 frag;',
    '',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform vec2  uPtr;',
    'uniform float uScroll;',
    '',
    'const float IOR = 1.45;',
    '',
    '/* ---------- sdf primitives ---------- */',
    'float sdRoundBox(vec3 p, vec3 b, float r){',
    '  vec3 q = abs(p) - b;',
    '  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;',
    '}',
    'float sdTorus(vec3 p, vec2 t){',
    '  vec2 q = vec2(length(p.xz)-t.x, p.y);',
    '  return length(q)-t.y;',
    '}',
    'float sdCapsule(vec3 p, vec3 a, vec3 b, float r){',
    '  vec3 pa = p-a, ba = b-a;',
    '  float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);',
    '  return length(pa - ba*h) - r;',
    '}',
    'float smin(float a, float b, float k){',
    '  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);',
    '  return mix(b, a, h) - k*h*(1.0-h);',
    '}',
    'mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }',
    '',
    '/* A cylinder lying along X. The plates and the bar are all this shape at',
    '   different proportions, which is why the whole object costs four lines. */',
    'float sdCylX(vec3 p, float halfLen, float r){',
    '  vec2 d = abs(vec2(length(p.yz), p.x)) - vec2(r, halfLen);',
    '  return min(max(d.x,d.y),0.0) + length(max(d,0.0));',
    '}',
    '',
    '/* ---------- the dumbbell ----------',
    '   Built from primitives rather than loaded as a model: an SDF has no',
    '   polygon budget, refracts exactly, and there is no .gltf to fetch before',
    '   the hero can paint. Two plate pairs, a knurled-looking collar and the',
    '   bar, all unioned. min() for the plates because they are separate steel;',
    '   smin() for the collars because those are welded to the bar and a hard',
    '   seam there reads as a modelling mistake. */',
    'float map(vec3 p){',
    '  float t = uTime*0.16 + uScroll*1.15;',
    '  p.yz *= rot(sin(t*0.9)*0.16 + uPtr.y*0.20);',
    '  p.xz *= rot(t*0.55 + uPtr.x*0.30);',
    '  p.xy *= rot(0.42);',
    '',
    '  float sp = uScroll;',
    '',
    '  /* the bar */',
    '  float d = sdCylX(p, 0.50, 0.070) - 0.012;',
    '',
    '  /* inner plates. They creep outward as the page scrolls, so the object is',
    '     doing something across the band rather than just spinning. */',
    '  float xi = 0.56 + sp*0.06;',
    '  d = min(d, sdCylX(p - vec3( xi,0.0,0.0), 0.062, 0.320) - 0.028);',
    '  d = min(d, sdCylX(p - vec3(-xi,0.0,0.0), 0.062, 0.320) - 0.028);',
    '',
    '  /* outer plates */',
    '  float xo = 0.72 + sp*0.10;',
    '  d = min(d, sdCylX(p - vec3( xo,0.0,0.0), 0.050, 0.215) - 0.026);',
    '  d = min(d, sdCylX(p - vec3(-xo,0.0,0.0), 0.050, 0.215) - 0.026);',
    '',
    '  /* collars, welded to the bar */',
    '  d = smin(d, sdCylX(p - vec3( 0.40,0.0,0.0), 0.055, 0.115), 0.035);',
    '  d = smin(d, sdCylX(p - vec3(-0.40,0.0,0.0), 0.055, 0.115), 0.035);',
    '',
    '  return d;',
    '}',
    '',
    'vec3 calcNormal(vec3 p){',
    '  const vec2 e = vec2(1.0,-1.0)*0.0012;',
    '  return normalize(',
    '    e.xyy*map(p+e.xyy) + e.yyx*map(p+e.yyx) +',
    '    e.yxy*map(p+e.yxy) + e.xxx*map(p+e.xxx));',
    '}',
    '',
    'float march(vec3 ro, vec3 rd, float side){',
    '  float t = 0.0;',
    '  for(int i=0;i<86;i++){',
    '    vec3 p = ro + rd*t;',
    '    float d = map(p)*side;',
    '    if(abs(d) < 0.0009*t + 0.0007) break;',
    '    t += d*0.86;',
    '    if(t > 7.0) return -1.0;',
    '  }',
    '  return t;',
    '}',
    '',
    '/* ---------- environment ----------',
    '   The page itself, reproduced procedurally: the same',
    '   #d6d6d6 -> #fafafa vertical gradient plus the bloom pool.',
    '   Refracting the real background welds the object to the page',
    '   instead of parking a render on top of it. */',
    'vec3 env(vec3 rd){',
    '  float h = clamp(rd.y*0.5 + 0.5, 0.0, 1.0);',
    '  float g = mix(0.980, 0.838, smoothstep(0.15, 0.95, h));',
    '  float b = pow(max(dot(rd, normalize(vec3(-0.25,0.55,0.80))), 0.0), 3.2);',
    '  g += b*0.16;',
    '  g += smoothstep(0.46,0.50,h)*(1.0-smoothstep(0.50,0.62,h))*0.10;',
    '  /* soft studio panels. Structure in the environment is what makes',
    '     refraction legible — a flat env refracts into flat nothing. */',
    '  vec2 pa = vec2(atan(rd.z, rd.x)*1.9, rd.y*2.6);',
    '  float panel = smoothstep(0.62, 0.98, sin(pa.x)*0.5+0.5) * smoothstep(0.15, 0.75, rd.y*0.5+0.5);',
    '  g += panel*0.13;',
    '  float band = smoothstep(0.86,1.0, sin(pa.y*1.6)*0.5+0.5);',
    '  g -= band*0.045;',
    '  return vec3(g);',
    '}',
    '',
    'void main(){',
    '  vec2 sc = (gl_FragCoord.xy*2.0 - uRes) / uRes.y;',
    '',
    '  vec3 ro = vec3(0.0, 0.0, 3.58);',
    '  vec3 rd = normalize(vec3(sc, -1.9));',
    '',
    '  /* The camera sits below the object so it hangs in the upper third, above',
    '     the headline. -1.20 was tuned for a taller object and clipped the',
    '     dumbbell against the top edge, which reads as a mistake rather than as',
    '     a crop. -0.84 seats the whole thing inside the frame. */',
    '  ro.y += -0.84 + uScroll*0.62;',
    '',
    '  float t = march(ro, rd, 1.0);',
    '  if(t < 0.0){ frag = vec4(0.0); return; }',
    '',
    '  vec3 pos = ro + rd*t;',
    '  vec3 n   = calcNormal(pos);',
    '  /* micro-relief on the surface only. Cheap (one evaluation, not one',
    '     per march step) and it is what stops the glass reading as CG-clean. */',
    '  vec3 h3 = sin(pos*46.0) * sin(pos.yzx*37.0);',
    '  n = normalize(n + h3*0.012);',
    '',
    '  float fres = pow(1.0 - max(dot(-rd, n), 0.0), 5.0);',
    '  fres = 0.04 + 0.96*fres;',
    '',
    '  vec3 rdIn = refract(rd, n, 1.0/IOR);',
    '  vec3 pIn  = pos + rdIn*0.02;',
    '  float tIn = march(pIn, rdIn, -1.0);',
    '  vec3 pOut = pIn + rdIn*max(tIn, 0.0);',
    '  vec3 nOut = -calcNormal(pOut);',
    '',
    '  vec3 rdOut = refract(rdIn, nOut, IOR);',
    '  if(dot(rdOut,rdOut) < 0.001) rdOut = reflect(rdIn, nOut);',
    '  vec3 refr = env(rdOut);',
    '',
    '  float thick = clamp(max(tIn,0.0), 0.0, 1.6);',
    '  refr *= 1.0 - thick*0.26;',
    '',
    '  vec3 refl = env(reflect(rd, n));',
    '',
    '  vec3 col = mix(refr, refl, fres);',
    '',
    '  vec3 L = normalize(vec3(-0.35, 0.85, 0.62));',
    '  float spec = pow(max(dot(reflect(-L, n), -rd), 0.0), 84.0);',
    '  col += spec*0.75;',
    '',
    '  col += pow(1.0 - max(dot(-rd,n),0.0), 3.0)*0.10;',
    '',
    '  float a = smoothstep(0.0, 0.014, 1.0 - pow(1.0-max(dot(-rd,n),0.0), 12.0));',
    '  frag = vec4(clamp(col,0.0,1.0), clamp(a+0.10, 0.0, 1.0));',
    '}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[gl]', gl.getShaderInfoLog(s)); return null;
    }
    return s;
  }
  var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.style.display = 'none'; return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[gl]', gl.getProgramInfoLog(prog)); canvas.style.display = 'none'; return;
  }
  gl.useProgram(prog);

  var vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {
    res:    gl.getUniformLocation(prog, 'uRes'),
    time:   gl.getUniformLocation(prog, 'uTime'),
    ptr:    gl.getUniformLocation(prog, 'uPtr'),
    scroll: gl.getUniformLocation(prog, 'uScroll')
  };

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  /* ---- sizing. Measured on the viewport bus, never inside a frame. ---- */
  var W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(canvas.clientWidth  * DPR));
    H = Math.max(1, Math.round(canvas.clientHeight * DPR));
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
  }
  var silk = window.silk;
  if (silk && silk.subscribeViewport) silk.subscribeViewport(resize);
  resize();

  /* ---- pointer, damped ---- */
  var pxT = 0, pyT = 0, px = 0, py = 0;
  window.addEventListener('pointermove', function (e) {
    pxT = (e.clientX / window.innerWidth) * 2 - 1;
    pyT = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function damp(cur, tgt, lerp, dt) {
    return tgt + (cur - tgt) * Math.exp(-lerp * dt * 60);
  }

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t0 = performance.now(), scrollP = 0, heroH = 900;

  if (silk && silk.subscribe) {
    silk.subscribe(function (s) {
      scrollP = Math.min(1, s.scrollTop / heroH);
      canvas.style.opacity = scrollP >= 1 ? '0' : '1';
    });
  }

  /* THE shared raf. One loop for the whole page. */
  if (silk && silk.onFrame) {
    silk.onFrame(function (dt) {
      if (scrollP >= 1) return;
      px = damp(px, pxT, 0.06, dt);
      py = damp(py, pyT, 0.06, dt);
      gl.uniform2f(U.res, W, H);
      gl.uniform1f(U.time, RM ? 8.0 : (performance.now() - t0) * 0.001);
      gl.uniform2f(U.ptr, px, py);
      gl.uniform1f(U.scroll, scrollP);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  }
  document.documentElement.classList.add('gl-ready');
}());
