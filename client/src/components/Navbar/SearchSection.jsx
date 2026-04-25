import { useState } from "react";
import axios from "axios";
import { IconSearch, IconUserPlus, IconCheck, IconX } from "@tabler/icons-react";
import styles from "./SearchSection.module.css";

const SearchSection = (props) => {
	const [value, setValue] = useState("");
	const [toast, setToast] = useState(null); // "success" | "error" | null

	const handleAddFriend = () => {
		if (!value || !props.user?._id) return;
		axios({
			method: "put",
			url: `${props.ENDPOINT}/api/user/${props.user._id}/addFriend`,
			data: { username: value },
		})
			.then((res) => {
				if (res.status === 200) {
					setToast("success");
					props.setRefresh((r) => !r);
					setValue("");
					setTimeout(() => setToast(null), 3500);
				}
			})
			.catch(() => {
				setToast("error");
				setTimeout(() => setToast(null), 3500);
			});
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter") handleAddFriend();
	};

	return (
		<>
			{toast && (
				<div className={styles.toast}>
					{toast === "success" ? (
						<><IconCheck size={15} /> Friend added!</>
					) : (
						<><IconX size={15} /> User not found.</>
					)}
					<button
						type="button"
						className={styles.toastClose}
						onClick={() => setToast(null)}
						aria-label="Dismiss"
					>
						×
					</button>
				</div>
			)}

			<div className={styles.wrap}>
				<div className={styles.field}>
					<span className={styles.icon}>
						<IconSearch size={15} stroke={2} />
					</span>
					<input
						className={styles.input}
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Add friend by username…"
						aria-label="Add friend by username"
					/>
				</div>

				<button
					type="button"
					className={styles.addBtn}
					onClick={handleAddFriend}
					disabled={!value || !props.user?._id}
					aria-label="Add friend"
				>
					<IconUserPlus size={15} stroke={2} />
					<span>Add</span>
				</button>
			</div>
		</>
	);
};

export default SearchSection;
