(function() {
  "use strict";

  let speakers = [];
  let env = "indoor";
  let standW = 40;
  let standL = 30;
  let bufferRatio = 0.5;
  const SAFETY_RADIUS = 3;

  let dragIdx = -1;
  let dragStartX = 0, dragStartY = 0;
  let hasMoved = false;

  const presets = {
    smallHall: {
      env: "indoor",
      w: 25,
      l: 20,
      t: 22,
      speakers: [
        { relX: 0.3, relY: -0.3 },
        { relX: 0.7, relY: -0.3 }
      ]
    },
    outdoorFestival: {
      env: "outdoor",
      w: 60,
      l: 50,
      t: 30,
      windDir: 0,
      windStr: 3,
      speakers: [
        { relX: 0.25, relY: -0.3 },
        { relX: 0.75, relY: -0.3 },
        { relX: 0.5, relY: 1.2 }
      ]
    },
    stadium: {
      env: "outdoor",
      w: 80,
      l: 70,
      t: 28,
      windDir: 0,
      windStr: 3,
      speakers: [
        { relX: 0.2, relY: -0.25 },
        { relX: 0.8, relY: -0.25 },
        { relX: 0.05, relY: 0.4 },
        { relX: 0.95, relY: 0.4 },
        { relX: 0.35, relY: 1.3 },
        { relX: 0.65, relY: 1.3 }
      ]
    }
  };

  const speakerCanvas = document.getElementById("speaker-canvas");
  const resultCanvas = document.getElementById("result-canvas");
  const speakerCtx = speakerCanvas.getContext("2d");
  const resultCtx = resultCanvas.getContext("2d");

  function getMapDimensions() {
    const bufferW = standW * bufferRatio;
    const bufferL = standL * bufferRatio;
    return {
      mapW: standW + 2 * bufferW,
      mapL: standL + 2 * bufferL,
      bufferW: bufferW,
      bufferL: bufferL
    };
  }

  function mapToCanvas(x, y, canvas) {
    const dims = getMapDimensions();
    const padding = 30;
    const availW = canvas.width - 2 * padding;
    const availH = canvas.height - 2 * padding;
    const scale = Math.min(availW / dims.mapW, availH / dims.mapL);
    const drawW = dims.mapW * scale;
    const drawH = dims.mapL * scale;
    const offX = (canvas.width - drawW) / 2;
    const offY = (canvas.height - drawH) / 2;
    return {
      px: offX + x * scale,
      py: offY + y * scale,
      scale: scale,
      offX: offX,
      offY: offY,
      drawW: drawW,
      drawH: drawH
    };
  }

  function canvasToMap(px, py, canvas) {
    const dims = getMapDimensions();
    const padding = 30;
    const availW = canvas.width - 2 * padding;
    const availH = canvas.height - 2 * padding;
    const scale = Math.min(availW / dims.mapW, availH / dims.mapL);
    const drawW = dims.mapW * scale;
    const drawH = dims.mapL * scale;
    const offX = (canvas.width - drawW) / 2;
    const offY = (canvas.height - drawH) / 2;
    return {
      x: (px - offX) / scale,
      y: (py - offY) / scale
    };
  }

  function getReferencePoint() {
    const dims = getMapDimensions();
    return {
      x: dims.bufferW + standW / 2,
      y: dims.bufferL
    };
  }

  function isInSafetyZone(px, py) {
    for (let i = 0; i < speakers.length; i++) {
      const dx = px - speakers[i].x;
      const dy = py - speakers[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < SAFETY_RADIUS) return true;
    }
    return false;
  }

  function getEventPos(e) {
    const rect = speakerCanvas.getBoundingClientRect();
    const scaleX = speakerCanvas.width / rect.width;
    const scaleY = speakerCanvas.height / rect.height;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      cx: (clientX - rect.left) * scaleX,
      cy: (clientY - rect.top) * scaleY
    };
  }

  function hitTestCloseButton(cx, cy) {
    for (let i = 0; i < speakers.length; i++) {
      const sp = mapToCanvas(speakers[i].x, speakers[i].y, speakerCanvas);
      const closeX = sp.px + 12, closeY = sp.py - 12;
      const dx = cx - closeX, dy = cy - closeY;
      if (Math.sqrt(dx * dx + dy * dy) < 10) return i;
    }
    return -1;
  }

  function hitTestSpeaker(cx, cy) {
    for (let i = 0; i < speakers.length; i++) {
      const sp = mapToCanvas(speakers[i].x, speakers[i].y, speakerCanvas);
      const dx = cx - sp.px, dy = cy - sp.py;
      if (Math.sqrt(dx * dx + dy * dy) < 16) return i;
    }
    return -1;
  }

  function drawSpeakerMap() {
    const canvas = speakerCanvas;
    const ctx = speakerCtx;
    const dims = getMapDimensions();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const origin = mapToCanvas(0, 0, canvas);
    const scale = origin.scale;

    ctx.fillStyle = "#FAEEDA";
    ctx.strokeStyle = "#EF9F27";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.fillRect(origin.offX, origin.offY, dims.mapW * scale, dims.bufferL * scale);
    ctx.strokeRect(origin.offX, origin.offY, dims.mapW * scale, dims.bufferL * scale);
    ctx.setLineDash([]);
    ctx.fillStyle = "#854F0B";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("STAGE AREA", origin.offX + dims.mapW * scale / 2, origin.offY + 20);
    ctx.font = "10px sans-serif";
    ctx.fillText("(tap to place main speakers)", origin.offX + dims.mapW * scale / 2, origin.offY + 36);

    const standPx = mapToCanvas(dims.bufferW, dims.bufferL, canvas);
    ctx.fillStyle = "#EAF3DE";
    ctx.strokeStyle = "#639922";
    ctx.lineWidth = 2;
    ctx.fillRect(standPx.px, standPx.py, standW * scale, standL * scale);
    ctx.strokeRect(standPx.px, standPx.py, standW * scale, standL * scale);
    ctx.fillStyle = "#3B6D11";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("STAND AREA", standPx.px + standW * scale / 2, standPx.py + standL * scale / 2 - 6);
    ctx.font = "11px sans-serif";
    ctx.fillText(standW + "m \u00d7 " + standL + "m", standPx.px + standW * scale / 2, standPx.py + standL * scale / 2 + 10);

    const ref = getReferencePoint();
    const refPx = mapToCanvas(ref.x, ref.y, canvas);

    speakers.forEach(function(s) {
      const spkPx = mapToCanvas(s.x, s.y, canvas);
      ctx.strokeStyle = "#E24B4A";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(spkPx.px, spkPx.py, SAFETY_RADIUS * scale, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    speakers.forEach(function(s) {
      const spkPx = mapToCanvas(s.x, s.y, canvas);
      ctx.strokeStyle = "#888780";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(refPx.px, refPx.py);
      ctx.lineTo(spkPx.px, spkPx.py);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    ctx.fillStyle = "#D85A30";
    ctx.beginPath();
    ctx.arc(refPx.px, refPx.py, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#D85A30";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(refPx.px, refPx.py, 13, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#993C1D";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("YOU", refPx.px, refPx.py - 18);

    speakers.forEach(function(s, i) {
      const spkPx = mapToCanvas(s.x, s.y, canvas);
      const isDragging = (i === dragIdx && hasMoved);

      ctx.fillStyle = isDragging ? "#378ADD" : "#185FA5";
      ctx.beginPath();
      ctx.arc(spkPx.px, spkPx.py, 14, 0, 2 * Math.PI);
      ctx.fill();
      if (isDragging) {
        ctx.strokeStyle = "#185FA5";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), spkPx.px, spkPx.py);

      const dx = s.x - ref.x;
      const dy = s.y - ref.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      ctx.fillStyle = isDragging ? "#0C447C" : "#185FA5";
      ctx.font = isDragging ? "bold 12px sans-serif" : "10px sans-serif";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(dist.toFixed(1) + "m", spkPx.px, spkPx.py + 28);

      const closeX = spkPx.px + 12;
      const closeY = spkPx.py - 12;
      ctx.fillStyle = "#E24B4A";
      ctx.beginPath();
      ctx.arc(closeX, closeY, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(closeX - 3, closeY - 3);
      ctx.lineTo(closeX + 3, closeY + 3);
      ctx.moveTo(closeX + 3, closeY - 3);
      ctx.lineTo(closeX - 3, closeY + 3);
      ctx.stroke();
    });
  }

  function calculate() {
    if (speakers.length === 0) return null;

    const T = parseFloat(document.getElementById("t-slider").value);
    const v = 331.3 + 0.606 * T;
    const windDir = env === "outdoor" ? parseFloat(document.getElementById("wind-dir").value) : 0;
    const windStr = env === "outdoor" ? parseFloat(document.getElementById("wind-str").value) : 0;

    const dims = getMapDimensions();
    const frequencies = [200, 1000, 4000];
    const gridW = 60, gridH = 45;
    const scores = [];
    const loudness = [];
    const unsafe = [];
    let maxA = 0, minA = Infinity;

    for (let gy = 0; gy < gridH; gy++) {
      scores[gy] = [];
      loudness[gy] = [];
      unsafe[gy] = [];
      for (let gx = 0; gx < gridW; gx++) {
        const px = dims.bufferW + (gx + 0.5) * standW / gridW;
        const py = dims.bufferL + (gy + 0.5) * standL / gridH;

        unsafe[gy][gx] = isInSafetyZone(px, py);

        const rs = speakers.map(function(sp) {
          const dx = px - sp.x;
          const dy = py - sp.y;
          return Math.sqrt(dx * dx + dy * dy);
        });

        const Ls = rs.map(function(r) { return 1 / Math.max(r, 1); });
        const meanL = Ls.reduce(function(a, b) { return a + b; }, 0) / Ls.length;
        const variance = Ls.reduce(function(a, b) { return a + (b - meanL) * (b - meanL); }, 0) / Ls.length;
        const sigma = Math.sqrt(variance);

        let Atotal = 0;
        for (let fi = 0; fi < frequencies.length; fi++) {
          const f = frequencies[fi];
          let sumCos = 0, sumSin = 0;
          for (let i = 0; i < speakers.length; i++) {
            const r = rs[i];
            let vEff = v;
            if (windStr > 0) {
              const soundAngle = Math.atan2(px - speakers[i].x, py - speakers[i].y);
              const windRad = windDir * Math.PI / 180;
              vEff = v + windStr * Math.cos(soundAngle - windRad);
            }
            const phase = 2 * Math.PI * f * r / vEff;
            const amp = Ls[i];
            sumCos += amp * Math.cos(phase);
            sumSin += amp * Math.sin(phase);
          }
          Atotal += Math.sqrt(sumCos * sumCos + sumSin * sumSin);
        }
        Atotal /= frequencies.length;

        const score = Atotal / (1 + sigma);
        scores[gy][gx] = score;
        loudness[gy][gx] = Atotal;
        if (Atotal > maxA && !unsafe[gy][gx]) maxA = Atotal;
        if (Atotal < minA) minA = Atotal;
      }
    }

    let maxScore = -Infinity, bestGX = -1, bestGY = -1;
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        if (unsafe[y][x]) continue;
        if (scores[y][x] > maxScore) {
          maxScore = scores[y][x];
          bestGX = x;
          bestGY = y;
        }
      }
    }

    return {
      scores: scores,
      loudness: loudness,
      unsafe: unsafe,
      maxA: maxA,
      minA: minA,
      maxScore: maxScore,
      bestGX: bestGX,
      bestGY: bestGY,
      gridW: gridW,
      gridH: gridH,
      v: v,
      T: T
    };
  }

  function scoreToColor(score, maxScore, loud, maxA, isUnsafe) {
    if (isUnsafe) return "rgba(121, 31, 31, 0.75)";
    const deadThreshold = 0.4 * maxA;
    if (loud < deadThreshold) {
      const intensity = Math.min(1, (deadThreshold - loud) / deadThreshold);
      const alpha = 0.4 + 0.4 * intensity;
      return "rgba(226, 75, 74, " + alpha.toFixed(2) + ")";
    }
    const ratio = score / maxScore;
    if (ratio > 0.75) {
      const t = (ratio - 0.75) / 0.25;
      return "rgba(99, 153, 34, " + (0.4 + 0.4 * t).toFixed(2) + ")";
    } else if (ratio > 0.5) {
      return "rgba(151, 196, 89, 0.45)";
    } else {
      return "rgba(239, 159, 39, 0.4)";
    }
  }

  function drawResult() {
    const canvas = resultCanvas;
    const ctx = resultCtx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const infoEl = document.getElementById("best-spot-info");

    if (speakers.length === 0) {
      infoEl.textContent = "Add at least 1 speaker to see the result.";
      infoEl.style.background = "#F1EFE8";
      infoEl.style.color = "#5F5E5A";
      return;
    }

    const data = calculate();
    const dims = getMapDimensions();

    const padding = 40;
    const availW = canvas.width - 2 * padding;
    const availH = canvas.height - 2 * padding;
    const scale = Math.min(availW / standW, availH / standL);
    const drawW = standW * scale;
    const drawH = standL * scale;
    const offX = (canvas.width - drawW) / 2;
    const offY = (canvas.height - drawH) / 2;

    ctx.fillStyle = "#5F5E5A";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("\u2190 FRONT (toward stage)", canvas.width / 2, offY - 10);
    ctx.fillText("BACK \u2192", canvas.width / 2, offY + drawH + 20);

    const cellW = drawW / data.gridW;
    const cellH = drawH / data.gridH;
    for (let y = 0; y < data.gridH; y++) {
      for (let x = 0; x < data.gridW; x++) {
        ctx.fillStyle = scoreToColor(data.scores[y][x], data.maxScore, data.loudness[y][x], data.maxA, data.unsafe[y][x]);
        ctx.fillRect(offX + x * cellW, offY + y * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    ctx.strokeStyle = "#639922";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(offX, offY, drawW, drawH);

    speakers.forEach(function(sp, i) {
      const relX = sp.x - dims.bufferW;
      const relY = sp.y - dims.bufferL;
      if (relX >= 0 && relX <= standW && relY >= 0 && relY <= standL) {
        const px = offX + relX * scale;
        const py = offY + relY * scale;
        ctx.fillStyle = "#185FA5";
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), px, py);
      }
    });

    if (data.bestGX >= 0 && data.bestGY >= 0) {
      const bestX = offX + (data.bestGX + 0.5) * cellW;
      const bestY = offY + (data.bestGY + 0.5) * cellH;
      ctx.fillStyle = "#27500A";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("\u2605", bestX, bestY);

      ctx.fillStyle = "#5F5E5A";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("0 m", offX, offY + drawH + 4);
      ctx.textAlign = "right";
      ctx.fillText(standW + " m", offX + drawW, offY + drawH + 4);
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText("0 m", offX - 4, offY);
      ctx.textBaseline = "bottom";
      ctx.fillText(standL + " m", offX - 4, offY + drawH);

      const bx = (data.bestGX + 0.5) * standW / data.gridW;
      const by = (data.bestGY + 0.5) * standL / data.gridH;
      const fromFront = by.toFixed(1);
      const fromCenter = (bx - standW / 2).toFixed(1);
      let side;
      if (parseFloat(fromCenter) > 0.5) {
        side = fromCenter + " m right of center";
      } else if (parseFloat(fromCenter) < -0.5) {
        side = Math.abs(parseFloat(fromCenter)).toFixed(1) + " m left of center";
      } else {
        side = "at the center";
      }
      infoEl.innerHTML = "\u2605 Best spot: <strong>" + fromFront + " m from the front, " + side + "</strong><br>" +
        "<span style='font-size:12px;color:#5F5E5A'>Speed of sound: " + data.v.toFixed(1) + " m/s at " + data.T + "\u00b0C | " +
        speakers.length + " speaker" + (speakers.length > 1 ? "s" : "") + " | Safety zones (3m) excluded</span>";
      infoEl.style.background = "#EAF3DE";
      infoEl.style.color = "#3B6D11";
    } else {
      infoEl.innerHTML = "\u26a0 No safe spot available. The entire stand area is inside safety zones. Move speakers further apart.";
      infoEl.style.background = "#FCEBEB";
      infoEl.style.color = "#791F1F";
    }
  }

  function updateAll() {
    standW = parseInt(document.getElementById("w-slider").value);
    standL = parseInt(document.getElementById("l-slider").value);
    document.getElementById("w-val").textContent = standW + " m";
    document.getElementById("l-val").textContent = standL + " m";
    document.getElementById("t-val").textContent = document.getElementById("t-slider").value + " \u00b0C";

    const dims = getMapDimensions();
    speakers = speakers.filter(function(s) {
      return s.x >= 0 && s.x <= dims.mapW && s.y >= 0 && s.y <= dims.mapL;
    });

    drawSpeakerMap();
    drawResult();
    updateSpeakerInfo();
  }

  function updateSpeakerInfo() {
    const info = document.getElementById("speaker-info");
    if (speakers.length === 0) {
      info.textContent = "No speakers placed. Tap the map to start.";
    } else {
      info.textContent = speakers.length + " speaker" + (speakers.length > 1 ? "s" : "") + " placed. " +
        "Drag to move, tap \u00d7 to remove. Red ring = 3m safety zone. " +
        (speakers.length < 6 ? "Tap empty space to add more." : "Maximum 6 reached.");
    }
  }

  function onPointerDown(e) {
    e.preventDefault();
    const pos = getEventPos(e);
    hasMoved = false;

    const closeIdx = hitTestCloseButton(pos.cx, pos.cy);
    if (closeIdx >= 0) {
      speakers.splice(closeIdx, 1);
      dragIdx = -1;
      drawSpeakerMap();
      drawResult();
      updateSpeakerInfo();
      return;
    }

    const spkIdx = hitTestSpeaker(pos.cx, pos.cy);
    if (spkIdx >= 0) {
      dragIdx = spkIdx;
      dragStartX = pos.cx;
      dragStartY = pos.cy;
      speakerCanvas.style.cursor = "grabbing";
      return;
    }

    if (speakers.length >= 6) {
      alert("Maximum 6 speakers. Remove one first.");
      return;
    }

    const mapPos = canvasToMap(pos.cx, pos.cy, speakerCanvas);
    const dims = getMapDimensions();
    if (mapPos.x < 0 || mapPos.x > dims.mapW || mapPos.y < 0 || mapPos.y > dims.mapL) {
      return;
    }

    speakers.push({ x: mapPos.x, y: mapPos.y });
    drawSpeakerMap();
    drawResult();
    updateSpeakerInfo();
  }

  function onPointerMove(e) {
    const pos = getEventPos(e);

    if (dragIdx >= 0) {
      e.preventDefault();
      const dx = pos.cx - dragStartX;
      const dy = pos.cy - dragStartY;
      if (Math.sqrt(dx * dx + dy * dy) > 3) hasMoved = true;

      const mapPos = canvasToMap(pos.cx, pos.cy, speakerCanvas);
      const dims = getMapDimensions();
      mapPos.x = Math.max(0, Math.min(dims.mapW, mapPos.x));
      mapPos.y = Math.max(0, Math.min(dims.mapL, mapPos.y));
      speakers[dragIdx].x = mapPos.x;
      speakers[dragIdx].y = mapPos.y;
      drawSpeakerMap();
      drawResult();
    } else {
      const closeIdx = hitTestCloseButton(pos.cx, pos.cy);
      const spkIdx = hitTestSpeaker(pos.cx, pos.cy);
      if (closeIdx >= 0) speakerCanvas.style.cursor = "pointer";
      else if (spkIdx >= 0) speakerCanvas.style.cursor = "grab";
      else speakerCanvas.style.cursor = "crosshair";
    }
  }

  function onPointerUp(e) {
    if (dragIdx >= 0) {
      dragIdx = -1;
      hasMoved = false;
      speakerCanvas.style.cursor = "crosshair";
      drawSpeakerMap();
    }
  }

  function setEnv(e) {
    env = e;
    document.getElementById("env-indoor").classList.toggle("active", e === "indoor");
    document.getElementById("env-outdoor").classList.toggle("active", e === "outdoor");
    document.getElementById("wind-panel").style.display = e === "outdoor" ? "block" : "none";
    drawResult();
  }

  function applyPreset(name) {
    const p = presets[name];
    if (!p) return;
    setEnv(p.env);
    document.getElementById("w-slider").value = p.w;
    document.getElementById("l-slider").value = p.l;
    document.getElementById("t-slider").value = p.t;
    standW = p.w;
    standL = p.l;
    if (p.windDir !== undefined) {
      document.getElementById("wind-dir").value = p.windDir;
    }
    if (p.windStr !== undefined) {
      document.getElementById("wind-str").value = p.windStr;
    }
    const dims = getMapDimensions();
    speakers = p.speakers.map(function(s) {
      return {
        x: dims.bufferW + s.relX * standW,
        y: dims.bufferL + s.relY * standL
      };
    });
    updateAll();
  }

  document.getElementById("env-indoor").addEventListener("click", function() { setEnv("indoor"); });
  document.getElementById("env-outdoor").addEventListener("click", function() { setEnv("outdoor"); });
  document.getElementById("w-slider").addEventListener("input", updateAll);
  document.getElementById("l-slider").addEventListener("input", updateAll);
  document.getElementById("t-slider").addEventListener("input", updateAll);
  document.getElementById("wind-dir").addEventListener("change", drawResult);
  document.getElementById("wind-str").addEventListener("change", drawResult);

  document.getElementById("clear-speakers").addEventListener("click", function() {
    speakers = [];
    drawSpeakerMap();
    drawResult();
    updateSpeakerInfo();
  });

  speakerCanvas.addEventListener("mousedown", onPointerDown);
  speakerCanvas.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);
  speakerCanvas.addEventListener("touchstart", onPointerDown, { passive: false });
  speakerCanvas.addEventListener("touchmove", onPointerMove, { passive: false });
  window.addEventListener("touchend", onPointerUp);

  document.querySelectorAll(".preset-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      applyPreset(btn.dataset.preset);
    });
  });

  document.getElementById("physics-toggle").addEventListener("click", function() {
    const details = document.getElementById("physics-details");
    const isVisible = details.style.display !== "none";
    details.style.display = isVisible ? "none" : "block";
    this.textContent = isVisible ? "Show physics formulas" : "Hide physics formulas";
  });

  updateAll();
  applyPreset("smallHall");

})();
