import { useEffect, useState } from "react";
import Lottie from "lottie-react";

const REACTION_LOTTIES = {
    "👍": "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/lottie.json",
    "❤️": "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/lottie.json",
    "😂": "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/lottie.json",
    "😮": "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62e/lottie.json",
    "😢": "https://fonts.gstatic.com/s/e/notoemoji/latest/1f622/lottie.json",
    "🔥": "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/lottie.json",
};

const LottieReaction = ({ emoji, size = 20, loop = true }) => {
    const [animationData, setAnimationData] = useState(null);
    const lottieUrl = REACTION_LOTTIES[emoji];

    useEffect(() => {
        if (lottieUrl) {
            fetch(lottieUrl)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const contentType = res.headers.get("content-type");
                    if (!contentType || !contentType.includes("application/json")) {
                        throw new Error("Response is not JSON");
                    }
                    return res.json();
                })
                .then(data => setAnimationData(data))
                .catch(err => {
                    if (err.message !== "Response is not JSON") {
                        console.error("Error loading lottie:", err);
                    }
                    setAnimationData(null);
                });
        }
    }, [lottieUrl]);

    if (!lottieUrl) return <span style={{ fontSize: size }}>{emoji}</span>;
    if (!animationData) return <div style={{ width: size, height: size }} />;

    return (
        <div style={{ width: size, height: size }}>
            <Lottie
                animationData={animationData}
                loop={loop}
                autoplay={true}
            />
        </div>
    );
};

export default LottieReaction;
export { REACTION_LOTTIES };
