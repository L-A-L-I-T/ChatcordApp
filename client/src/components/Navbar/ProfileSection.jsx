import { useState, useRef, useEffect } from "react";
import { IconChevronDown, IconLogout } from "@tabler/icons-react";
import Avatar from "../UI/Avatar";
import styles from "./ProfileSection.module.css";

const ProfileSection = (props) => {
	const [open, setOpen] = useState(false);
	const [greeting, setGreeting] = useState("Morning");
	const wrapRef = useRef(null);

	useEffect(() => {
		const h = new Date().getHours();
		if (h >= 12 && h < 18) setGreeting("Afternoon");
		else if (h >= 18) setGreeting("Evening");
	}, []);

	useEffect(() => {
		const handler = (e) => {
			if (wrapRef.current && !wrapRef.current.contains(e.target)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const logout = () => {
		window.open(`${props.ENDPOINT}/api/user/logout`, "_self");
	};

	return (
		<div className={styles.wrap} ref={wrapRef}>
			<button
				type="button"
				className={styles.trigger}
				onClick={() => setOpen((v) => !v)}
				aria-label="Profile menu"
			>
				<Avatar
					src={props.user?.avatar}
					name={props.user?.username}
					size={28}
					className={styles.avatar}
				/>
				<span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>
					<IconChevronDown size={14} stroke={2.5} />
				</span>
			</button>

			{open && (
				<div className={styles.panel}>
				<div className={styles.userRow}>
					<Avatar
						src={props.user?.avatar}
						name={props.user?.username}
						size={38}
						className={styles.userAvatarLg}
					/>
						<div className={styles.userInfo}>
							<div className={styles.greeting}>Good {greeting}</div>
							<div className={styles.username}>
								{props.user?.username || "Guest"}
							</div>
						</div>
					</div>

					<button
						type="button"
						className={`${styles.item} ${styles.danger}`}
						onClick={logout}
					>
						<IconLogout size={16} stroke={1.8} />
						<span>Sign out</span>
					</button>
				</div>
			)}
		</div>
	);
};

export default ProfileSection;
