import GoogleIcon from "../../assets/googleIcon.png";
import { IconMessages } from "@tabler/icons-react";
import styles from "./Home.module.css";

const Login = () => {
	const ENDPOINT = "http://localhost:8000";
	// const ENDPOINT = "https://mern-chatcord.herokuapp.com";

	const handleLoginWithGoogle = () => {
		window.open(`${ENDPOINT}/api/user/google`, "_self");
	};

	return (
		<div className={styles.shell}>
			<div className={styles.card}>
				<div className={styles.brand}>
					<IconMessages size={28} stroke={2} className={styles.logoIcon} />
					<span className={styles.logoName}>Chatcord</span>
				</div>

				<h1 className={styles.title}>Welcome back 👋</h1>
				<p className={styles.subtitle}>
					A clean, fast real-time chat app. Sign in with Google to continue.
				</p>

				<button
					type="button"
					className={styles.googleBtn}
					onClick={handleLoginWithGoogle}
				>
					<img src={GoogleIcon} alt="" width={20} height={20} />
					<span>Continue with Google</span>
				</button>

				<p className={styles.fineprint}>
					By continuing, you agree to our use of cookies for authentication.
				</p>
			</div>

			<footer className={styles.footer}>
				<span>Made by</span>
				<a href="http://lalitrajput.com" target="_blank" rel="noreferrer">
					Lalit Rajput
				</a>
				<span>·</span>
				<a
					href="https://github.com/L-A-L-I-T/mernchatcord"
					target="_blank"
					rel="noreferrer"
				>
					GitHub
				</a>
			</footer>
		</div>
	);
};

export default Login;
