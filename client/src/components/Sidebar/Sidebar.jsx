import React from "react";
import Conversation from "./Conversation";
import styles from "./Sidebar.module.css";
import { IconMessages, IconX } from "@tabler/icons-react";

const Sidebar = (props) => {
	const convList = (
		<div className={styles.list}>
			{props.conversations && props.conversations.length > 0 ? (
				props.conversations.map((chat, key) => (
					<Conversation
						chat={chat}
						key={key}
						currentUser={props.user}
						setCurrentChat={props.setCurrentChat}
						currentChat={props.currentChat}
						friend={props.friend}
						setFriend={props.setFriend}
						loading={props.loading}
						setLoading={props.setLoading}
						ENDPOINT={props.ENDPOINT}
						drawerToggle={props.drawerToggle}
						mobileView={!props.isDesktop}
						onlineUsers={props.onlineUsers}
					/>
				))
			) : (
				<div className={styles.empty}>
					No conversations yet.<br />Add a friend to start chatting!
				</div>
			)}
		</div>
	);

	return (
		<>
			{/* Mobile backdrop */}
			{!props.isDesktop && props.drawerOpen && (
				<button
					type="button"
					className={styles.backdrop}
					onClick={props.drawerToggle}
					aria-label="Close sidebar"
				/>
			)}

			<aside
				className={`${styles.aside} ${
					props.drawerOpen ? styles.open : styles.closed
				}`}
			>
				{/* Desktop header */}
				<div className={styles.sideHeader}>
					<span className={styles.sideTitle}>Conversations</span>
				</div>

				{/* Mobile header */}
				<div className={styles.mobileHeader}>
					<div className={styles.mobileBrand}>
						<IconMessages size={20} stroke={2} className={styles.logoImg} />
						<span className={styles.logoName}>Chatcord</span>
					</div>
					<button
						type="button"
						className={styles.closeBtn}
						onClick={props.drawerToggle}
						aria-label="Close sidebar"
					>
						<IconX size={16} stroke={2} />
					</button>
				</div>

				{convList}
			</aside>
		</>
	);
};

export default Sidebar;
