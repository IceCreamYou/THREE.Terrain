import * as e from "three";
//#region src/core.js
var t = {};
function n(e) {
	return 2 ** Math.ceil(Math.log(e) / Math.log(2));
}
var r = function(n) {
	var r = {
		after: null,
		easing: t.Linear,
		heightmap: t.DiamondSquare,
		material: null,
		maxHeight: 100,
		minHeight: -100,
		optimization: t.NONE,
		frequency: 2.5,
		steps: 1,
		stretch: !0,
		turbulent: !1,
		xSegments: 63,
		xSize: 1024,
		ySegments: 63,
		ySize: 1024
	};
	for (var i in n ||= {}, r) r.hasOwnProperty(i) && (n[i] = n[i] === void 0 ? r[i] : n[i]);
	n.material = n.material || new e.MeshBasicMaterial({ color: 15623731 });
	var a = new e.Object3D();
	a.rotation.x = -.5 * Math.PI;
	var o = new e.Mesh(new e.PlaneGeometry(n.xSize, n.ySize, n.xSegments, n.ySegments), n.material), s = t.toArray1D(o.geometry.attributes.position.array);
	return n.heightmap instanceof HTMLCanvasElement || n.heightmap instanceof Image ? t.fromHeightmap(s, n, n.heightmap) : typeof n.heightmap == "function" ? n.heightmap(s, n) : console.warn("An invalid value was passed for `options.heightmap`: " + n.heightmap), t.fromArray1D(o.geometry.attributes.position.array, s), t.Normalize(o, n), a.add(o), a;
};
t.Normalize = function(e, n) {
	var r = t.toArray1D(e.geometry.attributes.position.array);
	n.turbulent && t.Turbulence(r, n), n.steps > 1 && (t.Step(r, n.steps), t.Smooth(r, n)), t.Clamp(r, n), typeof n.after == "function" && n.after(r, n), t.fromArray1D(e.geometry.attributes.position.array, r), e.geometry.computeBoundingSphere(), e.geometry.computeVertexNormals();
}, t.NONE = 0, t.GEOMIPMAP = 1, t.GEOCLIPMAP = 2, t.POLYGONREDUCTION = 3, t.toArray2D = function(e, t) {
	var n = Array(t.xSegments + 1), r = t.xSegments + 1, i = t.ySegments + 1, a, o;
	for (a = 0; a < r; a++) for (n[a] = new Float32Array(t.ySegments + 1), o = 0; o < i; o++) n[a][o] = e[o * r + a];
	return n;
}, t.fromArray2D = function(e, t) {
	for (var n = 0, r = t.length; n < r; n++) for (var i = 0, a = t[n].length; i < a; i++) e[i * r + n] = t[n][i];
}, t.toArray1D = function(e) {
	for (var t = new Float32Array(e.length / 3), n = 0, r = t.length; n < r; n++) t[n] = e[n * 3 + 2];
	return t;
}, t.fromArray1D = function(e, t) {
	for (var n = 0, r = Math.min(e.length / 3, t.length); n < r; n++) e[n * 3 + 2] = t[n];
};
function i(e, t, n, r) {
	if (!e || !e.attributes || !e.attributes.position || !t || typeof n != "number" || typeof r != "number" || !isFinite(n) || !isFinite(r)) return 0;
	var i = e.attributes.position, a = i.array, o = t.xSegments, s = t.ySegments, c = t.xSize, l = t.ySize;
	if (!a || i.itemSize !== 3 || typeof i.count != "number" || typeof o != "number" || !isFinite(o) || o < 1 || Math.floor(o) !== o || typeof s != "number" || !isFinite(s) || s < 1 || Math.floor(s) !== s || typeof c != "number" || !isFinite(c) || c <= 0 || typeof l != "number" || !isFinite(l) || l <= 0) return 0;
	var u = o + 1, d = u * (s + 1), f = c * .5, p = l * .5;
	if (i.count < d || a.length < d * 3) return 0;
	var m = Math.max(-f, Math.min(f, n)), h = Math.max(-p, Math.min(p, r)), g = (m + f) / c * o, _ = (p - h) / l * s, v = Math.min(o, Math.floor(g)), y = Math.min(s, Math.floor(_)), b = Math.min(o, v + 1), x = Math.min(s, y + 1), S = g - v, C = _ - y, w = a[(y * u + v) * 3 + 2], T = a[(y * u + b) * 3 + 2], E = a[(x * u + v) * 3 + 2], D = a[(x * u + b) * 3 + 2];
	return !isFinite(w) || !isFinite(T) || !isFinite(E) || !isFinite(D) ? 0 : S + C <= 1 ? w + (T - w) * S + (E - w) * C : E * (1 - S) + D * (S + C - 1) + T * (1 - C);
}
t.getTerrainHeight = i, t.heightmapArray = function(e, n) {
	var r = Array((n.xSegments + 1) * (n.ySegments + 1));
	return r.length, r.fill(0), n.minHeight = n.minHeight || 0, n.maxHeight = n.maxHeight === void 0 ? 1 : n.maxHeight, n.stretch = n.stretch || !1, e(r, n), t.Clamp(r, n), r;
}, t.Linear = function(e) {
	return e;
}, t.EaseIn = function(e) {
	return e * e;
}, t.EaseOut = function(e) {
	return -e * (e - 2);
}, t.EaseInOut = function(e) {
	return e * e * (3 - 2 * e);
}, t.InEaseOut = function(e) {
	var t = 2 * e - 1;
	return .5 * t * t * t + .5;
}, t.EaseInWeak = function(e) {
	return e ** 1.55;
}, t.EaseInStrong = function(e) {
	return e * e * e * e * e * e * e;
}, t.Terrain = r, t.Clamp = function(e, n) {
	var r = Infinity, i = -Infinity, a = e.length, o;
	for (n.easing = n.easing || t.Linear, o = 0; o < a; o++) e[o] < r && (r = e[o]), e[o] > i && (i = e[o]);
	var s = i - r, c = typeof n.maxHeight == "number" ? n.maxHeight : i, l = typeof n.minHeight == "number" ? n.minHeight : r, u = n.stretch ? c : i < c ? i : c, d = n.stretch ? l : r > l ? r : l, f = u - d;
	for (u < d && (u = c, f = u - d), o = 0; o < a; o++) e[o] = n.easing((e[o] - r) / s) * f + l;
}, t.Edges = function(e, n, r, i, a, o) {
	var s = Math.floor(i / (n.xSize / n.xSegments)) || 1, c = Math.floor(i / (n.ySize / n.ySegments)) || 1, l = r ? n.maxHeight : n.minHeight, u = r ? Math.max : Math.min, d = n.xSegments + 1, f = n.ySegments + 1, p, m, h, g, _;
	for (a ||= t.EaseInOut, typeof o != "object" && (o = {
		top: !0,
		bottom: !0,
		left: !0,
		right: !0
	}), p = 0; p < d; p++) for (m = 0; m < c; m++) h = a(1 - m / c), g = m * d + p, _ = (n.ySegments - m) * d + p, o.top && (e[g] = u(e[g], (l - e[g]) * h + e[g])), o.bottom && (e[_] = u(e[_], (l - e[_]) * h + e[_]));
	for (p = 0; p < f; p++) for (m = 0; m < s; m++) h = a(1 - m / s), g = p * d + m, _ = (n.ySegments - p) * d + (n.xSegments - m), o.left && (e[g] = u(e[g], (l - e[g]) * h + e[g])), o.right && (e[_] = u(e[_], (l - e[_]) * h + e[_]));
	t.Clamp(e, {
		maxHeight: n.maxHeight,
		minHeight: n.minHeight,
		stretch: !0
	});
}, t.RadialEdges = function(e, t, n, r, i) {
	var a = n ? t.maxHeight : t.minHeight, o = n ? Math.max : Math.min, s = t.xSegments + 1, c = t.ySegments + 1, l = s * .5, u = c * .5, d = t.xSize / t.xSegments, f = t.ySize / t.ySegments, p = Math.min(t.xSize, t.ySize) * .5 - r, m, h, g, _, v;
	for (m = 0; m < s; m++) for (h = 0; h < u; h++) _ = h * s + m, v = Math.min(p, Math.sqrt((l - m) * d * (l - m) * d + (u - h) * f * (u - h) * f) - r), !(v < 0) && (g = i(v / p), e[_] = o(e[_], (a - e[_]) * g + e[_]), _ = (t.ySegments - h) * s + m, e[_] = o(e[_], (a - e[_]) * g + e[_]));
}, t.Smooth = function(e, t, n) {
	for (var r = new Float32Array(e.length), i = 0, a = t.xSegments + 1, o = t.ySegments + 1; i < a; i++) for (var s = 0; s < o; s++) {
		for (var c = 0, l = 0, u = -1; u <= 1; u++) for (var d = -1; d <= 1; d++) {
			var f = (s + u) * a + i + d;
			e[f] !== void 0 && i + d >= 0 && s + u >= 0 && i + d < a && s + u < o && (c += e[f], l++);
		}
		r[s * a + i] = c / l;
	}
	n ||= 0;
	for (var p = 1 / (1 + n), m = 0, h = e.length; m < h; m++) e[m] = (r[m] + e[m] * n) * p;
}, t.SmoothMedian = function(e, t) {
	for (var n = new Float32Array(e.length), r = [], i = [], a = function(e, t) {
		return r[e] - r[t];
	}, o = 0, s = t.xSegments + 1, c = t.ySegments + 1; o < s; o++) for (var l = 0; l < c; l++) {
		r.length = 0, i.length = 0;
		for (var u = -1; u <= 1; u++) for (var d = -1; d <= 1; d++) {
			var f = (l + u) * s + o + d;
			e[f] !== void 0 && o + d >= 0 && l + u >= 0 && o + d < s && l + u < c && (r.push(e[f]), i.push(f));
		}
		i.sort(a);
		var p = Math.floor(i.length * .5), m = i.length % 2 == 1 ? e[i[p]] : (e[i[p - 1]] + e[i[p]]) * .5;
		n[l * s + o] = m;
	}
	for (var h = 0, g = e.length; h < g; h++) e[h] = n[h];
}, t.SmoothConservative = function(e, t, n) {
	for (var r = new Float32Array(e.length), i = 0, a = t.xSegments + 1, o = t.ySegments + 1; i < a; i++) for (var s = 0; s < o; s++) {
		for (var c = -Infinity, l = Infinity, u = -1; u <= 1; u++) for (var d = -1; d <= 1; d++) {
			var f = (s + u) * a + i + d;
			e[f] !== void 0 && u && d && i + d >= 0 && s + u >= 0 && i + d < a && s + u < o && (e[f] < l && (l = e[f]), e[f] > c && (c = e[f]));
		}
		var p = s * a + i;
		if (typeof n == "number") {
			var m = (c - l) * .5, h = l + m;
			c = h + m * n, l = h - m * n;
		}
		r[p] = e[p] > c ? c : e[p] < l ? l : e[p];
	}
	for (var g = 0, _ = e.length; g < _; g++) e[g] = r[g];
}, t.Step = function(e, t) {
	var n = 0, r = 0, i = e.length, a = Math.floor(i / t), o = Array(i), s = Array(t);
	for (t === void 0 && (t = Math.floor((i * .5) ** .25)), n = 0; n < i; n++) o[n] = e[n];
	for (o.sort(function(e, t) {
		return e - t;
	}), n = 0; n < t; n++) {
		var c = o.slice(n * a, (n + 1) * a), l = 0, u = c.length;
		for (r = 0; r < u; r++) l += c[r];
		s[n] = {
			min: c[0],
			max: c[c.length - 1],
			avg: l / u
		};
	}
	for (n = 0; n < i; n++) {
		var d = e[n];
		for (r = 0; r < t; r++) if (d >= s[r].min && d <= s[r].max) {
			e[n] = s[r].avg;
			break;
		}
	}
}, t.Turbulence = function(e, t) {
	for (var n = t.maxHeight - t.minHeight, r = 0, i = e.length; r < i; r++) e[r] = t.minHeight + Math.abs((e[r] - t.minHeight) * 2 - n);
};
//#endregion
//#region src/noise.js
var a = {};
function o(e, t, n) {
	this.x = e, this.y = t, this.z = n;
}
o.prototype.dot2 = function(e, t) {
	return this.x * e + this.y * t;
}, o.prototype.dot3 = function(e, t, n) {
	return this.x * e + this.y * t + this.z * n;
};
var s = [
	new o(1, 1, 0),
	new o(-1, 1, 0),
	new o(1, -1, 0),
	new o(-1, -1, 0),
	new o(1, 0, 1),
	new o(-1, 0, 1),
	new o(1, 0, -1),
	new o(-1, 0, -1),
	new o(0, 1, 1),
	new o(0, -1, 1),
	new o(0, 1, -1),
	new o(0, -1, -1)
], c = [
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
], l = Array(512), u = Array(512);
a.seed = function(e) {
	e > 0 && e < 1 && (e *= 65536), e = Math.floor(e), e < 256 && (e |= e << 8);
	for (var t = 0; t < 256; t++) {
		var n = t & 1 ? c[t] ^ e & 255 : c[t] ^ e >> 8 & 255;
		l[t] = l[t + 256] = n, u[t] = u[t + 256] = s[n % 12];
	}
}, a.seed(Math.random());
var d = .5 * (Math.sqrt(3) - 1), f = (3 - Math.sqrt(3)) / 6;
a.simplex = function(e, t) {
	var n, r, i, a = (e + t) * d, o = Math.floor(e + a), s = Math.floor(t + a), c = (o + s) * f, p = e - o + c, m = t - s + c, h, g;
	p > m ? (h = 1, g = 0) : (h = 0, g = 1);
	var _ = p - h + f, v = m - g + f, y = p - 1 + 2 * f, b = m - 1 + 2 * f;
	o &= 255, s &= 255;
	var x = u[o + l[s]], S = u[o + h + l[s + g]], C = u[o + 1 + l[s + 1]], w = .5 - p * p - m * m;
	w < 0 ? n = 0 : (w *= w, n = w * w * x.dot2(p, m));
	var T = .5 - _ * _ - v * v;
	T < 0 ? r = 0 : (T *= T, r = T * T * S.dot2(_, v));
	var E = .5 - y * y - b * b;
	return E < 0 ? i = 0 : (E *= E, i = E * E * C.dot2(y, b)), 70 * (n + r + i);
};
function p(e) {
	return e * e * e * (e * (e * 6 - 15) + 10);
}
function m(e, t, n) {
	return (1 - n) * e + n * t;
}
a.perlin = function(e, t) {
	var n = Math.floor(e), r = Math.floor(t);
	e -= n, t -= r, n &= 255, r &= 255;
	var i = u[n + l[r]].dot2(e, t), a = u[n + l[r + 1]].dot2(e, t - 1), o = u[n + 1 + l[r]].dot2(e - 1, t), s = u[n + 1 + l[r + 1]].dot2(e - 1, t - 1), c = p(e);
	return m(m(i, o, c), m(a, s, c), p(t));
};
//#endregion
//#region src/random.js
function h(e) {
	return e && typeof e.random == "function" ? e.random : Math.random;
}
function g(e) {
	var t = typeof e == "function" ? e : Math.random, n = typeof globalThis < "u" ? globalThis.crypto : null;
	if (n && typeof n.getRandomValues == "function") {
		var r = /* @__PURE__ */ new Uint32Array(1);
		return n.getRandomValues(r), r[0];
	}
	return Math.floor(t() * 4294967296) >>> 0;
}
function _(e) {
	var t = e >>> 0;
	return t ||= 1831565813, function() {
		return t ^= t << 13, t ^= t >>> 17, t ^= t << 5, (t >>> 0) / 4294967296;
	};
}
t.MultiPass = function(e, t, n) {
	var r = {};
	for (var i in t) t.hasOwnProperty(i) && (r[i] = t[i]);
	for (var a = t.maxHeight - t.minHeight, o = 0, s = n.length; o < s; o++) {
		var c = .5 * (a - a * (n[o].amplitude === void 0 ? 1 : n[o].amplitude));
		r.maxHeight = t.maxHeight - c, r.minHeight = t.minHeight + c, r.frequency = n[o].frequency === void 0 ? t.frequency : n[o].frequency, n[o].method(e, r);
	}
}, t.Curve = function(e, t, n) {
	for (var r = (t.maxHeight - t.minHeight) * .5, i = t.frequency / (Math.min(t.xSegments, t.ySegments) + 1), a = 0, o = t.xSegments + 1, s = t.ySegments + 1; a < o; a++) for (var c = 0; c < s; c++) e[c * o + a] += n(a * i, c * i) * r;
}, t.Cosine = function(e, t) {
	for (var n = h(t), r = (t.maxHeight - t.minHeight) * .5, i = t.frequency * Math.PI / (Math.min(t.xSegments, t.ySegments) + 1), a = n() * Math.PI * 2, o = 0, s = t.xSegments + 1; o < s; o++) for (var c = 0, l = t.ySegments + 1; c < l; c++) e[c * s + o] += r * (Math.cos(o * i + a) + Math.cos(c * i + a));
}, t.CosineLayers = function(e, n) {
	t.MultiPass(e, n, [
		{
			method: t.Cosine,
			frequency: 2.5
		},
		{
			method: t.Cosine,
			amplitude: .1,
			frequency: 12
		},
		{
			method: t.Cosine,
			amplitude: .05,
			frequency: 15
		},
		{
			method: t.Cosine,
			amplitude: .025,
			frequency: 20
		}
	]);
}, t.DiamondSquare = function(e, t) {
	var r = h(t), i = n(Math.max(t.xSegments, t.ySegments) + 1), a = i + 1, o = [], s = t.maxHeight - t.minHeight, c, l, u = t.xSegments + 1, d = t.ySegments + 1;
	for (c = 0; c <= i; c++) o[c] = new Float64Array(i + 1);
	for (var f = i; f >= 2; f /= 2) {
		var p = Math.round(f * .5), m = Math.round(f), g, _, v, y;
		for (s /= 2, g = 0; g < i; g += m) for (_ = 0; _ < i; _ += m) y = r() * s * 2 - s, v = o[g][_] + o[g + m][_] + o[g][_ + m] + o[g + m][_ + m], v *= .25, o[g + p][_ + p] = v + y;
		for (g = 0; g < i; g += p) for (_ = (g + p) % f; _ < i; _ += f) y = r() * s * 2 - s, v = o[(g - p + a) % a][_] + o[(g + p) % a][_] + o[g][(_ + p) % a] + o[g][(_ - p + a) % a], v *= .25, v += y, o[g][_] = v, g === 0 && (o[i][_] = v), _ === 0 && (o[g][i] = v);
	}
	for (c = 0; c < u; c++) for (l = 0; l < d; l++) e[l * u + c] += o[c][l];
}, t.Fault = function(e, t) {
	for (var n = h(t), r = Math.sqrt(t.xSegments * t.xSegments + t.ySegments * t.ySegments), i = r * t.frequency, a = (t.maxHeight - t.minHeight) * .5 / i, o = Math.min(t.xSize / t.xSegments, t.ySize / t.ySegments) * t.frequency, s = 0; s < i; s++) for (var c = n(), l = Math.sin(c * Math.PI * 2), u = Math.cos(c * Math.PI * 2), d = n() * r - r * .5, f = 0, p = t.xSegments + 1; f < p; f++) for (var m = 0, g = t.ySegments + 1; m < g; m++) {
		var _ = l * f + u * m - d;
		_ > o ? e[m * p + f] += a : _ < -o ? e[m * p + f] -= a : e[m * p + f] += Math.cos(_ / o * Math.PI * 2) * a;
	}
}, t.Hill = function(n, r, i, a) {
	var o = h(r), s = r.frequency * 2, c = s * s * 10, l = r.maxHeight - r.minHeight, u = l / (s * s), d = l / s, f = Math.min(r.xSize, r.ySize), p = f / (s * s), m = f / s;
	i ||= t.Influences.Hill;
	for (var g = {
		x: 0,
		y: 0
	}, _ = 0; _ < c; _++) {
		var v = o() * (m - p) + p, y = o() * (d - u) + u;
		0 - v, r.xSize + v, r.ySize + v, g.x = o(), g.y = o(), typeof a == "function" && a(g), t.Influence(n, r, i, g.x, g.y, v, y, e.AdditiveBlending, t.EaseInStrong);
	}
}, t.HillIsland = (function() {
	var e = function(e, t) {
		var n = t() * Math.PI * 2;
		e.x = .5 + Math.cos(n) * e.x * .4, e.y = .5 + Math.sin(n) * e.y * .4;
	};
	return function(n, r, i) {
		var a = h(r);
		t.Hill(n, r, i, function(t) {
			e(t, a);
		});
	};
})(), (function() {
	function e(t, n, r, i, a, o) {
		for (var s = r * i + n, c = 0; c < 3; c++) {
			switch (Math.floor(o() * 8)) {
				case 0:
					n++;
					break;
				case 1:
					n--;
					break;
				case 2:
					r++;
					break;
				case 3:
					r--;
					break;
				case 4:
					n++, r++;
					break;
				case 5:
					n++, r--;
					break;
				case 6:
					n--, r++;
					break;
				case 7: n--, r--;
			}
			var l = r * i + n;
			if (t[l] !== void 0) {
				if (t[l] < t[s]) {
					e(t, n, r, i, a, o);
					return;
				}
			} else if (o() < .2) {
				t[s] += a;
				return;
			}
		}
		t[s] += a;
	}
	t.Particles = function(t, n) {
		for (var r = h(n), i = Math.sqrt(n.xSegments * n.xSegments + n.ySegments * n.ySegments) * n.frequency * 300, a = n.xSegments + 1, o = (n.maxHeight - n.minHeight) / i * 1e3, s = Math.floor(r() * n.xSegments), c = Math.floor(r() * n.ySegments), l = r() * .2 - .1, u = r() * .2 - .1, d = 0; d < i; d++) {
			e(t, s, c, a, o, r);
			var f = r() * Math.PI * 2;
			d % 1e3 == 0 && (l = r() * .2 - .1, u = r() * .2 - .1), d % 100 == 0 && (s = Math.floor(n.xSegments * (.5 + l) + Math.cos(f) * r() * n.xSegments * (.5 - Math.abs(l))), c = Math.floor(n.ySegments * (.5 + u) + Math.sin(f) * r() * n.ySegments * (.5 - Math.abs(u))));
		}
	};
})(), t.Perlin = function(e, t) {
	a.seed(h(t)());
	for (var n = (t.maxHeight - t.minHeight) * .5, r = (Math.min(t.xSegments, t.ySegments) + 1) / t.frequency, i = 0, o = t.xSegments + 1, s = t.ySegments + 1; i < o; i++) for (var c = 0; c < s; c++) {
		var l = c * o + i, u = a.perlin(i / r, c / r);
		e[l] += u * n;
	}
}, t.PerlinDiamond = function(e, n) {
	t.MultiPass(e, n, [
		{ method: t.Perlin },
		{
			method: t.DiamondSquare,
			amplitude: .75
		},
		{ method: function(e, n) {
			return t.SmoothMedian(e, n);
		} }
	]);
}, t.PerlinLayers = function(e, n) {
	t.MultiPass(e, n, [
		{
			method: t.Perlin,
			frequency: 1.25
		},
		{
			method: t.Perlin,
			amplitude: .05,
			frequency: 2.5
		},
		{
			method: t.Perlin,
			amplitude: .35,
			frequency: 5
		},
		{
			method: t.Perlin,
			amplitude: .15,
			frequency: 10
		}
	]);
}, t.Simplex = function(e, t) {
	a.seed(h(t)());
	for (var n = (t.maxHeight - t.minHeight) * .5, r = (Math.min(t.xSegments, t.ySegments) + 1) * 2 / t.frequency, i = 0, o = t.xSegments + 1; i < o; i++) for (var s = 0, c = t.ySegments + 1; s < c; s++) e[s * o + i] += a.simplex(i / r, s / r) * n;
}, t.SimplexLayers = function(e, n) {
	t.MultiPass(e, n, [
		{
			method: t.Simplex,
			frequency: 1.25
		},
		{
			method: t.Simplex,
			amplitude: .5,
			frequency: 2.5
		},
		{
			method: t.Simplex,
			amplitude: .25,
			frequency: 5
		},
		{
			method: t.Simplex,
			amplitude: .125,
			frequency: 10
		},
		{
			method: t.Simplex,
			amplitude: .0625,
			frequency: 20
		}
	]);
}, (function() {
	function e(e, t, n, r, i, a, o) {
		if (!(n > r)) {
			var s = 0, c = 0, l = r, u = r, d = Math.floor(r / n), f = -d, p = -d;
			for (s = 0; s <= l; s += d) {
				for (c = 0; c <= u; c += d) {
					var m = c * l + s;
					if (a[m] = o() * i, !(f < 0 && p < 0)) {
						for (var h = a[m], g = a[c * l + (s - d)] || h, _ = a[(c - d) * l + s] || h, v = a[(c - d) * l + (s - d)] || h, y = f; y < s; y++) for (var b = p; b < c; b++) if (y !== f || b !== p) {
							var x = b * l + y;
							if (!(x < 0)) {
								var S = (y - f) / d, C = (b - p) / d, w = S * _ + (1 - S) * v;
								a[x] = C * (S * h + (1 - S) * g) + (1 - C) * w;
							}
						}
						p = c;
					}
				}
				f = s, p = -d;
			}
			for (s = 0, l = t.xSegments + 1; s < l; s++) for (c = 0, u = t.ySegments + 1; c < u; c++) {
				var T = c * l + s, E = c * r + s;
				e[T] += a[E];
			}
		}
	}
	t.Value = function(r, i) {
		for (var a = h(i), o = n(Math.max(i.xSegments, i.ySegments) + 1), s = new Float64Array((o + 1) * (o + 1)), c = i.maxHeight - i.minHeight, l = 2; l < 7; l++) e(r, i, 2 ** l, o, c * 2 ** (2.4 - l * 1.2), s, a);
		t.Clamp(r, {
			maxHeight: i.maxHeight,
			minHeight: i.minHeight,
			stretch: !0
		});
	};
})(), t.Weierstrass = function(e, n) {
	for (var r = h(n), i = (n.maxHeight - n.minHeight) * .5, a = r() < .5 ? 1 : -1, o = r() < .5 ? 1 : -1, s = .5 + r() * 1, c = .5 + r() * 1, l = .025 + r() * .1, u = -1 + r() * 2, d = .5 + r() * 1, f = .5 + r() * 1, p = .025 + r() * .1, m = -1 + r() * 2, g = 0, _ = n.xSegments + 1; g < _; g++) for (var v = 0, y = n.ySegments + 1; v < y; v++) {
		for (var b = 0, x = 0; x < 20; x++) {
			var S = (1 + s) ** +-x * Math.sin((1 + c) ** +x * (g + .25 * Math.cos(v) + u * v) * l), C = (1 + d) ** +-x * Math.sin((1 + f) ** +x * (v + .25 * Math.cos(g) + m * g) * p);
			b -= Math.exp(a * S * S + o * C * C);
		}
		e[v * _ + g] += b * i;
	}
	t.Clamp(e, n);
};
//#endregion
//#region src/grass.js
var v;
function y(e) {
	var t = Math.sin(e * 12.9898) * 43758.5453;
	return t - Math.floor(t);
}
function b(e, t, n, r, i, a, o) {
	var s = r * .5;
	e.fillStyle = o, e.beginPath(), e.moveTo(t - s, n), e.quadraticCurveTo(t - r * .45 - a, n - i * .45, t + a, n - i), e.quadraticCurveTo(t + r * .35 + a, n - i * .45, t + s, n), e.closePath(), e.fill();
}
function x(e, t) {
	var n = Math.sin(e * 127.1 + t * 311.7) * 43758.5453;
	return n - Math.floor(n);
}
function S(e, t) {
	var n = Math.floor(e), r = Math.floor(t), i = e - n, a = t - r, o = i * i * (3 - 2 * i), s = a * a * (3 - 2 * a), c = x(n, r), l = x(n + 1, r), u = x(n, r + 1), d = x(n + 1, r + 1), f = c + (l - c) * o;
	return f + (u + (d - u) * o - f) * s;
}
function C(e, t) {
	var n = S(e * .009, t * .009), r = S(e * .026 + 17.3, t * .026 - 9.1);
	return n * .78 + r * .22;
}
function w(e, t) {
	var n = C(e, t), r = Math.max(0, Math.min(1, (n - .36) / .32));
	return .15 + r * r * (3 - 2 * r) * .85;
}
function T(e, t) {
	t ||= [
		-80,
		-35,
		20,
		50
	];
	var n = Math.max(1e-4, t[1] - t[0]), r = Math.max(1e-4, t[3] - t[2]), i = Math.max(0, Math.min(1, (e - t[0]) / n)), a = Math.max(0, Math.min(1, (e - t[2]) / r)), o = i * i * (3 - 2 * i), s = a * a * (3 - 2 * a);
	return Math.max(0, Math.min(1, o - s));
}
function E(e, t) {
	if (t ||= [.47123889803846897, .7853981633974483], typeof e != "number" || !isFinite(e)) return 1;
	var n = Math.min(t[0], t[1]), r = Math.max(t[0], t[1]);
	if (e <= n) return 1;
	if (e >= r) return 0;
	var i = (e - n) / Math.max(1e-4, r - n);
	return 1 - i * i * (3 - 2 * i);
}
function D(e, t, n, r) {
	return T(e, n) * E(t, r);
}
function O(e, t, n, r, i) {
	n ||= [
		-80,
		-35,
		20,
		50
	], r ||= [.47123889803846897, .7853981633974483];
	var a = n[1], o = n[2], s = Math.min(typeof i == "number" ? Math.max(0, i) : 8, (o - a) * .5);
	if (e <= a || e >= o || typeof t == "number" && isFinite(t) && t > r[0]) return 0;
	var c = s ? (e - a) / s : 1, l = s ? (o - e) / s : 1, u = Math.max(0, Math.min(1, c)), d = Math.max(0, Math.min(1, l));
	return u = u * u * (3 - 2 * u), d = d * d * (3 - 2 * d), u * d;
}
function k(t) {
	if (t ||= {}, v && !t.newTexture) return v;
	var n = t.size || 256, r = document.createElement("canvas"), i = r.getContext("2d");
	r.width = n, r.height = n, i.clearRect(0, 0, n, n);
	for (var a = typeof t.clusterCount == "number" ? t.clusterCount : 5, o = typeof t.minBlades == "number" ? t.minBlades : 3, s = typeof t.bladeRange == "number" ? t.bladeRange : 3, c = typeof t.clusterSpread == "number" ? t.clusterSpread : .18, l = typeof t.bladeWidthMin == "number" ? t.bladeWidthMin : .022, u = typeof t.bladeWidthRange == "number" ? t.bladeWidthRange : .028, d = 0; d < a; d++) for (var f = a === 1 ? n * .5 : (.05 + y(d * 3 + 1) * .9) * n, p = n * (.78 + y(d * 3 + 2) * .18), m = o + Math.floor(y(d * 3 + 3) * (s + 1)), h = 0; h < m; h++) {
		var g = d * 32 + h, _ = f + (y(g + 1) - .5) * n * c, x = n * (.28 + y(g + 2) * .62), S = n * (l + y(g + 3) * u), C = (y(g + 4) - .5) * n * .06, w = 150 + Math.floor(y(g + 5) * 75), T = 35 + Math.floor(y(g + 6) * 45), E = 34 + Math.floor(y(g + 7) * 40);
		b(i, _, p, S, x, C, "rgb(" + T + ", " + w + ", " + E + ")"), h % 3 == 0 && b(i, _ + S * .18, p, S * .35, x * .92, C * .7, "rgb(224, 240, 118)");
	}
	var D = new e.CanvasTexture(r);
	return D.colorSpace = e.SRGBColorSpace, D.minFilter = e.LinearMipmapLinearFilter, D.magFilter = e.LinearFilter, D.needsUpdate = !0, t.newTexture || (v = D), D;
}
function A(t, n) {
	for (var r = t * .5, i = [], a = [], o = [], s = [], c = [
		0,
		Math.PI / 3,
		2 * Math.PI / 3
	], l = [
		[
			-r,
			0,
			0,
			0
		],
		[
			r,
			0,
			1,
			0
		],
		[
			r,
			n,
			1,
			1
		],
		[
			-r,
			n,
			0,
			1
		]
	], u = 0; u < c.length; u++) {
		for (var d = c[u], f = Math.cos(d), p = Math.sin(d), m = p, h = f, g = i.length / 3, _ = 0; _ < l.length; _++) {
			var v = l[_], y = v[0];
			i.push(y * f, v[1], -y * p), a.push(m, 0, h), o.push(v[2], v[3]);
		}
		s.push(g, g + 1, g + 2, g, g + 2, g + 3);
	}
	var b = new e.BufferGeometry();
	return b.setAttribute("position", new e.Float32BufferAttribute(i, 3)), b.setAttribute("normal", new e.Float32BufferAttribute(a, 3)), b.setAttribute("uv", new e.Float32BufferAttribute(o, 2)), b.setIndex(s), b.computeBoundingSphere(), b;
}
function j(t, n, r) {
	r ||= 4;
	for (var i = [], a = [], o = [], s = [], c = [
		0,
		.2,
		.45,
		.72,
		1
	], l = [
		.75,
		.9,
		.55,
		.28,
		.02
	], u = [
		0,
		.08,
		.3,
		.65,
		1
	], d = 0; d < r; d++) for (var f = d * 23 + 7, p = y(f + 1) * Math.PI * 2, m = Math.sqrt(y(f + 2)) * t * .28, h = Math.cos(p) * m, g = Math.sin(p) * m, _ = y(f + 3) * Math.PI * 2, v = n * (.55 + y(f + 4) * .45), b = t * (.005 + y(f + 5) * .009), x = v * (.06 + y(f + 6) * .22), S = .88 + y(f + 7) * .24, C = (.28 + y(f + 8) * .18) * S, w = (.52 + y(f + 9) * .24) * S, T = (.1 + y(f + 10) * .08) * S, E = 0; E < 2; E++) {
		for (var D = _ + E * Math.PI * .5, O = Math.cos(D) * x, k = Math.sin(D) * x, A = Math.cos(D) * b * .12, j = Math.sin(D) * b * .12, M = i.length / 3, N = 0; N < c.length; N++) {
			var P = c[N], F = h + O * u[N] + A * Math.sin(P * Math.PI), I = g + k * u[N] + j * Math.sin(P * Math.PI), L = b * .5 * l[N], R = F - Math.sin(D) * L, z = I + Math.cos(D) * L, B = F + Math.sin(D) * L, V = I - Math.cos(D) * L, H = S * (.88 + P * .24), U = [
				R,
				v * P,
				z
			], W = [
				B,
				v * P,
				V
			];
			i.push(U[0], U[1], U[2], W[0], W[1], W[2]), a.push(0, P, 1, P), o.push(C * H, w * H, T * H, C * H, w * H, T * H);
		}
		for (var G = 0; G < c.length - 1; G++) {
			var K = M + G * 2, q = K + 2;
			s.push(K, K + 1, q + 1, K, q + 1, q);
		}
	}
	var J = new e.BufferGeometry();
	return J.setAttribute("position", new e.Float32BufferAttribute(i, 3)), J.setAttribute("uv", new e.Float32BufferAttribute(a, 2)), J.setAttribute("color", new e.Float32BufferAttribute(o, 3)), J.setIndex(s), J.computeVertexNormals(), J.computeBoundingSphere(), J;
}
function M(t, n) {
	var r = !!n, i = {
		alphaTest: r && typeof t.alphaTest == "number" ? t.alphaTest : 0,
		color: t.color || 16777215,
		depthWrite: !0,
		emissive: t.emissive || 0,
		emissiveIntensity: typeof t.emissiveIntensity == "number" ? t.emissiveIntensity : 1,
		fog: !0,
		side: e.DoubleSide,
		vertexColors: !r,
		transparent: !1
	};
	n && (i.map = n);
	var a = new e.MeshLambertMaterial(i), o = {
		time: { value: 0 },
		windDirection: { value: new e.Vector2(.8, .35) },
		windSpeed: { value: typeof t.windSpeed == "number" ? t.windSpeed : 1.2 },
		windStrength: { value: typeof t.windStrength == "number" ? t.windStrength : 7 },
		minimumLight: { value: typeof t.minimumLight == "number" ? t.minimumLight : 1 }
	};
	return a.userData.grassUniforms = o, a.onBeforeCompile = function(e) {
		e.uniforms.grassTime = o.time, e.uniforms.grassWindDirection = o.windDirection, e.uniforms.grassWindSpeed = o.windSpeed, e.uniforms.grassWindStrength = o.windStrength, e.uniforms.grassMinimumLight = o.minimumLight, e.vertexShader = e.vertexShader.replace("#include <common>", "#include <common>\nuniform float grassTime;\nuniform vec2 grassWindDirection;\nuniform float grassWindSpeed;\nuniform float grassWindStrength;"), e.vertexShader = e.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nfloat grassHeight = smoothstep(0.0, 1.0, uv.y);\nfloat grassPatchX = modelMatrix[3].x;\nfloat grassPatchZ = modelMatrix[3].z;\n#ifdef USE_INSTANCING\ngrassPatchX += instanceMatrix[3].x;\ngrassPatchZ += instanceMatrix[3].y;\n#endif\nfloat grassPhase = dot(vec2(grassPatchX, grassPatchZ), grassWindDirection) * 0.012 + grassTime * grassWindSpeed;\nfloat grassGust = sin(grassPhase) * 0.7 + sin(grassPhase * 0.43 + 1.7) * 0.3;\nfloat grassBend = grassGust * grassWindStrength * grassHeight * grassHeight;\ntransformed += vec3(grassWindDirection.x, 0.0, grassWindDirection.y) * grassBend;"), e.fragmentShader = e.fragmentShader.replace("uniform float opacity;", "uniform float opacity;\nuniform float grassMinimumLight;"), e.fragmentShader = e.fragmentShader.replace("vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;", "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\noutgoingLight = max(outgoingLight, diffuseColor.rgb * grassMinimumLight);");
	}, a;
}
function N(t) {
	t ||= {};
	var n = t.texture || (t.textureOptions ? k(t.textureOptions) : null) || t.material && t.material.map, r = t.material || M(t, n), i = n ? A(t.width || 12, t.height || 18) : j(t.width || 12, t.height || 18, t.bladeCount || 3), a = new e.Mesh(i, r);
	return a.name = t.name || "DenseGrass", a.userData.grassMaterial = r, a;
}
function P(e, t) {
	if (!e) return e;
	var n = e.userData && e.userData.grassMaterial || e.material, r = n && n.userData && n.userData.grassUniforms;
	return r && (r.time.value = t), e;
}
function F(t, n, r) {
	if (!t || !n) return t;
	var i = typeof r == "number" ? r : 0, a = i > 0 && i !== Infinity ? i * i : Infinity, o = n.getWorldPosition(new e.Vector3()), s = new e.Vector3(), c = new e.Matrix4(), l = Date.now();
	return t.traverse(function(e) {
		if (!(!e.isInstancedMesh || !e.userData.instancedLOD)) {
			var t = e.userData.instancedLOD, n = !t.cameraPosition || t.cameraPosition.distanceToSquared(o) > 4, r = t.lastDistance !== i;
			if (!t.initialized || n || r || l - t.lastUpdate > 250) {
				e.updateMatrixWorld(!0);
				for (var u = 0, d = 0; d < t.positions.length / 3; d++) s.fromArray(t.positions, d * 3).applyMatrix4(e.matrixWorld), s.distanceToSquared(o) <= a && (c.fromArray(t.matrices, d * 16), e.setMatrixAt(u, c), t.colors && e.instanceColor && e.instanceColor.setXYZ(u, t.colors[d * 3], t.colors[d * 3 + 1], t.colors[d * 3 + 2]), u++);
				e.count = u, e.instanceMatrix.needsUpdate = !0, e.instanceColor && (e.instanceColor.needsUpdate = !0), t.initialized = !0, t.visibleCount = u, t.lastDistance = i, t.lastUpdate = l, t.cameraPosition = o.clone();
			}
		}
	}), t;
}
function I(e, n) {
	n ||= {};
	var r = {};
	for (var i in n) n.hasOwnProperty(i) && (r[i] = n[i]);
	return r.mesh = n.mesh || N(n), t.ScatterMeshes(e, r);
}
t.createGrassTexture = k, t.createGrass = N, t.grassPatchNoise = C, t.grassClusterWeight = w, t.grassTextureWeight = T, t.grassSlopeWeight = E, t.grassMaterialWeight = D, t.grassMeshWeight = O, t.updateGrass = P, t.ScatterGrass = I, t.fromHeightmap = function(e, t, n) {
	var r = document.createElement("canvas"), i = r.getContext("2d"), a = t.ySegments + 1, o = t.xSegments + 1, s = t.maxHeight - t.minHeight;
	r.width = o, r.height = a;
	var c = n || t.heightmap;
	if (!c) {
		console.error("No heightmap image provided");
		return;
	}
	i.drawImage(c, 0, 0, r.width, r.height);
	for (var l = i.getImageData(0, 0, r.width, r.height).data, u = 0; u < a; u++) for (var d = 0; d < o; d++) {
		var f = u * o + d, p = f * 4;
		e[f] = (l[p] + l[p + 1] + l[p + 2]) / 765 * s + t.minHeight;
	}
}, t.toHeightmap = function(e, t) {
	var n = t.maxHeight !== void 0, r = t.minHeight !== void 0, i = n ? t.maxHeight : -Infinity, a = r ? t.minHeight : Infinity;
	if (!n || !r) {
		for (var o = i, s = a, c = 2, l = e.length; c < l; c += 3) e[c] > o && (o = e[c]), e[c] < s && (s = e[c]);
		n || (i = o), r || (a = s);
	}
	var u = t.heightmap instanceof HTMLCanvasElement ? t.heightmap : document.createElement("canvas"), d = u.getContext("2d"), f = t.ySegments + 1, p = t.xSegments + 1, m = i - a;
	u.width = p, u.height = f;
	for (var h = d.createImageData(u.width, u.height), g = h.data, _ = 0; _ < f; _++) for (var v = 0; v < p; v++) {
		var y = _ * p + v, b = y * 4;
		g[b] = g[b + 1] = g[b + 2] = Math.round((e[y * 3 + 2] - a) / m * 255), g[b + 3] = 255;
	}
	return d.putImageData(h, 0, 0), u;
}, t.Influences = {
	Mesa: function(e) {
		return 1.25 * Math.min(.8, Math.exp(-(e * e)));
	},
	Hole: function(e) {
		return -t.Influences.Mesa(e);
	},
	Hill: function(e) {
		return e < 0 ? (e + 1) * (e + 1) * (3 - 2 * (e + 1)) : 1 - e * e * (3 - 2 * e);
	},
	Valley: function(e) {
		return -t.Influences.Hill(e);
	},
	Dome: function(e) {
		return -(e + 1) * (e - 1);
	},
	Flat: function(e) {
		return 0;
	},
	Volcano: function(e) {
		return .94 - .32 * (Math.abs(2 * e) + Math.cos(2 * Math.PI * Math.abs(e) + .4));
	}
}, t.Influence = function(n, r, i, a, o, s, c, l, u) {
	i ||= t.Influences.Hill, a = a === void 0 ? .5 : a, o = o === void 0 ? .5 : o, s = s === void 0 ? 64 : s, c = c === void 0 ? 64 : c, l = l === void 0 ? e.NormalBlending : l, u ||= t.EaseIn;
	for (var d = r.xSegments + 1, f = r.ySegments + 1, p = d * a, m = f * o, h = r.xSize / r.xSegments, g = r.ySize / r.ySegments, _ = s / h, v = s / g, y = 1 / s, b = Math.ceil(p - _), x = Math.floor(p + _), S = Math.ceil(m - v), C = Math.floor(m + v), w = b; w < x; w++) for (var T = S; T < C; T++) {
		var E = T * d + w, D = (w - p) * h, O = (T - m) * g, k = Math.sqrt(D * D + O * O), A = k * y, j = D * y, M = O * y, N = i(A, j, M) * c * (1 - u(A, j, M));
		k > s || n[E] === void 0 || (l === e.AdditiveBlending ? n[E] += N : l === e.SubtractiveBlending ? n[E] -= N : l === e.MultiplyBlending ? n[E] *= N : l === e.NoBlending ? n[E] = N : l === e.NormalBlending ? n[E] = u(A, j, M) * n[E] + N : typeof l == "function" && (n[E] = l(n[E].z, N, A, j, M)));
	}
};
//#endregion
//#region src/materials.js
function L(t, n) {
	function r(e) {
		return e === (e | 0) ? e + ".0" : e + "";
	}
	for (var i = "", a = "", o = t[0].texture.repeat, s = t[0].texture.offset, c = 0, l = t.length; c < l; c++) if (t[c].texture.wrapS = t[c].texture.wrapT = e.RepeatWrapping, t[c].texture.source && (t[c].texture.colorSpace = e.SRGBColorSpace), t[c].texture.needsUpdate = !0, i += "uniform sampler2D texture_" + c + ";\n", c !== 0) {
		var u = t[c].levels, d = t[c].glsl, f = u !== void 0, p = t[c].texture.repeat, m = t[c].texture.offset;
		if (f) {
			u[1] - u[0] < 1 && --u[0], u[3] - u[2] < 1 && (u[3] += 1);
			for (var h = 0; h < u.length; h++) u[h] = r(u[h]);
		}
		var g = f ? "1.0 - smoothstep(" + u[0] + ", " + u[1] + ", vPosition.z) + smoothstep(" + u[2] + ", " + u[3] + ", vPosition.z)" : d;
		a += "        color = mix( texture2D( texture_" + c + ", MyvUv * vec2( " + r(p.x) + ", " + r(p.y) + " ) + vec2( " + r(m.x) + ", " + r(m.y) + " ) ), color, max(min(" + g + ", 1.0), 0.0));\n";
	}
	var _ = "// Calculate terrain slope for texture blending\n    float slope = acos(max(min(dot(normalize(myNormal), vec3(0.0, 0.0, 1.0)), 1.0), -1.0));\n    diffuseColor = vec4( diffuse, opacity );\n    vec4 color = texture2D( texture_0, MyvUv * vec2( " + r(o.x) + ", " + r(o.y) + " ) + vec2( " + r(s.x) + ", " + r(s.y) + " ) ); // base\n" + a + "    // Enhance saturation of the final color\n    vec3 grayScale = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));\n    color.rgb = mix(grayScale, color.rgb, 1.3);\n    diffuseColor = color;\n", v = i + "\nvarying vec2 MyvUv;\nvarying vec3 vPosition;\nvarying vec3 myNormal;\n", y = n || new e.MeshPhongMaterial({
		side: e.DoubleSide,
		shininess: 5,
		specular: new e.Color(1118481),
		flatShading: !1
	});
	return y.onBeforeCompile = function(e) {
		e.vertexShader = e.vertexShader.replace("#include <common>", "varying vec2 MyvUv;\nvarying vec3 vPosition;\nvarying vec3 myNormal;\n#include <common>"), e.vertexShader = e.vertexShader.replace("#include <uv_vertex>", "MyvUv = uv;\nvPosition = position;\nmyNormal = normal;\n#include <uv_vertex>"), e.vertexShader = e.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\n#ifdef USE_INSTANCING\nmyNormal = mat3(instanceMatrix) * myNormal;\n#endif"), e.fragmentShader = e.fragmentShader.replace("#include <common>", v + "\n#include <common>"), e.fragmentShader = e.fragmentShader.replace("#include <map_fragment>", _);
		for (var n = 0, r = t.length; n < r; n++) e.uniforms["texture_" + n] = {
			type: "t",
			value: t[n].texture
		};
	}, y;
}
t.generateBlendedMaterial = L;
//#endregion
//#region src/tint.js
function R(t) {
	if (!t) return null;
	var n = Array.isArray(t) ? t[0] : t.min, r = Array.isArray(t) ? t[1] : t.max;
	return n === void 0 || r === void 0 ? null : {
		min: new e.Color(n),
		max: new e.Color(r)
	};
}
function z(e, t) {
	return typeof e.onBeforeCompile == "function" && (t.onBeforeCompile = e.onBeforeCompile), typeof e.customProgramCacheKey == "function" && (t.customProgramCacheKey = e.customProgramCacheKey), t;
}
function B(e) {
	if (Array.isArray(e)) return e.map(function(e) {
		var t = z(e, e.clone());
		return t.vertexColors = !0, t.needsUpdate = !0, t;
	});
	var t = z(e, e.clone());
	return t.vertexColors = !0, t.needsUpdate = !0, t;
}
function V(t) {
	var n = t.clone();
	if (!n.getAttribute("color") && n.getAttribute("position")) {
		var r = new Float32Array(n.getAttribute("position").count * 3);
		r.fill(1), n.setAttribute("color", new e.BufferAttribute(r, 3));
	}
	return n;
}
//#endregion
//#region src/scatter.js
function H(e, t, n, r, i, a, o) {
	var s = h(o);
	if (e.position.addVectors(t, n).add(r).divideScalar(3), o.positionJitter > 0) {
		var c = s(), l = s();
		c + l > 1 && (c = 1 - c, l = 1 - l);
		var u = 1 - c - l, d = Math.max(0, o.positionJitter), f = t.x * u + n.x * c + r.x * l, p = t.y * u + n.y * c + r.y * l, m = t.z * u + n.z * c + r.z * l;
		e.position.x += (f - e.position.x) * d, e.position.y += (p - e.position.y) * d, e.position.z += (m - e.position.z) * d;
	}
	if (o.maxTilt > 0) {
		var g = e.position.clone().add(i);
		e.lookAt(g);
		var _ = i.angleTo(a);
		if (_ > o.maxTilt) {
			var v = o.maxTilt / _;
			e.rotation.x *= v, e.rotation.y *= v, e.rotation.z *= v;
		}
	}
	if (e.rotation.x += 90 / 180 * Math.PI, o.randomRotationAxis === "z" ? e.rotateZ(s() * 2 * Math.PI) : e.rotateY(s() * 2 * Math.PI), o.sizeRange) {
		var y = o.sizeRange, b = s();
		typeof y.easing == "function" && (b = y.easing(b)), b = Math.max(0, Math.min(1, b)), Array.isArray(y.x) && y.x.length > 1 && (e.scale.x *= y.x[0] + (y.x[1] - y.x[0]) * b), Array.isArray(y.y) && y.y.length > 1 && (e.scale.y *= y.y[0] + (y.y[1] - y.y[0]) * b), Array.isArray(y.z) && y.z.length > 1 && (e.scale.z *= y.z[0] + (y.z[1] - y.z[0]) * b);
	}
	if (o.sizeVariance) {
		var x = s() * o.sizeVariance * 2 - o.sizeVariance;
		o.nonUniformSizeVariance ? (e.scale.x *= 1 + x, e.scale.y *= 1 + x * (.75 + s() * .5), e.scale.z *= 1 + (s() * o.sizeVariance * 2 - o.sizeVariance)) : (e.scale.x = e.scale.z = 1 + x, e.scale.y += x);
	}
	e.updateMatrix();
}
function U(e) {
	var t = typeof e.minimumDistance == "number" ? Math.max(0, e.minimumDistance) : 0, n = e.minimumDistanceGroup;
	return !n || t <= 0 ? null : (typeof n.minimumDistance != "number" && (n.minimumDistance = t), Array.isArray(n.positions) || (n.positions = []), t = n.minimumDistance, {
		distanceSquared: t * t,
		positions: n.positions
	});
}
function W(e, t) {
	if (!t) return !0;
	for (var n = 0; n < t.positions.length; n++) {
		var r = t.positions[n], i = r.x - e.x, a = r.y - e.y;
		if (i * i + a * a < t.distanceSquared) return !1;
	}
	return t.positions.push({
		x: e.x,
		y: e.y
	}), !0;
}
function G(e, t, n) {
	if (!t) return !1;
	var r = n * n, i = t.positions;
	if (Array.isArray(i)) for (var a = 0; a < i.length; a++) {
		var o = i[a].x - e.x, s = i[a].y - e.y;
		if (o * o + s * s < r) return !0;
	}
	if (!t.occupied) return !1;
	for (var c = Math.max(.001, t.cellSize || t.minimumDistance || n), l = Math.floor(e.x / c), u = Math.floor(e.y / c), d = Math.ceil(n / c) + 1, f = t.occupied, p = l - d; p <= l + d; p++) for (var m = u - d; m <= u + d; m++) {
		var h = f[p + ":" + m];
		if (h) for (var g = 0; g < h.length; g++) {
			var _ = h[g].x - e.x, v = h[g].y - e.y;
			if (_ * _ + v * v < r) return !0;
		}
	}
	return !1;
}
t.isNearScatterGroup = G;
function K(t, n) {
	var r = h(n);
	t.computeBoundingBox();
	var i = (t.index ? t.toNonIndexed() : t).attributes.position.array, a = i.length / 9, o = Math.max(1, Math.floor(n.sampleCount || a)), s = t.boundingBox, c = s ? Math.max(1, (s.max.x - s.min.x) * (s.max.y - s.min.y)) : 1, l = n.minimumDistanceGroup, u = typeof n.minimumDistance == "number" && n.minimumDistance > 0 ? n.minimumDistance : typeof n.randomDistributionMinDistance == "number" ? Math.max(0, n.randomDistributionMinDistance) : Math.sqrt(c / o) * .34, d, f, p, m = [], g = new e.Vector3(), _ = new e.Vector3(), v = new e.Vector3(), y = new e.Vector3(), b = new e.Vector3();
	l ? (typeof l.minimumDistance != "number" && (l.minimumDistance = u), u = l.minimumDistance, typeof l.cellSize != "number" && (l.cellSize = Math.max(1, u)), l.occupied ||= {}, p = l.occupied, f = l.cellSize) : (f = Math.max(1, u), p = {}), d = u * u;
	for (var x = 0; x < o; x++) {
		var S = Math.floor(r() * a), C = S * 9;
		g.fromArray(i, C), _.fromArray(i, C + 3), v.fromArray(i, C + 6), e.Triangle.getNormal(g, _, v, y);
		var w = r(), T = r();
		w + T > 1 && (w = 1 - w, T = 1 - T);
		var E = 1 - w - T;
		if (b.set(g.x * E + _.x * w + v.x * T, g.y * E + _.y * w + v.y * T, g.z * E + _.z * w + v.z * T), typeof n.spread == "function") {
			if (!n.spread(b, S, y, C)) continue;
		} else if (typeof n.spread == "number" && r() >= n.spread) continue;
		if (!(typeof n.filter == "function" && !n.filter(b, y, S, C))) {
			if (u > 0) {
				for (var D = Math.floor(b.x / f), O = Math.floor(b.y / f), k = !1, A = D - 2; A <= D + 2 && !k; A++) for (var j = O - 2; j <= O + 2; j++) {
					var M = p[A + ":" + j];
					if (M) for (var N = 0; N < M.length; N++) {
						var P = M[N].x - b.x, F = M[N].y - b.y;
						if (P * P + F * F < d) {
							k = !0;
							break;
						}
					}
					if (k) break;
				}
				if (k) continue;
				var I = D + ":" + O;
				p[I] || (p[I] = []), p[I].push({
					x: b.x,
					y: b.y
				});
			}
			var L = .01, R = g.clone().add(_).add(v).divideScalar(3);
			g.sub(R).multiplyScalar(L).add(b), _.sub(R).multiplyScalar(L).add(b), v.sub(R).multiplyScalar(L).add(b), m.push(g.x, g.y, g.z, _.x, _.y, _.z, v.x, v.y, v.z);
		}
	}
	var z = new e.BufferGeometry();
	return z.setAttribute("position", new e.Float32BufferAttribute(m, 3)), z;
}
//#endregion
//#region src/analysis.js
t.ScatterMeshes = function(n, r) {
	if (!r.mesh) {
		console.error("options.mesh is required for THREE.Terrain.ScatterMeshes but was not passed");
		return;
	}
	r.scene ||= new e.Object3D();
	var i = {
		spread: .025,
		smoothSpread: 0,
		sizeVariance: .1,
		random: Math.random,
		randomness: null,
		maxSlope: .6283185307179586,
		maxTilt: Infinity,
		randomRotationAxis: "y",
		positionJitter: 0,
		instancesPerFace: 1,
		sizeRange: null,
		minimumDistance: 0,
		minimumDistanceGroup: null,
		w: 0,
		h: 0,
		instanced: !1,
		tintRange: null,
		filter: null
	};
	for (var a in i) i.hasOwnProperty(a) && (r[a] = r[a] === void 0 ? i[a] : r[a]);
	typeof r.randomness != "function" && (r.randomness = r.random);
	var o = h(r);
	r.randomDistribution && (n = K(n, r), r.spread = function() {
		return !0;
	}, r.positionJitter = 0);
	var s = !!r.instanced && r.mesh.isMesh && !r.mesh.children.length, c = R(r.tintRange), l = s ? [] : null, u = s ? new e.Object3D() : null, d = typeof r.spread == "number", f, p, m = 1 / r.smoothSpread, g = new e.Vector3(), _ = new e.Vector3(), v = new e.Vector3(), y = new e.Vector3(), b = Math.max(1, Math.floor(r.instancesPerFace)), x = r.randomDistribution ? null : U(r), S = r.mesh.up.clone().applyAxisAngle(new e.Vector3(1, 0, 0), .5 * Math.PI);
	r.instanced && !s && console.warn("THREE.Terrain.ScatterMeshes can only instance a single THREE.Mesh; falling back to clones"), c && !s && console.warn("THREE.Terrain.ScatterMeshes applies tintRange only when instanced is true"), d && (f = r.randomness(), p = typeof f == "number" ? o : function(e) {
		return f[e];
	}), n.index && (n = n.toNonIndexed());
	for (var C = n.attributes.position.array, w = 0; w < n.attributes.position.array.length; w += 9) {
		g.set(C[w + 0], C[w + 1], C[w + 2]), _.set(C[w + 3], C[w + 4], C[w + 5]), v.set(C[w + 6], C[w + 7], C[w + 8]), e.Triangle.getNormal(g, _, v, y);
		var T = !1;
		if (d) {
			var E = p(w / 9);
			E < r.spread ? T = !0 : E < r.spread + r.smoothSpread && (T = t.EaseInOut((E - r.spread) * m) * r.spread > o());
		} else T = r.spread(g, w / 9, y, w);
		if (T && typeof r.filter == "function" && !r.filter(g, y, w / 9, w) && (T = !1), T) {
			if (y.angleTo(S) > r.maxSlope) continue;
			for (var D = 0; D < b; D++) if (W(g.clone().add(_).add(v).divideScalar(3), x)) {
				if (s) {
					u.position.copy(r.mesh.position), u.quaternion.copy(r.mesh.quaternion), u.scale.copy(r.mesh.scale), H(u, g, _, v, y, S, r);
					var O = {
						matrix: u.matrix.clone(),
						position: u.position.clone()
					};
					c && (O.tint = new e.Color().lerpColors(c.min, c.max, o())), l.push(O);
				} else {
					var k = r.mesh.clone();
					H(k, g, _, v, y, S, r), r.scene.add(k);
				}
			}
		}
	}
	if (s && l.length) {
		var A = c ? V(r.mesh.geometry) : r.mesh.geometry, j = c ? B(r.mesh.material) : r.mesh.material, M = new e.InstancedMesh(A, j, l.length), N = new Float32Array(l.length * 16), P = new Float32Array(l.length * 3), F = c ? new Float32Array(l.length * 3) : null;
		M.name = (r.mesh.name || "ScatteredMesh") + " Instances", M.castShadow = r.mesh.castShadow, M.receiveShadow = r.mesh.receiveShadow, M.frustumCulled = r.mesh.frustumCulled, M.renderOrder = r.mesh.renderOrder;
		for (var I = 0; I < l.length; I++) M.setMatrixAt(I, l[I].matrix), N.set(l[I].matrix.elements, I * 16), P.set(l[I].position.toArray(), I * 3), c && (M.setColorAt(I, l[I].tint), F.set([
			l[I].tint.r,
			l[I].tint.g,
			l[I].tint.b
		], I * 3));
		M.userData.instancedLOD = {
			colors: F,
			matrices: N,
			positions: P,
			initialized: !1,
			lastDistance: -1,
			lastUpdate: 0
		}, M.instanceMatrix.needsUpdate = !0, M.instanceColor && (M.instanceColor.needsUpdate = !0), M.computeBoundingSphere(), r.scene.add(M);
	}
	return r.scene;
}, t.ScatterHelper = function(e, n, r, i) {
	r ||= 1, i ||= .25, n.frequency = n.frequency || 2.5;
	var a = h(n), o = {};
	for (var s in n) n.hasOwnProperty(s) && (o[s] = n[s]);
	o.xSegments *= 2, o.stretch = !0, o.maxHeight = 1, o.minHeight = 0;
	for (var c = t.heightmapArray(e, o), l = 0, u = c.length; l < u; l++) (l % r || a() > i) && (c[l] = 1);
	return function() {
		return c;
	};
}, t.Analyze = function(n, r) {
	if (!n || !n.geometry || !n.geometry.attributes || !n.geometry.attributes.position || n.geometry.attributes.position.count < 3) return console.warn("Not enough vertices to analyze or invalid mesh"), q(r);
	try {
		var i = n.geometry.clone();
		i.index && (i = i.toNonIndexed());
		var a = t.toArray1D(i.attributes.position.array);
		if (!a || a.length === 0) return console.warn("Could not extract elevations from geometry"), q(r);
		var o = Array.from(a).sort(function(e, t) {
			return e - t;
		}), s = a.length, c = J(o, 1), l = J(o, 0), u = J(o, .5), d = ae(o), f = 0, p = 0, m = 0, h = 0, g = n.up.clone().applyAxisAngle(new e.Vector3(1, 0, 0), .5 * Math.PI), _ = [];
		try {
			_ = ee(i, r).map(function(e) {
				return e.angleTo(g) * 180 / Math.PI;
			}).sort(function(e, t) {
				return e - t;
			});
		} catch (e) {
			console.warn("Error calculating slopes:", e), _ = [0];
		}
		var v = _.length, y = J(_, 1), b = J(_, 0), x = J(_, .5), S = ae(_), C = n.position.clone().setZ(d), w, T;
		try {
			w = te(i.attributes.position.array, C), T = w.angleTo(g) * 180 / Math.PI;
		} catch (t) {
			console.warn("Error calculating plane normal:", t), w = new e.Vector3(0, 0, 1), T = 0;
		}
		for (var E = 0, D = 0, O = 0, k = 0, A = r.xSize / r.xSegments * (r.ySize / r.ySegments) * .5, j = 0, M = 0, N = 0, P = new Float32Array(s), F = new Float32Array(v), I = 0, L; I < s; I++) L = o[I] - d, f += L * L, p += L * L * L, P[I] = Math.abs(o[I] - u), m += P[I], h += L * L * L * L;
		for (s > 1 && (p = p / s / (f / (s - 1)) ** 1.5, m = (d - u) / (m / s || 1), h = h * s / (f * f || 1) - 3, f = Math.sqrt(f / s)), Array.prototype.sort.call(P, function(e, t) {
			return e - t;
		}), I = 0; I < v; I++) L = _[I] - S, E += L * L, D += L * L * L, F[I] = Math.abs(_[I] - x), O += F[I], k += L * L * L * L, j += A / Math.cos(_[I] * Math.PI / 180 || .001);
		v > 1 && (D = D / v / (E / (v - 1)) ** 1.5, O = (S - x) / (O / v || 1), k = k * v / (E * E || 1) - 3, E = Math.sqrt(E / v)), Array.prototype.sort.call(F, function(e, t) {
			return e - t;
		});
		try {
			for (var R = r.xSegments + 1, z = r.ySegments + 1, B = 0; B < R; B++) for (var V = 0; V < z; V++) {
				for (var H = -Infinity, U = Infinity, W = i.attributes.position.array[(V * R + B) * 3 + 2], G = 0, K = 0, Z = -1; Z <= 1; Z++) for (var Q = -1; Q <= 1; Q++) if (B + Q >= 0 && V + Z >= 0 && B + Q < R && V + Z < z && (Z !== 0 || Q !== 0)) {
					var $ = i.attributes.position.array[((V + Z) * R + B + Q) * 3 + 2];
					G += $, K++, $ > H && (H = $), $ < U && (U = $);
				}
				K && (M += (G / K - W) * (G / K - W)), (W > H || W < U) && N++;
			}
			M = Math.sqrt(M / s);
			var oe = Math.ceil(R * .5) * Math.ceil(z * .5) * 2;
			N /= oe > 0 ? oe : 1;
		} catch (e) {
			console.warn("Error calculating roughness:", e), M = 0, N = 0;
		}
		return {
			elevation: {
				sampleSize: s,
				max: c,
				min: l,
				range: c - l,
				midrange: (c - l) * .5 + l,
				median: u,
				iqr: J(o, .75) - J(o, .25),
				mean: d,
				stdev: f,
				mad: J(P, .5),
				pearsonSkew: p,
				groeneveldMeedenSkew: m,
				kurtosis: h,
				modes: ne(o, Math.ceil(r.maxHeight - r.minHeight), r.minHeight, r.maxHeight),
				percentile: function(e) {
					return J(o, e);
				},
				percentRank: function(e) {
					return Y(o, e);
				},
				drawHistogram: function(e, t) {
					re(X(o, t, r.minHeight, r.maxHeight), e, r.minHeight, r.maxHeight);
				}
			},
			slope: {
				sampleSize: v,
				max: y,
				min: b,
				range: y - b,
				midrange: (y - b) * .5 + b,
				median: x,
				iqr: J(_, .75) - J(_, .25),
				mean: S,
				stdev: E,
				mad: J(F, .5),
				pearsonSkew: D,
				groeneveldMeedenSkew: O,
				kurtosis: k,
				modes: ne(_, 90, 0, 90),
				percentile: function(e) {
					return J(_, e);
				},
				percentRank: function(e) {
					return Y(_, e);
				},
				drawHistogram: function(e, t) {
					re(X(_, t, 0, 90), e, 0, 90, "°");
				}
			},
			roughness: {
				planimetricAreaRatio: r.xSize * r.ySize / (j || r.xSize * r.ySize),
				terrainRuggednessIndex: M,
				jaggedness: N
			},
			fittedPlane: {
				centroid: C,
				normal: w,
				slope: T,
				pctExplained: ie(i.attributes.position.array, C, w, r.maxHeight - r.minHeight)
			}
		};
	} catch (e) {
		return console.error("Error during terrain analysis:", e), q(r);
	}
};
function q(t) {
	var n = function(e) {
		if (e && e.getContext) {
			var t = e.getContext("2d");
			e.width = 300, e.height = 200, t.clearRect(0, 0, e.width, e.height), t.fillStyle = "rgba(144, 176, 192, 1)", t.font = "12px Arial", t.fillText("No data available for analysis", 10, 100);
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
			drawHistogram: n
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
			drawHistogram: n
		},
		roughness: {
			planimetricAreaRatio: 1,
			terrainRuggednessIndex: 0,
			jaggedness: 0
		},
		fittedPlane: {
			centroid: new e.Vector3(),
			normal: new e.Vector3(0, 0, 1),
			slope: 0,
			pctExplained: 0
		}
	};
}
t.percentile = J;
function J(e, t) {
	if (e.length === 0) return 0;
	if (typeof t != "number") throw TypeError("p must be a number");
	if (t <= 0) return e[0];
	if (t >= 1) return e[e.length - 1];
	var n = e.length * t, r = Math.floor(n), i = r + 1, a = n % 1;
	return i >= e.length ? e[r] : e[r] * (1 - a) + e[i] * a;
}
t.percentRank = Y;
function Y(e, t) {
	if (typeof t != "number") throw TypeError("v must be a number");
	for (var n = 0, r = e.length; n < r; n++) if (t <= e[n]) {
		for (; n < r && t === e[n];) n++;
		return n === 0 ? 0 : (t !== e[n - 1] && (n += (t - e[n - 1]) / (e[n] - e[n - 1])), n / r);
	}
	return 1;
}
t.faceNormals = ee;
function ee(t, n) {
	var r = t.clone();
	r.index && (r = r.toNonIndexed());
	for (var i = r.attributes.position.array, a = i.length / 9, o = Array(a), s = new e.Vector3(), c = new e.Vector3(), l = new e.Vector3(), u = 0; u < a; u++) {
		var d = u * 9;
		s.set(i[d], i[d + 1], i[d + 2]), c.set(i[d + 3], i[d + 4], i[d + 5]), l.set(i[d + 6], i[d + 7], i[d + 8]);
		var f = new e.Vector3().crossVectors(new e.Vector3().subVectors(c, s), new e.Vector3().subVectors(l, s)).normalize();
		o[u] = f;
	}
	return o;
}
t.getFittedPlaneNormal = te;
function te(t, n) {
	var r = t.length / 3, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0;
	if (r < 3) throw Error("At least three points are required to fit a plane");
	for (var u = new e.Vector3(), d = 0, f = t.length; d < f; d += 3) {
		var p = t[d] - n.x, m = t[d + 1] - n.y, h = t[d + 2] - n.z;
		i += p * p, a += p * m, o += p * h, s += m * m, c += m * h, l += h * h;
	}
	var g = s * l - c * c, _ = i * l - o * o, v = i * s - a * a;
	return g >= _ && g >= v ? u.set(g, a * l - o * c, o * s - a * c) : _ >= g && _ >= v ? u.set(a * l - o * c, _, a * o - c * i) : u.set(o * s - a * c, a * o - c * i, v), u.z < 0 && u.negate(), u.normalize();
}
t.bucketNumbersLinearly = X;
function X(e, t, n, r) {
	var i = 0, a = e.length;
	if (n === void 0) for (n = Infinity, r = -Infinity, i = 0; i < a; i++) e[i] < n && (n = e[i]), e[i] > r && (r = e[i]);
	n === r && (r = n + 1);
	var o = (r - n) / t, s = Array(t);
	for (i = 0; i < t; i++) s[i] = [];
	for (i = 0; i < a; i++) {
		var c = Math.max(n, Math.min(r, e[i]));
		if (c === r) s[t - 1].push(c);
		else {
			var l = Math.floor((c - n) / o);
			l = Math.max(0, Math.min(t - 1, l)), s[l].push(c);
		}
	}
	return s;
}
t.getModes = ne;
function ne(e, t, n, r) {
	if (!e || e.length === 0) return [];
	n === r && (r = n + 1);
	for (var i = X(e, t, n, r), a = 0, o = [], s = 0, c = i.length; s < c; s++) i[s].length > a ? (a = i[s].length, o = [n + (s + .5) / t * (r - n)]) : i[s].length === a && a > 0 && o.push(n + (s + .5) / t * (r - n));
	if (o.length === 0) return [];
	for (var l = 0; l < o.length; l++) Math.abs(o[l] - Math.round(o[l])) < .001 ? o[l] = Math.round(o[l]) : o[l] = parseFloat(o[l].toFixed(3));
	return o;
}
t.drawHistogram = re;
function re(e, t, n, r, i) {
	if (!t || !t.getContext) {
		console.warn("Invalid canvas for histogram drawing");
		return;
	}
	var a = t.getContext("2d"), o = 280, s = 180, c = 10, l = 4, u = r === void 0 ? -Infinity : r, d = n === void 0 ? Infinity : n, f = e.length, p;
	if (t.width = o + c * 2, t.height = s + c * 2, a.clearRect(0, 0, t.width, t.height), i === void 0 && (i = ""), u === -Infinity || d === Infinity) for (p = 0; p < f; p++) for (var m = 0, h = e[p].length; m < h; m++) e[p][m] > u && (u = e[p][m]), e[p][m] < d && (d = e[p][m]);
	d === u && (u = d + 1);
	var g = 0, _ = 0;
	for (p = 0; p < f; p++) e[p].length > g && (g = e[p].length), _ += e[p].length;
	if (_ === 0 || g === 0) {
		a.fillStyle = "rgba(144, 176, 192, 1)", a.font = "12px Arial", a.fillText("No data available", c + 10, c + s / 2), a.strokeStyle = "rgba(13, 42, 64, 1)", a.lineWidth = 2, a.beginPath(), a.moveTo(c, c), a.lineTo(c, s + c), a.moveTo(c, s + c), a.lineTo(o + c, s + c), a.stroke();
		return;
	}
	var v = (s - l) / g, y = (o - (e.length + 1) * l) / e.length;
	for (y >= 1 && (y = Math.floor(y)), v >= 1 && (v = Math.floor(v)), a.fillStyle = "rgba(13, 42, 64, 1)", p = 0; p < f; p++) a.fillRect(c + l + p * (y + l), c + s - (l + e[p].length * v), y, v * e[p].length);
	for (a.fillStyle = "rgba(144, 176, 192, 1)", a.font = "12px Arial", p = 0; p < f; p++) {
		var b = Math.floor((p + .5) / e.length * (u - d) + d) + "" + i;
		a.fillText(b, c + l + p * (y + l) + Math.floor((y - a.measureText(b).width) * .5), c + s - 8, y);
	}
	var x = _ > 0 ? Math.round(100 * g / _) + "%" : "0%";
	a.fillText(x, c + l, c + l + 6), a.strokeStyle = "rgba(13, 42, 64, 1)", a.lineWidth = 2, a.beginPath(), a.moveTo(c, c), a.lineTo(c, s + c), a.moveTo(c, s + c), a.lineTo(o + c, s + c), a.stroke();
}
t.percentVariationExplainedByFittedPlane = ie;
function ie(e, t, n, r) {
	if (!e || e.length < 3 || !t || !n || !n.isVector3) return 0;
	r = Math.abs(r) || 1;
	var i = e.length, a = 0, o, s;
	try {
		for (var c = 0; c < i; c += 3) {
			var l = e[c + 0] - t.x, u = e[c + 1] - t.y, d = e[c + 2] - t.z;
			o = n.x * l + n.y * u + n.z * d, s = Math.abs(o) / Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z), a += s * s;
		}
		return Math.max(0, Math.min(1, 1 - Math.sqrt(a / i) * 2 / r));
	} catch (e) {
		return console.warn("Error calculating plane variation:", e), 0;
	}
}
t.mean = ae;
function ae(e) {
	for (var t = 0, n = e.length, r = 0; r < n; r++) t += e[r];
	return t / n;
}
//#endregion
//#region src/brownian.js
t.Brownian = function(e, n) {
	var r = h(n), i = [], a = [], o = Math.min(n.xSize, n.ySize), s = Math.sqrt(o) / o, c = Math.sqrt(n.maxHeight - n.minHeight), l = n.xSegments + 1, u = n.ySegments + 1, d = Math.floor(r() * n.xSegments), f = Math.floor(r() * n.ySegments), p = d, m = f, g = e.length, _ = Array.from(e).map(function(e) {
		return { z: e };
	}), v = _[f * l + d], y = r() * Math.PI * 2, b = Math.cos(y), x = Math.sin(y), S, C, w, T, E, D, O;
	for (v.z = r() * (n.maxHeight - n.minHeight) + n.minHeight, a.push(v); a.length !== g;) {
		for (S = -1; S <= 1; S++) for (C = -1; C <= 1; C++) w = (f + S) * l + d + C, _[w] !== void 0 && a.indexOf(_[w]) === -1 && d + C >= 0 && f + S >= 0 && d + C < l && f + S < u && S && C && i.push(_[w]);
		if (r() < s) v = i.splice(Math.floor(r() * i.length), 1)[0], y = r() * Math.PI * 2, b = Math.cos(y), x = Math.sin(y), O = _.indexOf(v), d = O % l, f = Math.floor(O / l), p = d, m = f;
		else {
			for (var k = p, A = m; Math.round(k) === d && Math.round(A) === f;) k += b, A += x;
			d = Math.round(k), f = Math.round(k);
			for (var j = 0; d >= 0 && f >= 0 && d < l && f < u && a.indexOf(_[f * l + d]) !== -1 && j < 9; j++) {
				for (y = r() * Math.PI * 2, b = Math.cos(y), x = Math.sin(y); Math.round(k) === d && Math.round(A) === f;) k += b, A += x;
				d = Math.round(k), f = Math.round(A);
			}
			if (d >= 0 && f >= 0 && d < l && f < u && a.indexOf(_[f * l + d]) === -1) {
				p = k, m = A, v = _[f * l + d];
				var M = i.indexOf(v);
				M !== -1 && i.splice(M, 1);
			} else v = i.splice(Math.floor(r() * i.length), 1)[0], y = r() * Math.PI * 2, b = Math.cos(y), x = Math.sin(y), O = _.indexOf(v), d = O % l, f = Math.floor(O / l), p = d, m = f;
		}
		for (T = 0, E = 0, S = -1; S <= 1; S++) for (C = -1; C <= 1; C++) w = (f + S) * l + d + C, _[w] !== void 0 && a.indexOf(_[w]) !== -1 && d + C >= 0 && f + S >= 0 && d + C < l && f + S < u && S && C && (T += _[w].z, E++);
		E && ((!D || r() < s) && (D = r()), v.z = T / E + t.EaseInWeak(D) * c * 2 - c), a.push(v);
	}
	for (d = _.length - 1; d >= 0; d--) e[d] = _[d].z;
	t.Smooth(e, n), t.Smooth(e, n);
};
//#endregion
//#region src/gaussian.js
function Z(e, t, n) {
	if (!e.length || !t.length) return e;
	var r = 0, i = 0, a = 0, o = 0, s = e.length, c = e[0].length, l = t.length, u = t[0].length;
	if (n === void 0) for (n = Array(s), r = 0; r < s; r++) n[r] = new Float64Array(c);
	for (r = 0; r < s; r++) for (i = 0; i < c; i++) {
		var d = 0;
		for (n[r][i] = 0, a = 0; a < l; a++) for (o = 0; o < u; o++) e[r + a] !== void 0 && e[r + a][i + o] !== void 0 && (d = e[r + a][i + o]), n[r][i] += d * t[a][o];
	}
	return n;
}
function Q(e, t) {
	return Math.exp(-.5 * e * e / (t * t)) / (t * 2.5066282746310007);
}
function $(e, t) {
	typeof t != "number" && (t = 7);
	var n = new Float64Array(t), r = Math.floor(t * .5), i = t % 2, a;
	if (!e || !t) return n;
	for (a = 0; a <= r; a++) n[a] = Q(e * (a - r - i * .5), e);
	for (; a < t; a++) n[a] = n[t - 1 - a];
	return n;
}
function oe(e, t, n) {
	t === void 0 && (t = 1), n === void 0 && (n = 7);
	for (var r = $(t, n), i = n || r.length, a = [r], o = Array(i), s = 0; s < i; s++) o[s] = [r[s]];
	return Z(Z(e, a), o);
}
//#endregion
//#region src/weightedBoxBlurGaussian.js
t.Gaussian = function(e, n, r, i) {
	t.fromArray2D(e, oe(t.toArray2D(e, n), r, i));
}, t.GaussianBoxBlur = function(e, t, n, r) {
	se(e, t.xSegments + 1, t.ySegments + 1, n, r);
};
function se(e, t, n, r, i, a) {
	r === void 0 && (r = 1), i === void 0 && (i = 3), a === void 0 && (a = new Float32Array(e.length));
	for (var o = ce(r, i), s = 0; s < i; s++) le(e, a, t, n, (o[s] - 1) / 2);
	return a;
}
function ce(e, t) {
	var n = Math.sqrt(12 * e * e / t + 1), r = Math.floor(n);
	r % 2 == 0 && r--;
	for (var i = r + 2, a = (12 * e * e - t * r * r - 4 * t * r - 3 * t) / (-4 * r - 4), o = Math.round(a), s = new Int16Array(t), c = 0; c < t; c++) s[c] = c < o ? r : i;
	return s;
}
function le(e, t, n, r, i) {
	for (var a = 0, o = e.length; a < o; a++) t[a] = e[a];
	ue(t, e, n, r, i), de(e, t, n, r, i);
}
function ue(e, t, n, r, i) {
	for (var a = 1 / (i + i + 1), o = 0; o < r; o++) {
		var s = o * n, c = s, l = s + i, u = e[s], d = e[s + n - 1], f = (i + 1) * u, p;
		for (p = 0; p < i; p++) f += e[s + p];
		for (p = 0; p <= i; p++) f += e[l++] - u, t[s++] = f * a;
		for (p = i + 1; p < n - i; p++) f += e[l++] - e[c++], t[s++] = f * a;
		for (p = n - i; p < n; p++) f += d - e[c++], t[s++] = f * a;
	}
}
function de(e, t, n, r, i) {
	for (var a = 1 / (i + i + 1), o = 0; o < n; o++) {
		var s = o, c = s, l = s + i * n, u = e[s], d = e[s + n * (r - 1)], f = (i + 1) * u, p;
		for (p = 0; p < i; p++) f += e[s + p * n];
		for (p = 0; p <= i; p++) f += e[l] - u, t[s] = f * a, l += n, s += n;
		for (p = i + 1; p < r - i; p++) f += e[l] - e[c], t[s] = f * a, c += n, l += n, s += n;
		for (p = r - i; p < r; p++) f += d - e[c], t[s] = f * a, c += n, s += n;
	}
}
t.Worley ||= {}, e.Vector2.prototype.distanceToManhattan = function(e) {
	return Math.abs(this.x - e.x) + Math.abs(this.y - e.y);
}, e.Vector2.prototype.distanceToChebyshev = function(e) {
	var t = Math.abs(this.x - e.x), n = Math.abs(this.y - e.y);
	return t <= n ? n : t;
}, e.Vector2.prototype.distanceToQuadratic = function(e) {
	var t = Math.abs(this.x - e.x), n = Math.abs(this.y - e.y);
	return t * t + t * n + n * n;
};
function fe(e, t, n) {
	for (var r = Infinity, i = "distanceTo" + n, a = 0; a < t.length; a++) {
		var o = t[a][i](e);
		o < r && (r = o);
	}
	return r;
}
t.Worley = function(n, r) {
	for (var i = h(r), a = (r.worleyDistribution || t.Worley.randomPoints || function(t, n, r, i) {
		r = r || Math.floor(Math.sqrt(t * n * .025)) || 1;
		for (var a = Array(r), o = 0; o < r; o++) a[o] = new e.Vector2(i() * t, i() * n);
		return a;
	})(r.xSegments, r.ySegments, r.worleyPoints, i), o = r.worleyDistanceTransformation || function(e) {
		return -e;
	}, s = new e.Vector2(0, 0), c = 0, l = r.xSegments + 1; c < l; c++) for (var u = 0; u < r.ySegments + 1; u++) s.x = c, s.y = u, n[u * l + c] = o(fe(s, a, r.distanceType || ""));
	t.Clamp(n, {
		maxHeight: r.maxHeight,
		minHeight: r.minHeight,
		stretch: !0
	});
}, t.Worley.randomPoints = function(t, n, r, i) {
	i ||= Math.random, r = r || Math.floor(Math.sqrt(t * n * .025)) || 1;
	for (var a = Array(r), o = 0; o < r; o++) a[o] = new e.Vector2(i() * t, i() * n);
	return a;
};
function pe(e, t) {
	return e.splice(Math.floor(t() * e.length), 1)[0];
}
function me(e, t, n) {
	var r = Math.floor(t.x / n), i = Math.floor(t.y / n);
	e[r] || (e[r] = []), e[r][i] = t;
}
function he(e, t, n) {
	return e.x >= 0 && e.y >= 0 && e.x <= t + 1 && e.y <= n + 1;
}
function ge(e, t, n, r) {
	for (var i = Math.floor(t.x / r), a = Math.floor(t.y / r), o = i - 1; o <= i + 1; o++) for (var s = a - 1; s <= a + 1; s++) if (o !== i && s !== a && e[o] !== void 0 && e[o][s] !== void 0) {
		var c = o * r, l = s * r;
		if (Math.sqrt((t.x - c) * (t.x - c) + (t.y - l) * (t.y - l)) < n) return !0;
	}
	return !1;
}
function _e(t, n, r) {
	var i = n * (r() + 1), a = 2 * Math.PI * r();
	return new e.Vector2(t.x + i * Math.cos(a), t.y + i * Math.sin(a));
}
//#endregion
//#region src/index.js
t.Worley.PoissonDisks = function(t, n, r, i, a) {
	typeof i == "function" && a === void 0 && (a = i, i = void 0), a ||= Math.random, r = r || Math.floor(Math.sqrt(t * n * .2)) || 1, i = Math.sqrt((t + n) * 2.5), i > r * .67 && (i = r * .67);
	var o = i / Math.sqrt(2);
	o < 2 && (o = 2);
	var s = [], c = [], l = [], u = new e.Vector2(a() * t, a() * n);
	c.push(u), l.push(u), me(s, u, o);
	for (var d = 0; c.length;) {
		for (var f = pe(c, a), p = 0; p < r; p++) {
			var m = _e(f, i, a);
			if (he(m, t, n) && !ge(s, m, i, o) && (c.push(m), l.push(m), me(s, m, o), l.length >= r)) break;
		}
		if (l.length >= r || ++d > r * r) break;
	}
	return l;
}, typeof window < "u" && (window.THREE || (window.THREE = {}), window.THREE.Terrain = r, Object.assign(window.THREE.Terrain, t));
//#endregion
export { t as TerrainNS, N as createGrass, k as createGrassTexture, g as createRandomSeed, _ as createSeededRandom, r as default, L as generateBlendedMaterial, i as getTerrainHeight, w as grassClusterWeight, D as grassMaterialWeight, O as grassMeshWeight, C as grassPatchNoise, E as grassSlopeWeight, T as grassTextureWeight, G as isNearScatterGroup, I as scatterGrass, P as updateGrass, F as updateGrassLOD };
