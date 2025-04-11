import * as w from "three";
const g = {};
console.log("TerrainNS initialized in core.js");
g.ceilPowerOfTwo = function(r) {
  return Math.pow(2, Math.ceil(Math.log(r) / Math.log(2)));
};
const Me = function(r) {
  var e = {
    after: null,
    easing: g.Linear,
    // Use a simple default heightmap function if DiamondSquare is not available
    heightmap: function(l, v) {
      console.log("Using fallback heightmap function");
      for (var o = 0; o < l.length; o++)
        l[o] = Math.random() * (v.maxHeight - v.minHeight) + v.minHeight;
    },
    material: null,
    maxHeight: 100,
    minHeight: -100,
    optimization: g.NONE,
    frequency: 2.5,
    steps: 1,
    stretch: true,
    turbulent: false,
    xSegments: 63,
    xSize: 1024,
    ySegments: 63,
    ySize: 1024
  };
  console.log("Default heightmap function type:", typeof e.heightmap), r = r || {};
  for (var a in e)
    e.hasOwnProperty(a) && (r[a] = typeof r[a] > "u" ? e[a] : r[a]);
  r.material = r.material || new w.MeshPhongMaterial({
    color: 15623731,
    flatShading: true,
    shininess: 0,
    side: w.DoubleSide
  });
  var t = new w.Object3D();
  t.rotation.x = -0.5 * Math.PI, console.log("Creating terrain mesh with size:", r.xSize, r.ySize, "segments:", r.xSegments, r.ySegments);
  try {
    var n = new w.PlaneGeometry(
      r.xSize,
      r.ySize,
      r.xSegments,
      r.ySegments
    );
    console.log("Geometry created:", n), console.log("Geometry attributes:", n.attributes), console.log("Position array length:", n.attributes.position.array.length);
    var f = new w.Mesh(
      n,
      r.material || new w.MeshBasicMaterial({ color: 15623731 })
    );
    console.log("Mesh created:", f);
  } catch (l) {
    throw console.error("Error creating geometry or mesh:", l), l;
  }
  console.log("Getting position array from geometry:", f.geometry.attributes.position);
  var h = g.toArray1D(f.geometry.attributes.position.array);
  if (console.log("Generated zs array:", h.length), r.heightmap instanceof HTMLCanvasElement || r.heightmap instanceof Image)
    console.log("Using image heightmap"), g.fromHeightmap(h, r, r.heightmap);
  else if (typeof r.heightmap == "function")
    console.log("Using function heightmap:", r.heightmap.name), r.heightmap(h, r);
  else {
    console.warn("An invalid value was passed for `options.heightmap`: " + r.heightmap), console.log("Applying fallback random heightmap");
    for (var i = 0; i < h.length; i++)
      h[i] = Math.random() * (r.maxHeight - r.minHeight) + r.minHeight;
  }
  g.fromArray1D(f.geometry.attributes.position.array, h), g.Normalize(f, r), t.add(f), console.log("Scene created with children:", t.children.length), console.log("Mesh position:", f.position), console.log("Mesh rotation:", f.rotation), console.log("Mesh scale:", f.scale);
  for (var m = 1 / 0, u = -1 / 0, i = 0; i < h.length; i++)
    h[i] < m && (m = h[i]), h[i] > u && (u = h[i]);
  return console.log("Terrain height range:", m, "to", u), t;
};
g.Normalize = function(r, e) {
  var a = g.toArray1D(r.geometry.attributes.position.array);
  e.turbulent && g.Turbulence(a, e), e.steps > 1 && (g.Step(a, e.steps), g.Smooth(a, e)), g.Clamp(a, e), typeof e.after == "function" && e.after(a, e), g.fromArray1D(r.geometry.attributes.position.array, a), r.geometry.computeBoundingSphere(), r.geometry.computeVertexNormals();
};
g.NONE = 0;
g.GEOMIPMAP = 1;
g.GEOCLIPMAP = 2;
g.POLYGONREDUCTION = 3;
g.toArray2D = function(r, e) {
  var a = new Array(e.xSegments + 1), t = e.xSegments + 1, n = e.ySegments + 1, f, h;
  for (f = 0; f < t; f++)
    for (a[f] = new Float32Array(e.ySegments + 1), h = 0; h < n; h++)
      a[f][h] = r[h * t + f];
  return a;
};
g.fromArray2D = function(r, e) {
  for (var a = 0, t = e.length; a < t; a++)
    for (var n = 0, f = e[a].length; n < f; n++)
      r[n * t + a] = e[a][n];
};
g.toArray1D = function(r) {
  for (var e = new Float32Array(r.length / 3), a = 0, t = e.length; a < t; a++)
    e[a] = r[a * 3 + 2];
  return e;
};
g.fromArray1D = function(r, e) {
  for (var a = 0, t = Math.min(r.length / 3, e.length); a < t; a++)
    r[a * 3 + 2] = e[a];
};
g.heightmapArray = function(r, e) {
  var a = new Array((e.xSegments + 1) * (e.ySegments + 1));
  return a.length, a.fill(0), e.minHeight = e.minHeight || 0, e.maxHeight = typeof e.maxHeight > "u" ? 1 : e.maxHeight, e.stretch = e.stretch || false, r(a, e), g.Clamp(a, e), a;
};
g.Linear = function(r) {
  return r;
};
g.EaseIn = function(r) {
  return r * r;
};
g.EaseOut = function(r) {
  return -r * (r - 2);
};
g.EaseInOut = function(r) {
  return r * r * (3 - 2 * r);
};
g.InEaseOut = function(r) {
  var e = 2 * r - 1;
  return 0.5 * e * e * e + 0.5;
};
g.EaseInWeak = function(r) {
  return Math.pow(r, 1.55);
};
g.EaseInStrong = function(r) {
  return r * r * r * r * r * r * r;
};
g.Terrain = Me;
g.Clamp = function(r, e) {
  var a = 1 / 0, t = -1 / 0, n = r.length, f;
  for (e.easing = e.easing || g.Linear, f = 0; f < n; f++)
    r[f] < a && (a = r[f]), r[f] > t && (t = r[f]);
  var h = t - a, i = typeof e.maxHeight != "number" ? t : e.maxHeight, m = typeof e.minHeight != "number" ? a : e.minHeight, u = e.stretch ? i : t < i ? t : i, l = e.stretch ? m : a > m ? a : m, v = u - l;
  for (u < l && (u = i, v = u - l), f = 0; f < n; f++)
    r[f] = e.easing((r[f] - a) / h) * v + m;
};
g.Edges = function(r, e, a, t, n, f) {
  var h = Math.floor(t / (e.xSize / e.xSegments)) || 1, i = Math.floor(t / (e.ySize / e.ySegments)) || 1, m = a ? e.maxHeight : e.minHeight, u = a ? Math.max : Math.min, l = e.xSegments + 1, v = e.ySegments + 1, o, c, d, y, M;
  for (n = n || g.EaseInOut, typeof f != "object" && (f = { top: true, bottom: true, left: true, right: true }), o = 0; o < l; o++)
    for (c = 0; c < i; c++)
      d = n(1 - c / i), y = c * l + o, M = (e.ySegments - c) * l + o, f.top && (r[y] = u(r[y], (m - r[y]) * d + r[y])), f.bottom && (r[M] = u(r[M], (m - r[M]) * d + r[M]));
  for (o = 0; o < v; o++)
    for (c = 0; c < h; c++)
      d = n(1 - c / h), y = o * l + c, M = (e.ySegments - o) * l + (e.xSegments - c), f.left && (r[y] = u(r[y], (m - r[y]) * d + r[y])), f.right && (r[M] = u(r[M], (m - r[M]) * d + r[M]));
  g.Clamp(r, {
    maxHeight: e.maxHeight,
    minHeight: e.minHeight,
    stretch: true
  });
};
g.RadialEdges = function(r, e, a, t, n) {
  var f = a ? e.maxHeight : e.minHeight, h = a ? Math.max : Math.min, i = e.xSegments + 1, m = e.ySegments + 1, u = i * 0.5, l = m * 0.5, v = e.xSize / e.xSegments, o = e.ySize / e.ySegments, c = Math.min(e.xSize, e.ySize) * 0.5 - t, d, y, M, S, s;
  for (d = 0; d < i; d++)
    for (y = 0; y < l; y++)
      S = y * i + d, s = Math.min(c, Math.sqrt((u - d) * v * (u - d) * v + (l - y) * o * (l - y) * o) - t), !(s < 0) && (M = n(s / c), r[S] = h(r[S], (f - r[S]) * M + r[S]), S = (e.ySegments - y) * i + d, r[S] = h(r[S], (f - r[S]) * M + r[S]));
};
g.Smooth = function(r, e, a) {
  for (var t = new Float32Array(r.length), n = 0, f = e.xSegments + 1, h = e.ySegments + 1; n < f; n++)
    for (var i = 0; i < h; i++) {
      for (var m = 0, u = 0, l = -1; l <= 1; l++)
        for (var v = -1; v <= 1; v++) {
          var o = (i + l) * f + n + v;
          typeof r[o] < "u" && n + v >= 0 && i + l >= 0 && n + v < f && i + l < h && (m += r[o], u++);
        }
      t[i * f + n] = m / u;
    }
  a = a || 0;
  for (var c = 1 / (1 + a), d = 0, y = r.length; d < y; d++)
    r[d] = (t[d] + r[d] * a) * c;
};
g.SmoothMedian = function(r, e) {
  for (var a = new Float32Array(r.length), t = [], n = [], f = function(S, s) {
    return t[S] - t[s];
  }, h = 0, i = e.xSegments + 1, m = e.ySegments + 1; h < i; h++)
    for (var u = 0; u < m; u++) {
      t.length = 0, n.length = 0;
      for (var l = -1; l <= 1; l++)
        for (var v = -1; v <= 1; v++) {
          var o = (u + l) * i + h + v;
          typeof r[o] < "u" && h + v >= 0 && u + l >= 0 && h + v < i && u + l < m && (t.push(r[o]), n.push(o));
        }
      n.sort(f);
      var c = Math.floor(n.length * 0.5), d;
      n.length % 2 === 1 ? d = r[n[c]] : d = (r[n[c - 1]] + r[n[c]]) * 0.5, a[u * i + h] = d;
    }
  for (var y = 0, M = r.length; y < M; y++)
    r[y] = a[y];
};
g.SmoothConservative = function(r, e, a) {
  for (var t = new Float32Array(r.length), n = 0, f = e.xSegments + 1, h = e.ySegments + 1; n < f; n++)
    for (var i = 0; i < h; i++) {
      for (var m = -1 / 0, u = 1 / 0, l = -1; l <= 1; l++)
        for (var v = -1; v <= 1; v++) {
          var o = (i + l) * f + n + v;
          typeof r[o] < "u" && l && v && n + v >= 0 && i + l >= 0 && n + v < f && i + l < h && (r[o] < u && (u = r[o]), r[o] > m && (m = r[o]));
        }
      var c = i * f + n;
      if (typeof a == "number") {
        var d = (m - u) * 0.5, y = u + d;
        m = y + d * a, u = y - d * a;
      }
      t[c] = r[c] > m ? m : r[c] < u ? u : r[c];
    }
  for (var M = 0, S = r.length; M < S; M++)
    r[M] = t[M];
};
g.Step = function(r, e) {
  var a = 0, t = 0, n = r.length, f = Math.floor(n / e), h = new Array(n), i = new Array(e);
  for (typeof e > "u" && (e = Math.floor(Math.pow(n * 0.5, 0.25))), a = 0; a < n; a++)
    h[a] = r[a];
  for (h.sort(function(o, c) {
    return o - c;
  }), a = 0; a < e; a++) {
    var m = h.slice(a * f, (a + 1) * f), u = 0, l = m.length;
    for (t = 0; t < l; t++)
      u += m[t];
    i[a] = {
      min: m[0],
      max: m[m.length - 1],
      avg: u / l
    };
  }
  for (a = 0; a < n; a++) {
    var v = r[a];
    for (t = 0; t < e; t++)
      if (v >= i[t].min && v <= i[t].max) {
        r[a] = i[t].avg;
        break;
      }
  }
};
g.Turbulence = function(r, e) {
  for (var a = e.maxHeight - e.minHeight, t = 0, n = r.length; t < n; t++)
    r[t] = e.minHeight + Math.abs((r[t] - e.minHeight) * 2 - a);
};
const j = {
  seed: function(r) {
    r > 0 && r < 1 && (r *= 65536), r = Math.floor(r), r < 256 && (r |= r << 8);
    for (var e = 0; e < 256; e++) {
      var a;
      e & 1 ? a = oe[e] ^ r & 255 : a = oe[e] ^ r >> 8 & 255, B[e] = B[e + 256] = a, L[e] = L[e + 256] = He[a % 12];
    }
  },
  simplex: function(r, e) {
    var a, t, n, f = (r + e) * we, h = Math.floor(r + f), i = Math.floor(e + f), m = (h + i) * p, u = r - h + m, l = e - i + m, v, o;
    u > l ? (v = 1, o = 0) : (v = 0, o = 1);
    var c = u - v + p, d = l - o + p, y = u - 1 + 2 * p, M = l - 1 + 2 * p;
    h &= 255, i &= 255;
    var S = L[h + B[i]], s = L[h + v + B[i + o]], x = L[h + 1 + B[i + 1]], H = 0.5 - u * u - l * l;
    H < 0 ? a = 0 : (H *= H, a = H * H * S.dot2(u, l));
    var b = 0.5 - c * c - d * d;
    b < 0 ? t = 0 : (b *= b, t = b * b * s.dot2(c, d));
    var I = 0.5 - y * y - M * M;
    return I < 0 ? n = 0 : (I *= I, n = I * I * x.dot2(y, M)), 70 * (a + t + n);
  },
  perlin: function(r, e) {
    var a = Math.floor(r), t = Math.floor(e);
    r = r - a, e = e - t, a = a & 255, t = t & 255;
    var n = L[a + B[t]].dot2(r, e), f = L[a + B[t + 1]].dot2(r, e - 1), h = L[a + 1 + B[t]].dot2(r - 1, e), i = L[a + 1 + B[t + 1]].dot2(r - 1, e - 1), m = ve(r);
    return he(
      he(n, h, m),
      he(f, i, m),
      ve(e)
    );
  },
  simplex3: function(r, e, a) {
    var t, n, f, h, i = (r + e + a) * Ie, m = Math.floor(r + i), u = Math.floor(e + i), l = Math.floor(a + i), v = (m + u + l) * Y, o = r - m + v, c = e - u + v, d = a - l + v, y, M, S, s, x, H;
    o >= c ? c >= d ? (y = 1, M = 0, S = 0, s = 1, x = 1, H = 0) : o >= d ? (y = 1, M = 0, S = 0, s = 1, x = 0, H = 1) : (y = 0, M = 0, S = 1, s = 1, x = 0, H = 1) : c < d ? (y = 0, M = 0, S = 1, s = 0, x = 1, H = 1) : o < d ? (y = 0, M = 1, S = 0, s = 0, x = 1, H = 1) : (y = 0, M = 1, S = 0, s = 1, x = 1, H = 0);
    var b = o - y + Y, I = c - M + Y, q = d - S + Y, A = o - s + 2 * Y, V = c - x + 2 * Y, T = d - H + 2 * Y, C = o - 1 + 3 * Y, F = c - 1 + 3 * Y, R = d - 1 + 3 * Y;
    m &= 255, u &= 255, l &= 255;
    var O = L[m + B[u + B[l]]], G = L[m + y + B[u + M + B[l + S]]], X = L[m + s + B[u + x + B[l + H]]], Q = L[m + 1 + B[u + 1 + B[l + 1]]], N = 0.6 - o * o - c * c - d * d;
    N < 0 ? t = 0 : (N *= N, t = N * N * O.dot3(o, c, d));
    var z = 0.6 - b * b - I * I - q * q;
    z < 0 ? n = 0 : (z *= z, n = z * z * G.dot3(b, I, q));
    var U = 0.6 - A * A - V * V - T * T;
    U < 0 ? f = 0 : (U *= U, f = U * U * X.dot3(A, V, T));
    var _ = 0.6 - C * C - F * F - R * R;
    return _ < 0 ? h = 0 : (_ *= _, h = _ * _ * Q.dot3(C, F, R)), 32 * (t + n + f + h);
  },
  // Add the expected noise2D and noise3D functions
  noise2D: function(r, e) {
    return this.perlin(r, e);
  },
  noise3D: function(r, e, a) {
    return this.simplex3(r, e, a);
  }
}, oe = [
  151,
  160,
  137,
  91,
  90,
  15,
  131,
  13,
  201,
  95,
  96,
  53,
  194,
  233,
  7,
  225,
  140,
  36,
  103,
  30,
  69,
  142,
  8,
  99,
  37,
  240,
  21,
  10,
  23,
  190,
  6,
  148,
  247,
  120,
  234,
  75,
  0,
  26,
  197,
  62,
  94,
  252,
  219,
  203,
  117,
  35,
  11,
  32,
  57,
  177,
  33,
  88,
  237,
  149,
  56,
  87,
  174,
  20,
  125,
  136,
  171,
  168,
  68,
  175,
  74,
  165,
  71,
  134,
  139,
  48,
  27,
  166,
  77,
  146,
  158,
  231,
  83,
  111,
  229,
  122,
  60,
  211,
  133,
  230,
  220,
  105,
  92,
  41,
  55,
  46,
  245,
  40,
  244,
  102,
  143,
  54,
  65,
  25,
  63,
  161,
  1,
  216,
  80,
  73,
  209,
  76,
  132,
  187,
  208,
  89,
  18,
  169,
  200,
  196,
  135,
  130,
  116,
  188,
  159,
  86,
  164,
  100,
  109,
  198,
  173,
  186,
  3,
  64,
  52,
  217,
  226,
  250,
  124,
  123,
  5,
  202,
  38,
  147,
  118,
  126,
  255,
  82,
  85,
  212,
  207,
  206,
  59,
  227,
  47,
  16,
  58,
  17,
  182,
  189,
  28,
  42,
  223,
  183,
  170,
  213,
  119,
  248,
  152,
  2,
  44,
  154,
  163,
  70,
  221,
  153,
  101,
  155,
  167,
  43,
  172,
  9,
  129,
  22,
  39,
  253,
  19,
  98,
  108,
  110,
  79,
  113,
  224,
  232,
  178,
  185,
  112,
  104,
  218,
  246,
  97,
  228,
  251,
  34,
  242,
  193,
  238,
  210,
  144,
  12,
  191,
  179,
  162,
  241,
  81,
  51,
  145,
  235,
  249,
  14,
  239,
  107,
  49,
  192,
  214,
  31,
  181,
  199,
  106,
  157,
  184,
  84,
  204,
  176,
  115,
  121,
  50,
  45,
  127,
  4,
  150,
  254,
  138,
  236,
  205,
  93,
  222,
  114,
  67,
  29,
  24,
  72,
  243,
  141,
  128,
  195,
  78,
  66,
  215,
  61,
  156,
  180
], B = new Array(512), L = new Array(512), He = [
  new E(1, 1, 0),
  new E(-1, 1, 0),
  new E(1, -1, 0),
  new E(-1, -1, 0),
  new E(1, 0, 1),
  new E(-1, 0, 1),
  new E(1, 0, -1),
  new E(-1, 0, -1),
  new E(0, 1, 1),
  new E(0, -1, 1),
  new E(0, 1, -1),
  new E(0, -1, -1)
];
function E(r, e, a) {
  this.x = r, this.y = e, this.z = a;
}
E.prototype.dot2 = function(r, e) {
  return this.x * r + this.y * e;
};
E.prototype.dot3 = function(r, e, a) {
  return this.x * r + this.y * e + this.z * a;
};
function ve(r) {
  return r * r * r * (r * (r * 6 - 15) + 10);
}
function he(r, e, a) {
  return (1 - a) * r + a * e;
}
const we = 0.5 * (Math.sqrt(3) - 1), p = (3 - Math.sqrt(3)) / 6, Ie = 1 / 3, Y = 1 / 6;
j.seed(Math.random());
console.log("TerrainNS in generators.js:", g);
g.MultiPass = function(r, e, a) {
  var t = {};
  for (var n in e)
    e.hasOwnProperty(n) && (t[n] = e[n]);
  for (var f = e.maxHeight - e.minHeight, h = 0, i = a.length; h < i; h++) {
    var m = typeof a[h].amplitude > "u" ? 1 : a[h].amplitude, u = 0.5 * (f - f * m);
    t.maxHeight = e.maxHeight - u, t.minHeight = e.minHeight + u, t.frequency = typeof a[h].frequency > "u" ? e.frequency : a[h].frequency, a[h].method(r, t);
  }
};
g.Curve = function(r, e, a) {
  for (var t = (e.maxHeight - e.minHeight) * 0.5, n = e.frequency / (Math.min(e.xSegments, e.ySegments) + 1), f = 0, h = e.xSegments + 1, i = e.ySegments + 1; f < h; f++)
    for (var m = 0; m < i; m++)
      r[m * h + f] += a(f * n, m * n) * t;
};
g.Cosine = function(r, e) {
  for (var a = (e.maxHeight - e.minHeight) * 0.5, t = e.frequency * Math.PI / (Math.min(e.xSegments, e.ySegments) + 1), n = Math.random() * Math.PI * 2, f = 0, h = e.xSegments + 1; f < h; f++)
    for (var i = 0, m = e.ySegments + 1; i < m; i++)
      r[i * h + f] += a * (Math.cos(f * t + n) + Math.cos(i * t + n));
};
g.CosineLayers = function(r, e) {
  g.MultiPass(r, e, [
    { method: g.Cosine, frequency: 2.5 },
    { method: g.Cosine, amplitude: 0.1, frequency: 12 },
    { method: g.Cosine, amplitude: 0.05, frequency: 15 },
    { method: g.Cosine, amplitude: 0.025, frequency: 20 }
  ]);
};
g.DiamondSquare = function(r, e) {
  var a = g.ceilPowerOfTwo(Math.max(e.xSegments, e.ySegments) + 1);
  console.log("Generating Diamond-Square terrain with segments:", a), console.log("Height range:", e.minHeight, "to", e.maxHeight);
  var t = a + 1, n = [], f = e.maxHeight - e.minHeight, h, i, m = e.xSegments + 1, u = e.ySegments + 1;
  for (h = 0; h <= a; h++)
    n[h] = new Float64Array(a + 1);
  var l = (e.maxHeight - e.minHeight) * 0.1;
  n[0][0] = Math.random() * l, n[0][a] = Math.random() * l, n[a][0] = Math.random() * l, n[a][a] = Math.random() * l;
  for (var v = a; v >= 2; v /= 2) {
    var o = Math.round(v * 0.5), c = Math.round(v), d, y, M, S;
    for (f /= 2, d = 0; d < a; d += c)
      for (y = 0; y < a; y += c)
        S = Math.random() * f * 2 - f, M = n[d][y] + // top left
        n[d + c][y] + // top right
        n[d][y + c] + // bottom left
        n[d + c][y + c], M *= 0.25, n[d + o][y + o] = M + S;
    for (d = 0; d < a; d += o)
      for (y = (d + o) % v; y < a; y += v)
        S = Math.random() * f * 2 - f, M = n[(d - o + t) % t][y] + // middle left
        n[(d + o) % t][y] + // middle right
        n[d][(y + o) % t] + // middle top
        n[d][(y - o + t) % t], M *= 0.25, M += S, n[d][y] = M, d === 0 && (n[a][y] = M), y === 0 && (n[d][a] = M);
  }
  for (h = 0; h < m; h++)
    for (i = 0; i < u; i++)
      r[i * m + h] += n[h][i];
  var s = 1 / 0, x = -1 / 0;
  for (h = 0; h < r.length; h++)
    r[h] < s && (s = r[h]), r[h] > x && (x = r[h]);
  console.log("Diamond-Square terrain generated, height range:", s, "to", x);
};
g.Fault = function(r, e) {
  for (var a = Math.sqrt(e.xSegments * e.xSegments + e.ySegments * e.ySegments), t = a * e.frequency, n = (e.maxHeight - e.minHeight) * 0.5, f = n / t, h = Math.min(e.xSize / e.xSegments, e.ySize / e.ySegments) * e.frequency, i = 0; i < t; i++)
    for (var m = Math.random(), u = Math.sin(m * Math.PI * 2), l = Math.cos(m * Math.PI * 2), v = Math.random() * a - a * 0.5, o = 0, c = e.xSegments + 1; o < c; o++)
      for (var d = 0, y = e.ySegments + 1; d < y; d++) {
        var M = u * o + l * d - v;
        M > h ? r[d * c + o] += f : M < -h ? r[d * c + o] -= f : r[d * c + o] += Math.cos(M / h * Math.PI * 2) * f;
      }
};
g.Hill = function(r, e, a, t) {
  var n = e.frequency * 2, f = n * n * 10, h = e.maxHeight - e.minHeight, i = h / (n * n), m = h / n, u = Math.min(e.xSize, e.ySize), l = u / (n * n), v = u / n;
  a = a || g.Influences.Hill;
  for (var o = { x: 0, y: 0 }, c = 0; c < f; c++) {
    var d = Math.random() * (v - l) + l, y = Math.random() * (m - i) + i;
    e.xSize + d, e.ySize + d, o.x = Math.random(), o.y = Math.random(), typeof t == "function" && t(o), g.Influence(
      r,
      e,
      a,
      o.x,
      o.y,
      d,
      y,
      w.AdditiveBlending,
      g.EaseInStrong
    );
  }
};
g.HillIsland = /* @__PURE__ */ function() {
  var r = function(e) {
    var a = Math.random() * Math.PI * 2;
    e.x = 0.5 + Math.cos(a) * e.x * 0.4, e.y = 0.5 + Math.sin(a) * e.y * 0.4;
  };
  return function(e, a, t) {
    g.Hill(e, a, t, r);
  };
}();
(function() {
  function r(e, a, t, n, f) {
    for (var h = t * n + a, i = 0; i < 3; i++) {
      var m = Math.floor(Math.random() * 8);
      switch (m) {
        case 0:
          a++;
          break;
        case 1:
          a--;
          break;
        case 2:
          t++;
          break;
        case 3:
          t--;
          break;
        case 4:
          a++, t++;
          break;
        case 5:
          a++, t--;
          break;
        case 6:
          a--, t++;
          break;
        case 7:
          a--, t--;
          break;
      }
      var u = t * n + a;
      if (typeof e[u] < "u") {
        if (e[u] < e[h]) {
          r(e, a, t, n, f);
          return;
        }
      } else if (Math.random() < 0.2) {
        e[h] += f;
        return;
      }
    }
    e[h] += f;
  }
  g.Particles = function(e, a) {
    for (var t = Math.sqrt(a.xSegments * a.xSegments + a.ySegments * a.ySegments) * a.frequency * 300, n = a.xSegments + 1, f = (a.maxHeight - a.minHeight) / t * 1e3, h = Math.floor(Math.random() * a.xSegments), i = Math.floor(Math.random() * a.ySegments), m = Math.random() * 0.2 - 0.1, u = Math.random() * 0.2 - 0.1, l = 0; l < t; l++) {
      r(e, h, i, n, f);
      var v = Math.random() * Math.PI * 2;
      l % 1e3 === 0 && (m = Math.random() * 0.2 - 0.1, u = Math.random() * 0.2 - 0.1), l % 100 === 0 && (h = Math.floor(a.xSegments * (0.5 + m) + Math.cos(v) * Math.random() * a.xSegments * (0.5 - Math.abs(m))), i = Math.floor(a.ySegments * (0.5 + u) + Math.sin(v) * Math.random() * a.ySegments * (0.5 - Math.abs(u))));
    }
  };
})();
g.Perlin = function(r, e) {
  j.seed(Math.random());
  var a = (e.maxHeight - e.minHeight) * 0.5, t = (Math.min(e.xSegments, e.ySegments) + 1) / e.frequency;
  console.log("Generating Perlin noise terrain with range:", a, "divisor:", t);
  for (var n = 0, f = e.xSegments + 1, h = e.ySegments + 1; n < f; n++)
    for (var i = 0; i < h; i++) {
      var m = i * f + n, u = j.perlin(n / t, i / t);
      r[m] += u * a;
    }
  for (var l = 1 / 0, v = -1 / 0, n = 0; n < r.length; n++)
    r[n] < l && (l = r[n]), r[n] > v && (v = r[n]);
  console.log("Perlin noise terrain generated, height range:", l, "to", v);
};
g.PerlinDiamond = function(r, e) {
  g.MultiPass(r, e, [
    { method: g.Perlin },
    { method: g.DiamondSquare, amplitude: 0.75 },
    { method: function(a, t) {
      return g.SmoothMedian(a, t);
    } }
  ]);
};
g.PerlinLayers = function(r, e) {
  g.MultiPass(r, e, [
    { method: g.Perlin, frequency: 1.25 },
    { method: g.Perlin, amplitude: 0.05, frequency: 2.5 },
    { method: g.Perlin, amplitude: 0.35, frequency: 5 },
    { method: g.Perlin, amplitude: 0.15, frequency: 10 }
  ]);
};
g.Simplex = function(r, e) {
  j.seed(Math.random());
  for (var a = (e.maxHeight - e.minHeight) * 0.5, t = (Math.min(e.xSegments, e.ySegments) + 1) * 2 / e.frequency, n = 0, f = e.xSegments + 1; n < f; n++)
    for (var h = 0, i = e.ySegments + 1; h < i; h++)
      r[h * f + n] += j.simplex(n / t, h / t) * a;
};
g.SimplexLayers = function(r, e) {
  g.MultiPass(r, e, [
    { method: g.Simplex, frequency: 1.25 },
    { method: g.Simplex, amplitude: 0.5, frequency: 2.5 },
    { method: g.Simplex, amplitude: 0.25, frequency: 5 },
    { method: g.Simplex, amplitude: 0.125, frequency: 10 },
    { method: g.Simplex, amplitude: 0.0625, frequency: 20 }
  ]);
};
(function() {
  function r(e, a, t, n, f, h) {
    if (!(t > n)) {
      var i = 0, m = 0, u = n, l = n, v = Math.floor(n / t), o = -v, c = -v;
      for (i = 0; i <= u; i += v) {
        for (m = 0; m <= l; m += v) {
          var d = m * u + i;
          if (h[d] = Math.random() * f, !(o < 0 && c < 0)) {
            for (var y = h[d], M = h[m * u + (i - v)] || y, S = h[(m - v) * u + i] || y, s = h[(m - v) * u + (i - v)] || y, x = o; x < i; x++)
              for (var H = c; H < m; H++)
                if (!(x === o && H === c)) {
                  var b = H * u + x;
                  if (!(b < 0)) {
                    var I = (x - o) / v, q = (H - c) / v, A = I * S + (1 - I) * s, V = I * y + (1 - I) * M;
                    h[b] = q * V + (1 - q) * A;
                  }
                }
            c = m;
          }
        }
        o = i, c = -v;
      }
      for (i = 0, u = a.xSegments + 1; i < u; i++)
        for (m = 0, l = a.ySegments + 1; m < l; m++) {
          var T = m * u + i, C = m * n + i;
          e[T] += h[C];
        }
    }
  }
  g.Value = function(e, a) {
    for (var t = g.ceilPowerOfTwo(Math.max(a.xSegments, a.ySegments) + 1), n = new Float64Array((t + 1) * (t + 1)), f = a.maxHeight - a.minHeight, h = 2; h < 7; h++)
      r(e, a, Math.pow(2, h), t, f * Math.pow(2, 2.4 - h * 1.2), n);
    g.Clamp(e, {
      maxHeight: a.maxHeight,
      minHeight: a.minHeight,
      stretch: true
    });
  };
})();
g.Weierstrass = function(r, e) {
  for (var a = (e.maxHeight - e.minHeight) * 0.5, t = Math.random() < 0.5 ? 1 : -1, n = Math.random() < 0.5 ? 1 : -1, f = 0.5 + Math.random() * 1, h = 0.5 + Math.random() * 1, i = 0.025 + Math.random() * 0.1, m = -1 + Math.random() * 2, u = 0.5 + Math.random() * 1, l = 0.5 + Math.random() * 1, v = 0.025 + Math.random() * 0.1, o = -1 + Math.random() * 2, c = 0, d = e.xSegments + 1; c < d; c++)
    for (var y = 0, M = e.ySegments + 1; y < M; y++) {
      for (var S = 0, s = 0; s < 20; s++) {
        var x = Math.pow(1 + f, -s) * Math.sin(Math.pow(1 + h, s) * (c + 0.25 * Math.cos(y) + m * y) * i), H = Math.pow(1 + u, -s) * Math.sin(Math.pow(1 + l, s) * (y + 0.25 * Math.cos(c) + o * c) * v);
        S -= Math.exp(t * x * x + n * H * H);
      }
      r[y * d + c] += S * a;
    }
  g.Clamp(r, e);
};
g.fromHeightmap = function(r, e, a) {
  var t = document.createElement("canvas"), n = t.getContext("2d"), f = e.ySegments + 1, h = e.xSegments + 1, i = e.maxHeight - e.minHeight;
  t.width = h, t.height = f;
  var m = a || e.heightmap;
  if (!m) {
    console.error("No heightmap image provided");
    return;
  }
  n.drawImage(m, 0, 0, t.width, t.height);
  var u = n.getImageData(0, 0, t.width, t.height).data;
  console.log("Processing heightmap image, dimensions:", t.width, "x", t.height), console.log("Height range:", e.minHeight, "to", e.maxHeight, "spread:", i);
  for (var l = 0; l < f; l++)
    for (var v = 0; v < h; v++) {
      var o = l * h + v, c = o * 4;
      r[o] = (u[c] + u[c + 1] + u[c + 2]) / 765 * i + e.minHeight;
    }
  for (var d = 1 / 0, y = -1 / 0, o = 0; o < r.length; o++)
    r[o] < d && (d = r[o]), r[o] > y && (y = r[o]);
  console.log("Heightmap processed, resulting height range:", d, "to", y);
};
g.toHeightmap = function(r, e) {
  var a = typeof e.maxHeight < "u", t = typeof e.minHeight < "u", n = a ? e.maxHeight : -1 / 0, f = t ? e.minHeight : 1 / 0;
  if (!a || !t) {
    for (var h = n, i = f, m = 2, u = r.length; m < u; m += 3)
      r[m] > h && (h = r[m]), r[m] < i && (i = r[m]);
    a || (n = h), t || (f = i);
  }
  var l = e.heightmap instanceof HTMLCanvasElement ? e.heightmap : document.createElement("canvas"), v = l.getContext("2d"), o = e.ySegments + 1, c = e.xSegments + 1, d = n - f;
  l.width = c, l.height = o;
  for (var y = v.createImageData(l.width, l.height), M = y.data, S = 0; S < o; S++)
    for (var s = 0; s < c; s++) {
      var x = S * c + s, H = x * 4;
      M[H] = M[H + 1] = M[H + 2] = Math.round((r[x * 3 + 2] - f) / d * 255), M[H + 3] = 255;
    }
  return v.putImageData(y, 0, 0), l;
};
g.fromHeightmap = function(r, e, a) {
  var t = document.createElement("canvas"), n = t.getContext("2d"), f = e.ySegments + 1, h = e.xSegments + 1, i = e.maxHeight - e.minHeight;
  t.width = h, t.height = f, n.drawImage(a, 0, 0, t.width, t.height);
  for (var m = n.getImageData(0, 0, t.width, t.height).data, u = 0; u < f; u++)
    for (var l = 0; l < h; l++) {
      var v = u * h + l, o = v * 4;
      r[v] = (m[o] + m[o + 1] + m[o + 2]) / 765 * i + e.minHeight;
    }
  g.Clamp(r, {
    maxHeight: e.maxHeight,
    minHeight: e.minHeight,
    stretch: true
  });
};
g.fromHeightmapURL = function(r, e, a) {
  return new Promise(function(t, n) {
    var f = new Image();
    f.crossOrigin = "anonymous", f.onload = function() {
      g.fromHeightmap(r, e, f), t(r, e, f);
    }, f.src = a;
  });
};
g.heightmapArray = function(r, e) {
  return new Promise(function(a, t) {
    var n = new Image();
    n.crossOrigin = "anonymous", n.onload = function() {
      var f = document.createElement("canvas"), h = f.getContext("2d"), i = r.ySegments + 1, m = r.xSegments + 1, u = r.maxHeight - r.minHeight;
      f.width = m, f.height = i, h.drawImage(n, 0, 0, f.width, f.height);
      for (var l = h.getImageData(0, 0, f.width, f.height).data, v = new Float32Array(i * m), o = 0; o < i; o++)
        for (var c = 0; c < m; c++) {
          var d = o * m + c, y = d * 4;
          v[d] = (l[y] + l[y + 1] + l[y + 2]) / 765 * u + r.minHeight;
        }
      g.Clamp(v, {
        maxHeight: r.maxHeight,
        minHeight: r.minHeight,
        stretch: true
      }), a(v);
    }, n.src = e;
  });
};
g.Influences = {
  /**
   * Raise the terrain in a circular fashion.
   *
   * @param {Number} x
   *   The normalized distance of the vertex from the center of the terrain
   *   in the X direction.
   * @param {Number} y
   *   The normalized distance of the vertex from the center of the terrain
   *   in the Y direction.
   *
   * @return {Number}
   *   The adjusted elevation at that point.
   */
  Hill: function(r, e) {
    return Math.sqrt(r * r + e * e) * -1 + 1;
  },
  /**
   * Raise the terrain in a ripple-like manner.
   *
   * @param {Number} x
   *   The normalized distance of the vertex from the center of the terrain
   *   in the X direction.
   * @param {Number} y
   *   The normalized distance of the vertex from the center of the terrain
   *   in the Y direction.
   * @param {Number} [frequency=2.5]
   *   The frequency of the ripples.
   * @param {Number} [amplitude=0.5]
   *   The amplitude of the ripples.
   * @param {Number} [phase=0]
   *   How far into the ripple we are.
   *
   * @return {Number}
   *   The adjusted elevation at that point.
   */
  Ripple: function(r, e, a, t, n) {
    a = typeof a > "u" ? 2.5 : a, t = typeof t > "u" ? 0.5 : t, n = typeof n > "u" ? 0 : n;
    var f = Math.sqrt(r * r + e * e), h = f * a * Math.PI - n;
    return Math.sin(h) * t;
  },
  /**
   * Produce spiky terrain.
   *
   * @param {Number} x
   *   The normalized distance of the vertex from the center of the terrain
   *   in the X direction.
   * @param {Number} y
   *   The normalized distance of the vertex from the center of the terrain
   *   in the Y direction.
   * @param {Number} [frequency=2.5]
   *   The frequency of the ripples.
   * @param {Number} [amplitude=0.5]
   *   The amplitude of the ripples.
   * @param {Number} [phase=0]
   *   How far into the ripple we are.
   *
   * @return {Number}
   *   The adjusted elevation at that point.
   */
  Spike: function(r, e, a, t, n) {
    a = typeof a > "u" ? 2.5 : a, t = typeof t > "u" ? 0.5 : t, n = typeof n > "u" ? 0 : n;
    var f = Math.sqrt(r * r + e * e), h = f * a * Math.PI - n;
    return Math.pow(Math.sin(h), 2) * t;
  },
  /**
   * A stepwise function that creates a platform-like appearance.
   *
   * @param {Number} x
   *   The normalized distance of the vertex from the center of the terrain
   *   in the X direction.
   * @param {Number} y
   *   The normalized distance of the vertex from the center of the terrain
   *   in the Y direction.
   * @param {Number} [levels=4]
   *   The number of distinct levels.
   *
   * @return {Number}
   *   The adjusted elevation at that point.
   */
  Platforms: function(r, e, a) {
    a = typeof a > "u" ? 4 : a;
    var t = Math.sqrt(r * r + e * e);
    return Math.floor(t * a) / a;
  },
  /**
   * A stepwise version of the Hill function.
   *
   * @param {Number} x
   *   The normalized distance of the vertex from the center of the terrain
   *   in the X direction.
   * @param {Number} y
   *   The normalized distance of the vertex from the center of the terrain
   *   in the Y direction.
   * @param {Number} [levels=4]
   *   The number of distinct levels.
   *
   * @return {Number}
   *   The adjusted elevation at that point.
   */
  Steps: function(r, e, a) {
    a = typeof a > "u" ? 4 : a;
    var t = g.Influences.Hill(r, e);
    return Math.floor(t * a) / a;
  },
  /**
   * Raise the terrain in a circular fashion.
   *
   * @param {Number} x
   *   The normalized distance of the vertex from the center of the terrain
   *   in the X direction.
   * @param {Number} y
   *   The normalized distance of the vertex from the center of the terrain
   *   in the Y direction.
   *
   * @return {Number}
   *   The adjusted elevation at that point.
   */
  Mesa: function(r, e) {
    var a = Math.sqrt(r * r + e * e);
    return 1.25 * Math.min(0.8, Math.exp(-(a * a)));
  },
  /**
   * Lower the terrain in a circular fashion.
   *
   * @param {Number} x
   *   The normalized distance of the vertex from the center of the terrain
   *   in the X direction.
   * @param {Number} y
   *   The normalized distance of the vertex from the center of the terrain
   *   in the Y direction.
   *
   * @return {Number}
   *   The adjusted elevation at that point.
   */
  Hole: function(r, e) {
    return -g.Influences.Mesa(r, e);
  },
  /**
   * Create a valley.
   *
   * @param {Number} x
   *   The normalized distance of the vertex from the center of the terrain
   *   in the X direction.
   * @param {Number} y
   *   The normalized distance of the vertex from the center of the terrain
   *   in the Y direction.
   *
   * @return {Number}
   *   The adjusted elevation at that point.
   */
  Valley: function(r, e) {
    return -g.Influences.Hill(r, e);
  },
  /**
   * Create a dome-shaped terrain feature.
   *
   * @param {Number} x
   *   The normalized distance of the vertex from the center of the terrain
   *   in the X direction.
   * @param {Number} y
   *   The normalized distance of the vertex from the center of the terrain
   *   in the Y direction.
   *
   * @return {Number}
   *   The adjusted elevation at that point.
   */
  Dome: function(r, e) {
    var a = Math.sqrt(r * r + e * e);
    return -(a + 1) * (a - 1);
  },
  /**
   * Create a flat terrain feature.
   *
   * @param {Number} x
   *   The normalized distance of the vertex from the center of the terrain
   *   in the X direction.
   * @param {Number} y
   *   The normalized distance of the vertex from the center of the terrain
   *   in the Y direction.
   *
   * @return {Number}
   *   The adjusted elevation at that point.
   */
  Flat: function(r, e) {
    return 0;
  },
  /**
   * Create a volcano-shaped terrain feature.
   *
   * @param {Number} x
   *   The normalized distance of the vertex from the center of the terrain
   *   in the X direction.
   * @param {Number} y
   *   The normalized distance of the vertex from the center of the terrain
   *   in the Y direction.
   *
   * @return {Number}
   *   The adjusted elevation at that point.
   */
  Volcano: function(r, e) {
    var a = Math.sqrt(r * r + e * e);
    return 0.94 - 0.32 * (Math.abs(2 * a) + Math.cos(2 * Math.PI * Math.abs(a) + 0.4));
  }
};
g.Influence = function(r, e, a, t, n, f, h, i, m) {
  a = a || g.Influences.Hill, t = typeof t > "u" ? 0.5 : t, n = typeof n > "u" ? 0.5 : n, f = typeof f > "u" ? 64 : f, h = typeof h > "u" ? 64 : h, i = typeof i > "u" ? w.NormalBlending : i, m = m || g.EaseIn;
  for (var u = e.xSegments + 1, l = e.ySegments + 1, v = u * t, o = l * n, c = e.xSize / e.xSegments, d = e.ySize / e.ySegments, y = f / c, M = f / d, S = 1 / f, s = Math.ceil(v - y), x = Math.floor(v + y), H = Math.ceil(o - M), b = Math.floor(o + M), I = s; I < x; I++)
    for (var q = H; q < b; q++) {
      var A = q * u + I, V = (I - v) * c, T = (q - o) * d, C = Math.sqrt(V * V + T * T), F = C * S, R = V * S, O = T * S, G = a(F, R, O) * h * (1 - m(F, R, O));
      C > f || typeof r[A] > "u" || (i === w.AdditiveBlending ? r[A] += G : i === w.SubtractiveBlending ? r[A] -= G : i === w.MultiplyBlending ? r[A] *= G : i === w.NoBlending ? r[A] = G : i === w.NormalBlending ? r[A] = m(F, R, O) * r[A] + G : typeof i == "function" && (r[A] = i(r[A].z, G, F, R, O)));
    }
};
g.normalize = function(r, e) {
};
g.applyInfluence = function(r, e, a, t) {
  for (var n = e.xSegments + 1, f = e.ySegments + 1, h = a, i = 0; i < n; i++)
    for (var m = (i - e.xSegments * 0.5) / e.xSegments, u = 0; u < f; u++) {
      var l = (u - e.ySegments * 0.5) / e.ySegments;
      r[u * n + i] += h(m, l, t);
    }
};
g.multiplyInfluence = function(r, e, a, t) {
  for (var n = e.xSegments + 1, f = e.ySegments + 1, h = a, i = 0; i < n; i++)
    for (var m = (i - e.xSegments * 0.5) / e.xSegments, u = 0; u < f; u++) {
      var l = (u - e.ySegments * 0.5) / e.ySegments;
      r[u * n + i] *= h(m, l, t);
    }
};
g.applyEasing = function(r, e, a, t) {
  for (var n = e.xSegments + 1, f = e.ySegments + 1, h = a, i = e.maxHeight, m = e.minHeight, u = 0; u < n; u++)
    for (var l = (u - e.xSegments * 0.5) / e.xSegments, v = 0; v < f; v++) {
      var o = v * n + u, c = (v - e.ySegments * 0.5) / e.ySegments, d = h(l, c, t);
      (d < 0 || d > 1) && console.warn("Curve value should be in the range [0, 1]"), r[o] = d * i + (1 - d) * m;
    }
};
g.setHeightByVertices = function(r, e, a, t) {
  for (var n = a.length, f = 0; f < n; f++)
    r[a[f]] = t;
};
g.Smooth = function(r, e, a) {
  var t = new Float32Array(r.length);
  a = a || 1;
  var n = e.xSegments + 1;
  e.ySegments + 1;
  for (var f, h, i, m = 0; m < a; m++) {
    for (var u = 0; u <= e.xSegments; u++)
      for (var l = 0; l <= e.ySegments; l++) {
        var i = l * n + u;
        t[i] = r[i];
      }
    for (var u = 0; u <= e.xSegments; u++)
      for (var l = 0; l <= e.ySegments; l++) {
        for (var v = 0, o = 0, c = -1; c <= 1; c++)
          for (var d = -1; d <= 1; d++)
            f = u + c, h = l + d, f >= 0 && f <= e.xSegments && h >= 0 && h <= e.ySegments && (i = h * n + f, v += t[i], o++);
        r[l * n + u] = v / o;
      }
  }
};
g.SmoothMedian = function(r, e) {
  var a = new Float32Array(r.length), t = e.xSegments + 1;
  e.ySegments + 1;
  for (var n, f, h, i = 0; i <= e.xSegments; i++)
    for (var m = 0; m <= e.ySegments; m++) {
      var h = m * t + i;
      a[h] = r[h];
    }
  for (var i = 0; i <= e.xSegments; i++)
    for (var m = 0; m <= e.ySegments; m++) {
      for (var u = [], l = -1; l <= 1; l++)
        for (var v = -1; v <= 1; v++)
          n = i + l, f = m + v, n >= 0 && n <= e.xSegments && f >= 0 && f <= e.ySegments && (h = f * t + n, u.push(a[h]));
      u.sort(), r[m * t + i] = u[Math.floor(u.length / 2)];
    }
};
g.SmoothConservative = function(r, e) {
  var a = new Float32Array(r.length), t = e.xSegments + 1;
  e.ySegments + 1;
  for (var n, f, h, i = 0; i <= e.xSegments; i++)
    for (var m = 0; m <= e.ySegments; m++) {
      var h = m * t + i;
      a[h] = r[h];
    }
  for (var i = 0; i <= e.xSegments; i++)
    for (var m = 0; m <= e.ySegments; m++) {
      for (var u = 1 / 0, l = -1 / 0, v = -1; v <= 1; v++)
        for (var o = -1; o <= 1; o++)
          n = i + v, f = m + o, n >= 0 && n <= e.xSegments && f >= 0 && f <= e.ySegments && (h = f * t + n, a[h] < u && (u = a[h]), a[h] > l && (l = a[h]));
      var c = m * t + i;
      a[c] < u ? r[c] = u : a[c] > l && (r[c] = l);
    }
};
g.Normalize = function(r, e) {
  for (var a = 1 / 0, t = -1 / 0, n = 0, f = r.length; n < f; n++)
    r[n] < a && (a = r[n]), r[n] > t && (t = r[n]);
  for (var h = e.maxHeight - e.minHeight, n = 0, f = r.length; n < f; n++)
    r[n] = (r[n] - a) / (t - a) * h + e.minHeight;
};
g.Turbulence = function(r, e, a) {
  a = a || 0;
  for (var t = (e.maxHeight - e.minHeight) * 0.5, n = e.xSegments + 1, f = e.ySegments + 1, h = 0; h < n; h++)
    for (var i = 0; i < f; i++) {
      var m = i * n + h;
      r[m] += a * (Math.random() - 0.5) * t;
    }
};
g.Clamp = function(r, e, a) {
  var t = 1 / 0, n = -1 / 0, f = r.length;
  e.minHeight = e.minHeight || 0, e.maxHeight = typeof e.maxHeight > "u" ? 100 : e.maxHeight, a = a || false;
  for (var h = 0; h < f; h++)
    r[h] < t && (t = r[h]), r[h] > n && (n = r[h]);
  if (a)
    for (var h = 0; h < f; h++)
      r[h] = (r[h] - t) / (n - t) * (e.maxHeight - e.minHeight) + e.minHeight;
  else
    for (var h = 0; h < f; h++)
      r[h] = r[h] < e.minHeight ? e.minHeight : r[h] > e.maxHeight ? e.maxHeight : r[h];
};
g.EaseInOut = function(r, e) {
  return e === 0 || r === 0 || r === 1 ? r : r < 0.5 ? Math.pow(2, (e + 1) * (r * 2 - 1) - e) * 0.5 : 1 - Math.pow(2, -((e + 1) * (r * 2 - 1) + e)) * 0.5;
};
g.EaseIn = function(r, e) {
  return r === 0 ? 0 : Math.pow(r, e);
};
g.EaseOut = function(r, e) {
  return r === 1 ? 1 : 1 - Math.pow(1 - r, e);
};
g.LinearTaper = function(r, e) {
  return Math.min(r * e, 1);
};
g.Identity = function(r) {
  return r;
};
g.EaseInStrong = function(r) {
  return r * r * r * r;
};
g.EaseOutStrong = function(r) {
  return 1 - Math.pow(1 - r, 4);
};
g.EaseNone = function(r) {
  return 0;
};
g.EaseSin = function(r) {
  return 1 - Math.sin((1 - r) * Math.PI * 0.5);
};
g.fromGenerator = function(r, e, a) {
  console.log("Creating terrain using generator " + e.generator);
  var t = g(e);
  return r.add(t), a && a(t), t;
};
g.Influence = function(r, e, a, t, n, f, h, i, m, u) {
  a = a || g.Influences.Hill, t = t || 0, n = n || 0, f = f || 64, h = h || 120, i = i || w.NormalBlending, m = m || g.EaseInOut, u = u || 3;
  for (var l = e.xSegments + 1, v = e.ySegments + 1, o = e.xSize / e.xSegments, c = e.ySize / e.ySegments, d = l * t - 0.5, y = v * n - 0.5, M = f / o, S = f / c, s = 0; s < l; s++)
    for (var x = 0; x < v; x++) {
      var H = x * l + s, b = Math.abs(s - d), I = Math.abs(x - y);
      if (!(b >= M || I >= S)) {
        var q = Math.sqrt(b * b + I * I) / Math.sqrt(M * M + S * S), A = 0;
        switch (i) {
          case w.SubtractiveBlending:
            A = r[H] - h * a(q, b / M, I / S) * m(1 - q, u);
            break;
          case w.AdditiveBlending:
          default:
            A = r[H] + h * a(q, b / M, I / S) * m(1 - q, u);
            break;
        }
        r[H] = A;
      }
    }
};
g.generateBlendedMaterial = function(r) {
  function e(s) {
    return s === (s | 0) ? s + ".0" : s + "";
  }
  for (var a = "", t = "", n = r[0].texture.repeat || new w.Vector2(1, 1), f = r[0].texture.offset || new w.Vector2(0, 0), h = 0, i = r.length; h < i; h++)
    if (r[h].texture.wrapS = r[h].texture.wrapT = w.RepeatWrapping, r[h].texture.needsUpdate = true, a += "uniform sampler2D texture_" + h + `;
`, h !== 0) {
      var m = r[h].levels, u = r[h].glsl, l = typeof m < "u", v = r[h].texture.repeat || new w.Vector2(1, 1), o = r[h].texture.offset || new w.Vector2(0, 0);
      if (l) {
        m[1] - m[0] < 1 && (m[0] -= 1), m[3] - m[2] < 1 && (m[3] += 1);
        for (var c = 0; c < m.length; c++)
          m[c] = e(m[c]);
      }
      var d = l ? "1.0 - smoothstep(" + m[0] + ", " + m[1] + ", vPosition.z) + smoothstep(" + m[2] + ", " + m[3] + ", vPosition.z)" : u;
      t += "        color = mix( texture2D( texture_" + h + ", MyvUv * vec2( " + e(v.x) + ", " + e(v.y) + " ) + vec2( " + e(o.x) + ", " + e(o.y) + " ) ), color, max(min(" + d + `, 1.0), 0.0));
`;
    }
  var y = `float slope = acos(max(min(dot(myNormal, vec3(0.0, 0.0, 1.0)), 1.0), -1.0));
    diffuseColor = vec4( diffuse, opacity );
    vec4 color = texture2D( texture_0, MyvUv * vec2( ` + e(n.x) + ", " + e(n.y) + " ) + vec2( " + e(f.x) + ", " + e(f.y) + ` ) ); // base
` + t + `    diffuseColor = color;
`, M = a + `
varying vec2 MyvUv;
varying vec3 vPosition;
varying vec3 myNormal;
`, S = new w.MeshLambertMaterial();
  return S.onBeforeCompile = function(s) {
    s.vertexShader = s.vertexShader.replace(
      "#include <common>",
      `varying vec2 MyvUv;
varying vec3 vPosition;
varying vec3 myNormal;
#include <common>`
    ), s.vertexShader = s.vertexShader.replace(
      "#include <uv_vertex>",
      `MyvUv = uv;
vPosition = position;
myNormal = normal;
#include <uv_vertex>`
    ), s.fragmentShader = s.fragmentShader.replace("#include <common>", M + `
#include <common>`), s.fragmentShader = s.fragmentShader.replace("#include <map_fragment>", y);
    for (var x = 0, H = r.length; x < H; x++)
      s.uniforms["texture_" + x] = {
        type: "t",
        value: r[x].texture
      };
  }, S;
};
g.ScatterMeshes = function(r, e) {
  r instanceof w.BufferGeometry && console.warn("The terrain's BufferGeometry was passed to ScatterMeshes. You probably want to pass the terrain mesh's Geometry instead."), (r.type === "PlaneGeometry" || r.type === "PlaneBufferGeometry") && console.warn("A plane geometry was passed to ScatterMeshes. You probably want to pass the terrain mesh's geometry instead."), e = e || {}, e.mesh = e.mesh || new w.Mesh(new w.BoxGeometry(0.5, 0.5, 0.5), new w.MeshBasicMaterial({ color: 8947848 })), e.spread = e.spread || 0.025, e.smoothSpread = e.smoothSpread || 0, e.sizeVariance = e.sizeVariance || 0.1, e.randomness = e.randomness || 1, e.maxSlope = e.maxSlope || Math.PI / 4, e.maxTilt = e.maxTilt || Math.PI / 4, e.w = e.w || 0, e.h = e.h || 0;
  var a = e.scene || new w.Object3D(), t = typeof e.spread == "number", n, f, h, i = (r.faces ? r.faces.length : r.index.count) * 0.85, m = {};
  (!e.w || !e.h) && yieldException("The width and height of the terrain in terms of segments must be passed to ScatterMeshes."), f = g.heightmapArray(r, e), t ? n = e.spread : (h = Math.random(), n = e.spread(f.min, f.max, h)), i *= n;
  var u = g.randomHeightIndices(f, i, e);
  return u.forEach(function(l) {
    var v, o, c, d, y, M = new w.Vector3(), S = new w.Vector3(), s = new w.Euler(0, 0, 0, "YXZ"), x = Math.random() * e.sizeVariance * 2 + 1 - e.sizeVariance, H = x;
    if (r.faces) {
      if (v = r.faces[l], o = r.vertices[v.a].clone(), c = r.vertices[v.b].clone(), d = r.vertices[v.c].clone(), v.normal.angleTo(g.toNormalVector(0, 1, 0)) > e.maxSlope)
        return;
      S.copy(v.normal);
    } else {
      if (l = l * 3, o = new w.Vector3().fromBufferAttribute(r.attributes.position, l), c = new w.Vector3().fromBufferAttribute(r.attributes.position, l + 1), d = new w.Vector3().fromBufferAttribute(r.attributes.position, l + 2), y = new w.Vector3().fromBufferAttribute(r.attributes.normal, l), y.angleTo(g.toNormalVector(0, 1, 0)) > e.maxSlope)
        return;
      S.copy(y);
    }
    var b = o.clone().add(c).add(d).divideScalar(3 * (e.w / 127)).round();
    if (!m[b]) {
      m[b] = true, M.copy(o).add(c).add(d).divideScalar(3), s.y = Math.random() * Math.PI * 2, e.maxTilt > 0 && (s.x = Math.random() * e.maxTilt * 2 - e.maxTilt, s.z = Math.random() * e.maxTilt * 2 - e.maxTilt);
      var I = e.mesh.clone();
      I.position.copy(M), I.rotation.copy(s), I.scale.set(H, H, H), I.updateMatrix(), a.add(I);
    }
  }), a;
};
g.randomHeightIndices = function(r, e, a) {
  for (var t = Math.floor(e), n = /* @__PURE__ */ new Map(), f = 0; n.size < t && f < t * 10; ) {
    var h = Math.floor(Math.random() * r.length), i = r[h];
    if (i > a.maxElevation || i < a.minElevation) {
      f++;
      continue;
    }
    n.set(h, h), f++;
  }
  return Array.from(n.values());
};
g.normalToXYCoordinates = function(r) {
  var e = 0, a = 0, t = 0;
  return r instanceof w.Vector3 ? (e = r.x, a = r.y, t = Math.sqrt(e * e + a * a), e /= t, a /= t, e = (e + 1) * 0.5, a = (a + 1) * 0.5) : (e = r[0], a = r[1], t = Math.sqrt(e * e + a * a), e /= t, a /= t, e = (e + 1) * 0.5, a = (a + 1) * 0.5), new w.Vector2(e, a);
};
g.toNormalVector = function(r, e, a) {
  var t = new w.Vector3(0, 1, 0), n;
  return typeof r < "u" && typeof e < "u" && typeof a < "u" && (n = new w.Vector3(r, e, a), t.copy(n).normalize()), t;
};
g.xyCoordinatesToNormal = function(r) {
  if (r instanceof w.Vector2)
    return new w.Vector3(2 * r.x - 1, 2 * r.y - 1, 0);
  if (r instanceof Array && r.length === 2)
    return new w.Vector3(2 * r[0] - 1, 2 * r[1] - 1, 0);
  if (r instanceof Array && r.length === 3)
    return new w.Vector3(2 * r[0] - 1, 2 * r[1] - 1, 2 * r[2] - 1);
};
g.heightmapArray = function(r, e) {
  var a = new Float32Array(e.w * e.h), t = 0;
  if (r.attributes && r.attributes.position)
    for (var n = r.attributes.position, f = 0; f < n.count; f++)
      t = f * 3, a[f] = n.array[t + 1];
  else if (r.vertices && r.faces)
    for (var h = r.vertices, f = 0, i = h.length; f < i; f++)
      a[f] = h[f].y;
  a.min = 1 / 0, a.max = -1 / 0;
  for (var f = 0, i = a.length; f < i; f++)
    a[f] < a.min && (a.min = a[f]), a[f] > a.max && (a.max = a[f]);
  return a;
};
g.Clamp = g.Clamp || {};
g.Clamp.index = function(r) {
  return r;
};
g.ScatterHelper = function(r, e, a, t) {
  if (console.log("ScatterHelper called with:", typeof r, e ? Object.keys(e) : "no options"), !r || !e)
    return console.warn("ScatterHelper called with invalid parameters"), r instanceof w.Vector3 ? false : function() {
      return [];
    };
  if (r instanceof w.Vector3)
    return !(r.x < 0 || r.x > (e.maxWidth || e.xSize || 1024) || r.z < 0 || r.z > (e.maxHeight || e.ySize || 1024) || typeof e.minElevation < "u" && typeof e.maxElevation < "u" && (r.y < e.minElevation || r.y > e.maxElevation));
  a = a || 1, t = t || 0.25;
  var n = {
    xSegments: e.xSegments || 63,
    ySegments: e.ySegments || 63,
    maxHeight: 1,
    minHeight: 0,
    frequency: e.frequency || 2.5,
    stretch: true
  };
  for (var f in e)
    e.hasOwnProperty(f) && !n.hasOwnProperty(f) && (n[f] = e[f]);
  return typeof r != "function" ? (console.warn("ScatterHelper: provided method is not a function"), function() {
    return [];
  }) : function() {
    try {
      for (var h = (n.xSegments + 1) * (n.ySegments + 1), i = new Float32Array(h * 3), m = 0; m < i.length; m++)
        i[m] = 0;
      r(i, n);
      for (var u = [], m = 2; m < i.length; m += 3)
        u.push(i[m]);
      for (var l = [], m = 0; m < u.length; m += a)
        l.push(u[m] > t ? 1 : 0);
      return l;
    } catch (v) {
      return console.error("Error in ScatterHelper noise generation:", v), [];
    }
  };
};
g.Analyze = function(r, e) {
  if (!r || !r.geometry || !r.geometry.attributes || !r.geometry.attributes.position || r.geometry.attributes.position.count < 3)
    return console.warn("Not enough vertices to analyze or invalid mesh"), ie();
  try {
    var a = r.geometry.clone();
    a.index && (a = a.toNonIndexed());
    var t = g.toArray1D(a.attributes.position.array);
    if (!t || t.length === 0)
      return console.warn("Could not extract elevations from geometry"), ie(e);
    var n = Array.from(t).sort(function(P, W) {
      return P - W;
    }), f = t.length, h = D(n, 1), i = D(n, 0), m = D(n, 0.5), u = ce(n), l = 0, v = 0, o = 0, c = 0, d = r.up.clone().applyAxisAngle(new w.Vector3(1, 0, 0), 0.5 * Math.PI), y = [];
    try {
      y = se(a, e).map(function(P) {
        return P.angleTo(d) * 180 / Math.PI;
      }).sort(function(P, W) {
        return P - W;
      });
    } catch (P) {
      console.warn("Error calculating slopes:", P), y = [0];
    }
    var M = y.length, S = D(y, 1), s = D(y, 0), x = D(y, 0.5), H = ce(y), b = r.position.clone().setZ(u), I, q;
    try {
      I = Se(a.attributes.position.array, b), q = I.angleTo(d) * 180 / Math.PI;
    } catch (P) {
      console.warn("Error calculating plane normal:", P), I = new w.Vector3(0, 0, 1), q = 0;
    }
    for (var A = 0, V = 0, T = 0, C = 0, F = e.xSize / e.xSegments * (e.ySize / e.ySegments) * 0.5, R = 0, O = 0, G = 0, X = new Float32Array(f), Q = new Float32Array(M), N = 0, z; N < f; N++)
      z = n[N] - u, l += z * z, v += z * z * z, X[N] = Math.abs(n[N] - m), o += X[N], c += z * z * z * z;
    for (f > 1 && (v = v / f / Math.pow(l / (f - 1), 1.5), o = (u - m) / (o / f || 1), c = c * f / (l * l || 1) - 3, l = Math.sqrt(l / f)), Array.prototype.sort.call(X, function(P, W) {
      return P - W;
    }), N = 0; N < M; N++)
      z = y[N] - H, A += z * z, V += z * z * z, Q[N] = Math.abs(y[N] - x), T += Q[N], C += z * z * z * z, R += F / Math.cos(y[N] * Math.PI / 180 || 1e-3);
    M > 1 && (V = V / M / Math.pow(A / (M - 1), 1.5), T = (H - x) / (T / M || 1), C = C * M / (A * A || 1) - 3, A = Math.sqrt(A / M)), Array.prototype.sort.call(Q, function(P, W) {
      return P - W;
    });
    try {
      for (var U = e.xSegments + 1, _ = e.ySegments + 1, J = 0; J < U; J++)
        for (var K = 0; K < _; K++) {
          for (var te = -1 / 0, ne = 1 / 0, ee = a.attributes.position.array[(K * U + J) * 3 + 2], fe = 0, re = 0, $ = -1; $ <= 1; $++)
            for (var Z = -1; Z <= 1; Z++)
              if (J + Z >= 0 && K + $ >= 0 && J + Z < U && K + $ < _ && !($ === 0 && Z === 0)) {
                var k = a.attributes.position.array[((K + $) * U + J + Z) * 3 + 2];
                fe += k, re++, k > te && (te = k), k < ne && (ne = k);
              }
          re && (O += (fe / re - ee) * (fe / re - ee)), (ee > te || ee < ne) && G++;
        }
      O = Math.sqrt(O / f);
      var ge = Math.ceil(U * 0.5) * Math.ceil(_ * 0.5) * 2;
      G /= ge > 0 ? ge : 1;
    } catch (P) {
      console.warn("Error calculating roughness:", P), O = 0, G = 0;
    }
    return {
      elevation: {
        sampleSize: f,
        max: h,
        min: i,
        range: h - i,
        midrange: (h - i) * 0.5 + i,
        median: m,
        iqr: D(n, 0.75) - D(n, 0.25),
        mean: u,
        stdev: l,
        mad: D(X, 0.5),
        pearsonSkew: v,
        groeneveldMeedenSkew: o,
        kurtosis: c,
        modes: ue(
          n,
          Math.ceil(e.maxHeight - e.minHeight),
          e.minHeight,
          e.maxHeight
        ),
        percentile: function(P) {
          return D(n, P);
        },
        percentRank: function(P) {
          return me(n, P);
        },
        drawHistogram: function(P, W) {
          le(
            ae(
              n,
              W,
              e.minHeight,
              e.maxHeight
            ),
            P,
            e.minHeight,
            e.maxHeight
          );
        }
      },
      slope: {
        sampleSize: M,
        max: S,
        min: s,
        range: S - s,
        midrange: (S - s) * 0.5 + s,
        median: x,
        iqr: D(y, 0.75) - D(y, 0.25),
        mean: H,
        stdev: A,
        mad: D(Q, 0.5),
        pearsonSkew: V,
        groeneveldMeedenSkew: T,
        kurtosis: C,
        modes: ue(y, 90, 0, 90),
        percentile: function(P) {
          return D(y, P);
        },
        percentRank: function(P) {
          return me(y, P);
        },
        drawHistogram: function(P, W) {
          le(
            ae(
              y,
              W,
              0,
              90
            ),
            P,
            0,
            90,
            "\xB0"
          );
        }
      },
      roughness: {
        planimetricAreaRatio: e.xSize * e.ySize / (R || e.xSize * e.ySize),
        terrainRuggednessIndex: O,
        jaggedness: G
      },
      fittedPlane: {
        centroid: b,
        normal: I,
        slope: q,
        pctExplained: xe(
          a.attributes.position.array,
          b,
          I,
          e.maxHeight - e.minHeight
        )
      }
    };
  } catch (P) {
    return console.error("Error during terrain analysis:", P), ie();
  }
};
function ie(r) {
  var e = function(a) {
    if (a && a.getContext) {
      var t = a.getContext("2d");
      a.width = 300, a.height = 200, t.clearRect(0, 0, a.width, a.height), t.fillStyle = "rgba(144, 176, 192, 1)", t.font = "12px Arial", t.fillText("No data available for analysis", 10, 100);
    }
  };
  return {
    elevation: {
      sampleSize: 0,
      max: 0,
      min: 0,
      range: 0,
      midrange: 0,
      median: 0,
      iqr: 0,
      mean: 0,
      stdev: 0,
      mad: 0,
      pearsonSkew: 0,
      groeneveldMeedenSkew: 0,
      kurtosis: 0,
      modes: [],
      percentile: function() {
        return 0;
      },
      percentRank: function() {
        return 0;
      },
      drawHistogram: e
    },
    slope: {
      sampleSize: 0,
      max: 0,
      min: 0,
      range: 0,
      midrange: 0,
      median: 0,
      iqr: 0,
      mean: 0,
      stdev: 0,
      mad: 0,
      pearsonSkew: 0,
      groeneveldMeedenSkew: 0,
      kurtosis: 0,
      modes: [],
      percentile: function() {
        return 0;
      },
      percentRank: function() {
        return 0;
      },
      drawHistogram: e
    },
    roughness: {
      planimetricAreaRatio: 1,
      terrainRuggednessIndex: 0,
      jaggedness: 0
    },
    fittedPlane: {
      centroid: new w.Vector3(),
      normal: new w.Vector3(0, 0, 1),
      slope: 0,
      pctExplained: 0
    }
  };
}
g.percentile = D;
function D(r, e) {
  if (r.length === 0) return 0;
  if (typeof e != "number") throw new TypeError("p must be a number");
  if (e <= 0) return r[0];
  if (e >= 1) return r[r.length - 1];
  var a = r.length * e, t = Math.floor(a), n = t + 1, f = a % 1;
  return n >= r.length ? r[t] : r[t] * (1 - f) + r[n] * f;
}
g.percentRank = me;
function me(r, e) {
  if (typeof e != "number") throw new TypeError("v must be a number");
  for (var a = 0, t = r.length; a < t; a++)
    if (e <= r[a]) {
      for (; a < t && e === r[a]; )
        a++;
      return a === 0 ? 0 : (e !== r[a - 1] && (a += (e - r[a - 1]) / (r[a] - r[a - 1])), a / t);
    }
  return 1;
}
g.faceNormals = se;
function se(r, e) {
  var a = r.clone();
  a.index && (a = a.toNonIndexed());
  for (var t = a.attributes.position.array, n = t.length / 9, f = new Array(n), h = new w.Vector3(), i = new w.Vector3(), m = new w.Vector3(), u = 0; u < n; u++) {
    var l = u * 9;
    h.set(
      t[l],
      t[l + 1],
      t[l + 2]
    ), i.set(
      t[l + 3],
      t[l + 4],
      t[l + 5]
    ), m.set(
      t[l + 6],
      t[l + 7],
      t[l + 8]
    );
    var v = new w.Vector3().crossVectors(
      new w.Vector3().subVectors(i, h),
      new w.Vector3().subVectors(m, h)
    ).normalize();
    f[u] = v;
  }
  return f;
}
g.getFittedPlaneNormal = Se;
function Se(r, e) {
  var a = r.length / 3, t = 0, n = 0, f = 0, h = 0, i = 0, m = 0;
  if (a < 3) throw new Error("At least three points are required to fit a plane");
  for (var u = new w.Vector3(), l = 0, v = r.length; l < v; l += 3) {
    var o = r[l] - e.x, c = r[l + 1] - e.y, d = r[l + 2] - e.z;
    t += o * o, n += o * c, f += o * d, h += c * c, i += c * d, m += d * d;
  }
  var y = h * m - i * i, M = t * m - f * f, S = t * h - n * n;
  return y >= M && y >= S ? u.set(y, n * m - f * i, f * h - n * i) : M >= y && M >= S ? u.set(n * m - f * i, M, n * f - i * t) : u.set(f * h - n * i, n * f - i * t, S), u.z < 0 && u.negate(), u.normalize();
}
g.bucketNumbersLinearly = ae;
function ae(r, e, a, t) {
  var n = 0, f = r.length;
  if (typeof a > "u")
    for (a = 1 / 0, t = -1 / 0, n = 0; n < f; n++)
      r[n] < a && (a = r[n]), r[n] > t && (t = r[n]);
  a === t && (t = a + 1);
  var h = (t - a) / e, i = new Array(e);
  for (n = 0; n < e; n++)
    i[n] = [];
  for (n = 0; n < f; n++) {
    var m = Math.max(a, Math.min(t, r[n]));
    if (m === t)
      i[e - 1].push(m);
    else {
      var u = Math.floor((m - a) / h);
      u = Math.max(0, Math.min(e - 1, u)), i[u].push(m);
    }
  }
  return i;
}
g.getModes = ue;
function ue(r, e, a, t) {
  if (!r || r.length === 0)
    return [];
  a === t && (t = a + 1);
  for (var n = ae(r, e, a, t), f = 0, h = [], i = 0, m = n.length; i < m; i++)
    n[i].length > f ? (f = n[i].length, h = [a + (i + 0.5) / e * (t - a)]) : n[i].length === f && f > 0 && h.push(a + (i + 0.5) / e * (t - a));
  if (h.length === 0)
    return [];
  for (var u = 0; u < h.length; u++)
    Math.abs(h[u] - Math.round(h[u])) < 1e-3 ? h[u] = Math.round(h[u]) : h[u] = parseFloat(h[u].toFixed(3));
  return h;
}
g.drawHistogram = le;
function le(r, e, a, t, n) {
  if (!e || !e.getContext) {
    console.warn("Invalid canvas for histogram drawing");
    return;
  }
  var f = e.getContext("2d"), h = 280, i = 180, m = 10, u = 4, l = typeof t > "u" ? -1 / 0 : t, v = typeof a > "u" ? 1 / 0 : a, o = r.length, c;
  if (e.width = h + m * 2, e.height = i + m * 2, f.clearRect(0, 0, e.width, e.height), typeof n > "u" && (n = ""), l === -1 / 0 || v === 1 / 0)
    for (c = 0; c < o; c++)
      for (var d = 0, y = r[c].length; d < y; d++)
        r[c][d] > l && (l = r[c][d]), r[c][d] < v && (v = r[c][d]);
  v === l && (l = v + 1);
  var M = 0, S = 0;
  for (c = 0; c < o; c++)
    r[c].length > M && (M = r[c].length), S += r[c].length;
  if (S === 0 || M === 0) {
    f.fillStyle = "rgba(144, 176, 192, 1)", f.font = "12px Arial", f.fillText("No data available", m + 10, m + i / 2), f.strokeStyle = "rgba(13, 42, 64, 1)", f.lineWidth = 2, f.beginPath(), f.moveTo(m, m), f.lineTo(m, i + m), f.moveTo(m, i + m), f.lineTo(h + m, i + m), f.stroke();
    return;
  }
  var s = (i - u) / M, x = (h - (r.length + 1) * u) / r.length;
  for (x >= 1 && (x = Math.floor(x)), s >= 1 && (s = Math.floor(s)), f.fillStyle = "rgba(13, 42, 64, 1)", c = 0; c < o; c++)
    f.fillRect(
      m + u + c * (x + u),
      m + i - (u + r[c].length * s),
      x,
      s * r[c].length
    );
  for (f.fillStyle = "rgba(144, 176, 192, 1)", f.font = "12px Arial", c = 0; c < o; c++) {
    var H = Math.floor((c + 0.5) / r.length * (l - v) + v) + "" + n;
    f.fillText(
      H,
      m + u + c * (x + u) + Math.floor((x - f.measureText(H).width) * 0.5),
      m + i - 8,
      x
    );
  }
  var b = S > 0 ? Math.round(100 * M / S) + "%" : "0%";
  f.fillText(
    b,
    m + u,
    m + u + 6
  ), f.strokeStyle = "rgba(13, 42, 64, 1)", f.lineWidth = 2, f.beginPath(), f.moveTo(m, m), f.lineTo(m, i + m), f.moveTo(m, i + m), f.lineTo(h + m, i + m), f.stroke();
}
g.percentVariationExplainedByFittedPlane = xe;
function xe(r, e, a, t) {
  if (!r || r.length < 3 || !e || !a || !a.isVector3)
    return 0;
  t = Math.abs(t) || 1;
  var n = r.length, f = 0, h, i;
  try {
    for (var m = 0; m < n; m += 3) {
      var u = r[m + 0] - e.x, l = r[m + 1] - e.y, v = r[m + 2] - e.z;
      h = a.x * u + a.y * l + a.z * v, i = Math.abs(h) / Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z), f += i * i;
    }
    return Math.max(0, Math.min(1, 1 - Math.sqrt(f / n) * 2 / t));
  } catch (o) {
    return console.warn("Error calculating plane variation:", o), 0;
  }
}
g.mean = ce;
function ce(r) {
  for (var e = 0, a = r.length, t = 0; t < a; t++)
    e += r[t];
  return e / a;
}
g.Brownian = function(r, e) {
  var a = [], t = [], n = Math.min(e.xSize, e.ySize), f = Math.sqrt(n) / n, h = Math.sqrt(e.maxHeight - e.minHeight), i = e.xSegments + 1, m = e.ySegments + 1, u = Math.floor(Math.random() * e.xSegments), l = Math.floor(Math.random() * e.ySegments), v = u, o = l, c = r.length, d = Array.from(r).map(function(O) {
    return { z: O };
  }), y = d[l * i + u], M = Math.random() * Math.PI * 2, S = Math.cos(M), s = Math.sin(M), x, H, b, I, q, A, V;
  for (y.z = Math.random() * (e.maxHeight - e.minHeight) + e.minHeight, t.push(y); t.length !== c; ) {
    for (x = -1; x <= 1; x++)
      for (H = -1; H <= 1; H++)
        b = (l + x) * i + u + H, typeof d[b] < "u" && t.indexOf(d[b]) === -1 && u + H >= 0 && l + x >= 0 && u + H < i && l + x < m && x && H && a.push(d[b]);
    if (Math.random() < f)
      y = a.splice(Math.floor(Math.random() * a.length), 1)[0], M = Math.random() * Math.PI * 2, S = Math.cos(M), s = Math.sin(M), V = d.indexOf(y), u = V % i, l = Math.floor(V / i), v = u, o = l;
    else {
      for (var T = v, C = o; Math.round(T) === u && Math.round(C) === l; )
        T += S, C += s;
      u = Math.round(T), l = Math.round(T);
      for (var F = 0; u >= 0 && l >= 0 && u < i && l < m && t.indexOf(d[l * i + u]) !== -1 && F < 9; F++) {
        for (M = Math.random() * Math.PI * 2, S = Math.cos(M), s = Math.sin(M); Math.round(T) === u && Math.round(C) === l; )
          T += S, C += s;
        u = Math.round(T), l = Math.round(C);
      }
      if (u >= 0 && l >= 0 && u < i && l < m && t.indexOf(d[l * i + u]) === -1) {
        v = T, o = C, y = d[l * i + u];
        var R = a.indexOf(y);
        R !== -1 && a.splice(R, 1);
      } else
        y = a.splice(Math.floor(Math.random() * a.length), 1)[0], M = Math.random() * Math.PI * 2, S = Math.cos(M), s = Math.sin(M), V = d.indexOf(y), u = V % i, l = Math.floor(V / i), v = u, o = l;
    }
    for (I = 0, q = 0, x = -1; x <= 1; x++)
      for (H = -1; H <= 1; H++)
        b = (l + x) * i + u + H, typeof d[b] < "u" && t.indexOf(d[b]) !== -1 && u + H >= 0 && l + x >= 0 && u + H < i && l + x < m && x && H && (I += d[b].z, q++);
    q && ((!A || Math.random() < f) && (A = Math.random()), y.z = I / q + g.EaseInWeak(A) * h * 2 - h), t.push(y);
  }
  for (u = d.length - 1; u >= 0; u--)
    r[u] = d[u].z;
  g.Smooth(r, e), g.Smooth(r, e);
};
function de(r, e, a) {
  if (!r.length || !e.length) return r;
  var t = 0, n = 0, f = 0, h = 0, i = r.length, m = r[0].length, u = e.length, l = e[0].length;
  if (typeof a > "u")
    for (a = new Array(i), t = 0; t < i; t++)
      a[t] = new Float64Array(m);
  for (t = 0; t < i; t++)
    for (n = 0; n < m; n++) {
      var v = 0;
      for (a[t][n] = 0, f = 0; f < u; f++)
        for (h = 0; h < l; h++)
          typeof r[t + f] < "u" && typeof r[t + f][n + h] < "u" && (v = r[t + f][n + h]), a[t][n] += v * e[f][h];
    }
  return a;
}
function be(r, e) {
  return Math.exp(-0.5 * r * r / (e * e)) / (e * 2.5066282746310007);
}
function Ae(r, e) {
  typeof e != "number" && (e = 7);
  var a = new Float64Array(e), t = Math.floor(e * 0.5), n = e % 2, f;
  if (!r || !e) return a;
  for (f = 0; f <= t; f++)
    a[f] = be(r * (f - t - n * 0.5), r);
  for (; f < e; f++)
    a[f] = a[e - 1 - f];
  return a;
}
function Pe(r, e, a) {
  typeof e > "u" && (e = 1), typeof a > "u" && (a = 7);
  for (var t = Ae(e, a), n = a || t.length, f = [t], h = new Array(n), i = 0; i < n; i++)
    h[i] = [t[i]];
  return de(de(r, f), h);
}
g.Gaussian = function(r, e, a, t) {
  g.fromArray2D(r, Pe(g.toArray2D(r, e), a, t));
};
g.GaussianBoxBlur = function(r, e, a, t) {
  ze(
    r,
    e.xSegments + 1,
    e.ySegments + 1,
    a,
    t
  );
};
function ze(r, e, a, t, n, f) {
  typeof t > "u" && (t = 1), typeof n > "u" && (n = 3), typeof f > "u" && (f = new Float32Array(r.length));
  for (var h = qe(t, n), i = 0; i < n; i++)
    Te(r, f, e, a, (h[i] - 1) / 2);
  return f;
}
function qe(r, e) {
  var a = Math.sqrt(12 * r * r / e + 1), t = Math.floor(a);
  t % 2 === 0 && t--;
  for (var n = t + 2, f = (12 * r * r - e * t * t - 4 * e * t - 3 * e) / (-4 * t - 4), h = Math.round(f), i = new Int16Array(e), m = 0; m < e; m++)
    i[m] = m < h ? t : n;
  return i;
}
function Te(r, e, a, t, n) {
  for (var f = 0, h = r.length; f < h; f++)
    e[f] = r[f];
  Ve(e, r, a, t, n), Ce(r, e, a, t, n);
}
function Ve(r, e, a, t, n) {
  for (var f = 1 / (n + n + 1), h = 0; h < t; h++) {
    var i = h * a, m = i, u = i + n, l = r[i], v = r[i + a - 1], o = (n + 1) * l, c;
    for (c = 0; c < n; c++)
      o += r[i + c];
    for (c = 0; c <= n; c++)
      o += r[u++] - l, e[i++] = o * f;
    for (c = n + 1; c < a - n; c++)
      o += r[u++] - r[m++], e[i++] = o * f;
    for (c = a - n; c < a; c++)
      o += v - r[m++], e[i++] = o * f;
  }
}
function Ce(r, e, a, t, n) {
  for (var f = 1 / (n + n + 1), h = 0; h < a; h++) {
    var i = h, m = i, u = i + n * a, l = r[i], v = r[i + a * (t - 1)], o = (n + 1) * l, c;
    for (c = 0; c < n; c++)
      o += r[i + c * a];
    for (c = 0; c <= n; c++)
      o += r[u] - l, e[i] = o * f, u += a, i += a;
    for (c = n + 1; c < t - n; c++)
      o += r[u] - r[m], e[i] = o * f, m += a, u += a, i += a;
    for (c = t - n; c < t; c++)
      o += v - r[m], e[i] = o * f, m += a, i += a;
  }
}
w.Vector2.prototype.distanceToManhattan = function(r) {
  return Math.abs(this.x - r.x) + Math.abs(this.y - r.y);
};
w.Vector2.prototype.distanceToChebyshev = function(r) {
  var e = Math.abs(this.x - r.x), a = Math.abs(this.y - r.y);
  return e <= a ? a : e;
};
w.Vector2.prototype.distanceToQuadratic = function(r) {
  var e = Math.abs(this.x - r.x), a = Math.abs(this.y - r.y);
  return e * e + e * a + a * a;
};
function Ne(r, e, a) {
  for (var t = 1 / 0, n = "distanceTo" + a, f = 0; f < e.length; f++) {
    var h = e[f][n](r);
    h < t && (t = h);
  }
  return t;
}
g.Worley = function(r, e) {
  for (var a = (e.worleyDistribution || g.Worley.randomPoints)(e.xSegments, e.ySegments, e.worleyPoints), t = e.worleyDistanceTransformation || function(m) {
    return -m;
  }, n = new w.Vector2(0, 0), f = 0, h = e.xSegments + 1; f < h; f++)
    for (var i = 0; i < e.ySegments + 1; i++)
      n.x = f, n.y = i, r[i * h + f] = t(Ne(n, a, e.distanceType || ""));
  g.Clamp(r, {
    maxHeight: e.maxHeight,
    minHeight: e.minHeight,
    stretch: true
  });
};
g.Worley.randomPoints = function(r, e, a) {
  a = a || Math.floor(Math.sqrt(r * e * 0.025)) || 1;
  for (var t = new Array(a), n = 0; n < a; n++)
    t[n] = new w.Vector2(
      Math.random() * r,
      Math.random() * e
    );
  return t;
};
function Be(r) {
  return r.splice(Math.floor(Math.random() * r.length), 1)[0];
}
function ye(r, e, a) {
  var t = Math.floor(e.x / a), n = Math.floor(e.y / a);
  r[t] || (r[t] = []), r[t][n] = e;
}
function De(r, e, a) {
  return r.x >= 0 && // jscs:ignore requireSpaceAfterKeywords
  r.y >= 0 && r.x <= e + 1 && r.y <= a + 1;
}
function Re(r, e, a, t) {
  for (var n = Math.floor(e.x / t), f = Math.floor(e.y / t), h = n - 1; h <= n + 1; h++)
    for (var i = f - 1; i <= f + 1; i++)
      if (h !== n && i !== f && typeof r[h] < "u" && typeof r[h][i] < "u") {
        var m = h * t, u = i * t;
        if (Math.sqrt((e.x - m) * (e.x - m) + (e.y - u) * (e.y - u)) < a)
          return true;
      }
  return false;
}
function Oe(r, e) {
  var a = e * (Math.random() + 1), t = 2 * Math.PI * Math.random();
  return new w.Vector2(
    r.x + a * Math.cos(t),
    r.y + a * Math.sin(t)
  );
}
g.Worley.PoissonDisks = function(r, e, a, t) {
  a = a || Math.floor(Math.sqrt(r * e * 0.2)) || 1, t = Math.sqrt((r + e) * 2.5), t > a * 0.67 && (t = a * 0.67);
  var n = t / Math.sqrt(2);
  n < 2 && (n = 2);
  var f = [], h = [], i = [], m = new w.Vector2(
    Math.random() * r,
    Math.random() * e
  );
  h.push(m), i.push(m), ye(f, m, n);
  for (var u = 0; h.length; ) {
    for (var l = Be(h), v = 0; v < a; v++) {
      var o = Oe(l, t);
      if (De(o, r, e) && !Re(f, o, t, n) && (h.push(o), i.push(o), ye(f, o, n), i.length >= a))
        break;
    }
    if (i.length >= a || ++u > a * a)
      break;
  }
  return i;
};
g.MultiPass || (console.log("Adding fallback MultiPass function"), g.MultiPass = function(r, e, a) {
  console.log("Using fallback MultiPass function");
  var t = {};
  for (var n in e)
    e.hasOwnProperty(n) && (t[n] = e[n]);
  for (var f = e.maxHeight - e.minHeight, h = 0, i = a.length; h < i; h++) {
    var m = typeof a[h].amplitude > "u" ? 1 : a[h].amplitude, u = 0.5 * (f - f * m);
    t.maxHeight = e.maxHeight - u, t.minHeight = e.minHeight + u, t.frequency = typeof a[h].frequency > "u" ? e.frequency : a[h].frequency, a[h].method(r, t);
  }
});
g.DiamondSquare || (console.log("Adding fallback DiamondSquare function"), g.DiamondSquare = function(r, e) {
  console.log("Using fallback DiamondSquare function");
  var a = Math.max(e.xSegments, e.ySegments) + 1;
  a = g.ceilPowerOfTwo(a);
  for (var t = a + 1, n = new Array(t), f = 0; f < t; f++) {
    n[f] = new Array(t);
    for (var h = 0; h < t; h++)
      n[f][h] = 0;
  }
  var i = e.minHeight, m = e.maxHeight, u = m - i;
  n[0][0] = Math.random() * u + i, n[0][t - 1] = Math.random() * u + i, n[t - 1][0] = Math.random() * u + i, n[t - 1][t - 1] = Math.random() * u + i;
  for (var l = u * 0.5, v = a; v >= 2; v /= 2) {
    for (var o = Math.round(v * 0.5), c = Math.round(v), d = 0; d < a; d += c)
      for (var y = 0; y < a; y += c) {
        var M = n[d][y] + n[d + c][y] + n[d][y + c] + n[d + c][y + c];
        M *= 0.25, n[d + o][y + o] = M + (Math.random() * 2 - 1) * l;
      }
    for (var d = 0; d < a; d += o)
      for (var y = (d + o) % v; y < a; y += v) {
        var M = 0, S = 0;
        d >= o && (M += n[d - o][y], S++), d + o < t && (M += n[d + o][y], S++), y >= o && (M += n[d][y - o], S++), y + o < t && (M += n[d][y + o], S++), M /= S, n[d][y] = M + (Math.random() * 2 - 1) * l, d === 0 && (n[a][y] = n[0][y]), y === 0 && (n[d][a] = n[d][0]);
      }
    l /= 2;
  }
  for (var s = e.xSegments + 1, x = e.ySegments + 1, f = 0; f < s; f++)
    for (var h = 0; h < x; h++) {
      var d = Math.round(f * a / s), y = Math.round(h * a / x);
      r[h * s + f] = n[d][y];
    }
});
g.Perlin || (console.log("Adding fallback Perlin function"), g.Perlin = function(r, e) {
  console.log("Using fallback Perlin function");
  for (var a = (e.maxHeight - e.minHeight) * 0.5, t = 0; t < r.length; t++)
    r[t] = Math.random() * a * 2 - a;
});
g.SmoothMedian || (console.log("Adding fallback SmoothMedian function"), g.SmoothMedian = function(r, e) {
  return console.log("Using fallback SmoothMedian function"), r;
});
console.log("THREE.Terrain module loaded");
console.log("Available heightmap generators:", Object.keys(g).filter((r) => typeof g[r] == "function" && [
  "Perlin",
  "DiamondSquare",
  "Hill",
  "Brownian",
  "Cosine",
  "CosineLayers",
  "Fault",
  "Particles",
  "Simplex",
  "SimplexLayers",
  "Value",
  "Weierstrass",
  "Worley"
].includes(r)));
typeof window < "u" && (window.THREE || (window.THREE = {}), window.THREE.Terrain = Me, Object.assign(window.THREE.Terrain, g));
export {
  g as TerrainNS,
  Me as default
};
