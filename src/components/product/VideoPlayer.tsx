import { useCallback, useEffect, useRef, useState } from "react";
import {
	MdFullscreen,
	MdPause,
	MdPlayArrow,
	MdReplay,
	MdVolumeOff,
	MdVolumeUp,
} from "react-icons/md";

export type VideoItem = {
	title?: string;
	youtube?: string;
	src?: string;
	poster?: string;
	end?: number;
};

interface Props {
	videos: VideoItem[];
	locale?: string;
}

const labels: Record<
	string,
	{
		play: string;
		pause: string;
		mute: string;
		unmute: string;
		replay: string;
		full: string;
	}
> = {
	en: {
		play: "Play video",
		pause: "Pause",
		mute: "Mute",
		unmute: "Unmute",
		replay: "Replay",
		full: "Full screen",
	},
	ar: {
		play: "تشغيل الفيديو",
		pause: "إيقاف مؤقت",
		mute: "كتم الصوت",
		unmute: "تشغيل الصوت",
		replay: "إعادة التشغيل",
		full: "ملء الشاشة",
	},
	fa: {
		play: "پخش ویدیو",
		pause: "توقف",
		mute: "بی‌صدا",
		unmute: "صدا",
		replay: "پخش دوباره",
		full: "تمام‌صفحه",
	},
};

function youtubeId(value: string): string {
	const m = value.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
	return m ? m[1] : value.trim();
}

function formatTime(s: number) {
	if (!Number.isFinite(s) || s < 0) return "0:00";
	const m = Math.floor(s / 60);
	return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/**
 * YouTube playback without outbound links: the iframe sits under a transparent
 * shield (so YouTube's title/logo/end-screen can't be clicked) and is driven
 * through the IFrame postMessage API with our own controls.
 */
function YouTubeStage({
	id,
	title,
	ui,
}: {
	id: string;
	title: string;
	ui: (typeof labels)["en"];
}) {
	const frameRef = useRef<HTMLIFrameElement>(null);
	const wrapRef = useRef<HTMLDivElement>(null);
	const [started, setStarted] = useState(false);
	const [playing, setPlaying] = useState(false);
	const [ended, setEnded] = useState(false);
	const [muted, setMuted] = useState(false);
	const [time, setTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [poster, setPoster] = useState(
		`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
	);

	const command = useCallback((func: string, args: unknown[] = []) => {
		frameRef.current?.contentWindow?.postMessage(
			JSON.stringify({ event: "command", func, args }),
			"*",
		);
	}, []);

	useEffect(() => {
		setStarted(false);
		setPlaying(false);
		setEnded(false);
		setTime(0);
		setDuration(0);
		setPoster(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);
	}, [id]);

	useEffect(() => {
		if (!started) return;
		const onMessage = (e: MessageEvent) => {
			if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
			if (e.source !== frameRef.current?.contentWindow) return;
			let data: { event?: string; info?: Record<string, number> } | null = null;
			try {
				data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
			} catch {
				return;
			}
			const info = data?.info;
			if (!info) return;
			if (typeof info.currentTime === "number") setTime(info.currentTime);
			if (typeof info.duration === "number" && info.duration > 0)
				setDuration(info.duration);
			if (typeof info.playerState === "number") {
				setPlaying(info.playerState === 1);
				if (info.playerState === 0) setEnded(true);
				if (info.playerState === 1) setEnded(false);
			}
		};
		window.addEventListener("message", onMessage);
		// Ask the player to start sending state updates
		const handshake = window.setInterval(() => {
			frameRef.current?.contentWindow?.postMessage(
				JSON.stringify({ event: "listening", id: "tadawi" }),
				"*",
			);
		}, 500);
		const stop = window.setTimeout(() => window.clearInterval(handshake), 4000);
		return () => {
			window.removeEventListener("message", onMessage);
			window.clearInterval(handshake);
			window.clearTimeout(stop);
		};
	}, [started]);

	const toggle = () => {
		if (!started) {
			setStarted(true);
			setPlaying(true);
			return;
		}
		if (ended) {
			command("seekTo", [0, true]);
			command("playVideo");
			setEnded(false);
			return;
		}
		command(playing ? "pauseVideo" : "playVideo");
		setPlaying(!playing);
	};

	const seek = (ratio: number) => {
		if (!duration) return;
		command("seekTo", [ratio * duration, true]);
		setTime(ratio * duration);
	};

	const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&cc_load_policy=0&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`;

	return (
		<div ref={wrapRef} className="video-frame group">
			{started && (
				<iframe
					ref={frameRef}
					src={src}
					title={title}
					allow="autoplay; encrypted-media; picture-in-picture"
					className="absolute inset-x-0 w-full"
					// Oversized frame: YouTube's title bar and logo fall outside the visible 16:9 area.
					style={{ pointerEvents: "none", top: "-14%", height: "128%" }}
				/>
			)}

			{/* Shield: catches every click so nothing inside the YouTube frame is reachable */}
			<button
				type="button"
				className="absolute inset-0 z-10 w-full h-full cursor-pointer"
				aria-label={playing ? ui.pause : ui.play}
				onClick={toggle}
				style={{ background: "transparent" }}
			/>

			{(!started || ended) && (
				<div className="absolute inset-0 z-20 pointer-events-none">
					<img
						src={poster}
						alt=""
						className="absolute inset-0 w-full h-full object-cover"
						onError={() =>
							setPoster(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)
						}
						loading="lazy"
					/>
					<div className="absolute inset-0 bg-black/35" />
					<div className="absolute inset-0 grid place-items-center">
						<span className="video-play-btn">
							{ended ? <MdReplay /> : <MdPlayArrow />}
						</span>
					</div>
					{title && (
						<div className="absolute bottom-4 inset-x-5 text-white font-bold text-lg drop-shadow">
							{title}
						</div>
					)}
				</div>
			)}

			{started && !ended && (
				<div className="video-controls z-30">
					<button
						type="button"
						onClick={toggle}
						aria-label={playing ? ui.pause : ui.play}
					>
						{playing ? <MdPause /> : <MdPlayArrow />}
					</button>
					<span className="video-time">{formatTime(time)}</span>
					<input
						type="range"
						min={0}
						max={1000}
						value={duration ? Math.round((time / duration) * 1000) : 0}
						onChange={(e) => seek(Number(e.target.value) / 1000)}
						aria-label="Seek"
						className="video-seek"
						dir="ltr"
					/>
					<span className="video-time">{formatTime(duration)}</span>
					<button
						type="button"
						onClick={() => {
							command(muted ? "unMute" : "mute");
							setMuted(!muted);
						}}
						aria-label={muted ? ui.unmute : ui.mute}
					>
						{muted ? <MdVolumeOff /> : <MdVolumeUp />}
					</button>
					<button
						type="button"
						onClick={() => wrapRef.current?.requestFullscreen?.()}
						aria-label={ui.full}
					>
						<MdFullscreen />
					</button>
				</div>
			)}
		</div>
	);
}

function FileStage({
	video,
	ui,
}: {
	video: VideoItem;
	ui: (typeof labels)["en"];
}) {
	const ref = useRef<HTMLVideoElement>(null);
	const [started, setStarted] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el || video.end === undefined) return;
		const onTime = () => {
			if (video.end !== undefined && el.currentTime >= video.end) {
				el.pause();
				el.currentTime = video.end;
			}
		};
		el.addEventListener("timeupdate", onTime);
		return () => el.removeEventListener("timeupdate", onTime);
	}, [video.end, video.src]);

	return (
		<div className="video-frame">
			<video
				ref={ref}
				key={video.src}
				src={video.src}
				poster={video.poster || undefined}
				controls={started}
				playsInline
				preload="metadata"
				controlsList="nodownload noplaybackrate"
				disablePictureInPicture
				onContextMenu={(e) => e.preventDefault()}
				className="absolute inset-0 w-full h-full object-contain bg-black"
			/>
			{!started && (
				<button
					type="button"
					className="absolute inset-0 grid place-items-center bg-black/30"
					aria-label={ui.play}
					onClick={() => {
						setStarted(true);
						void ref.current?.play();
					}}
				>
					<span className="video-play-btn">
						<MdPlayArrow />
					</span>
				</button>
			)}
		</div>
	);
}

export default function VideoPlayer({ videos, locale = "en" }: Props) {
	const ui = labels[locale] ?? labels.en;
	const [index, setIndex] = useState(0);
	const list = videos.filter((v) => v.youtube || v.src);
	if (!list.length) return null;
	const current = list[Math.min(index, list.length - 1)];

	return (
		<div className="flex flex-col gap-3">
			{current.youtube ? (
				<YouTubeStage
					id={youtubeId(current.youtube)}
					title={current.title ?? ""}
					ui={ui}
				/>
			) : (
				<FileStage video={current} ui={ui} />
			)}
			{list.length > 1 && (
				<div
					className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar"
					role="tablist"
				>
					{list.map((v, i) => (
						<button
							key={`${v.youtube || v.src}-${i}`}
							type="button"
							role="tab"
							aria-selected={i === index}
							onClick={() => setIndex(i)}
							className="chip !h-auto py-2 gap-2"
						>
							<MdPlayArrow className="text-base" />
							{v.title || `Video ${i + 1}`}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
