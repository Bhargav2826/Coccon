import React, { useRef, useEffect, useState, useCallback } from "react";
import {
    Eraser, Pencil, Trash2, Maximize2, Minimize2, Palette,
    Square, Circle, Minus, Undo2, Download, X, Type,
    ArrowUpRight, Grid3X3, ImagePlus, Check
} from "lucide-react";
import { toast } from "react-hot-toast";

const Whiteboard = ({ socket, callId, isFaculty, onClose }) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState("pencil"); // pencil, eraser, rectangle, circle, line, arrow, text
    const [color, setColor] = useState("#3b82f6");
    const [lineWidth, setLineWidth] = useState(3);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showGrid, setShowGrid] = useState(true);

    // For shapes
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [snapshot, setSnapshot] = useState(null);
    const [undoStack, setUndoStack] = useState([]);

    // For Text
    const [typingPos, setTypingPos] = useState(null);
    const [textInput, setTextInput] = useState("");

    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const context = canvas.getContext("2d");
        context.scale(2, 2);
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        contextRef.current = context;

        // If we have an undo stack, redraw the last state (useful on resize)
        if (undoStack.length > 0) {
            const img = new Image();
            img.src = undoStack[undoStack.length - 1];
            img.onload = () => context.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
        }
    }, [color, lineWidth, undoStack]);

    useEffect(() => {
        initCanvas();
        const handleResize = () => initCanvas();
        window.addEventListener('resize', handleResize);

        const handlePaste = (e) => {
            if (!isFaculty) return;
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (const item of items) {
                if (item.type.indexOf("image") !== -1) {
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (event) => drawImageOnCanvas(event.target.result, 50, 50, true);
                    reader.readAsDataURL(blob);
                    toast.success("Image pasted from clipboard!");
                }
            }
        };
        window.addEventListener('paste', handlePaste);

        if (socket) {
            socket.on("whiteboard:draw", (data) => handleRemoteAction(data));
            socket.on("whiteboard:clear", () => clearCanvas(false));
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('paste', handlePaste);
            if (socket) {
                socket.off("whiteboard:draw");
                socket.off("whiteboard:clear");
            }
        };
    }, [socket, initCanvas, isFaculty]);

    const saveToUndoStack = () => {
        const canvas = canvasRef.current;
        setUndoStack(prev => [...prev.slice(-24), canvas.toDataURL()]);
    };

    const undo = () => {
        if (undoStack.length === 0) return;
        const previous = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, -1));

        const img = new Image();
        img.src = previous;
        img.onload = () => {
            const context = contextRef.current;
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            context.drawImage(img, 0, 0, canvasRef.current.width / 2, canvasRef.current.height / 2);
        };
    };

    const startAction = (e) => {
        if (!isFaculty) return;
        const { offsetX, offsetY } = e.nativeEvent;

        if (tool === "text") {
            setTypingPos({ x: offsetX, y: offsetY });
            return;
        }

        saveToUndoStack();
        setStartPos({ x: offsetX, y: offsetY });
        setIsDrawing(true);

        if (tool === "pencil" || tool === "eraser") {
            contextRef.current.beginPath();
            contextRef.current.moveTo(offsetX, offsetY);
        } else {
            setSnapshot(contextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
        }
    };

    const performAction = (e) => {
        if (!isDrawing || !isFaculty || tool === "text") return;
        const { offsetX, offsetY } = e.nativeEvent;
        const context = contextRef.current;

        context.strokeStyle = tool === "eraser" ? "#ffffff" : color;
        context.lineWidth = lineWidth;

        if (tool === "pencil" || tool === "eraser") {
            context.lineTo(offsetX, offsetY);
            context.stroke();

            socket.emit("whiteboard:draw", {
                callId, type: tool,
                x0: startPos.x, y0: startPos.y,
                x1: offsetX, y1: offsetY,
                color: context.strokeStyle, lineWidth
            });
            setStartPos({ x: offsetX, y: offsetY });
        } else {
            context.putImageData(snapshot, 0, 0);
            drawShape(tool, startPos.x, startPos.y, offsetX, offsetY, context);
        }
    };

    const endAction = (e) => {
        if (!isDrawing || !isFaculty) return;
        const { offsetX, offsetY } = e.nativeEvent;
        setIsDrawing(false);

        if (tool !== "pencil" && tool !== "eraser") {
            socket.emit("whiteboard:draw", {
                callId, type: tool,
                x0: startPos.x, y0: startPos.y,
                x1: offsetX, y1: offsetY,
                color, lineWidth
            });
        }
    };

    const drawShape = (type, x0, y0, x1, y1, ctx) => {
        ctx.beginPath();
        ctx.setLineDash([]);
        if (type === "rectangle") {
            ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
        } else if (type === "circle") {
            let radius = Math.sqrt(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2));
            ctx.arc(x0, y0, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (type === "line") {
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
        } else if (type === "arrow") {
            const headlen = 15;
            const angle = Math.atan2(y1 - y0, x1 - x0);
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x1 - headlen * Math.cos(angle - Math.PI / 6), y1 - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 - headlen * Math.cos(angle + Math.PI / 6), y1 - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }
    };

    const drawTextOnCanvas = (text, x, y, emit) => {
        if (!text.trim()) return;
        const ctx = contextRef.current;
        ctx.font = `bold ${lineWidth * 4}px Montserrat, sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);

        if (emit && socket) {
            saveToUndoStack();
            socket.emit("whiteboard:draw", {
                callId, type: "text", text, x, y, color, lineWidth
            });
        }
        setTypingPos(null);
        setTextInput("");
    };

    const drawImageOnCanvas = (dataUrl, x, y, emit) => {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const ctx = contextRef.current;
            const maxWidth = 400;
            const scale = Math.min(1, maxWidth / img.width);
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            if (emit && socket) {
                saveToUndoStack();
                socket.emit("whiteboard:draw", {
                    callId, type: "image", dataUrl, x, y,
                    width: img.width * scale, height: img.height * scale
                });
            }
        };
    };

    const handleRemoteAction = (data) => {
        const context = contextRef.current;
        if (!context) return;

        const originalColor = context.strokeStyle;
        const originalWidth = context.lineWidth;
        context.strokeStyle = data.color;
        context.lineWidth = data.lineWidth;

        if (data.type === "pencil" || data.type === "eraser") {
            context.beginPath();
            context.moveTo(data.x0, data.y0);
            context.lineTo(data.x1, data.y1);
            context.stroke();
        } else if (data.type === "text") {
            context.font = `bold ${data.lineWidth * 4}px Montserrat, sans-serif`;
            context.fillStyle = data.color;
            context.fillText(data.text, data.x, data.y);
        } else if (data.type === "image") {
            const img = new Image();
            img.src = data.dataUrl;
            img.onload = () => context.drawImage(img, data.x, data.y, data.width, data.height);
        } else {
            drawShape(data.type, data.x0, data.y0, data.x1, data.y1, context);
        }

        context.strokeStyle = originalColor;
        context.lineWidth = originalWidth;
    };

    const clearCanvas = (emit) => {
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (emit && socket) socket.emit("whiteboard:clear", { callId });
    };

    const download = () => {
        const canvas = canvasRef.current;
        const link = document.createElement("a");
        link.download = `whiteboard-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Board saved to downloads!");
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => drawImageOnCanvas(event.target.result, 50, 50, true);
            reader.readAsDataURL(file);
        }
    };

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-24 right-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-50 flex items-center gap-2 group border-4 border-white/20"
            >
                <Maximize2 size={24} className="group-hover:rotate-12 transition-transform" />
                <span className="font-bold text-sm">Open Board</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 md:inset-4 lg:inset-6 bg-white shadow-2xl rounded-[2.5rem] z-50 flex flex-col overflow-hidden border-[8px] border-primary/5 animate-in zoom-in-95 duration-500">
            {/* Premium Header */}
            <div className="bg-white p-5 shrink-0 flex items-center justify-between border-b border-base-200">
                <div className="flex items-center gap-4">
                    <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                        <Palette className="text-primary size-7" />
                    </div>
                    <div>
                        <h3 className="font-black text-xl text-base-content tracking-tight leading-none mb-1">Interactive Education Board</h3>
                        <div className="flex items-center gap-2">
                            <span className="size-2 bg-success rounded-full animate-pulse" />
                            <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">
                                {isFaculty ? "Faculty Authoring Mode" : "Real-time Student Watch"}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`btn btn-sm btn-circle ${showGrid ? 'btn-primary shadow-lg shadow-primary/20' : 'btn-ghost'}`}
                        title="Toggle Grid"
                    >
                        <Grid3X3 size={18} />
                    </button>
                    <button onClick={() => setIsMinimized(true)} className="btn btn-ghost btn-sm btn-circle"><Minimize2 size={20} /></button>
                    {isFaculty && (
                        <button onClick={onClose} className="btn btn-circle btn-sm btn-error shadow-lg shadow-error/20" title="End Session"><X size={18} /></button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                {isFaculty && (
                    <div className="w-20 bg-base-100 border-r border-base-200 flex flex-col items-center py-6 gap-6 shrink-0 overflow-y-auto no-scrollbar">
                        <div className="flex flex-col gap-3">
                            {[
                                { id: "pencil", icon: Pencil, label: "Draw" },
                                { id: "text", icon: Type, label: "Type" },
                                { id: "arrow", icon: ArrowUpRight, label: "Pointer" },
                                { id: "rectangle", icon: Square, label: "Square" },
                                { id: "circle", icon: Circle, label: "Circle" },
                                { id: "line", icon: Minus, label: "Line" },
                                { id: "eraser", icon: Eraser, label: "Erase" }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTool(t.id)}
                                    className={`size-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${tool === t.id ? 'bg-primary text-primary-content shadow-xl scale-110' : 'hover:bg-base-200 opacity-60'}`}
                                    title={t.label}
                                >
                                    <t.icon size={22} />
                                </button>
                            ))}
                        </div>

                        <div className="h-px w-10 bg-base-200" />

                        {/* Image Tool */}
                        <div className="relative group">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            <button className="size-12 rounded-2xl bg-base-100 border-2 border-dashed border-base-300 flex items-center justify-center opacity-60 group-hover:opacity-100 group-hover:border-primary transition-all">
                                <ImagePlus size={22} className="group-hover:text-primary transition-colors" />
                            </button>
                        </div>

                        <div className="h-px w-10 bg-base-200" />

                        <div className="flex flex-col gap-3">
                            {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#000000"].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`size-8 rounded-full transition-all ${color === c ? 'ring-4 ring-primary ring-offset-2 scale-110 shadow-lg' : 'hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>

                        <div className="mt-auto flex flex-col gap-3 pb-2">
                            <button onClick={undo} disabled={undoStack.length === 0} className="btn btn-ghost btn-sm btn-square disabled:opacity-20" title="Undo"><Undo2 size={18} /></button>
                            <button onClick={() => clearCanvas(true)} className="btn btn-ghost btn-sm btn-square text-error" title="Clear All"><Trash2 size={18} /></button>
                            <button onClick={download} className="btn btn-primary btn-sm btn-square shadow-lg shadow-primary/20" title="Save Image"><Download size={18} /></button>
                        </div>
                    </div>
                )}

                {/* Canvas */}
                <div className="flex-1 bg-white relative overflow-hidden">
                    {/* Grid Layer */}
                    {showGrid && (
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                            style={{
                                backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                                backgroundSize: '40px 40px'
                            }}
                        />
                    )}

                    {/* Typing Input */}
                    {typingPos && (
                        <div
                            className="absolute z-[60] animate-in zoom-in-50 duration-200"
                            style={{ left: typingPos.x, top: typingPos.y - 40 }}
                        >
                            <div className="bg-white shadow-2xl rounded-2xl p-2 border border-primary/20 flex gap-2 w-max">
                                <input
                                    autoFocus
                                    type="text"
                                    className="input input-sm bg-base-100 focus:outline-none font-bold text-base-content min-w-[200px]"
                                    placeholder="Type perfect text..."
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && drawTextOnCanvas(textInput, typingPos.x, typingPos.y, true)}
                                />
                                <button
                                    onClick={() => drawTextOnCanvas(textInput, typingPos.x, typingPos.y, true)}
                                    className="btn btn-sm btn-primary btn-circle"
                                >
                                    <Check size={16} />
                                </button>
                                <button onClick={() => setTypingPos(null)} className="btn btn-sm btn-ghost btn-circle text-error"><X size={16} /></button>
                            </div>
                        </div>
                    )}

                    {/* Controls Overlay */}
                    {isFaculty && (
                        <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-xl rounded-2xl p-2 flex items-center gap-6 z-10 border border-base-200 shadow-xl">
                            <div className="flex items-center gap-3 px-2">
                                <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Thickness</span>
                                <input type="range" min="1" max="30" value={lineWidth} onChange={(e) => setLineWidth(e.target.value)} className="range range-primary range-xs w-32" />
                                <span className="text-xs font-mono w-4 font-black">{lineWidth}</span>
                            </div>
                            <div className="h-6 w-px bg-base-200" />
                            <p className="text-[10px] font-black opacity-30 italic px-2">Tip: Paste (Cmd+V) to add screenshots</p>
                        </div>
                    )}

                    <canvas
                        ref={canvasRef}
                        onMouseDown={startAction}
                        onMouseMove={performAction}
                        onMouseUp={endAction}
                        onMouseLeave={endAction}
                        className={`w-full h-full ${isFaculty ? (tool === 'text' ? 'cursor-text' : 'cursor-crosshair') : 'cursor-default'}`}
                    />
                </div>
            </div>
        </div>
    );
};

export default Whiteboard;
