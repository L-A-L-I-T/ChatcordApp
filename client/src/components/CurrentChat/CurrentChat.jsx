import React, { useRef, useEffect } from "react";
import styles from "./CurrentChat.module.css";
import { IconSend, IconMessages } from "@tabler/icons-react";
import Avatar from "../UI/Avatar";
import Message from "../Message/Message";

function CurrentChat(props) {
	const scrollRef = useRef();

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			props.handleSendMessage();
		}
	};

	useEffect(() => {
		scrollRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [props.messages]);

	const isOnline = props.onlineUsers?.includes(props.friend?._id);

	/* ── Empty / loading states ── */
	if (!props.currentChat) {
		return (
			<div className={styles.empty}>
				<IconMessages size={48} stroke={1.4} className={styles.emptyIcon} />
				<div className={styles.emptyTitle}>No conversation selected</div>
				<div className={styles.emptySub}>
					Pick a friend from the sidebar to start chatting
				</div>
			</div>
		);
	}

	if (props.loading) {
		return (
			<div className={styles.empty}>
				<div className={styles.spinner} />
			</div>
		);
	}

	return (
		<div className={styles.wrap}>
			{/* ── Chat header ── */}
			<div className={styles.chatHeader}>
				<Avatar
					src={props.friend?.avatar}
					name={props.friend?.username}
					size={34}
					className={styles.chatAvatar}
				/>
				<div className={styles.chatInfo}>
					<div className={styles.chatName}>{props.friend?.username}</div>
					<div className={styles.chatStatus}>
						{isOnline && <span className={styles.onlineDot} />}
						<span>{isOnline ? "Online" : "Offline"}</span>
					</div>
				</div>
			</div>

			{/* ── Messages ── */}
			<div className={styles.msgs}>
				{props.messages.map((msg, idx) => (
					<Message
						key={idx}
						ref={idx === props.messages.length - 1 ? scrollRef : null}
						message={msg}
						own={msg.senderId === props.user?._id}
						senderAvatar={
							msg.senderId === props.user?._id
								? props.user?.avatar
								: props.friend?.avatar
						}
						senderName={
							msg.senderId === props.user?._id
								? props.user?.username
								: props.friend?.username
						}
					/>
				))}
				<div ref={scrollRef} />
			</div>

			{/* ── Input bar ── */}
			<div className={styles.inputBar}>
				<input
					className={styles.input}
					value={props.newMessage}
					onChange={(e) => props.setNewMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Type a message…"
					autoComplete="off"
				/>
				<button
					type="button"
					className={styles.sendBtn}
					onClick={props.handleSendMessage}
					disabled={!props.newMessage?.trim()}
					aria-label="Send message"
				>
					<IconSend size={18} stroke={2} />
				</button>
			</div>
		</div>
	);
}

export default CurrentChat;
