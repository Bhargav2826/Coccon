import { useState, useEffect } from "react";

const ProgressiveImage = ({ src, placeholderSrc, className, alt, onClick }) => {
    const [imgSrc, setImgSrc] = useState(placeholderSrc || src);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setImgSrc(src);
            setLoading(false);
        };
    }, [src]);

    return (
        <div className={`relative overflow-hidden rounded-lg ${className}`}>
            <img
                src={imgSrc}
                alt={alt}
                className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${loading ? "blur-xl scale-110" : "blur-0 scale-100"
                    }`}
                onClick={onClick}
                loading="lazy"
            />
            {loading && (
                <div className="absolute inset-0 bg-base-300 animate-pulse -z-10" />
            )}
        </div>
    );
};

export default ProgressiveImage;
