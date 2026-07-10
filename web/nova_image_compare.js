import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

const MODES = ["Wipe", "Side by Side", "Overlay", "Difference"];
const HEADER_H = 34;
const PAD = 8;

function imageUrl(info) {
    const params = new URLSearchParams();
    params.set("filename", info.filename || "");
    params.set("subfolder", info.subfolder || "");
    params.set("type", info.type || "temp");
    return api.apiURL(`/view?${params.toString()}`);
}

function loadImage(info) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageUrl(info);
    });
}

function fitRect(img, x, y, w, h) {
    const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    return {
        x: x + (w - dw) / 2,
        y: y + (h - dh) / 2,
        w: dw,
        h: dh,
    };
}

function drawContained(ctx, img, rect) {
    if (!img) return;
    const r = fitRect(img, rect.x, rect.y, rect.w, rect.h);
    ctx.drawImage(img, r.x, r.y, r.w, r.h);
}

function buttonRects(width) {
    const gap = 4;
    const usable = width - PAD * 2 - gap * (MODES.length - 1);
    const bw = usable / MODES.length;
    return MODES.map((_, i) => ({
        x: PAD + i * (bw + gap),
        y: 8,
        w: bw,
        h: 20,
    }));
}

function hit(rect, x, y) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function drawButtons(ctx, node, width) {
    const rects = buttonRects(width);
    ctx.save();
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    rects.forEach((r, i) => {
        const active = node.properties.novaCompareMode === MODES[i];
        ctx.fillStyle = active ? "#7c3aed" : "#292b31";
        ctx.strokeStyle = active ? "#a78bfa" : "#4b4e57";
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(r.x, r.y, r.w, r.h, 4);
        else ctx.rect(r.x, r.y, r.w, r.h);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? "#ffffff" : "#d1d5db";
        ctx.fillText(MODES[i], r.x + r.w / 2, r.y + r.h / 2);
    });
    ctx.restore();
}

function drawLabels(ctx, area, info) {
    ctx.save();
    ctx.font = "11px sans-serif";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(area.x + 6, area.y + 6, 104, 20);
    ctx.fillRect(area.x + area.w - 110, area.y + 6, 104, 20);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(`A  ${info?.a_width || "?"}×${info?.a_height || "?"}`, area.x + 12, area.y + 10);
    ctx.textAlign = "right";
    ctx.fillText(`B  ${info?.b_width || "?"}×${info?.b_height || "?"}`, area.x + area.w - 12, area.y + 10);
    ctx.restore();
}

function drawCompare(ctx, node) {
    const width = node.size[0];
    const height = node.size[1];
    const area = { x: PAD, y: HEADER_H, w: width - PAD * 2, h: height - HEADER_H - PAD };

    drawButtons(ctx, node, width);

    ctx.save();
    ctx.fillStyle = "#111318";
    ctx.fillRect(area.x, area.y, area.w, area.h);
    ctx.beginPath();
    ctx.rect(area.x, area.y, area.w, area.h);
    ctx.clip();

    const a = node._novaCompareA;
    const b = node._novaCompareB;
    const d = node._novaCompareDiff;
    const mode = node.properties.novaCompareMode || "Wipe";
    const pos = Math.max(0, Math.min(1, Number(node.properties.novaComparePosition ?? 0.5)));

    if (a && b) {
        if (mode === "Side by Side") {
            const left = { x: area.x, y: area.y, w: area.w / 2, h: area.h };
            const right = { x: area.x + area.w / 2, y: area.y, w: area.w / 2, h: area.h };
            drawContained(ctx, a, left);
            drawContained(ctx, b, right);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(area.x + area.w / 2, area.y);
            ctx.lineTo(area.x + area.w / 2, area.y + area.h);
            ctx.stroke();
        } else if (mode === "Overlay") {
            drawContained(ctx, a, area);
            ctx.globalAlpha = pos;
            drawContained(ctx, b, area);
            ctx.globalAlpha = 1;
        } else if (mode === "Difference") {
            drawContained(ctx, d || b, area);
        } else {
            drawContained(ctx, a, area);
            ctx.save();
            ctx.beginPath();
            ctx.rect(area.x, area.y, area.w * pos, area.h);
            ctx.clip();
            drawContained(ctx, b, area);
            ctx.restore();
            const x = area.x + area.w * pos;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, area.y);
            ctx.lineTo(x, area.y + area.h);
            ctx.stroke();
            ctx.fillStyle = "#7c3aed";
            ctx.beginPath();
            ctx.arc(x, area.y + area.h / 2, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        ctx.fillStyle = "#9ca3af";
        ctx.font = "13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Connect two images and run the workflow", area.x + area.w / 2, area.y + area.h / 2);
    }

    ctx.restore();
    drawLabels(ctx, area, node._novaCompareInfo);
}

function setPositionFromMouse(node, localX) {
    const width = node.size[0];
    const areaX = PAD;
    const areaW = width - PAD * 2;
    node.properties.novaComparePosition = Math.max(0, Math.min(1, (localX - areaX) / areaW));
    node.setDirtyCanvas?.(true, true);
}

app.registerExtension({
    name: "NovaEssentials.ImageCompare",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "NovaImageCompare") return;

        const originalCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = originalCreated?.apply(this, arguments);
            this.properties = this.properties || {};
            this.properties.novaCompareMode ??= "Wipe";
            this.properties.novaComparePosition ??= 0.5;
            this.size = [Math.max(this.size?.[0] || 420, 420), Math.max(this.size?.[1] || 440, 440)];
            return result;
        };

        const originalExecuted = nodeType.prototype.onExecuted;
        nodeType.prototype.onExecuted = async function (output) {
            originalExecuted?.apply(this, arguments);
            const images = output?.images || [];
            if (images.length < 2) return;
            try {
                const loaded = await Promise.all(images.slice(0, 3).map(loadImage));
                this._novaCompareA = loaded[0];
                this._novaCompareB = loaded[1];
                this._novaCompareDiff = loaded[2] || null;
                this._novaCompareInfo = output?.nova_compare?.[0] || null;
                this.imgs = null;
                this.setDirtyCanvas?.(true, true);
            } catch (error) {
                console.warn("[Nova Image Compare] Failed to load preview images", error);
            }
        };

        const originalDraw = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function (ctx) {
            originalDraw?.apply(this, arguments);
            if (this.flags?.collapsed) return;
            drawCompare(ctx, this);
        };

        const originalDown = nodeType.prototype.onMouseDown;
        nodeType.prototype.onMouseDown = function (event, pos, canvas) {
            const x = pos?.[0] ?? 0;
            const y = pos?.[1] ?? 0;
            const rects = buttonRects(this.size[0]);
            for (let i = 0; i < rects.length; i++) {
                if (hit(rects[i], x, y)) {
                    this.properties.novaCompareMode = MODES[i];
                    this.setDirtyCanvas?.(true, true);
                    return true;
                }
            }
            if (y >= HEADER_H && ["Wipe", "Overlay"].includes(this.properties.novaCompareMode)) {
                this._novaCompareDragging = true;
                setPositionFromMouse(this, x);
                return true;
            }
            return originalDown?.apply(this, arguments);
        };

        const originalMove = nodeType.prototype.onMouseMove;
        nodeType.prototype.onMouseMove = function (event, pos, canvas) {
            if (this._novaCompareDragging) {
                setPositionFromMouse(this, pos?.[0] ?? 0);
                return true;
            }
            return originalMove?.apply(this, arguments);
        };

        const originalUp = nodeType.prototype.onMouseUp;
        nodeType.prototype.onMouseUp = function () {
            if (this._novaCompareDragging) {
                this._novaCompareDragging = false;
                this.setDirtyCanvas?.(true, true);
                return true;
            }
            return originalUp?.apply(this, arguments);
        };
    },
});
