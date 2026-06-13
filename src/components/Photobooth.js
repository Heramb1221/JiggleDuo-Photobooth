import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";

// ─── Constants ───────────────────────────────────────────────────────────────

const frameOptions = [
  "/assets/frames/heart-frame.png",
  "/assets/frames/heart-frame-2.png",
  "/assets/frames/heart-frame-3.png",
  "/assets/frames/heart-frame-4.png",
];

// SVG-based sticker categories so no external image files are needed
const STICKER_CATEGORIES = {
  hearts: [
    { id: "h1", type: "svg", label: "❤️" },
    { id: "h2", type: "svg", label: "🩷" },
    { id: "h3", type: "svg", label: "💕" },
    { id: "h4", type: "svg", label: "💖" },
    { id: "h5", type: "svg", label: "🫶" },
    { id: "h6", type: "svg", label: "💗" },
  ],
  sparkles: [
    { id: "s1", type: "svg", label: "✨" },
    { id: "s2", type: "svg", label: "⭐" },
    { id: "s3", type: "svg", label: "🌟" },
    { id: "s4", type: "svg", label: "💫" },
    { id: "s5", type: "svg", label: "🌸" },
    { id: "s6", type: "svg", label: "🌼" },
  ],
  stamps: [
    { id: "t1", type: "text", label: "BFF" },
    { id: "t2", type: "text", label: "LOVE" },
    { id: "t3", type: "text", label: "XOXO" },
    { id: "t4", type: "text", label: "CUTE" },
    { id: "t5", type: "text", label: "YAY!" },
    { id: "t6", type: "text", label: "BESTIES" },
  ],
  date: [
    { id: "d1", type: "date", label: "📅 Date" },
    { id: "d2", type: "date-cute", label: "🗓 Cute date" },
  ],
  files: [
    { id: "f1", type: "file", label: "leaf", src: "/assets/stickers/leaf.png" },
    { id: "f2", type: "file", label: "sparkles", src: "/assets/stickers/sparkles.png" },
  ],
};

const FILTERS = [
  { id: "none", label: "Normal", filter: null },
  { id: "vintage", label: "Vintage", filter: "sepia(0.5) contrast(1.1) brightness(0.95) saturate(0.85)" },
  { id: "warm", label: "Warm", filter: "saturate(1.3) brightness(1.05) sepia(0.2) hue-rotate(-10deg)" },
  { id: "cool", label: "Cool", filter: "saturate(0.9) brightness(1.05) hue-rotate(20deg)" },
  { id: "noir", label: "Noir", filter: "grayscale(1) contrast(1.2) brightness(0.9)" },
  { id: "dreamy", label: "Dreamy", filter: "saturate(1.4) brightness(1.1) contrast(0.95) hue-rotate(5deg)" },
];

const BG_OPTIONS = [
  { id: "white", label: "White", value: "#FFFFFF" },
  { id: "pink", label: "Pink", value: "#FFD6E0" },
  { id: "lavender", label: "Lavender", value: "#E8D5FF" },
  { id: "mint", label: "Mint", value: "#D0F5E8" },
  { id: "cream", label: "Cream", value: "#FFF5DC" },
  { id: "black", label: "Black", value: "#1A1A1A" },
];

const videoConstraints = { width: 953, height: 599, facingMode: "user" };
const SLOT_WIDTH = 953;
const SLOT_HEIGHT = 599;

const slots = [
  { x: 123, y: 78 },
  { x: 123, y: 697 },
  { x: 123, y: 1286 },
  { x: 123, y: 1885 },
];

function makeStickerImage(sticker) {
  return new Promise((resolve) => {
    const size = 120;
    const offscreen = document.createElement("canvas");
    offscreen.width = size;
    offscreen.height = size;
    const ctx = offscreen.getContext("2d");

    if (sticker.type === "svg" || sticker.type === "date" || sticker.type === "date-cute") {
      ctx.font = `${size * 0.65}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (sticker.type === "svg") {
        ctx.fillText(sticker.label, size / 2, size / 2);
      } else {
        // date stamp
        const now = new Date();
        const dateStr = sticker.type === "date-cute"
          ? `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`
          : now.toLocaleDateString();
        ctx.font = `bold 22px sans-serif`;
        ctx.fillStyle = "#ff7aa2";
        ctx.fillText(dateStr, size / 2, size / 2);
      }
    } else if (sticker.type === "text") {
      ctx.font = `bold 26px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 4;
      ctx.strokeText(sticker.label, size / 2, size / 2);
      ctx.fillStyle = "#ff7aa2";
      ctx.fillText(sticker.label, size / 2, size / 2);
    }

    const img = new Image();
    img.src = offscreen.toDataURL();
    img.onload = () => resolve(img);
  });
}

export default function PhotoBooth() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const frameImgRef = useRef(null);

  const [selectedFrame, setSelectedFrame] = useState(null);
  const [mode, setMode] = useState("photo"); // "photo" | "decorate"
  const [photos, setPhotos] = useState([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [canTakePhoto, setCanTakePhoto] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [showFlash, setShowFlash] = useState(false);

  const [stickers, setStickers] = useState([]);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [activeStickerCategory, setActiveStickerCategory] = useState("hearts");

  const [textStamps, setTextStamps] = useState([]);
  const [selectedTextStamp, setSelectedTextStamp] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);

  const [activeFilter, setActiveFilter] = useState("none");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [dragging, setDragging] = useState(null);

  const [resizing, setResizing] = useState(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frameImgRef.current) return;

    const ctx = canvas.getContext("2d");
    const frameWidth = frameImgRef.current.width;
    const frameHeight = frameImgRef.current.height;
    canvas.width = frameWidth;
    canvas.height = frameHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Photos with filter
    const filterObj = FILTERS.find((f) => f.id === activeFilter);
    photos.forEach((p) => {
      const slot = slots[p.slotIndex];
      const drawW = p.img.width * p.scale;
      const drawH = p.img.height * p.scale;
      const dx = slot.x + p.offsetX;
      const dy = slot.y + p.offsetY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(slot.x, slot.y, SLOT_WIDTH, SLOT_HEIGHT);
      ctx.clip();
      if (filterObj && filterObj.filter) {
        ctx.filter = filterObj.filter;
      }
      ctx.drawImage(p.img, dx, dy, drawW, drawH);
      ctx.filter = "none";
      ctx.restore();
    });

    ctx.drawImage(frameImgRef.current, 0, 0, frameWidth, frameHeight);

    stickers.forEach((s, i) => {
      const size = s.size || 120;
      ctx.save();
      ctx.translate(s.x + size / 2, s.y + size / 2);
      ctx.rotate((s.angle || 0) * (Math.PI / 180));
      ctx.drawImage(s.img, -size / 2, -size / 2, size, size);

      if (i === selectedSticker) {
        ctx.strokeStyle = "#ff7aa2";
        ctx.lineWidth = 3;
        ctx.strokeRect(-size / 2, -size / 2, size, size);

        ctx.fillStyle = "#ff7aa2";
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#a78bfa";
        ctx.beginPath();
        ctx.arc(0, -size / 2 - 12, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Text stamps
    textStamps.forEach((ts, i) => {
      ctx.save();
      ctx.translate(ts.x, ts.y);
      ctx.rotate((ts.angle || 0) * (Math.PI / 180));
      ctx.font = `bold ${ts.fontSize || 48}px "CantikaCute", cursive, sans-serif`;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 5;
      ctx.strokeText(ts.text, 0, 0);
      ctx.fillStyle = ts.color || "#ff7aa2";
      ctx.fillText(ts.text, 0, 0);

      if (i === selectedTextStamp) {
        const metrics = ctx.measureText(ts.text);
        const w = metrics.width;
        const h = ts.fontSize || 48;
        ctx.strokeStyle = "#ff7aa2";
        ctx.lineWidth = 2;
        ctx.strokeRect(-4, -h, w + 8, h + 8);
        ctx.fillStyle = "#ff7aa2";
        ctx.beginPath();
        ctx.arc(w + 4, 8, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }, [photos, stickers, textStamps, selectedSticker, selectedTextStamp, activeFilter, bgColor]);

  useEffect(() => {
    if (!selectedFrame) return;
    const img = new Image();
    img.src = selectedFrame;
    img.onload = () => {
      frameImgRef.current = img;
      drawCanvas();
    };
  }, [selectedFrame]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleBack = () => {
    if (mode === "decorate") {
      setMode("photo");
      setCanTakePhoto(false);
      setStickers([]);
      setTextStamps([]);
      setSelectedSticker(null);
      setSelectedTextStamp(null);
    } else {
      setSelectedFrame(null);
      setPhotos([]);
      setPhotoCount(0);
      setStickers([]);
      setTextStamps([]);
      setSelectedSticker(null);
      setSelectedTextStamp(null);
      setMode("photo");
      setCanTakePhoto(true);
      setActiveFilter("none");
      setBgColor("#FFFFFF");
    }
  };

  const addPhoto = (img) => {
    if (photoCount >= 4) return;
    const scale = SLOT_WIDTH / img.width;
    const drawH = img.height * scale;
    const offsetY = drawH > SLOT_HEIGHT ? (SLOT_HEIGHT - drawH) / 2 : 0;

    setPhotos((p) => [
      ...p,
      { img, slotIndex: photoCount, scale, offsetX: 0, offsetY },
    ]);
    setCanTakePhoto(true);

    setPhotoCount((c) => {
      const next = c + 1;
      if (next === 4) setMode("decorate");
      return next;
    });
  };

  const takePhotoNow = () => {
    const src = webcamRef.current && webcamRef.current.getScreenshot();
    if (!src) return;
    // Flash
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 350);

    const img = new Image();
    img.src = src;
    img.onload = () => addPhoto(img);
  };

  const capturePhoto = () => {
    if (!canTakePhoto || countdown !== null) return;
    setCanTakePhoto(false);
    setCountdown(3);
    let current = 3;
    const interval = setInterval(() => {
      current -= 1;
      if (current === 0) {
        clearInterval(interval);
        setCountdown(null);
        takePhotoNow();
      } else {
        setCountdown(current);
      }
    }, 1000);
  };

  const uploadPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => addPhoto(img);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const redoLastPhoto = () => {
    if (!photos.length) return;
    setPhotos((p) => p.slice(0, -1));
    setPhotoCount((c) => Math.max(0, c - 1));
    setCanTakePhoto(true);
    if (mode === "decorate") setMode("photo");
  };

  const addSticker = async (sticker) => {
    let img;
    if (sticker.type === "file") {
      img = await new Promise((res) => {
        const i = new Image();
        i.src = sticker.src;
        i.onload = () => res(i);
      });
    } else {
      img = await makeStickerImage(sticker);
    }
    setStickers((s) => [
      ...s,
      { img, x: 300, y: 200, size: 120, angle: 0 },
    ]);
    setSelectedSticker(stickers.length);
  };

  const addTextStamp = () => {
    if (!textInput.trim()) return;
    setTextStamps((ts) => [
      ...ts,
      { text: textInput.trim(), x: 300, y: 400, fontSize: 60, angle: 0, color: "#ff7aa2" },
    ]);
    setSelectedTextStamp(textStamps.length);
    setTextInput("");
    setShowTextInput(false);
  };

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - r.left) * scaleX,
      y: (clientY - r.top) * scaleY,
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const { x, y } = getCoords(e);

    if (mode === "photo") {
      for (let i = photos.length - 1; i >= 0; i--) {
        const p = photos[i];
        const slot = slots[p.slotIndex];
        const w = p.img.width * p.scale;
        const h = p.img.height * p.scale;
        if (
          x >= slot.x + p.offsetX &&
          x <= slot.x + p.offsetX + w &&
          y >= slot.y + p.offsetY &&
          y <= slot.y + p.offsetY + h
        ) {
          setDragging({ type: "photo", index: i, offsetX: x - slot.x - p.offsetX, offsetY: y - slot.y - p.offsetY });
          return;
        }
      }
    }

    if (mode === "decorate") {
      for (let i = textStamps.length - 1; i >= 0; i--) {
        const ts = textStamps[i];
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.font = `bold ${ts.fontSize || 48}px sans-serif`;
        const metrics = ctx.measureText(ts.text);
        const hw = metrics.width + 4;
        const hh = 8;
        const rx = ts.x + hw;
        const ry = ts.y + hh;
        if (Math.hypot(x - rx, y - ry) < 16) {
          setResizing({ type: "textStamp", index: i, startX: x, startY: y, startSize: ts.fontSize });
          setSelectedTextStamp(i);
          return;
        }
      }

      for (let i = stickers.length - 1; i >= 0; i--) {
        const s = stickers[i];
        const size = s.size || 120;
        const cx = s.x + size / 2;
        const cy = s.y + size / 2;
        const angle = (s.angle || 0) * (Math.PI / 180);

        const rx = cx + (size / 2) * Math.cos(angle) - (-size / 2) * Math.sin(angle);
        const ry = cy + (size / 2) * Math.sin(angle) + (-size / 2) * Math.cos(angle);
        if (Math.hypot(x - rx, y - ry) < 16) {
          setResizing({ type: "sticker", index: i, startX: x, startY: y, startSize: size, cx, cy });
          setSelectedSticker(i);
          return;
        }

        const rotX = cx + 0 * Math.cos(angle) - (-size / 2 - 12) * Math.sin(angle);
        const rotY = cy + 0 * Math.sin(angle) + (-size / 2 - 12) * Math.cos(angle);
        if (Math.hypot(x - rotX, y - rotY) < 16) {
          setResizing({ type: "stickerRotate", index: i, cx, cy });
          setSelectedSticker(i);
          return;
        }

        const localX = (x - cx) * Math.cos(-angle) - (y - cy) * Math.sin(-angle);
        const localY = (x - cx) * Math.sin(-angle) + (y - cy) * Math.cos(-angle);
        if (Math.abs(localX) <= size / 2 && Math.abs(localY) <= size / 2) {
          setDragging({ type: "sticker", index: i, offsetX: x - s.x, offsetY: y - s.y });
          setSelectedSticker(i);
          return;
        }
      }

      for (let i = textStamps.length - 1; i >= 0; i--) {
        const ts = textStamps[i];
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.font = `bold ${ts.fontSize || 48}px sans-serif`;
        const metrics = ctx.measureText(ts.text);
        const w = metrics.width + 8;
        const h = (ts.fontSize || 48) + 8;
        if (x >= ts.x - 4 && x <= ts.x + w && y >= ts.y - h && y <= ts.y + 8) {
          setDragging({ type: "textStamp", index: i, offsetX: x - ts.x, offsetY: y - ts.y });
          setSelectedTextStamp(i);
          return;
        }
      }

      setSelectedSticker(null);
      setSelectedTextStamp(null);
    }
  };

  const handlePointerMove = (e) => {
    e.preventDefault();
    const { x, y } = getCoords(e);

    if (resizing) {
      if (resizing.type === "sticker") {
        const dist = Math.hypot(x - resizing.cx, y - resizing.cy);
        const newSize = Math.max(40, Math.min(400, dist * 2));
        setStickers((prev) => {
          const u = [...prev];
          u[resizing.index] = { ...u[resizing.index], size: newSize };
          return u;
        });
      } else if (resizing.type === "stickerRotate") {
        const angle = Math.atan2(y - resizing.cy, x - resizing.cx) * (180 / Math.PI) + 90;
        setStickers((prev) => {
          const u = [...prev];
          u[resizing.index] = { ...u[resizing.index], angle };
          return u;
        });
      } else if (resizing.type === "textStamp") {
        const dx = x - resizing.startX;
        const newSize = Math.max(20, Math.min(200, resizing.startSize + dx * 0.5));
        setTextStamps((prev) => {
          const u = [...prev];
          u[resizing.index] = { ...u[resizing.index], fontSize: newSize };
          return u;
        });
      }
      return;
    }

    if (!dragging) return;

    if (dragging.type === "photo") {
      setPhotos((prev) => {
        const updated = [...prev];
        const p = { ...updated[dragging.index] };
        const slot = slots[p.slotIndex];
        const w = p.img.width * p.scale;
        const h = p.img.height * p.scale;
        p.offsetX = x - slot.x - dragging.offsetX;
        p.offsetY = y - slot.y - dragging.offsetY;
        p.offsetX = Math.min(Math.max(p.offsetX, SLOT_WIDTH - w), 0);
        p.offsetY = Math.min(Math.max(p.offsetY, SLOT_HEIGHT - h), 0);
        updated[dragging.index] = p;
        return updated;
      });
    } else if (dragging.type === "sticker") {
      setStickers((prev) => {
        const u = [...prev];
        u[dragging.index] = { ...u[dragging.index], x: x - dragging.offsetX, y: y - dragging.offsetY };
        return u;
      });
    } else if (dragging.type === "textStamp") {
      setTextStamps((prev) => {
        const u = [...prev];
        u[dragging.index] = { ...u[dragging.index], x: x - dragging.offsetX, y: y - dragging.offsetY };
        return u;
      });
    }
  };

  const handlePointerUp = (e) => {
    e.preventDefault();
    setDragging(null);
    setResizing(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (mode !== "decorate") return;
      if (e.target.tagName === "INPUT") return;

      if (selectedSticker !== null) {
        setStickers((s) => s.filter((_, i) => i !== selectedSticker));
        setSelectedSticker(null);
      } else if (selectedTextStamp !== null) {
        setTextStamps((ts) => ts.filter((_, i) => i !== selectedTextStamp));
        setSelectedTextStamp(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSticker, selectedTextStamp, mode]);

  const downloadPhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "photo-strip.png";
    a.click();
  };

  const progressDots = Array.from({ length: 4 }, (_, i) => (
    <span
      key={i}
      style={{
        display: "inline-block",
        width: i < photoCount ? 14 : 10,
        height: i < photoCount ? 14 : 10,
        borderRadius: "50%",
        background: i < photoCount ? "#ff7aa2" : "#f0c4cf",
        margin: "0 4px",
        transition: "all 0.3s ease",
        verticalAlign: "middle",
      }}
    />
  ));

  return (
    <div style={styles.centerCol}>
      {/* Flash overlay */}
      {showFlash && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "white",
          opacity: 0.9,
          zIndex: 9999,
          pointerEvents: "none",
          animation: "flash 0.35s ease-out forwards",
        }} />
      )}

      {/* Top bar */}
      <div style={styles.topBar}>
        {selectedFrame && (
          <button style={styles.backBtn} onClick={handleBack}>← Back</button>
        )}
        <h1 style={styles.titleBar}>
          {!selectedFrame
            ? "₊✩‧₊˚ Select a frame ౨ৎ ˚₊✩‧₊"
            : mode === "photo"
              ? "⋆｡‧˚ʚ Smile :) ɞ˚‧｡⋆"
              : ". ݁₊ ⊹ Let's decorate ⊹ ₊ ݁."}
        </h1>
      </div>

      {/* Progress indicator (photo mode only) */}
      {selectedFrame && mode === "photo" && (
        <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
          {progressDots}
          <span style={{ fontFamily: "CantikaCute", color: "#b87c7c", fontSize: 16 }}>
            {photoCount < 4 ? `Photo ${photoCount + 1} of 4` : "All done!"}
          </span>
        </div>
      )}

      {/* Main content */}
      <div style={styles.mainContent}>
        {!selectedFrame ? (
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {frameOptions.map((src) => (
              <img
                key={src}
                src={src}
                alt="frame option"
                onClick={() => setSelectedFrame(src)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.08)";
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(255,122,162,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 8px 8px rgba(0,0,0,0.15)";
                }}
                style={styles.frameThumb}
              />
            ))}
          </div>
        ) : (
          <div style={styles.row}>
            {/* Left panel */}
            <div style={styles.leftPanel}>
              {mode === "photo" ? (
                <>
                  {/* Webcam */}
                  <div style={{ position: "relative", width: 340, borderRadius: 12, overflow: "hidden" }}>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/png"
                      videoConstraints={videoConstraints}
                      mirrored={true}
                      style={{ width: "100%", display: "block" }}
                    />
                    {countdown !== null && (
                      <div style={styles.countdownOverlay}>{countdown}</div>
                    )}
                  </div>

                  {/* Photo buttons */}
                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {canTakePhoto && (
                      <>
                        <button style={styles.btn} onClick={capturePhoto}>
                          📷 Take Photo
                        </button>
                        <label style={{ ...styles.btn, cursor: "pointer" }}>
                          ⬆️ Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={uploadPhoto}
                            style={{ display: "none" }}
                          />
                        </label>
                      </>
                    )}
                    {photoCount > 0 && (
                      <button
                        style={{ ...styles.btn, padding: "8px 14px", fontSize: 20 }}
                        onClick={redoLastPhoto}
                        title="Redo last photo"
                      >
                        ⟳
                      </button>
                    )}
                  </div>

                  {/* Filter selector */}
                  <div style={{ marginTop: 16 }}>
                    <p style={styles.sectionLabel}>Filter</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {FILTERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setActiveFilter(f.id)}
                          style={{
                            ...styles.filterBtn,
                            background: activeFilter === f.id ? "#ff7aa2" : "white",
                            color: activeFilter === f.id ? "white" : "#8c5b4a",
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background color selector */}
                  <div style={{ marginTop: 14 }}>
                    <p style={styles.sectionLabel}>Strip background</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {BG_OPTIONS.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => setBgColor(bg.value)}
                          title={bg.label}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: bg.value,
                            border: bgColor === bg.value ? "3px solid #ff7aa2" : "2px solid #e0b8c0",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Decorate panel */
                <>
                  {/* Sticker categories */}
                  <p style={styles.sectionLabel}>Stickers</p>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {Object.keys(STICKER_CATEGORIES).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveStickerCategory(cat)}
                        style={{
                          ...styles.filterBtn,
                          padding: "4px 10px",
                          fontSize: 13,
                          background: activeStickerCategory === cat ? "#ff7aa2" : "white",
                          color: activeStickerCategory === cat ? "white" : "#8c5b4a",
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div style={styles.stickerTray}>
                    {STICKER_CATEGORIES[activeStickerCategory].map((sticker) => {
                        const isEmoji = sticker.type === "svg";
                        const isFile = sticker.type === "file";

                        return (
                        <button
                            key={sticker.id}
                            onClick={() => addSticker(sticker)}
                            style={{
                            ...styles.stickerBtn,
                            width: isEmoji ? 50 : "auto", // Let text/date buttons expand to fit their content
                            padding: isEmoji ? 0 : "0 12px", // Add inner spacing for text buttons
                            }}
                            title={sticker.label}
                        >
                            {isFile ? (
                            // Display the actual image instead of the text for uploaded files
                            <img 
                                src={sticker.src} 
                                alt={sticker.label} 
                                style={{ width: 32, height: 32, objectFit: "contain" }} 
                            />
                            ) : (
                            // Use smaller font for text/dates, keep it large for emojis
                            <span style={{
                                fontSize: isEmoji ? 28 : 16,
                                fontWeight: isEmoji ? "normal" : "bold",
                                color: "#ff7aa2",
                                lineHeight: 1,
                                fontFamily: "CantikaCute, sans-serif"
                            }}>
                                {sticker.label}
                            </span>
                            )}
                        </button>
                        );
                    })}
                    </div>

                  {/* Text stamps */}
                  <div style={{ marginTop: 14 }}>
                    <p style={styles.sectionLabel}>Text stamp</p>
                    {showTextInput ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addTextStamp()}
                          placeholder="Type something cute..."
                          maxLength={20}
                          style={styles.textInput}
                          autoFocus
                        />
                        <button style={styles.btn} onClick={addTextStamp}>Add</button>
                        <button
                          style={{ ...styles.btn, padding: "8px 10px" }}
                          onClick={() => setShowTextInput(false)}
                        >✕</button>
                      </div>
                    ) : (
                      <button style={styles.btn} onClick={() => setShowTextInput(true)}>
                        ✍️ Add text
                      </button>
                    )}
                    {selectedTextStamp !== null && textStamps[selectedTextStamp] && (
                      <p style={{ fontSize: 12, color: "#b87c7c", marginTop: 6 }}>
                        Drag to move · drag ↘ handle to resize · Delete to remove
                      </p>
                    )}
                  </div>

                  {/* Selected sticker hint */}
                  {selectedSticker !== null && (
                    <p style={{ fontSize: 12, color: "#b87c7c", marginTop: 10 }}>
                      Drag to move · ↘ resize · ○ rotate · Delete to remove
                    </p>
                  )}

                  {/* Download */}
                  <div style={{ marginTop: 20 }}>
                    <button style={{ ...styles.btn, background: "#ff7aa2", color: "white", border: "none" }} onClick={downloadPhoto}>
                      ⬇️ Download strip
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Canvas */}
            <div>
              <canvas
                ref={canvasRef}
                style={styles.canvas}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              />
            </div>
          </div>
        )}
      </div>

      {/* Flash keyframe injected globally */}
      <style>{`
        @keyframes flash {
          0%   { opacity: 0.95; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  centerCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "0 16px",
    boxSizing: "border-box",
  },
  topBar: {
    width: "100%",
    maxWidth: 760,
    height: 60,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    left: 0,
    padding: "8px 16px",
    fontFamily: "CantikaCute",
    color: "#8c5b4a",
    border: "2px solid #8c5b4a",
    borderRadius: 8,
    background: "white",
    cursor: "pointer",
    fontSize: 18,
  },
  titleBar: {
    margin: 0,
    textAlign: "center",
    fontFamily: "CantikaCute",
    color: "#8c5b4a",
  },
  mainContent: {
    width: "100%",
    maxWidth: 900,
    display: "flex",
    justifyContent: "center",
  },
  row: {
    display: "flex",
    gap: 32,
    alignItems: "flex-start",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  leftPanel: {
    width: 340,
    display: "flex",
    flexDirection: "column",
  },
  frameThumb: {
    width: 160,
    cursor: "pointer",
    borderRadius: 12,
    boxShadow: "0 8px 8px rgba(0,0,0,0.15)",
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
  },
  canvas: {
    width: 200,
    height: 500,
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    touchAction: "none",
    cursor: "crosshair",
  },
  countdownOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 96,
    fontWeight: "bold",
    color: "white",
    textShadow: "0 4px 20px rgba(0,0,0,0.6)",
    background: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    pointerEvents: "none",
  },
  btn: {
    padding: "10px 18px",
    fontSize: 18,
    cursor: "pointer",
    fontFamily: "CantikaCute",
    color: "#8c5b4a",
    border: "2px solid #8c5b4a",
    borderRadius: 8,
    background: "white",
  },
  filterBtn: {
    padding: "6px 14px",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "CantikaCute",
    border: "2px solid #f0c4cf",
    borderRadius: 20,
    transition: "all 0.2s",
  },
  stickerTray: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    background: "#fff5f7",
    borderRadius: 12,
    padding: "10px",
  },
  stickerBtn: {
    width: 50,
    height: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "white",
    border: "1.5px solid #f0c4cf",
    borderRadius: 10,
    transition: "transform 0.15s",
  },
  sectionLabel: {
    margin: "0 0 6px 0",
    fontSize: 13,
    fontWeight: "bold",
    color: "#b87c7c",
    fontFamily: "CantikaCute",
  },
  textInput: {
    padding: "8px 12px",
    fontSize: 16,
    fontFamily: "CantikaCute",
    color: "#8c5b4a",
    border: "2px solid #f0c4cf",
    borderRadius: 8,
    outline: "none",
    flex: 1,
  },
};