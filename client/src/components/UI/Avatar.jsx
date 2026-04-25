import React, { useState } from "react";
import styles from "./Avatar.module.css";

/**
 * Avatar with automatic letter-fallback when the image URL is missing or broken.
 * Props: src, name, size (px number, default 36), className
 */
const COLORS = [
	"#5b6df8", "#10b981", "#f59e0b", "#ef4444",
	"#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6",
];

function colorForName(name = "") {
	let hash = 0;
	for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
	return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ src, name = "", size = 36, className = "" }) {
	const [errored, setErrored] = useState(false);
	const initial = (name || "?")[0].toUpperCase();
	const bg = colorForName(name);

	if (src && !errored) {
		return (
			<img
				className={`${styles.img} ${className}`}
				style={{ width: size, height: size }}
				src={src}
				alt={name}
				onError={() => setErrored(true)}
			/>
		);
	}

	return (
		<span
			className={`${styles.fallback} ${className}`}
			style={{ width: size, height: size, background: bg }}
			aria-label={name}
		>
			{initial}
		</span>
	);
}
