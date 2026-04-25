import React, { forwardRef } from "react";
import { format } from "timeago.js";
import Avatar from "../UI/Avatar";
import styles from "./Message.module.css";

const Message = forwardRef(function Message(props, ref) {
	const { message, own, senderAvatar, senderName } = props;

	return (
		<div ref={ref} className={`${styles.row} ${own ? styles.own : ""}`}>
			{!own && (
				<Avatar
					src={senderAvatar}
					name={senderName}
					size={28}
					className={styles.avatar}
				/>
			)}

			<div>
				<div className={styles.meta}>
					{!own && <span>{senderName}</span>}
					<span>{format(message.createdAt)}</span>
				</div>
				<div className={styles.bubble}>{message.text}</div>
			</div>
		</div>
	);
});

export default Message;
