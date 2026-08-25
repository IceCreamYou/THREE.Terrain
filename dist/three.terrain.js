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
}, t.heightmapArray = function(e, n) {
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
var i = {};
function a(e, t, n) {
	this.x = e, this.y = t, this.z = n;
}
a.prototype.dot2 = function(e, t) {
	return this.x * e + this.y * t;
}, a.prototype.dot3 = function(e, t, n) {
	return this.x * e + this.y * t + this.z * n;
};
var o = [
	new a(1, 1, 0),
	new a(-1, 1, 0),
	new a(1, -1, 0),
	new a(-1, -1, 0),
	new a(1, 0, 1),
	new a(-1, 0, 1),
	new a(1, 0, -1),
	new a(-1, 0, -1),
	new a(0, 1, 1),
	new a(0, -1, 1),
	new a(0, 1, -1),
	new a(0, -1, -1)
], s = [
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
], c = Array(512), l = Array(512);
i.seed = function(e) {
	e > 0 && e < 1 && (e *= 65536), e = Math.floor(e), e < 256 && (e |= e << 8);
	for (var t = 0; t < 256; t++) {
		var n = t & 1 ? s[t] ^ e & 255 : s[t] ^ e >> 8 & 255;
		c[t] = c[t + 256] = n, l[t] = l[t + 256] = o[n % 12];
	}
}, i.seed(Math.random());
var u = .5 * (Math.sqrt(3) - 1), d = (3 - Math.sqrt(3)) / 6;
i.simplex = function(e, t) {
	var n, r, i, a = (e + t) * u, o = Math.floor(e + a), s = Math.floor(t + a), f = (o + s) * d, p = e - o + f, m = t - s + f, h, g;
	p > m ? (h = 1, g = 0) : (h = 0, g = 1);
	var _ = p - h + d, v = m - g + d, y = p - 1 + 2 * d, b = m - 1 + 2 * d;
	o &= 255, s &= 255;
	var x = l[o + c[s]], S = l[o + h + c[s + g]], C = l[o + 1 + c[s + 1]], w = .5 - p * p - m * m;
	w < 0 ? n = 0 : (w *= w, n = w * w * x.dot2(p, m));
	var T = .5 - _ * _ - v * v;
	T < 0 ? r = 0 : (T *= T, r = T * T * S.dot2(_, v));
	var E = .5 - y * y - b * b;
	return E < 0 ? i = 0 : (E *= E, i = E * E * C.dot2(y, b)), 70 * (n + r + i);
};
function f(e) {
	return e * e * e * (e * (e * 6 - 15) + 10);
}
function p(e, t, n) {
	return (1 - n) * e + n * t;
}
i.perlin = function(e, t) {
	var n = Math.floor(e), r = Math.floor(t);
	e -= n, t -= r, n &= 255, r &= 255;
	var i = l[n + c[r]].dot2(e, t), a = l[n + c[r + 1]].dot2(e, t - 1), o = l[n + 1 + c[r]].dot2(e - 1, t), s = l[n + 1 + c[r + 1]].dot2(e - 1, t - 1), u = f(e);
	return p(p(i, o, u), p(a, s, u), f(t));
};
//#endregion
//#region src/random.js
function m(e) {
	return e && typeof e.random == "function" ? e.random : Math.random;
}
function h(e) {
	var t = typeof e == "function" ? e : Math.random, n = typeof globalThis < "u" ? globalThis.crypto : null;
	if (n && typeof n.getRandomValues == "function") {
		var r = new Uint32Array(1);
		return n.getRandomValues(r), r[0];
	}
	return Math.floor(t() * 4294967296) >>> 0;
}
function g(e) {
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
	for (var n = m(t), r = (t.maxHeight - t.minHeight) * .5, i = t.frequency * Math.PI / (Math.min(t.xSegments, t.ySegments) + 1), a = n() * Math.PI * 2, o = 0, s = t.xSegments + 1; o < s; o++) for (var c = 0, l = t.ySegments + 1; c < l; c++) e[c * s + o] += r * (Math.cos(o * i + a) + Math.cos(c * i + a));
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
	var r = m(t), i = n(Math.max(t.xSegments, t.ySegments) + 1), a = i + 1, o = [], s = t.maxHeight - t.minHeight, c, l, u = t.xSegments + 1, d = t.ySegments + 1;
	for (c = 0; c <= i; c++) o[c] = new Float64Array(i + 1);
	for (var f = i; f >= 2; f /= 2) {
		var p = Math.round(f * .5), h = Math.round(f), g, _, v, y;
		for (s /= 2, g = 0; g < i; g += h) for (_ = 0; _ < i; _ += h) y = r() * s * 2 - s, v = o[g][_] + o[g + h][_] + o[g][_ + h] + o[g + h][_ + h], v *= .25, o[g + p][_ + p] = v + y;
		for (g = 0; g < i; g += p) for (_ = (g + p) % f; _ < i; _ += f) y = r() * s * 2 - s, v = o[(g - p + a) % a][_] + o[(g + p) % a][_] + o[g][(_ + p) % a] + o[g][(_ - p + a) % a], v *= .25, v += y, o[g][_] = v, g === 0 && (o[i][_] = v), _ === 0 && (o[g][i] = v);
	}
	for (c = 0; c < u; c++) for (l = 0; l < d; l++) e[l * u + c] += o[c][l];
}, t.Fault = function(e, t) {
	for (var n = m(t), r = Math.sqrt(t.xSegments * t.xSegments + t.ySegments * t.ySegments), i = r * t.frequency, a = (t.maxHeight - t.minHeight) * .5 / i, o = Math.min(t.xSize / t.xSegments, t.ySize / t.ySegments) * t.frequency, s = 0; s < i; s++) for (var c = n(), l = Math.sin(c * Math.PI * 2), u = Math.cos(c * Math.PI * 2), d = n() * r - r * .5, f = 0, p = t.xSegments + 1; f < p; f++) for (var h = 0, g = t.ySegments + 1; h < g; h++) {
		var _ = l * f + u * h - d;
		_ > o ? e[h * p + f] += a : _ < -o ? e[h * p + f] -= a : e[h * p + f] += Math.cos(_ / o * Math.PI * 2) * a;
	}
}, t.Hill = function(n, r, i, a) {
	var o = m(r), s = r.frequency * 2, c = s * s * 10, l = r.maxHeight - r.minHeight, u = l / (s * s), d = l / s, f = Math.min(r.xSize, r.ySize), p = f / (s * s), h = f / s;
	i ||= t.Influences.Hill;
	for (var g = {
		x: 0,
		y: 0
	}, _ = 0; _ < c; _++) {
		var v = o() * (h - p) + p, y = o() * (d - u) + u;
		0 - v, r.xSize + v, r.ySize + v, g.x = o(), g.y = o(), typeof a == "function" && a(g), t.Influence(n, r, i, g.x, g.y, v, y, e.AdditiveBlending, t.EaseInStrong);
	}
}, t.HillIsland = (function() {
	var e = function(e, t) {
		var n = t() * Math.PI * 2;
		e.x = .5 + Math.cos(n) * e.x * .4, e.y = .5 + Math.sin(n) * e.y * .4;
	};
	return function(n, r, i) {
		var a = m(r);
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
				case 7:
					n--, r--;
					break;
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
		for (var r = m(n), i = Math.sqrt(n.xSegments * n.xSegments + n.ySegments * n.ySegments) * n.frequency * 300, a = n.xSegments + 1, o = (n.maxHeight - n.minHeight) / i * 1e3, s = Math.floor(r() * n.xSegments), c = Math.floor(r() * n.ySegments), l = r() * .2 - .1, u = r() * .2 - .1, d = 0; d < i; d++) {
			e(t, s, c, a, o, r);
			var f = r() * Math.PI * 2;
			d % 1e3 == 0 && (l = r() * .2 - .1, u = r() * .2 - .1), d % 100 == 0 && (s = Math.floor(n.xSegments * (.5 + l) + Math.cos(f) * r() * n.xSegments * (.5 - Math.abs(l))), c = Math.floor(n.ySegments * (.5 + u) + Math.sin(f) * r() * n.ySegments * (.5 - Math.abs(u))));
		}
	};
})(), t.Perlin = function(e, t) {
	i.seed(m(t)());
	for (var n = (t.maxHeight - t.minHeight) * .5, r = (Math.min(t.xSegments, t.ySegments) + 1) / t.frequency, a = 0, o = t.xSegments + 1, s = t.ySegments + 1; a < o; a++) for (var c = 0; c < s; c++) {
		var l = c * o + a, u = i.perlin(a / r, c / r);
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
	i.seed(m(t)());
	for (var n = (t.maxHeight - t.minHeight) * .5, r = (Math.min(t.xSegments, t.ySegments) + 1) * 2 / t.frequency, a = 0, o = t.xSegments + 1; a < o; a++) for (var s = 0, c = t.ySegments + 1; s < c; s++) e[s * o + a] += i.simplex(a / r, s / r) * n;
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
						for (var h = a[m], g = a[c * l + (s - d)] || h, _ = a[(c - d) * l + s] || h, v = a[(c - d) * l + (s - d)] || h, y = f; y < s; y++) for (var b = p; b < c; b++) if (!(y === f && b === p)) {
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
		for (var a = m(i), o = n(Math.max(i.xSegments, i.ySegments) + 1), s = new Float64Array((o + 1) * (o + 1)), c = i.maxHeight - i.minHeight, l = 2; l < 7; l++) e(r, i, 2 ** l, o, c * 2 ** (2.4 - l * 1.2), s, a);
		t.Clamp(r, {
			maxHeight: i.maxHeight,
			minHeight: i.minHeight,
			stretch: !0
		});
	};
})(), t.Weierstrass = function(e, n) {
	for (var r = m(n), i = (n.maxHeight - n.minHeight) * .5, a = r() < .5 ? 1 : -1, o = r() < .5 ? 1 : -1, s = .5 + r() * 1, c = .5 + r() * 1, l = .025 + r() * .1, u = -1 + r() * 2, d = .5 + r() * 1, f = .5 + r() * 1, p = .025 + r() * .1, h = -1 + r() * 2, g = 0, _ = n.xSegments + 1; g < _; g++) for (var v = 0, y = n.ySegments + 1; v < y; v++) {
		for (var b = 0, x = 0; x < 20; x++) {
			var S = (1 + s) ** +-x * Math.sin((1 + c) ** +x * (g + .25 * Math.cos(v) + u * v) * l), C = (1 + d) ** +-x * Math.sin((1 + f) ** +x * (v + .25 * Math.cos(g) + h * g) * p);
			b -= Math.exp(a * S * S + o * C * C);
		}
		e[v * _ + g] += b * i;
	}
	t.Clamp(e, n);
};
//#endregion
//#region src/grass.js
var _;
function v(e) {
	var t = Math.sin(e * 12.9898) * 43758.5453;
	return t - Math.floor(t);
}
function y(e, t, n, r, i, a, o) {
	var s = r * .5;
	e.fillStyle = o, e.beginPath(), e.moveTo(t - s, n), e.quadraticCurveTo(t - r * .45 - a, n - i * .45, t + a, n - i), e.quadraticCurveTo(t + r * .35 + a, n - i * .45, t + s, n), e.closePath(), e.fill();
}
function b(e, t) {
	var n = Math.sin(e * 127.1 + t * 311.7) * 43758.5453;
	return n - Math.floor(n);
}
function x(e, t) {
	var n = Math.floor(e), r = Math.floor(t), i = e - n, a = t - r, o = i * i * (3 - 2 * i), s = a * a * (3 - 2 * a), c = b(n, r), l = b(n + 1, r), u = b(n, r + 1), d = b(n + 1, r + 1), f = c + (l - c) * o;
	return f + (u + (d - u) * o - f) * s;
}
function S(e, t) {
	var n = x(e * .009, t * .009), r = x(e * .026 + 17.3, t * .026 - 9.1);
	return n * .78 + r * .22;
}
function C(e, t) {
	var n = S(e, t), r = Math.max(0, Math.min(1, (n - .36) / .32));
	return .15 + r * r * (3 - 2 * r) * .85;
}
function w(e, t) {
	t ||= [
		-80,
		-35,
		20,
		50
	];
	var n = Math.max(1e-4, t[1] - t[0]), r = Math.max(1e-4, t[3] - t[2]), i = Math.max(0, Math.min(1, (e - t[0]) / n)), a = Math.max(0, Math.min(1, (e - t[2]) / r)), o = i * i * (3 - 2 * i), s = a * a * (3 - 2 * a);
	return Math.max(0, Math.min(1, o - s));
}
function T(e, t) {
	if (t ||= [.47123889803846897, .7853981633974483], typeof e != "number" || !isFinite(e)) return 1;
	var n = Math.min(t[0], t[1]), r = Math.max(t[0], t[1]);
	if (e <= n) return 1;
	if (e >= r) return 0;
	var i = (e - n) / Math.max(1e-4, r - n);
	return 1 - i * i * (3 - 2 * i);
}
function E(e, t, n, r) {
	return w(e, n) * T(t, r);
}
function D(e, t, n, r, i) {
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
function O(t) {
	if (t ||= {}, _ && !t.newTexture) return _;
	var n = t.size || 256, r = document.createElement("canvas"), i = r.getContext("2d");
	r.width = n, r.height = n, i.clearRect(0, 0, n, n);
	for (var a = typeof t.clusterCount == "number" ? t.clusterCount : 5, o = typeof t.minBlades == "number" ? t.minBlades : 3, s = typeof t.bladeRange == "number" ? t.bladeRange : 3, c = typeof t.clusterSpread == "number" ? t.clusterSpread : .18, l = typeof t.bladeWidthMin == "number" ? t.bladeWidthMin : .022, u = typeof t.bladeWidthRange == "number" ? t.bladeWidthRange : .028, d = 0; d < a; d++) for (var f = a === 1 ? n * .5 : (.05 + v(d * 3 + 1) * .9) * n, p = n * (.78 + v(d * 3 + 2) * .18), m = o + Math.floor(v(d * 3 + 3) * (s + 1)), h = 0; h < m; h++) {
		var g = d * 32 + h, b = f + (v(g + 1) - .5) * n * c, x = n * (.28 + v(g + 2) * .62), S = n * (l + v(g + 3) * u), C = (v(g + 4) - .5) * n * .06, w = 150 + Math.floor(v(g + 5) * 75), T = 35 + Math.floor(v(g + 6) * 45), E = 34 + Math.floor(v(g + 7) * 40);
		y(i, b, p, S, x, C, "rgb(" + T + ", " + w + ", " + E + ")"), h % 3 == 0 && y(i, b + S * .18, p, S * .35, x * .92, C * .7, "rgb(224, 240, 118)");
	}
	var D = new e.CanvasTexture(r);
	return D.colorSpace = e.SRGBColorSpace, D.minFilter = e.LinearMipmapLinearFilter, D.magFilter = e.LinearFilter, D.needsUpdate = !0, t.newTexture || (_ = D), D;
}
function k(t, n) {
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
function A(t, n, r) {
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
	], d = 0; d < r; d++) for (var f = d * 23 + 7, p = v(f + 1) * Math.PI * 2, m = Math.sqrt(v(f + 2)) * t * .28, h = Math.cos(p) * m, g = Math.sin(p) * m, _ = v(f + 3) * Math.PI * 2, y = n * (.55 + v(f + 4) * .45), b = t * (.005 + v(f + 5) * .009), x = y * (.06 + v(f + 6) * .22), S = .88 + v(f + 7) * .24, C = (.28 + v(f + 8) * .18) * S, w = (.52 + v(f + 9) * .24) * S, T = (.1 + v(f + 10) * .08) * S, E = 0; E < 2; E++) {
		for (var D = _ + E * Math.PI * .5, O = Math.cos(D) * x, k = Math.sin(D) * x, A = Math.cos(D) * b * .12, j = Math.sin(D) * b * .12, M = i.length / 3, N = 0; N < c.length; N++) {
			var P = c[N], F = h + O * u[N] + A * Math.sin(P * Math.PI), I = g + k * u[N] + j * Math.sin(P * Math.PI), L = b * .5 * l[N], R = F - Math.sin(D) * L, z = I + Math.cos(D) * L, B = F + Math.sin(D) * L, V = I - Math.cos(D) * L, H = S * (.88 + P * .24), U = [
				R,
				y * P,
				z
			], W = [
				B,
				y * P,
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
function j(t, n) {
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
function M(t) {
	t ||= {};
	var n = t.texture || (t.textureOptions ? O(t.textureOptions) : null) || t.material && t.material.map, r = t.material || j(t, n), i = n ? k(t.width || 12, t.height || 18) : A(t.width || 12, t.height || 18, t.bladeCount || 3), a = new e.Mesh(i, r);
	return a.name = t.name || "DenseGrass", a.userData.grassMaterial = r, a;
}
function N(e, t) {
	if (!e) return e;
	var n = e.userData && e.userData.grassMaterial || e.material, r = n && n.userData && n.userData.grassUniforms;
	return r && (r.time.value = t), e;
}
function P(t, n, r) {
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
function F(e, n) {
	n ||= {};
	var r = {};
	for (var i in n) n.hasOwnProperty(i) && (r[i] = n[i]);
	return r.mesh = n.mesh || M(n), t.ScatterMeshes(e, r);
}
t.createGrassTexture = O, t.createGrass = M, t.grassPatchNoise = S, t.grassClusterWeight = C, t.grassTextureWeight = w, t.grassSlopeWeight = T, t.grassMaterialWeight = E, t.grassMeshWeight = D, t.updateGrass = N, t.ScatterGrass = F, t.fromHeightmap = function(e, t, n) {
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
function I(t, n) {
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
t.generateBlendedMaterial = I;
//#endregion
//#region src/tint.js
function L(t) {
	if (!t) return null;
	var n = Array.isArray(t) ? t[0] : t.min, r = Array.isArray(t) ? t[1] : t.max;
	return n === void 0 || r === void 0 ? null : {
		min: new e.Color(n),
		max: new e.Color(r)
	};
}
function R(e, t) {
	return typeof e.onBeforeCompile == "function" && (t.onBeforeCompile = e.onBeforeCompile), typeof e.customProgramCacheKey == "function" && (t.customProgramCacheKey = e.customProgramCacheKey), t;
}
function z(e) {
	if (Array.isArray(e)) return e.map(function(e) {
		var t = R(e, e.clone());
		return t.vertexColors = !0, t.needsUpdate = !0, t;
	});
	var t = R(e, e.clone());
	return t.vertexColors = !0, t.needsUpdate = !0, t;
}
function B(t) {
	var n = t.clone();
	if (!n.getAttribute("color") && n.getAttribute("position")) {
		var r = new Float32Array(n.getAttribute("position").count * 3);
		r.fill(1), n.setAttribute("color", new e.BufferAttribute(r, 3));
	}
	return n;
}
//#endregion
//#region src/scatter.js
function V(e, t, n, r, i, a, o) {
	var s = m(o);
	if (e.position.addVectors(t, n).add(r).divideScalar(3), o.positionJitter > 0) {
		var c = s(), l = s();
		c + l > 1 && (c = 1 - c, l = 1 - l);
		var u = 1 - c - l, d = Math.max(0, o.positionJitter), f = t.x * u + n.x * c + r.x * l, p = t.y * u + n.y * c + r.y * l, h = t.z * u + n.z * c + r.z * l;
		e.position.x += (f - e.position.x) * d, e.position.y += (p - e.position.y) * d, e.position.z += (h - e.position.z) * d;
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
	if (e.rotation.x += 90 / 180 * Math.PI, o.randomRotationAxis === "z" ? e.rotateZ(s() * 2 * Math.PI) : e.rotateY(s() * 2 * Math.PI), o.sizeVariance) {
		var y = s() * o.sizeVariance * 2 - o.sizeVariance;
		o.nonUniformSizeVariance ? (e.scale.x *= 1 + y, e.scale.y *= 1 + y * (.75 + s() * .5), e.scale.z *= 1 + (s() * o.sizeVariance * 2 - o.sizeVariance)) : (e.scale.x = e.scale.z = 1 + y, e.scale.y += y);
	}
	e.updateMatrix();
}
function H(t, n) {
	var r = m(n);
	t.computeBoundingBox();
	for (var i = (t.index ? t.toNonIndexed() : t).attributes.position.array, a = i.length / 9, o = Math.max(1, Math.floor(n.sampleCount || a)), s = t.boundingBox, c = s ? Math.max(1, (s.max.x - s.min.x) * (s.max.y - s.min.y)) : 1, l = typeof n.randomDistributionMinDistance == "number" ? Math.max(0, n.randomDistributionMinDistance) : Math.sqrt(c / o) * .34, u = l * l, d = Math.max(1, l), f = {}, p = [], h = new e.Vector3(), g = new e.Vector3(), _ = new e.Vector3(), v = new e.Vector3(), y = new e.Vector3(), b = 0; b < o; b++) {
		var x = Math.floor(r() * a), S = x * 9;
		h.fromArray(i, S), g.fromArray(i, S + 3), _.fromArray(i, S + 6), e.Triangle.getNormal(h, g, _, v);
		var C = r(), w = r();
		C + w > 1 && (C = 1 - C, w = 1 - w);
		var T = 1 - C - w;
		if (y.set(h.x * T + g.x * C + _.x * w, h.y * T + g.y * C + _.y * w, h.z * T + g.z * C + _.z * w), typeof n.spread == "function") {
			if (!n.spread(y, x, v, S)) continue;
		} else if (typeof n.spread == "number" && r() >= n.spread) continue;
		if (!(typeof n.filter == "function" && !n.filter(y, v, x, S))) {
			if (l > 0) {
				for (var E = Math.floor(y.x / d), D = Math.floor(y.y / d), O = !1, k = E - 2; k <= E + 2 && !O; k++) for (var A = D - 2; A <= D + 2; A++) {
					var j = f[k + ":" + A];
					if (j) for (var M = 0; M < j.length; M++) {
						var N = j[M].x - y.x, P = j[M].y - y.y;
						if (N * N + P * P < u) {
							O = !0;
							break;
						}
					}
					if (O) break;
				}
				if (O) continue;
				var F = E + ":" + D;
				f[F] || (f[F] = []), f[F].push({
					x: y.x,
					y: y.y
				});
			}
			var I = .01, L = h.clone().add(g).add(_).divideScalar(3);
			h.sub(L).multiplyScalar(I).add(y), g.sub(L).multiplyScalar(I).add(y), _.sub(L).multiplyScalar(I).add(y), p.push(h.x, h.y, h.z, g.x, g.y, g.z, _.x, _.y, _.z);
		}
	}
	var R = new e.BufferGeometry();
	return R.setAttribute("position", new e.Float32BufferAttribute(p, 3)), R;
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
		w: 0,
		h: 0,
		instanced: !1,
		tintRange: null,
		filter: null
	};
	for (var a in i) i.hasOwnProperty(a) && (r[a] = r[a] === void 0 ? i[a] : r[a]);
	typeof r.randomness != "function" && (r.randomness = r.random);
	var o = m(r);
	r.randomDistribution && (n = H(n, r), r.spread = function() {
		return !0;
	}, r.positionJitter = 0);
	var s = !!r.instanced && r.mesh.isMesh && !r.mesh.children.length, c = L(r.tintRange), l = s ? [] : null, u = s ? new e.Object3D() : null, d = typeof r.spread == "number", f, p, h = 1 / r.smoothSpread, g = new e.Vector3(), _ = new e.Vector3(), v = new e.Vector3(), y = new e.Vector3(), b = Math.max(1, Math.floor(r.instancesPerFace)), x = r.mesh.up.clone().applyAxisAngle(new e.Vector3(1, 0, 0), .5 * Math.PI);
	r.instanced && !s && console.warn("THREE.Terrain.ScatterMeshes can only instance a single THREE.Mesh; falling back to clones"), c && !s && console.warn("THREE.Terrain.ScatterMeshes applies tintRange only when instanced is true"), d && (f = r.randomness(), p = typeof f == "number" ? o : function(e) {
		return f[e];
	}), n.index && (n = n.toNonIndexed());
	for (var S = n.attributes.position.array, C = 0; C < n.attributes.position.array.length; C += 9) {
		g.set(S[C + 0], S[C + 1], S[C + 2]), _.set(S[C + 3], S[C + 4], S[C + 5]), v.set(S[C + 6], S[C + 7], S[C + 8]), e.Triangle.getNormal(g, _, v, y);
		var w = !1;
		if (d) {
			var T = p(C / 9);
			T < r.spread ? w = !0 : T < r.spread + r.smoothSpread && (w = t.EaseInOut((T - r.spread) * h) * r.spread > o());
		} else w = r.spread(g, C / 9, y, C);
		if (w && typeof r.filter == "function" && !r.filter(g, y, C / 9, C) && (w = !1), w) {
			if (y.angleTo(x) > r.maxSlope) continue;
			for (var E = 0; E < b; E++) if (s) {
				u.position.copy(r.mesh.position), u.quaternion.copy(r.mesh.quaternion), u.scale.copy(r.mesh.scale), V(u, g, _, v, y, x, r);
				var D = {
					matrix: u.matrix.clone(),
					position: u.position.clone()
				};
				c && (D.tint = new e.Color().lerpColors(c.min, c.max, o())), l.push(D);
			} else {
				var O = r.mesh.clone();
				V(O, g, _, v, y, x, r), r.scene.add(O);
			}
		}
	}
	if (s && l.length) {
		var k = c ? B(r.mesh.geometry) : r.mesh.geometry, A = c ? z(r.mesh.material) : r.mesh.material, j = new e.InstancedMesh(k, A, l.length), M = new Float32Array(l.length * 16), N = new Float32Array(l.length * 3), P = c ? new Float32Array(l.length * 3) : null;
		j.name = (r.mesh.name || "ScatteredMesh") + " Instances", j.castShadow = r.mesh.castShadow, j.receiveShadow = r.mesh.receiveShadow, j.frustumCulled = r.mesh.frustumCulled, j.renderOrder = r.mesh.renderOrder;
		for (var F = 0; F < l.length; F++) j.setMatrixAt(F, l[F].matrix), M.set(l[F].matrix.elements, F * 16), N.set(l[F].position.toArray(), F * 3), c && (j.setColorAt(F, l[F].tint), P.set([
			l[F].tint.r,
			l[F].tint.g,
			l[F].tint.b
		], F * 3));
		j.userData.instancedLOD = {
			colors: P,
			matrices: M,
			positions: N,
			initialized: !1,
			lastDistance: -1,
			lastUpdate: 0
		}, j.instanceMatrix.needsUpdate = !0, j.instanceColor && (j.instanceColor.needsUpdate = !0), j.computeBoundingSphere(), r.scene.add(j);
	}
	return r.scene;
}, t.ScatterHelper = function(e, n, r, i) {
	r ||= 1, i ||= .25, n.frequency = n.frequency || 2.5;
	var a = m(n), o = {};
	for (var s in n) n.hasOwnProperty(s) && (o[s] = n[s]);
	o.xSegments *= 2, o.stretch = !0, o.maxHeight = 1, o.minHeight = 0;
	for (var c = t.heightmapArray(e, o), l = 0, u = c.length; l < u; l++) (l % r || a() > i) && (c[l] = 1);
	return function() {
		return c;
	};
}, t.Analyze = function(n, r) {
	if (!n || !n.geometry || !n.geometry.attributes || !n.geometry.attributes.position || n.geometry.attributes.position.count < 3) return console.warn("Not enough vertices to analyze or invalid mesh"), U(r);
	try {
		var i = n.geometry.clone();
		i.index && (i = i.toNonIndexed());
		var a = t.toArray1D(i.attributes.position.array);
		if (!a || a.length === 0) return console.warn("Could not extract elevations from geometry"), U(r);
		var o = Array.from(a).sort(function(e, t) {
			return e - t;
		}), s = a.length, c = W(o, 1), l = W(o, 0), u = W(o, .5), d = re(o), f = 0, p = 0, m = 0, h = 0, g = n.up.clone().applyAxisAngle(new e.Vector3(1, 0, 0), .5 * Math.PI), _ = [];
		try {
			_ = K(i, r).map(function(e) {
				return e.angleTo(g) * 180 / Math.PI;
			}).sort(function(e, t) {
				return e - t;
			});
		} catch (e) {
			console.warn("Error calculating slopes:", e), _ = [0];
		}
		var v = _.length, y = W(_, 1), b = W(_, 0), x = W(_, .5), S = re(_), C = n.position.clone().setZ(d), w, T;
		try {
			w = q(i.attributes.position.array, C), T = w.angleTo(g) * 180 / Math.PI;
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
				for (var H = -Infinity, Y = Infinity, X = i.attributes.position.array[(V * R + B) * 3 + 2], ie = 0, ae = 0, Z = -1; Z <= 1; Z++) for (var Q = -1; Q <= 1; Q++) if (B + Q >= 0 && V + Z >= 0 && B + Q < R && V + Z < z && !(Z === 0 && Q === 0)) {
					var $ = i.attributes.position.array[((V + Z) * R + B + Q) * 3 + 2];
					ie += $, ae++, $ > H && (H = $), $ < Y && (Y = $);
				}
				ae && (M += (ie / ae - X) * (ie / ae - X)), (X > H || X < Y) && N++;
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
				iqr: W(o, .75) - W(o, .25),
				mean: d,
				stdev: f,
				mad: W(P, .5),
				pearsonSkew: p,
				groeneveldMeedenSkew: m,
				kurtosis: h,
				modes: ee(o, Math.ceil(r.maxHeight - r.minHeight), r.minHeight, r.maxHeight),
				percentile: function(e) {
					return W(o, e);
				},
				percentRank: function(e) {
					return G(o, e);
				},
				drawHistogram: function(e, t) {
					te(J(o, t, r.minHeight, r.maxHeight), e, r.minHeight, r.maxHeight);
				}
			},
			slope: {
				sampleSize: v,
				max: y,
				min: b,
				range: y - b,
				midrange: (y - b) * .5 + b,
				median: x,
				iqr: W(_, .75) - W(_, .25),
				mean: S,
				stdev: E,
				mad: W(F, .5),
				pearsonSkew: D,
				groeneveldMeedenSkew: O,
				kurtosis: k,
				modes: ee(_, 90, 0, 90),
				percentile: function(e) {
					return W(_, e);
				},
				percentRank: function(e) {
					return G(_, e);
				},
				drawHistogram: function(e, t) {
					te(J(_, t, 0, 90), e, 0, 90, "°");
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
				pctExplained: ne(i.attributes.position.array, C, w, r.maxHeight - r.minHeight)
			}
		};
	} catch (e) {
		return console.error("Error during terrain analysis:", e), U(r);
	}
};
function U(t) {
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
t.percentile = W;
function W(e, t) {
	if (e.length === 0) return 0;
	if (typeof t != "number") throw TypeError("p must be a number");
	if (t <= 0) return e[0];
	if (t >= 1) return e[e.length - 1];
	var n = e.length * t, r = Math.floor(n), i = r + 1, a = n % 1;
	return i >= e.length ? e[r] : e[r] * (1 - a) + e[i] * a;
}
t.percentRank = G;
function G(e, t) {
	if (typeof t != "number") throw TypeError("v must be a number");
	for (var n = 0, r = e.length; n < r; n++) if (t <= e[n]) {
		for (; n < r && t === e[n];) n++;
		return n === 0 ? 0 : (t !== e[n - 1] && (n += (t - e[n - 1]) / (e[n] - e[n - 1])), n / r);
	}
	return 1;
}
t.faceNormals = K;
function K(t, n) {
	var r = t.clone();
	r.index && (r = r.toNonIndexed());
	for (var i = r.attributes.position.array, a = i.length / 9, o = Array(a), s = new e.Vector3(), c = new e.Vector3(), l = new e.Vector3(), u = 0; u < a; u++) {
		var d = u * 9;
		s.set(i[d], i[d + 1], i[d + 2]), c.set(i[d + 3], i[d + 4], i[d + 5]), l.set(i[d + 6], i[d + 7], i[d + 8]), o[u] = new e.Vector3().crossVectors(new e.Vector3().subVectors(c, s), new e.Vector3().subVectors(l, s)).normalize();
	}
	return o;
}
t.getFittedPlaneNormal = q;
function q(t, n) {
	var r = t.length / 3, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0;
	if (r < 3) throw Error("At least three points are required to fit a plane");
	for (var u = new e.Vector3(), d = 0, f = t.length; d < f; d += 3) {
		var p = t[d] - n.x, m = t[d + 1] - n.y, h = t[d + 2] - n.z;
		i += p * p, a += p * m, o += p * h, s += m * m, c += m * h, l += h * h;
	}
	var g = s * l - c * c, _ = i * l - o * o, v = i * s - a * a;
	return g >= _ && g >= v ? u.set(g, a * l - o * c, o * s - a * c) : _ >= g && _ >= v ? u.set(a * l - o * c, _, a * o - c * i) : u.set(o * s - a * c, a * o - c * i, v), u.z < 0 && u.negate(), u.normalize();
}
t.bucketNumbersLinearly = J;
function J(e, t, n, r) {
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
t.getModes = ee;
function ee(e, t, n, r) {
	if (!e || e.length === 0) return [];
	n === r && (r = n + 1);
	for (var i = J(e, t, n, r), a = 0, o = [], s = 0, c = i.length; s < c; s++) i[s].length > a ? (a = i[s].length, o = [n + (s + .5) / t * (r - n)]) : i[s].length === a && a > 0 && o.push(n + (s + .5) / t * (r - n));
	if (o.length === 0) return [];
	for (var l = 0; l < o.length; l++) Math.abs(o[l] - Math.round(o[l])) < .001 ? o[l] = Math.round(o[l]) : o[l] = parseFloat(o[l].toFixed(3));
	return o;
}
t.drawHistogram = te;
function te(e, t, n, r, i) {
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
t.percentVariationExplainedByFittedPlane = ne;
function ne(e, t, n, r) {
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
t.mean = re;
function re(e) {
	for (var t = 0, n = e.length, r = 0; r < n; r++) t += e[r];
	return t / n;
}
//#endregion
//#region src/brownian.js
t.Brownian = function(e, n) {
	var r = m(n), i = [], a = [], o = Math.min(n.xSize, n.ySize), s = Math.sqrt(o) / o, c = Math.sqrt(n.maxHeight - n.minHeight), l = n.xSegments + 1, u = n.ySegments + 1, d = Math.floor(r() * n.xSegments), f = Math.floor(r() * n.ySegments), p = d, h = f, g = e.length, _ = Array.from(e).map(function(e) {
		return { z: e };
	}), v = _[f * l + d], y = r() * Math.PI * 2, b = Math.cos(y), x = Math.sin(y), S, C, w, T, E, D, O;
	for (v.z = r() * (n.maxHeight - n.minHeight) + n.minHeight, a.push(v); a.length !== g;) {
		for (S = -1; S <= 1; S++) for (C = -1; C <= 1; C++) w = (f + S) * l + d + C, _[w] !== void 0 && a.indexOf(_[w]) === -1 && d + C >= 0 && f + S >= 0 && d + C < l && f + S < u && S && C && i.push(_[w]);
		if (r() < s) v = i.splice(Math.floor(r() * i.length), 1)[0], y = r() * Math.PI * 2, b = Math.cos(y), x = Math.sin(y), O = _.indexOf(v), d = O % l, f = Math.floor(O / l), p = d, h = f;
		else {
			for (var k = p, A = h; Math.round(k) === d && Math.round(A) === f;) k += b, A += x;
			d = Math.round(k), f = Math.round(k);
			for (var j = 0; d >= 0 && f >= 0 && d < l && f < u && a.indexOf(_[f * l + d]) !== -1 && j < 9; j++) {
				for (y = r() * Math.PI * 2, b = Math.cos(y), x = Math.sin(y); Math.round(k) === d && Math.round(A) === f;) k += b, A += x;
				d = Math.round(k), f = Math.round(A);
			}
			if (d >= 0 && f >= 0 && d < l && f < u && a.indexOf(_[f * l + d]) === -1) {
				p = k, h = A, v = _[f * l + d];
				var M = i.indexOf(v);
				M !== -1 && i.splice(M, 1);
			} else v = i.splice(Math.floor(r() * i.length), 1)[0], y = r() * Math.PI * 2, b = Math.cos(y), x = Math.sin(y), O = _.indexOf(v), d = O % l, f = Math.floor(O / l), p = d, h = f;
		}
		for (T = 0, E = 0, S = -1; S <= 1; S++) for (C = -1; C <= 1; C++) w = (f + S) * l + d + C, _[w] !== void 0 && a.indexOf(_[w]) !== -1 && d + C >= 0 && f + S >= 0 && d + C < l && f + S < u && S && C && (T += _[w].z, E++);
		E && ((!D || r() < s) && (D = r()), v.z = T / E + t.EaseInWeak(D) * c * 2 - c), a.push(v);
	}
	for (d = _.length - 1; d >= 0; d--) e[d] = _[d].z;
	t.Smooth(e, n), t.Smooth(e, n);
};
//#endregion
//#region src/gaussian.js
function Y(e, t, n) {
	if (!e.length || !t.length) return e;
	var r = 0, i = 0, a = 0, o = 0, s = e.length, c = e[0].length, l = t.length, u = t[0].length;
	if (n === void 0) for (n = Array(s), r = 0; r < s; r++) n[r] = new Float64Array(c);
	for (r = 0; r < s; r++) for (i = 0; i < c; i++) {
		var d = 0;
		for (n[r][i] = 0, a = 0; a < l; a++) for (o = 0; o < u; o++) e[r + a] !== void 0 && e[r + a][i + o] !== void 0 && (d = e[r + a][i + o]), n[r][i] += d * t[a][o];
	}
	return n;
}
function X(e, t) {
	return Math.exp(-.5 * e * e / (t * t)) / (t * 2.5066282746310007);
}
function ie(e, t) {
	typeof t != "number" && (t = 7);
	var n = new Float64Array(t), r = Math.floor(t * .5), i = t % 2, a;
	if (!e || !t) return n;
	for (a = 0; a <= r; a++) n[a] = X(e * (a - r - i * .5), e);
	for (; a < t; a++) n[a] = n[t - 1 - a];
	return n;
}
function ae(e, t, n) {
	t === void 0 && (t = 1), n === void 0 && (n = 7);
	for (var r = ie(t, n), i = n || r.length, a = [r], o = Array(i), s = 0; s < i; s++) o[s] = [r[s]];
	return Y(Y(e, a), o);
}
//#endregion
//#region src/weightedBoxBlurGaussian.js
t.Gaussian = function(e, n, r, i) {
	t.fromArray2D(e, ae(t.toArray2D(e, n), r, i));
}, t.GaussianBoxBlur = function(e, t, n, r) {
	Z(e, t.xSegments + 1, t.ySegments + 1, n, r);
};
function Z(e, t, n, r, i, a) {
	r === void 0 && (r = 1), i === void 0 && (i = 3), a === void 0 && (a = new Float32Array(e.length));
	for (var o = Q(r, i), s = 0; s < i; s++) $(e, a, t, n, (o[s] - 1) / 2);
	return a;
}
function Q(e, t) {
	var n = Math.sqrt(12 * e * e / t + 1), r = Math.floor(n);
	r % 2 == 0 && r--;
	for (var i = r + 2, a = (12 * e * e - t * r * r - 4 * t * r - 3 * t) / (-4 * r - 4), o = Math.round(a), s = new Int16Array(t), c = 0; c < t; c++) s[c] = c < o ? r : i;
	return s;
}
function $(e, t, n, r, i) {
	for (var a = 0, o = e.length; a < o; a++) t[a] = e[a];
	oe(t, e, n, r, i), se(e, t, n, r, i);
}
function oe(e, t, n, r, i) {
	for (var a = 1 / (i + i + 1), o = 0; o < r; o++) {
		var s = o * n, c = s, l = s + i, u = e[s], d = e[s + n - 1], f = (i + 1) * u, p;
		for (p = 0; p < i; p++) f += e[s + p];
		for (p = 0; p <= i; p++) f += e[l++] - u, t[s++] = f * a;
		for (p = i + 1; p < n - i; p++) f += e[l++] - e[c++], t[s++] = f * a;
		for (p = n - i; p < n; p++) f += d - e[c++], t[s++] = f * a;
	}
}
function se(e, t, n, r, i) {
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
function ce(e, t, n) {
	for (var r = Infinity, i = "distanceTo" + n, a = 0; a < t.length; a++) {
		var o = t[a][i](e);
		o < r && (r = o);
	}
	return r;
}
t.Worley = function(n, r) {
	for (var i = m(r), a = (r.worleyDistribution || t.Worley.randomPoints || function(t, n, r, i) {
		r = r || Math.floor(Math.sqrt(t * n * .025)) || 1;
		for (var a = Array(r), o = 0; o < r; o++) a[o] = new e.Vector2(i() * t, i() * n);
		return a;
	})(r.xSegments, r.ySegments, r.worleyPoints, i), o = r.worleyDistanceTransformation || function(e) {
		return -e;
	}, s = new e.Vector2(0, 0), c = 0, l = r.xSegments + 1; c < l; c++) for (var u = 0; u < r.ySegments + 1; u++) s.x = c, s.y = u, n[u * l + c] = o(ce(s, a, r.distanceType || ""));
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
function le(e, t) {
	return e.splice(Math.floor(t() * e.length), 1)[0];
}
function ue(e, t, n) {
	var r = Math.floor(t.x / n), i = Math.floor(t.y / n);
	e[r] || (e[r] = []), e[r][i] = t;
}
function de(e, t, n) {
	return e.x >= 0 && e.y >= 0 && e.x <= t + 1 && e.y <= n + 1;
}
function fe(e, t, n, r) {
	for (var i = Math.floor(t.x / r), a = Math.floor(t.y / r), o = i - 1; o <= i + 1; o++) for (var s = a - 1; s <= a + 1; s++) if (o !== i && s !== a && e[o] !== void 0 && e[o][s] !== void 0) {
		var c = o * r, l = s * r;
		if (Math.sqrt((t.x - c) * (t.x - c) + (t.y - l) * (t.y - l)) < n) return !0;
	}
	return !1;
}
function pe(t, n, r) {
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
	c.push(u), l.push(u), ue(s, u, o);
	for (var d = 0; c.length;) {
		for (var f = le(c, a), p = 0; p < r; p++) {
			var m = pe(f, i, a);
			if (de(m, t, n) && !fe(s, m, i, o) && (c.push(m), l.push(m), ue(s, m, o), l.length >= r)) break;
		}
		if (l.length >= r || ++d > r * r) break;
	}
	return l;
}, typeof window < "u" && (window.THREE || (window.THREE = {}), window.THREE.Terrain = r, Object.assign(window.THREE.Terrain, t));
//#endregion
export { t as TerrainNS, M as createGrass, O as createGrassTexture, h as createRandomSeed, g as createSeededRandom, r as default, I as generateBlendedMaterial, C as grassClusterWeight, E as grassMaterialWeight, D as grassMeshWeight, S as grassPatchNoise, T as grassSlopeWeight, w as grassTextureWeight, F as scatterGrass, N as updateGrass, P as updateGrassLOD };
