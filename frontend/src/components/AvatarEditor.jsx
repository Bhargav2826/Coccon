import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Check, RotateCw, Image as ImageIcon, Trash2, Camera, Shield, Lock } from "lucide-react";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import Lottie from "lottie-react";
import { useEffect, useMemo } from "react";
import { Search } from "lucide-react";

const COCOON_AVATARS = [
    "https://api.dicebear.com/7.x/bottts/svg?seed=Butterfly&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Bee&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Dragonfly&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Ladybug&backgroundColor=ffd5dc",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Cricket&backgroundColor=d1d4f9",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Leaf&backgroundColor=b6e3f4"
];

const LOTTIE_AVATARS = [
    { name: "Butterfly", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f98b/lottie.json" },
    { name: "Lion", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f981/lottie.json" },
    { name: "Rocket", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/lottie.json" },
    { name: "Alien", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f47d/lottie.json" },
    { name: "Ghost", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f47b/lottie.json" },
    { name: "Robot", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f916/lottie.json" },
    { name: "Unicorn", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f984/lottie.json" },
    { name: "Brain", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f9e0/lottie.json" },
    { name: "Cool", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/lottie.json" },
    { name: "Nerd", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f913/lottie.json" },
    { name: "Thinking", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/lottie.json" },
    { name: "Party", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/lottie.json" },
    { name: "Panda", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f43c/lottie.json" },
    { name: "Dragon", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f432/lottie.json" },
    { name: "Fire", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/lottie.json" },
    { name: "Star", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/2b50/lottie.json" },
    { name: "Heart", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/lottie.json" },
    { name: "Pizza", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f355/lottie.json" },
    { name: "Coffee", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/2615_fe0f/lottie.json" },
    { name: "Meditation", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f9d8/lottie.json" }
];

const GRADIENTS = [
    "linear-gradient(45deg, #f3ec78, #af4261)",
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(to right, #00b09b, #96c93d)",
    "linear-gradient(to right, #ff5f6d, #ffc371)",
    "linear-gradient(to right, #ee0979, #ff6a00)",
    "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)",
    "linear-gradient(to right, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(to right, #fa709a 0%, #fee140 100%)"
];

const EMOJI_DATA = [
    // Smiles & People
    { char: "😀", tags: ["smile", "happy", "face", "grin"] },
    { char: "😂", tags: ["laugh", "funny", "joy", "tear", "lol"] },
    { char: "🥰", tags: ["love", "heart", "smile", "adore", "crush"] },
    { char: "😎", tags: ["cool", "glasses", "sunglasses", "chill"] },
    { char: "🤩", tags: ["star", "eyes", "wow", "amazing", "excited"] },
    { char: "🥳", tags: ["party", "celebrate", "birthday", "hat"] },
    { char: "🤔", tags: ["think", "ponder", "wonder", "hmm"] },
    { char: "🤫", tags: ["quiet", "shh", "silence", "secret"] },
    { char: "🫠", tags: ["melt", "hot", "embarrassed", "soft"] },
    { char: "🥺", tags: ["pleading", "beg", "sad", "eyes", "cute"] },
    { char: "🤯", tags: ["mind", "blown", "explosion", "wow", "brain"] },
    { char: "👽", tags: ["alien", "space", "ufo", "world"] },
    { char: "🤖", tags: ["robot", "bot", "tech", "ai"] },
    { char: "👻", tags: ["ghost", "scary", "boo", "halloween"] },
    { char: "😈", tags: ["devil", "evil", "purple", "horn", "mischievous"] },
    { char: "🤡", tags: ["clown", "funny", "circus", "mask"] },
    { char: "💩", tags: ["poop", "funny", "brown", "smile"] },

    // Animals & Nature
    { char: "🦋", tags: ["butterfly", "insect", "fly", "blue", "wing"] },
    { char: "🦁", tags: ["lion", "cat", "animal", "king", "roar"] },
    { char: "🦄", tags: ["unicorn", "magic", "horse", "fantasy"] },
    { char: "🐼", tags: ["panda", "bear", "animal", "bamboo", "china"] },
    { char: "🦊", tags: ["fox", "animal", "orange", "smart"] },
    { char: "🐙", tags: ["octopus", "sea", "ocean", "purple", "ink"] },
    { char: "🦖", tags: ["dino", "trex", "dinosaur", "green", "scary"] },
    { char: "🐉", tags: ["dragon", "fire", "myth", "fantasy"] },
    { char: "🌵", tags: ["cactus", "desert", "plant", "green", "spike"] },
    { char: "🌈", tags: ["rainbow", "color", "sky", "peace"] },
    { char: "🔥", tags: ["fire", "hot", "burn", "lit", "flame"] },
    { char: "✨", tags: ["sparkle", "star", "magic", "shiny", "glitter"] },
    { char: "🍀", tags: ["clover", "luck", "green", "nature"] },
    { char: "🌸", tags: ["flower", "pink", "cherry", "spring"] },
    { char: "🌍", tags: ["earth", "world", "globe", "planet"] },
    { char: "🌕", tags: ["moon", "night", "dark", "planet"] },
    { char: "🐯", tags: ["tiger", "cat", "stripes", "orange"] },

    // Food & Drink
    { char: "🍕", tags: ["pizza", "food", "cheese", "slice", "dinner"] },
    { char: "🍔", tags: ["burger", "food", "meat", "fast", "lunch"] },
    { char: "🍣", tags: ["sushi", "food", "fish", "japan", "rice"] },
    { char: "🍦", tags: ["icecream", "cold", "sweet", "dessert"] },
    { char: "🍩", tags: ["donut", "sweet", "pink", "sugar"] },
    { char: "🍓", tags: ["strawberry", "fruit", "red", "sweet"] },
    { char: "🥑", tags: ["avocado", "food", "green", "guac"] },
    { char: "☕", tags: ["coffee", "drink", "cup", "morning", "hot"] },
    { char: "🍹", tags: ["cocktail", "drink", "beach", "summer"] },
    { char: "🍺", tags: ["beer", "drink", "party", "alcohol"] },
    { char: "🥂", tags: ["cheers", "drink", "wine", "celebrate"] },
    { char: "🍿", tags: ["popcorn", "movie", "cinema", "snack"] },
    { char: "🍪", tags: ["cookie", "sweet", "snack", "bake"] },
    { char: "🍭", tags: ["lollipop", "sweet", "candy"] },

    // Activities & Objects
    { char: "⚽", tags: ["soccer", "ball", "sport", "game", "play"] },
    { char: "🎮", tags: ["gaming", "video", "play", "controller"] },
    { char: "🎸", tags: ["guitar", "music", "rock", "instrument"] },
    { char: "🎨", tags: ["art", "paint", "color", "draw"] },
    { char: "🚀", tags: ["rocket", "space", "fly", "launch"] },
    { char: "🎓", tags: ["grad", "school", "college", "degree"] },
    { char: "🧩", tags: ["puzzle", "game", "think", "logic"] },
    { char: "💼", tags: ["work", "office", "business", "bag"] },
    { char: "💎", tags: ["diamond", "gem", "shiny", "rich"] },
    { char: "🔮", tags: ["magic", "future", "crystal", "mystic"] },
    { char: "📷", tags: ["camera", "photo", "pic", "lens"] },
    { char: "💡", tags: ["idea", "light", "bright", "smart"] },
    { char: "🔑", tags: ["key", "lock", "access", "open"] },
    { char: "🛹", tags: ["skate", "board", "sport", "cool"] },
    { char: "🎭", tags: ["theatre", "mask", "drama", "art"] },
    { char: "🎧", tags: ["music", "sound", "headphone", "listen"] }
];

const FILTERS = [
    { name: "Normal", value: "none" },
    { name: "Grayscale", value: "grayscale(1)" },
    { name: "Sepia", value: "sepia(0.8)" },
    { name: "Bright", value: "brightness(1.5)" },
    { name: "Cool", value: "hue-rotate(180deg)" },
    { name: "Vintage", value: "contrast(1.2) sepia(0.3)" }
];

const AvatarEditor = ({ isOpen, onClose, onSave, currentAvatar, isUploading, userHistory = [], currentVisibility = 'everyone' }) => {
    const [image, setImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [activeFilter, setActiveFilter] = useState("none");
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [activeTab, setActiveTab] = useState("personal");

    // Emoji & Lottie State
    const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_DATA[0].char);
    const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
    const [selectedLottie, setSelectedLottie] = useState(null);
    const [lottieData, setLottieData] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Reset search when changing tabs
    useEffect(() => {
        setSearchTerm("");
    }, [activeTab]);

    const filteredEmojis = useMemo(() => {
        if (!searchTerm) return EMOJI_DATA;
        const lowSearch = searchTerm.toLowerCase();
        return EMOJI_DATA.filter(e =>
            e.char.includes(searchTerm) ||
            e.tags.some(t => t.toLowerCase().includes(lowSearch))
        );
    }, [searchTerm]);

    const filteredLotties = useMemo(() => {
        if (!searchTerm) return LOTTIE_AVATARS;
        const lowSearch = searchTerm.toLowerCase();
        return LOTTIE_AVATARS.filter(l =>
            l.name.toLowerCase().includes(lowSearch)
        );
    }, [searchTerm]);

    // Generative Search Results (using DiceBear for "related related pictures")
    const searchResults = useMemo(() => {
        if (!searchTerm || activeTab !== "personal") return [];
        // Generate a few seeds related to search term
        return [
            `https://api.dicebear.com/7.x/identicon/svg?seed=${searchTerm}&backgroundColor=b6e3f4`,
            `https://api.dicebear.com/7.x/shapes/svg?seed=${searchTerm}&backgroundColor=ffdfbf`,
            `https://api.dicebear.com/7.x/bottts/svg?seed=${searchTerm}&backgroundColor=c0aede`,
            `https://api.dicebear.com/7.x/micah/svg?seed=${searchTerm}&backgroundColor=ffd5dc`
        ];
    }, [searchTerm, activeTab]);

    useEffect(() => {
        if (selectedLottie) {
            fetch(selectedLottie)
                .then(res => res.json())
                .then(data => setLottieData(data))
                .catch(err => console.error("Lottie select error:", err));
        }
    }, [selectedLottie]);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            return toast.error("Please select an image file");
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImage(reader.result);
            setActiveTab("personal");
        };
        reader.readAsDataURL(file);
    };

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous");
            image.src = url;
        });

    const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0, filter = "none") => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const maxSize = Math.max(image.width, image.height);
        const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

        canvas.width = safeArea;
        canvas.height = safeArea;

        ctx.translate(safeArea / 2, safeArea / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-safeArea / 2, -safeArea / 2);

        // Apply filter before drawing
        ctx.filter = filter;

        ctx.drawImage(
            image,
            safeArea / 2 - image.width * 0.5,
            safeArea / 2 - image.height * 0.5
        );

        const data = ctx.getImageData(0, 0, safeArea, safeArea);

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.putImageData(
            data,
            Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
            Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
        );

        return new Promise((resolve) => {
            canvas.toBlob((file) => {
                resolve(file);
            }, "image/jpeg");
        });
    };

    const handleSave = async () => {
        try {
            if (activeTab === "emoji") {
                onSave({ emojiAvatar: { emoji: selectedEmoji, gradient: selectedGradient } });
                onClose();
                return;
            }

            if (activeTab === "animated") {
                if (!selectedLottie) return toast.error("Please select an animation");
                onSave({ lottieAvatar: selectedLottie });
                onClose();
                return;
            }

            if (!image) return;

            const croppedBlob = await getCroppedImg(image, croppedAreaPixels, rotation, activeFilter);

            const options = {
                maxSizeMB: 0.1,
                maxWidthOrHeight: 500,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(croppedBlob, options);

            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            reader.onloadend = () => {
                onSave({ profilePic: reader.result });
                setImage(null);
                onClose();
            };
        } catch (e) {
            console.error(e);
            toast.error("Failed to process image");
        }
    };

    const handleRemove = () => {
        if (confirm("Are you sure you want to remove your profile picture?")) {
            onSave({ profilePic: "" });
            onClose();
        }
    };

    const handleHistoryClick = (url) => {
        onSave({ useFromHistory: url });
        onClose();
    };

    const handleVisibilityToggle = (val) => {
        onSave({ visibility: val });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-base-100 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-base-300 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Camera className="text-primary" size={20} />
                        Update Profile Picture
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content Area - Split View for tabs */}
                <div className="flex flex-1 overflow-hidden min-h-0">
                    {/* Left Sidebar Tabs */}
                    <div className="w-48 bg-base-200/50 border-r border-base-300 flex flex-col p-2 gap-1 overflow-y-auto">
                        {[
                            { id: "personal", label: "Photo / Upload", icon: <ImageIcon size={18} /> },
                            { id: "emoji", label: "Emoji / Color", icon: <span className="text-lg">😀</span> },
                            { id: "animated", label: "Animated", icon: <RotateCw size={18} className="text-secondary" /> },
                            { id: "history", label: "History", icon: <RotateCw size={18} /> },
                            { id: "cocoon", label: "Cocoon Styles", icon: <Shield size={18} /> },
                            { id: "settings", label: "Privacy", icon: <Lock size={18} /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeTab === tab.id ? "bg-primary text-primary-content shadow-lg" : "hover:bg-base-300 text-base-content/70"}`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-base-100 relative">
                        {activeTab === "personal" && (
                            <div className="space-y-6">
                                {image ? (
                                    <>
                                        <div className="relative h-64 w-full bg-black rounded-2xl overflow-hidden shadow-inner border border-base-300">
                                            <Cropper
                                                image={image}
                                                crop={crop}
                                                zoom={zoom}
                                                rotation={rotation}
                                                aspect={1}
                                                onCropChange={setCrop}
                                                onZoomChange={setZoom}
                                                onRotationChange={setRotation}
                                                onCropComplete={onCropComplete}
                                                cropShape="round"
                                                showGrid={false}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-bold opacity-60 min-w-[50px]">Filters</span>
                                                <div className="flex gap-2 overflow-x-auto pb-2 flex-1 scrollbar-hide">
                                                    {FILTERS.map(f => (
                                                        <button
                                                            key={f.name}
                                                            onClick={() => setActiveFilter(f.value)}
                                                            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 border transition-all ${activeFilter === f.value ? "bg-primary border-primary text-primary-content" : "bg-base-200 border-base-300 hover:border-primary"}`}
                                                        >
                                                            {f.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-bold opacity-60 min-w-[50px]">Zoom</span>
                                                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(e.target.value)} className="range range-xs range-primary flex-1" />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button onClick={() => setImage(null)} className="btn btn-outline flex-1 rounded-full">Change</button>
                                            <button onClick={handleSave} disabled={isUploading} className="btn btn-primary flex-1 rounded-full">
                                                {isUploading && <span className="loading loading-spinner" />} Save
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-6 py-10 border-2 border-dashed border-base-300 rounded-3xl bg-base-200/30">
                                        <ImageIcon size={48} className="text-primary/30" />
                                        <div className="text-center">
                                            <p className="text-lg font-bold">Pick a Profile Photo</p>
                                            <p className="text-xs opacity-50">High resolution JPG or PNG</p>
                                        </div>
                                        <label className="btn btn-primary btn-wide rounded-full shadow-lg cursor-pointer">
                                            Browse Local Files
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        setImage(reader.result);
                                                        setActiveTab("personal");
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }} />
                                        </label>

                                        {/* Related Search Results */}
                                        <div className="w-full space-y-3 pt-4 border-t border-base-300">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold opacity-50 uppercase tracking-widest">Search Generations</p>
                                                <div className="relative group">
                                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30" size={12} />
                                                    <input
                                                        type="text"
                                                        placeholder="Keyword..."
                                                        className="input input-xs input-bordered pl-7 rounded-full w-32 focus:w-48 transition-all"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            {searchResults.length > 0 ? (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {searchResults.map((url, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={async () => {
                                                                // Fetch image and set as local image for cropping
                                                                try {
                                                                    const res = await fetch(url);
                                                                    const blob = await res.blob();
                                                                    const reader = new FileReader();
                                                                    reader.onload = () => setImage(reader.result);
                                                                    reader.readAsDataURL(blob);
                                                                } catch (e) {
                                                                    toast.error("Failed to load image");
                                                                }
                                                            }}
                                                            className="aspect-square bg-base-300 rounded-xl overflow-hidden hover:ring-2 ring-primary transition-all p-1"
                                                        >
                                                            <img src={url} className="w-full h-full object-contain" />
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] opacity-40 italic text-center py-2">Try searching "Space", "Abstract", or "Hero" for related results</p>
                                            )}
                                        </div>
                                        {currentAvatar && <button onClick={handleRemove} className="btn btn-ghost text-error btn-xs"><Trash2 size={14} className="mr-1" /> Remove Current</button>}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "emoji" && (
                            <div className="space-y-8 animate-in slide-in-from-right-4">
                                <div className="flex justify-center">
                                    <div
                                        className="size-40 rounded-full flex items-center justify-center text-7xl shadow-2xl ring-4 ring-base-100 ring-offset-4 ring-offset-primary/20"
                                        style={{ background: selectedGradient }}
                                    >
                                        <span className="drop-shadow-lg">{selectedEmoji}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-50">Pick an Emoji</p>
                                        <div className="relative group">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="input input-xs input-bordered pl-8 rounded-full bg-base-200 focus:bg-base-100 transition-all w-32"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-6 gap-3 max-h-48 overflow-y-auto p-1 scrollbar-hide">
                                        {filteredEmojis.map(e => (
                                            <button
                                                key={e.char}
                                                onClick={() => setSelectedEmoji(e.char)}
                                                className={`text-2xl p-2 rounded-xl transition-all ${selectedEmoji === e.char ? "bg-primary/10 ring-2 ring-primary scale-110" : "hover:bg-base-200"}`}
                                            >
                                                {e.char}
                                            </button>
                                        ))}
                                        {filteredEmojis.length === 0 && <p className="col-span-6 text-center py-4 opacity-40 text-xs italic">No emoji found</p>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">Vibrant Gradients</p>
                                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                        {GRADIENTS.map(g => (
                                            <button
                                                key={g}
                                                onClick={() => setSelectedGradient(g)}
                                                className={`size-10 rounded-full shrink-0 transition-all ${selectedGradient === g ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"}`}
                                                style={{ background: g }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button onClick={handleSave} disabled={isUploading} className="btn btn-primary w-full rounded-full shadow-lg shadow-primary/20 mt-4">
                                    {isUploading && <span className="loading loading-spinner" />} Set Emoji Avatar
                                </button>
                            </div>
                        )}
                        {activeTab === "animated" && (
                            <div className="space-y-8 animate-in slide-in-from-right-4">
                                <div className="flex justify-center">
                                    <div className="size-44 rounded-full bg-base-200 flex items-center justify-center overflow-hidden border-4 border-secondary/20 shadow-2xl">
                                        {lottieData ? (
                                            <Lottie
                                                animationData={lottieData}
                                                loop={true}
                                                style={{ width: '130%', height: '130%' }}
                                            />
                                        ) : (
                                            <RotateCw className="size-12 opacity-20 animate-spin" />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-50">Select Animation</p>
                                        <div className="relative group">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search lottie..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="input input-xs input-bordered pl-8 rounded-full bg-base-200 focus:bg-base-100 transition-all w-40"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1 scrollbar-hide">
                                        {filteredLotties.map(l => (
                                            <button
                                                key={l.url}
                                                onClick={() => setSelectedLottie(l.url)}
                                                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${selectedLottie === l.url ? "bg-secondary/10 ring-2 ring-secondary scale-105" : "bg-base-200 hover:bg-base-300"}`}
                                            >
                                                <span className="text-xs font-bold opacity-70">{l.name}</span>
                                            </button>
                                        ))}
                                        {filteredLotties.length === 0 && <p className="col-span-4 text-center py-4 opacity-40 text-xs italic">No animation found</p>}
                                    </div>
                                </div>

                                <button onClick={handleSave} disabled={isUploading} className="btn btn-secondary w-full rounded-full shadow-lg shadow-secondary/20 mt-4">
                                    {isUploading && <span className="loading loading-spinner" />} Set Animated Avatar
                                </button>
                            </div>
                        )}

                        {activeTab === "history" && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <RotateCw size={18} className="text-primary" />
                                    <p className="font-bold">Recent Avatars</p>
                                </div>
                                {userHistory.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {userHistory.map((url, i) => (
                                            <div
                                                key={i}
                                                onClick={() => handleHistoryClick(url)}
                                                className="aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary cursor-pointer hover:scale-105 transition-all shadow-md group"
                                            >
                                                <img src={url} className="w-full h-full object-cover group-hover:opacity-80" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center bg-base-200/50 rounded-3xl">
                                        <p className="opacity-50">No history yet. Your old avatars will appear here!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "cocoon" && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {COCOON_AVATARS.map((url, i) => (
                                    <div key={url} onClick={() => onSave({ profilePic: url })} className="aspect-square bg-base-200 rounded-2xl p-2 cursor-pointer hover:border-primary border-2 border-transparent shadow-sm">
                                        <img src={url} className="w-full h-full object-contain" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === "settings" && (
                            <div className="space-y-6">
                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex gap-3 text-sm">
                                    <Shield className="text-primary" size={20} />
                                    <p>Control who can see your face and identify your presence.</p>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { id: 'everyone', label: 'Everyone', desc: 'All students and faculty can see your picture' },
                                        { id: 'friends', label: 'Friends Only', desc: 'Only your mutual friends can see your picture' },
                                        { id: 'nobody', label: 'Nobody', desc: 'Your picture is hidden from everyone' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleVisibilityToggle(opt.id)}
                                            className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex justify-between items-center ${currentVisibility === opt.id ? "bg-primary/5 border-primary" : "bg-base-200 border-transparent hover:border-base-300"}`}
                                        >
                                            <div>
                                                <p className="font-bold">{opt.label}</p>
                                                <p className="text-xs opacity-50">{opt.desc}</p>
                                            </div>
                                            {currentVisibility === opt.id && <Check size={20} className="text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvatarEditor;
