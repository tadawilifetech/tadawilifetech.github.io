/**
 * "Breathing night" hero scene rendered behind the site banner.
 *
 * Layers (all additive, transparent canvas over the banner photo):
 *  - a particle wave field whose amplitude follows a slow breathing cycle and
 *    ripples around the pointer,
 *  - airflow streams: particles gliding along curved paths, echoing CPAP airflow,
 *  - floating motes that drift upward and twinkle.
 */
import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	CatmullRomCurve3,
	Clock,
	Color,
	MathUtils,
	Mesh,
	PerspectiveCamera,
	Plane,
	PlaneGeometry,
	Points,
	Raycaster,
	Scene,
	ShaderMaterial,
	Vector2,
	Vector3,
	WebGLRenderer,
} from "three";

export type SleepSceneOptions = {
	reducedMotion: boolean;
	rtl: boolean;
};

const BREATH_PERIOD = 6.5; // seconds per inhale + exhale

const waveVertex = /* glsl */ `
uniform float uTime;
uniform float uBreath;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uPixelRatio;
uniform float uFade;
attribute float aRandom;
varying float vElev;
varying float vAlpha;

void main() {
	vec3 p = position;
	float t = uTime;
	float w = sin(p.x * 0.42 + t * 0.55) * 0.34
		+ sin(p.y * 0.65 + t * 0.75) * 0.22
		+ sin((p.x + p.y) * 0.22 + t * 0.35) * 0.42;
	w *= 0.5 + 0.5 * uBreath;
	float d = distance(p.xy, uMouse);
	float ripple = sin(d * 2.6 - t * 3.6) * exp(-d * 0.55) * uMouseStrength * 0.45;
	p.z += w + ripple;
	vElev = p.z;
	vec4 mv = modelViewMatrix * vec4(p, 1.0);
	gl_Position = projectionMatrix * mv;
	gl_PointSize = (1.6 + aRandom * 1.8 + max(ripple, 0.0) * 3.0) * uPixelRatio * (9.0 / -mv.z);
	vAlpha = smoothstep(30.0, 7.0, -mv.z) * uFade;
}
`;

const waveFragment = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vElev;
varying float vAlpha;

void main() {
	float r = length(gl_PointCoord - 0.5);
	if (r > 0.5) discard;
	float soft = smoothstep(0.5, 0.05, r);
	vec3 col = mix(uColorA, uColorB, smoothstep(-0.7, 0.9, vElev));
	gl_FragColor = vec4(col, soft * vAlpha * 0.85);
}
`;

const glowVertex = /* glsl */ `
uniform float uPixelRatio;
uniform float uTime;
uniform float uFade;
attribute float aSize;
attribute float aPhase;
varying float vAlpha;

void main() {
	vec4 mv = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * mv;
	gl_PointSize = aSize * uPixelRatio * (10.0 / -mv.z);
	vAlpha = (0.55 + 0.45 * sin(uTime * 1.7 + aPhase * 6.2831)) * uFade;
}
`;

const glowFragment = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;

void main() {
	float r = length(gl_PointCoord - 0.5);
	if (r > 0.5) discard;
	float core = smoothstep(0.5, 0.0, r);
	gl_FragColor = vec4(uColor, core * core * vAlpha);
}
`;

const moteVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uFade;
attribute float aSpeed;
attribute float aPhase;
varying float vAlpha;

void main() {
	vec3 p = position;
	p.y = mod(p.y + uTime * aSpeed + 6.0, 12.0) - 6.0;
	p.x += sin(uTime * 0.3 + aPhase * 6.2831) * 0.35;
	vec4 mv = modelViewMatrix * vec4(p, 1.0);
	gl_Position = projectionMatrix * mv;
	gl_PointSize = (1.0 + aPhase * 2.2) * uPixelRatio * (8.0 / -mv.z);
	float twinkle = 0.35 + 0.65 * abs(sin(uTime * (0.6 + aPhase) + aPhase * 12.0));
	vAlpha = twinkle * smoothstep(6.0, 3.5, abs(p.y)) * uFade;
}
`;

export function createSleepScene(
	canvas: HTMLCanvasElement,
	opts: SleepSceneOptions,
) {
	const renderer = new WebGLRenderer({
		canvas,
		alpha: true,
		antialias: false,
		powerPreference: "high-performance",
	});
	renderer.setClearColor(0x000000, 0);

	const scene = new Scene();
	const camera = new PerspectiveCamera(46, 1, 0.1, 80);
	camera.position.set(0, 1.4, 8.5);

	const small = window.innerWidth < 768;
	const pixelRatio = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
	renderer.setPixelRatio(pixelRatio);

	// ---------- Wave field ----------
	const waveGeo = new PlaneGeometry(
		30,
		16,
		small ? 130 : 210,
		small ? 70 : 110,
	);
	const count = waveGeo.attributes.position.count;
	const rnd = new Float32Array(count);
	for (let i = 0; i < count; i++) rnd[i] = Math.random();
	waveGeo.setAttribute("aRandom", new BufferAttribute(rnd, 1));
	const waveUniforms = {
		uTime: { value: 0 },
		uBreath: { value: 0 },
		uMouse: { value: new Vector2(99, 99) },
		uMouseStrength: { value: 0 },
		uPixelRatio: { value: pixelRatio },
		uFade: { value: 1 },
		uColorA: { value: new Color("#3d5cff") },
		uColorB: { value: new Color("#7ff3ff") },
	};
	const wave = new Points(
		waveGeo,
		new ShaderMaterial({
			vertexShader: waveVertex,
			fragmentShader: waveFragment,
			uniforms: waveUniforms,
			transparent: true,
			depthWrite: false,
			blending: AdditiveBlending,
		}),
	);
	wave.rotation.x = -Math.PI * 0.43;
	wave.position.set(0, -2.1, -3);
	scene.add(wave);

	// Invisible plane used to project the pointer onto the wave surface
	const hitMesh = new Mesh(new PlaneGeometry(30, 16));
	hitMesh.rotation.copy(wave.rotation);
	hitMesh.position.copy(wave.position);
	hitMesh.updateMatrixWorld();
	const hitPlane = new Plane();
	hitPlane.setFromNormalAndCoplanarPoint(
		new Vector3(0, 0, 1).applyQuaternion(hitMesh.quaternion),
		hitMesh.position,
	);

	// ---------- Airflow streams ----------
	const dir = opts.rtl ? -1 : 1;
	const streamDefs = [
		[
			[-13, -0.4, -1],
			[-6, 0.9, 0.5],
			[-1, 0.2, 1.2],
			[4, 1.6, 0],
			[9, 2.4, -1.5],
			[14, 3.2, -3],
		],
		[
			[-13, 1.2, -3],
			[-7, 2.2, -1.5],
			[-2, 1.4, -0.5],
			[3, 2.6, -1],
			[8, 3.6, -2.5],
			[14, 4.2, -4],
		],
		[
			[-13, -1.4, 0],
			[-5, -0.6, 1.5],
			[0, -1.0, 2],
			[5, 0.3, 1],
			[10, 1.0, -0.5],
			[14, 1.8, -2],
		],
	].map(
		(pts) =>
			new CatmullRomCurve3(pts.map(([x, y, z]) => new Vector3(x * dir, y, z))),
	);
	const LUT = 400;
	const streamLuts = streamDefs.map((curve) => curve.getSpacedPoints(LUT - 1));
	const perStream = small ? 140 : 240;
	const streamCount = perStream * streamLuts.length;
	const sPos = new Float32Array(streamCount * 3);
	const sSize = new Float32Array(streamCount);
	const sPhase = new Float32Array(streamCount);
	const sProgress = new Float32Array(streamCount);
	const sSpeed = new Float32Array(streamCount);
	const sOffset = new Float32Array(streamCount * 3);
	for (let i = 0; i < streamCount; i++) {
		sProgress[i] = Math.random();
		sSpeed[i] = 0.025 + Math.random() * 0.05;
		sSize[i] = 1.5 + Math.random() * 4.5;
		sPhase[i] = Math.random();
		const spread = Math.random() ** 2 * 0.55;
		const a = Math.random() * Math.PI * 2;
		sOffset[i * 3] = Math.cos(a) * spread;
		sOffset[i * 3 + 1] = Math.sin(a) * spread;
		sOffset[i * 3 + 2] = (Math.random() - 0.5) * spread;
	}
	const streamGeo = new BufferGeometry();
	streamGeo.setAttribute("position", new BufferAttribute(sPos, 3));
	streamGeo.setAttribute("aSize", new BufferAttribute(sSize, 1));
	streamGeo.setAttribute("aPhase", new BufferAttribute(sPhase, 1));
	const streamUniforms = {
		uTime: { value: 0 },
		uPixelRatio: { value: pixelRatio },
		uFade: { value: 1 },
		uColor: { value: new Color("#cdf6ff") },
	};
	const streams = new Points(
		streamGeo,
		new ShaderMaterial({
			vertexShader: glowVertex,
			fragmentShader: glowFragment,
			uniforms: streamUniforms,
			transparent: true,
			depthWrite: false,
			blending: AdditiveBlending,
		}),
	);
	scene.add(streams);

	const updateStreams = (dt: number, breath: number) => {
		const flow = 0.55 + breath * 0.9;
		for (let s = 0; s < streamLuts.length; s++) {
			const lut = streamLuts[s];
			for (let k = 0; k < perStream; k++) {
				const i = s * perStream + k;
				let p = sProgress[i] + sSpeed[i] * dt * flow;
				if (p > 1) p -= 1;
				sProgress[i] = p;
				const f = p * (LUT - 1);
				const i0 = Math.floor(f);
				const i1 = Math.min(i0 + 1, LUT - 1);
				const t = f - i0;
				const a = lut[i0];
				const b = lut[i1];
				// fade the tube width in/out at the ends of the path
				const taper = Math.sin(p * Math.PI);
				sPos[i * 3] = a.x + (b.x - a.x) * t + sOffset[i * 3] * taper;
				sPos[i * 3 + 1] = a.y + (b.y - a.y) * t + sOffset[i * 3 + 1] * taper;
				sPos[i * 3 + 2] = a.z + (b.z - a.z) * t + sOffset[i * 3 + 2] * taper;
			}
		}
		streamGeo.attributes.position.needsUpdate = true;
	};

	// ---------- Motes ----------
	const moteCount = small ? 220 : 420;
	const mPos = new Float32Array(moteCount * 3);
	const mSpeed = new Float32Array(moteCount);
	const mPhase = new Float32Array(moteCount);
	for (let i = 0; i < moteCount; i++) {
		mPos[i * 3] = (Math.random() - 0.5) * 26;
		mPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
		mPos[i * 3 + 2] = -Math.random() * 10 + 2;
		mSpeed[i] = 0.08 + Math.random() * 0.25;
		mPhase[i] = Math.random();
	}
	const moteGeo = new BufferGeometry();
	moteGeo.setAttribute("position", new BufferAttribute(mPos, 3));
	moteGeo.setAttribute("aSpeed", new BufferAttribute(mSpeed, 1));
	moteGeo.setAttribute("aPhase", new BufferAttribute(mPhase, 1));
	const moteUniforms = {
		uTime: { value: 0 },
		uPixelRatio: { value: pixelRatio },
		uFade: { value: 1 },
		uColor: { value: new Color("#ffffff") },
	};
	const motes = new Points(
		moteGeo,
		new ShaderMaterial({
			vertexShader: moteVertex,
			fragmentShader: glowFragment,
			uniforms: moteUniforms,
			transparent: true,
			depthWrite: false,
			blending: AdditiveBlending,
		}),
	);
	scene.add(motes);

	// ---------- Interaction ----------
	const pointer = new Vector2(0, 0);
	const pointerTarget = new Vector2(0, 0);
	const raycaster = new Raycaster();
	const hit = new Vector3();
	let pointerActive = 0;
	let lastPointerMove = 0;

	const onPointerMove = (e: PointerEvent) => {
		const rect = canvas.getBoundingClientRect();
		if (e.clientY > rect.bottom) return;
		pointerTarget.set(
			((e.clientX - rect.left) / rect.width) * 2 - 1,
			-((e.clientY - rect.top) / rect.height) * 2 + 1,
		);
		lastPointerMove = performance.now();
	};
	window.addEventListener("pointermove", onPointerMove, { passive: true });

	let scrollFade = 1;
	const onScroll = () => {
		const h = canvas.clientHeight || window.innerHeight;
		scrollFade = 1 - MathUtils.clamp(window.scrollY / (h * 0.9), 0, 1);
	};
	window.addEventListener("scroll", onScroll, { passive: true });
	onScroll();

	// ---------- Sizing ----------
	const resize = () => {
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		if (!w || !h) return;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		// keep the composition on tall/narrow screens
		camera.fov = w / h < 1 ? 62 : 46;
		camera.updateProjectionMatrix();
	};
	const ro = new ResizeObserver(resize);
	ro.observe(canvas);
	resize();

	// ---------- Loop ----------
	const clock = new Clock();
	let raf = 0;
	let running = false;
	let visible = true;
	let elapsed = 2.2;

	const renderFrame = (dt: number) => {
		elapsed += dt;
		const phase = (elapsed / BREATH_PERIOD) * Math.PI * 2;
		const breath = 0.5 - 0.5 * Math.cos(phase); // 0 → 1 → 0

		pointer.lerp(pointerTarget, 0.06);
		const idle = performance.now() - lastPointerMove > 2500;
		pointerActive = MathUtils.lerp(pointerActive, idle ? 0 : 1, 0.05);

		raycaster.setFromCamera(pointer, camera);
		if (raycaster.ray.intersectPlane(hitPlane, hit)) {
			const local = hitMesh.worldToLocal(hit.clone());
			waveUniforms.uMouse.value.set(local.x, local.y);
		}

		camera.position.x = MathUtils.lerp(
			camera.position.x,
			pointer.x * 0.7,
			0.04,
		);
		camera.position.y = MathUtils.lerp(
			camera.position.y,
			1.4 + pointer.y * 0.35 - (1 - scrollFade) * 1.2,
			0.05,
		);
		camera.lookAt(0, -0.3 - (1 - scrollFade) * 0.8, 0);

		const fade = 0.25 + 0.75 * scrollFade;
		waveUniforms.uTime.value = elapsed;
		waveUniforms.uBreath.value = breath;
		waveUniforms.uMouseStrength.value = pointerActive;
		waveUniforms.uFade.value = fade;
		streamUniforms.uTime.value = elapsed;
		streamUniforms.uFade.value = fade;
		moteUniforms.uTime.value = elapsed;
		moteUniforms.uFade.value = fade;

		updateStreams(dt, breath);
		motes.rotation.y = pointer.x * 0.05;
		renderer.render(scene, camera);
	};

	const loop = () => {
		raf = requestAnimationFrame(loop);
		renderFrame(Math.min(clock.getDelta(), 0.05));
	};

	const start = () => {
		if (running || opts.reducedMotion) return;
		running = true;
		clock.getDelta();
		loop();
	};
	const stop = () => {
		running = false;
		cancelAnimationFrame(raf);
	};

	const updateRunning = () => {
		if (visible && !document.hidden) start();
		else stop();
	};

	const io = new IntersectionObserver(
		(entries) => {
			visible = entries[0]?.isIntersecting ?? true;
			updateRunning();
		},
		{ threshold: 0 },
	);
	io.observe(canvas);
	document.addEventListener("visibilitychange", updateRunning);

	const onContextLost = (e: Event) => {
		e.preventDefault();
		stop();
	};
	canvas.addEventListener("webglcontextlost", onContextLost);

	// First frame: settle the streams so the still image (reduced motion) looks complete
	updateStreams(0, 0.5);
	renderFrame(0);
	updateRunning();

	return {
		dispose() {
			stop();
			io.disconnect();
			ro.disconnect();
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("scroll", onScroll);
			document.removeEventListener("visibilitychange", updateRunning);
			canvas.removeEventListener("webglcontextlost", onContextLost);
			for (const obj of [wave, streams, motes]) {
				obj.geometry.dispose();
				(obj.material as ShaderMaterial).dispose();
			}
			hitMesh.geometry.dispose();
			renderer.dispose();
		},
	};
}
