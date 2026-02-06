import React, { useRef, useEffect, useState } from "react";
import { Eraser, Pencil, Trash2, Maximize2, Minimize2, Palette } from "lucide-react";

const Whiteboard = ({ socket, callId, isFaculty }) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#3b82f6"); // Default blue
    const [lineWidth, setLineWidth] = useState(3);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set high resolution for canvas
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const context = canvas.getContext("2d");
        context.scale(2, 2);
        context.lineCap = "round";
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        contextRef.current = context;

        // Socket Listeners
        if (socket) {
            socket.on("whiteboard:draw", (data) => {
                drawOnCanvas(data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth, false);
            });

            socket.on("whiteboard:clear", () => {
                clearCanvas(false);
            });
        }

        return () => {
            if (socket) {
                socket.off("whiteboard:draw");
                socket.off("whiteboard:clear");
            }
        };
    }, [socket, isMinimized]);

    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = color;
            contextRef.current.lineWidth = lineWidth;
        }
    }, [color, lineWidth]);

    const startDrawing = ({ nativeEvent }) => {
        if (!isFaculty) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        if (!isFaculty) return;
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing || !isFaculty) return;
        const { offsetX, offsetY } = nativeEvent;

        // Get previous position (this is simplified, for better curves we need to store lastX, lastY)
        const x0 = contextRef.current.lastX || offsetX;
        const y0 = contextRef.current.lastY || offsetY;
        const x1 = offsetX;
        const y1 = offsetY;

        drawOnCanvas(x0, y0, x1, y1, color, lineWidth, true);

        contextRef.current.lastX = x1;
        contextRef.current.lastY = y1;
    };

    const drawOnCanvas = (x0, y0, x1, y1, drawColor, width, emit) => {
        const context = contextRef.current;
        if (!context) return;

        context.strokeStyle = drawColor;
        context.lineWidth = width;
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.stroke();
        context.closePath();

        if (emit && socket) {
            socket.emit("whiteboard:draw", {
                callId,
                x0,
                y0,
                x1,
                y1,
                color: drawColor,
                lineWidth: width
            });
        }

        // Reset to current selected tools if this was a remote draw
        if (!emit) {
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
        }
    };

    const clearCanvas = (emit) => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (emit && socket) {
            socket.emit("whiteboard:clear", { callId });
        }
    };

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-24 right-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-50 flex items-center gap-2"
            >
                <Maximize2 size={24} />
                <span className="font-bold text-sm">Open Whiteboard</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 md:inset-10 bg-white shadow-2xl rounded-3xl z-50 flex flex-col overflow-hidden border-4 border-primary/20 animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-base-200 p-4 flex items-center justify-between border-b border-base-300">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Pencil className="text-primary size-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base-content">Interactive Shared Whiteboard</h3>
                        <p className="text-xs opacity-60">
                            {isFaculty ? "Drawing active - students see this in real-time" : "Viewing faculty's shared canvas"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="btn btn-ghost btn-sm btn-circle"
                        title="Minimize"
                    >
                        <Minimize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Toolbar (Faculty Only) */}
            {isFaculty && (
                <div className="p-3 bg-base-100 border-b border-base-300 flex flex-wrap items-center gap-4">
                    <div className="flex bg-base-200 p-1 rounded-xl gap-1">
                        {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#000000"].map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-lg transition-all ${color === c ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                        <div className="divider divider-horizontal mx-1"></div>
                        <button
                            onClick={() => setColor("#ffffff")}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-base-300 transition-all ${color === "#ffffff" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                            title="Eraser"
                        >
                            <Eraser size={16} className="text-base-content/60" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 bg-base-200 px-4 py-2 rounded-xl">
                        <span className="text-xs font-bold opacity-50 uppercase">Size</span>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(parseInt(e.target.value))}
                            className="range range-primary range-xs w-32"
                        />
                        <span className="text-xs font-mono w-4">{lineWidth}</span>
                    </div>

                    <button
                        onClick={() => clearCanvas(true)}
                        className="btn btn-error btn-sm gap-2"
                    >
                        <Trash2 size={16} /> Clear All
                    </button>
                </div>
            )}

            {/* Canvas Area */}
            <div className="flex-1 bg-white relative cursor-crosshair overflow-hidden">
                {!isFaculty && (
                    <div className="absolute top-4 right-4 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold animate-pulse z-10">
                        LIVE VIEW
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={finishDrawing}
                    onMouseMove={draw}
                    onMouseOut={finishDrawing}
                    className="w-full h-full"
                />
            </div>
        </div>
    );
};

export default Whiteboard;
