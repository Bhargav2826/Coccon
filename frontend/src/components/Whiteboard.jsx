import React, { useRef, useEffect, useState, useCallback } from "react";
import {
    Eraser, Pencil, Trash2, Maximize2, Minimize2, Palette,
    Square, Circle, Minus, Undo2, Download, X, MousePointer2
} from "lucide-react";
import { toast } from "react-hot-toast";

const Whiteboard = ({ socket, callId, isFaculty, onClose }) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState("pencil"); // pencil, eraser, rectangle, circle, line
    const [color, setColor] = useState("#3b82f6");
    const [lineWidth, setLineWidth] = useState(3);
    const [isMinimized, setIsMinimized] = useState(false);

    // For shapes
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [snapshot, setSnapshot] = useState(null);
    const [undoStack, setUndoStack] = useState([]);

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
    }, [color, lineWidth]);

    useEffect(() => {
        initCanvas();

        const handleResize = () => initCanvas();
        window.addEventListener('resize', handleResize);

        if (socket) {
            socket.on("whiteboard:draw", (data) => {
                handleRemoteAction(data);
            });
            socket.on("whiteboard:clear", () => {
                clearCanvas(false);
            });
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (socket) {
                socket.off("whiteboard:draw");
                socket.off("whiteboard:clear");
            }
        };
    }, [socket, initCanvas]);

    const saveToUndoStack = () => {
        const canvas = canvasRef.current;
        setUndoStack(prev => [...prev.slice(-19), canvas.toDataURL()]);
    };

    const undo = () => {
        if (undoStack.length === 0) return;
        const previous = undoStack[undoStack.length - 1];
        const newStack = undoStack.slice(0, -1);
        setUndoStack(newStack);

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
        saveToUndoStack();
        const { offsetX, offsetY } = e.nativeEvent;
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
        if (!isDrawing || !isFaculty) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const context = contextRef.current;

        context.strokeStyle = tool === "eraser" ? "#ffffff" : color;
        context.lineWidth = lineWidth;

        if (tool === "pencil" || tool === "eraser") {
            context.lineTo(offsetX, offsetY);
            context.stroke();

            socket.emit("whiteboard:draw", {
                callId,
                type: tool,
                x0: startPos.x,
                y0: startPos.y,
                x1: offsetX,
                y1: offsetY,
                color: context.strokeStyle,
                lineWidth
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
                callId,
                type: tool,
                x0: startPos.x,
                y0: startPos.y,
                x1: offsetX,
                y1: offsetY,
                color,
                lineWidth
            });
        }
    };

    const drawShape = (type, x0, y0, x1, y1, ctx) => {
        ctx.beginPath();
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
        }
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
        } else {
            drawShape(data.type, data.x0, data.y0, data.x1, data.y1, context);
        }

        context.strokeStyle = originalColor;
        context.lineWidth = originalWidth;
    };

    const clearCanvas = (emit) => {
        const canvas = canvasRef.current;
        contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
        if (emit && socket) socket.emit("whiteboard:clear", { callId });
    };

    const download = () => {
        const link = document.createElement("a");
        link.download = `whiteboard-${Date.now()}.jpg`;
        link.href = canvasRef.current.toDataURL();
        link.click();
    };

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-24 right-6 bg-primary text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-50 flex items-center gap-2 group"
            >
                <Maximize2 size={24} className="group-hover:rotate-12 transition-transform" />
                <span className="font-bold text-sm">Open Board</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 md:inset-6 bg-white shadow-2xl rounded-3xl z-50 flex flex-col overflow-hidden border-[6px] border-primary/10 animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-base-200 to-base-100 p-4 shrink-0 flex items-center justify-between border-b border-base-300">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Palette className="text-primary size-6" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-base-content tracking-tight">Pro Shared Canvas</h3>
                        <div className="flex items-center gap-2">
                            <span className="size-2 bg-success rounded-full animate-pulse" />
                            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest leading-none">
                                {isFaculty ? "Broadcasting Live" : "Viewing Faculty Screen"}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(true)} className="btn btn-ghost btn-sm btn-circle tooltip tooltip-bottom" data-tip="Minimize"><Minimize2 size={18} /></button>
                    {isFaculty && (
                        <button onClick={onClose} className="btn btn-circle btn-sm btn-error btn-outline" title="Close for Everyone"><X size={18} /></button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Professional Sidebar Toolbar */}
                {isFaculty && (
                    <div className="w-16 bg-base-200 border-r border-base-300 flex flex-col items-center py-4 gap-4 shrink-0 overflow-y-auto no-scrollbar">
                        <div className="flex flex-col gap-2">
                            {[
                                { id: "pencil", icon: Pencil, label: "Pencil" },
                                { id: "eraser", icon: Eraser, label: "Eraser" },
                                { id: "rectangle", icon: Square, label: "Rectangle" },
                                { id: "circle", icon: Circle, label: "Circle" },
                                { id: "line", icon: Minus, label: "Line" }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTool(t.id)}
                                    className={`size-10 rounded-xl flex items-center justify-center transition-all ${tool === t.id ? 'bg-primary text-primary-content shadow-lg scale-110' : 'hover:bg-base-300 opacity-60'}`}
                                    title={t.label}
                                >
                                    <t.icon size={20} />
                                </button>
                            ))}
                        </div>

                        <div className="h-px w-8 bg-base-300" />

                        {/* Colors */}
                        <div className="flex flex-col gap-2">
                            {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#000000"].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`size-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-primary ring-offset-2 scale-110 shadow-md' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>

                        <div className="h-px w-8 bg-base-300" />

                        <div className="flex flex-col gap-2">
                            <button onClick={undo} disabled={undoStack.length === 0} className="btn btn-ghost btn-sm btn-square disabled:opacity-20" title="Undo"><Undo2 size={18} /></button>
                            <button onClick={() => clearCanvas(true)} className="btn btn-ghost btn-sm btn-square text-error" title="Clear All"><Trash2 size={18} /></button>
                            <button onClick={download} className="btn btn-ghost btn-sm btn-square text-primary" title="Save Board"><Download size={18} /></button>
                        </div>
                    </div>
                )}

                {/* Canvas Area */}
                <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
                    {isFaculty && (
                        <div className="absolute top-4 left-4 bg-base-200/80 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-4 z-10 border border-base-300 shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold opacity-50 uppercase">Size</span>
                                <input type="range" min="1" max="25" value={lineWidth} onChange={(e) => setLineWidth(e.target.value)} className="range range-primary range-xs w-24" />
                                <span className="text-xs font-mono w-4">{lineWidth}</span>
                            </div>
                        </div>
                    )}

                    <canvas
                        ref={canvasRef}
                        onMouseDown={startAction}
                        onMouseMove={performAction}
                        onMouseUp={endAction}
                        onMouseLeave={endAction}
                        className={`w-full h-full ${isFaculty ? 'cursor-crosshair' : 'cursor-default'}`}
                    />
                </div>
            </div>
        </div>
    );
};

export default Whiteboard;
