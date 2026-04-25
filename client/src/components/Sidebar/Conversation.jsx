import React, { useState, useEffect } from "react";
import styles from "./Conversation.module.css";
import Avatar from "../UI/Avatar";
import axios from "axios";

function Conversation(props) {
	const [friend, setFriend] = useState(null);
	const friendId = props.chat.members.find((m) => m !== props.currentUser._id);
	const isOnline = props.onlineUsers.includes(friendId);

	const fetchFriend = async () => {
		props.setLoading(true);
		try {
			const res = await axios.get(
				`${props.ENDPOINT}/api/user?userId=${friendId}`
			);
			setFriend(res.data);
			return res.data;
		} catch (err) {
			console.error(err);
		} finally {
			props.setLoading(false);
		}
		return null;
	};

	useEffect(() => {
		if (friendId) fetchFriend();
	}, [props.currentUser]);

	const isActive =
		props.friend && friendId === props.friend?._id ? "true" : "false";

	const handleClick = async () => {
		// Use already-fetched local state if available, otherwise re-fetch
		const resolved = friend ?? (await fetchFriend());
		props.setCurrentChat(props.chat);
		props.setFriend(resolved);
		if (props.mobileView) props.drawerToggle();
	};

	return (
		<div
			className={styles.item}
			data-active={isActive}
			onClick={handleClick}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => e.key === "Enter" && handleClick()}
		>
			<div className={styles.avatarWrap}>
				<Avatar
					src={friend?.avatar}
					name={friend?.username}
					size={40}
					className={styles.avatar}
				/>
				{isOnline && <span className={styles.dot} />}
			</div>

			<div className={styles.info}>
				<div className={styles.name}>{friend?.username ?? "…"}</div>
				<div className={styles.sub}>{isOnline ? "Online" : "Offline"}</div>
			</div>
		</div>
	);
}

export default Conversation;
