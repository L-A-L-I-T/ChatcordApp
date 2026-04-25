import SearchSection from "./SearchSection";
import ProfileSection from "./ProfileSection";
import styles from "./Navbar.module.css";
import { IconLayoutSidebar, IconMessages } from "@tabler/icons-react";

const Navbar = (props) => {
	return (
		<div className={styles.container}>
			{/* Left: toggle + brand */}
			<div className={styles.left}>
				<button
					type="button"
					className={styles.menuBtn}
					onClick={props.handleLeftDrawerToggle}
					aria-label="Toggle sidebar"
					title={props.leftDrawerOpened ? "Hide sidebar" : "Show sidebar"}
				>
					<IconLayoutSidebar size={18} stroke={1.8} />
				</button>

				<div className={styles.brand}>
					<IconMessages
						size={22}
						stroke={2}
						className={styles.logoIcon}
					/>
					<span className={styles.logoName}>Chatcord</span>
				</div>
			</div>

			{/* Center: add friend search */}
			<SearchSection
				user={props.user}
				ENDPOINT={props.ENDPOINT}
				setRefresh={props.setRefresh}
				refresh={props.refresh}
			/>

			{/* Right: profile */}
			<div className={styles.right}>
				<ProfileSection user={props.user} ENDPOINT={props.ENDPOINT} />
			</div>
		</div>
	);
};

export default Navbar;
