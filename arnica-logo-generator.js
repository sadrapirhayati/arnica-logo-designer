(() => {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const center = 400;
  const defaultColors = ['#0055A1', '#1F75BA', '#2A7DBD', '#3A86C2', '#5799CF', '#7AADDD'];
  const ringDefaults = Array.from({ length: 5 }, (_, index) => ({
    radius: 118 + index * 54,
    squareCount: 12,
    squareSize: 46 + index * 6,
    cornerRadius: 4,
    color: defaultColors[index % defaultColors.length],
    ringRotation: index * 5,
    squareRotation: 0,
    startAngle: 0,
    opacity: 1,
    visible: true
  }));

  const state = {
    ringCount: ringDefaults.length,
    rings: ringDefaults,
    bgColor: '#0a1120',
    motion: false,
    motionSettings: []
  };

  const ringCountInput = document.getElementById('ringCount');
  const ringCountValue = document.getElementById('ringCountValue');
  const ringSettings = document.getElementById('ringSettings');
  const root = document.getElementById('logoRoot');
  const logoSvg = document.getElementById('logoSvg');
  const svgCode = document.getElementById('svgCode');
  const artboard = document.querySelector('.artboard');
  const referenceImage = document.getElementById('referenceImage');
  const referenceFile = document.getElementById('referenceFile');
  const importSvgFile = document.getElementById('importSvgFile');
  const toggleReferenceButton = document.getElementById('toggleReferenceBtn');
  const clearReferenceButton = document.getElementById('clearReferenceBtn');
  const referenceOpacity = document.getElementById('referenceOpacity');
  const referenceFit = document.getElementById('referenceFit');
  let referenceObjectUrl = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function ensureRings() {
    while (state.rings.length < state.ringCount) {
      const index = state.rings.length;
      state.rings.push({
        ...ringDefaults[index % ringDefaults.length],
        radius: clamp(118 + index * 54, 20, 380),
        color: defaultColors[index % defaultColors.length]
      });
    }
  }

  function addRange(card, index, key, labelText, min, max, step = 1, unit = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'ring-setting';
    const label = document.createElement('label');
    const title = document.createElement('span');
    title.textContent = labelText;
    const valueLabel = document.createElement('span');
    valueLabel.className = 'value';
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(state.rings[index][key]);
    input.dataset.setting = key;

    const updateLabel = () => {
      valueLabel.textContent = `${input.value}${unit}`;
    };
    updateLabel();
    input.addEventListener('input', () => {
      const ring = state.rings[index];
      ring[key] = Number(input.value);
      if (key === 'radius') updateRingLimits(card, ring);
      if (key === 'squareSize') {
        ring.cornerRadius = Math.min(ring.cornerRadius, ring.squareSize / 2);
        updateRingLimits(card, ring);
      }
      updateLabel();
      render();
    });

    label.append(title, valueLabel);
    wrapper.append(label, input);
    card.appendChild(wrapper);
  }

  function updateRingLimits(card, ring) {
    const sizeInput = card.querySelector('[data-setting="squareSize"]');
    const cornerInput = card.querySelector('[data-setting="cornerRadius"]');
    const sizeLabel = sizeInput.previousElementSibling.lastElementChild;
    const cornerLabel = cornerInput.previousElementSibling.lastElementChild;
    const maxSize = Math.min(200, Math.floor(ring.radius * 2));

    sizeInput.max = String(maxSize);
    ring.squareSize = Math.min(ring.squareSize, maxSize);
    sizeInput.value = String(ring.squareSize);
    sizeLabel.textContent = `${ring.squareSize} واحد`;

    cornerInput.max = String(ring.squareSize / 2);
    ring.cornerRadius = Math.min(ring.cornerRadius, ring.squareSize / 2);
    cornerInput.value = String(ring.cornerRadius);
    cornerLabel.textContent = `${ring.cornerRadius} واحد`;
  }

  function buildRingSettings() {
    ensureRings();
    ringSettings.replaceChildren();

    for (let index = 0; index < state.ringCount; index++) {
      const ring = state.rings[index];
      const card = document.createElement('div');
      card.className = 'ring-card';
      const heading = document.createElement('div');
      heading.className = 'ring-card-title';
      heading.textContent = `حلقه ${index + 1}`;
      card.appendChild(heading);

      const colorSetting = document.createElement('div');
      colorSetting.className = 'ring-setting';
      const colorLabel = document.createElement('label');
      colorLabel.textContent = 'رنگ حلقه';
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = ring.color;
      colorInput.setAttribute('aria-label', `رنگ حلقه ${index + 1}`);
      colorInput.addEventListener('input', () => {
        ring.color = colorInput.value;
        render();
      });
      colorSetting.append(colorLabel, colorInput);
      card.appendChild(colorSetting);

      const visibility = document.createElement('label');
      const visibleInput = document.createElement('input');
      visibleInput.type = 'checkbox';
      visibleInput.checked = ring.visible;
      visibleInput.setAttribute('aria-label', `نمایش حلقه ${index + 1}`);
      visibleInput.addEventListener('change', () => {
        ring.visible = visibleInput.checked;
        render();
      });
      visibility.append(visibleInput, document.createTextNode(' نمایش این حلقه'));
      card.appendChild(visibility);

      addRange(card, index, 'radius', 'شعاع دایره', 20, 380, 1, ' واحد');
      addRange(card, index, 'squareCount', 'تعداد مربع‌ها', 1, 48);
      addRange(card, index, 'squareSize', 'اندازه ضلع مربع', 1, Math.min(200, ring.radius * 2), 1, ' واحد');
      addRange(card, index, 'cornerRadius', 'گردی گوشه', 0, ring.squareSize / 2, 0.5, ' واحد');
      addRange(card, index, 'ringRotation', 'چرخش حلقه', -180, 180, 1, '°');
      addRange(card, index, 'squareRotation', 'چرخش مستقل مربع‌ها', -180, 180, 1, '°');
      addRange(card, index, 'startAngle', 'زاویه شروع مربع‌ها', 0, 360, 1, '°');
      addRange(card, index, 'opacity', 'شفافیت حلقه', 0.1, 1, 'any');
      ringSettings.appendChild(card);
    }
  }

  function makeSvgElement(name, attributes) {
    const element = document.createElementNS(svgNamespace, name);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, String(value));
    }
    return element;
  }

  function render() {
    ringCountValue.textContent = String(state.ringCount);
    artboard.style.backgroundColor = state.bgColor;
    root.replaceChildren();
    ensureRings();

    state.rings.slice(0, state.ringCount).forEach((ring, ringIndex) => {
      if (!ring.visible) return;
      const ringGroup = makeSvgElement('g', {
        fill: ring.color,
        opacity: ring.opacity,
        'data-ring': ringIndex + 1
      });
      const step = 360 / ring.squareCount;
      const squareSize = Math.min(ring.squareSize, ring.radius * 2);
      const halfChordAngle = Math.asin(squareSize / (2 * ring.radius));
      const chordMidRadius = ring.radius * Math.cos(halfChordAngle);

      for (let squareIndex = 0; squareIndex < ring.squareCount; squareIndex++) {
        const angle = ring.startAngle + ring.ringRotation + squareIndex * step;
        const radians = angle * Math.PI / 180;
        const chordX = center + Math.cos(radians) * chordMidRadius;
        const chordY = center + Math.sin(radians) * chordMidRadius;
        const squareGroup = makeSvgElement('g', {
          transform: `translate(${chordX} ${chordY}) rotate(${angle - 90})`
        });
        const square = makeSvgElement('rect', {
          x: -squareSize / 2,
          y: -squareSize,
          width: squareSize,
          height: squareSize,
          rx: Math.min(ring.cornerRadius, squareSize / 2),
          transform: `rotate(${ring.squareRotation} 0 ${-squareSize / 2})`
        });
        squareGroup.appendChild(square);
        ringGroup.appendChild(squareGroup);
      }

      if (state.motion) {
        const settings = state.motionSettings[ringIndex];
        ringGroup.appendChild(makeSvgElement('animateTransform', {
          attributeName: 'transform',
          attributeType: 'XML',
          type: 'rotate',
          from: `0 ${center} ${center}`,
          to: `${settings.direction * 360} ${center} ${center}`,
          dur: `${settings.duration}s`,
          repeatCount: 'indefinite',
          calcMode: 'linear'
        }));
      }
      root.appendChild(ringGroup);
    });

    updateSvgCode();
  }

  function updateSvgCode() {
    const exportSvg = logoSvg.cloneNode(true);
    const exportRoot = exportSvg.querySelector('#logoRoot');
    const metadata = makeSvgElement('metadata', { id: 'arnica-logo-generator-settings' });
    metadata.textContent = JSON.stringify({
      format: 'arnica-logo-generator',
      version: 1,
      bgColor: state.bgColor,
      rings: state.rings.slice(0, state.ringCount)
    });
    exportRoot.insertBefore(makeSvgElement('rect', {
      x: 0,
      y: 0,
      width: 800,
      height: 800,
      fill: state.bgColor
    }), exportRoot.firstChild);
    exportSvg.insertBefore(metadata, exportRoot);
    svgCode.value = new XMLSerializer().serializeToString(exportSvg);
  }

  function parseHexColor(value) {
    if (!value) return null;
    if (/^#[0-9a-f]{6}$/i.test(value)) return value;
    if (/^#[0-9a-f]{3}$/i.test(value)) {
      return `#${value.slice(1).split('').map((part) => part + part).join('')}`;
    }
    const probe = document.createElement('span');
    probe.style.color = value;
    if (!probe.style.color) return null;
    document.body.appendChild(probe);
    const normalized = getComputedStyle(probe).color;
    probe.remove();
    const match = normalized.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (match) {
      return `#${match.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`;
    }
    return null;
  }

  function validateImportedSettings(data) {
    if (!data || data.format !== 'arnica-logo-generator' || data.version !== 1 ||
        !Array.isArray(data.rings) || data.rings.length < 1 || data.rings.length > 10) {
      throw new Error('این فایل تنظیمات قابل‌ویرایش آرنیکا را ندارد یا نسخه‌ی آن پشتیبانی نمی‌شود.');
    }

    const rings = data.rings.map((source) => {
      const numericKeys = ['radius', 'squareCount', 'squareSize', 'cornerRadius',
        'ringRotation', 'squareRotation', 'startAngle', 'opacity'];
      if (!source || numericKeys.some((key) => !Number.isFinite(Number(source[key])))) {
        throw new Error('مشخصات یکی از حلقه‌ها در فایل معتبر نیست.');
      }
      const radius = clamp(Number(source.radius), 20, 380);
      const squareSize = clamp(Number(source.squareSize), 1, Math.min(200, radius * 2));
      return {
        radius,
        squareCount: clamp(Math.round(Number(source.squareCount)), 1, 48),
        squareSize,
        cornerRadius: clamp(Number(source.cornerRadius), 0, squareSize / 2),
        color: parseHexColor(source.color) || defaultColors[0],
        ringRotation: clamp(Number(source.ringRotation), -180, 180),
        squareRotation: clamp(Number(source.squareRotation), -180, 180),
        startAngle: clamp(Number(source.startAngle), 0, 360),
        opacity: clamp(Number(source.opacity), 0.1, 1),
        visible: source.visible !== false
      };
    });

    return {
      rings,
      bgColor: parseHexColor(data.bgColor) || '#0a1120'
    };
  }

  function getInheritedAttribute(element, name, fallback = '') {
    let current = element;
    while (current && current.localName !== 'svg') {
      const attribute = current.getAttribute(name);
      if (attribute !== null) return attribute;
      current = current.parentElement;
    }
    return fallback;
  }

  function extractNumber(value, fallback = 0) {
    const match = String(value || '').match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/i);
    return match ? Number(match[0]) : fallback;
  }

  function parseViewBox(svg) {
    const parts = (svg.getAttribute('viewBox') || '0 0 800 800').trim().split(/[,\s]+/).map(Number);
    if (parts.length !== 4 || !parts.every(Number.isFinite) || parts[2] <= 0 || parts[3] <= 0) {
      throw new Error('اندازه‌ی کادر SVG قابل‌خواندن نیست.');
    }
    return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
  }

  function importLegacySvg(svg) {
    const viewBox = parseViewBox(svg);
    const scale = 800 / Math.max(viewBox.width, viewBox.height);
    const sourceCenterX = viewBox.x + viewBox.width / 2;
    const sourceCenterY = viewBox.y + viewBox.height / 2;
    let rootElement = svg.querySelector('#logoRoot');
    if (!rootElement) rootElement = svg;

    let ringGroups = Array.from(rootElement.children).filter((child) => child.localName === 'g');
    if (!ringGroups.length && rootElement !== svg) {
      ringGroups = Array.from(svg.children).filter((child) => child.localName === 'g');
    }
    const importedRings = [];

    for (const group of ringGroups) {
      const squares = Array.from(group.querySelectorAll('rect'));
      if (!squares.length) continue;
      const first = squares[0];
      const width = Number(first.getAttribute('width'));
      const height = Number(first.getAttribute('height'));
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) continue;
      const squareSize = ((width + height) / 2) * scale;
      const transform = first.parentElement?.getAttribute('transform') || '';
      const translateMatch = transform.match(/translate\(\s*([-+.\de]+)[,\s]+([-+.\de]+)/i);
      let radius;
      let ringAngle;
      if (translateMatch && group.hasAttribute('data-ring')) {
        const x = (Number(translateMatch[1]) - sourceCenterX) * scale;
        const y = (Number(translateMatch[2]) - sourceCenterY) * scale;
        const chordMidRadius = Math.hypot(x, y);
        radius = Math.hypot(chordMidRadius, squareSize / 2);
        ringAngle = Math.atan2(y, x) * 180 / Math.PI;
      } else {
        const x = (extractNumber(first.getAttribute('x')) + width / 2 - sourceCenterX) * scale;
        const y = (extractNumber(first.getAttribute('y')) + height / 2 - sourceCenterY) * scale;
        radius = Math.hypot(x, y);
        ringAngle = Math.atan2(y, x) * 180 / Math.PI;
      }
      if (!Number.isFinite(radius) || radius < 1) continue;

      const color = parseHexColor(getInheritedAttribute(first, 'fill') || getInheritedAttribute(group, 'fill')) || defaultColors[importedRings.length % defaultColors.length];
      const rotationMatches = [...(first.getAttribute('transform') || '').matchAll(/rotate\(\s*([-+.\de]+)/gi)];
      const squareRotation = rotationMatches.length ? extractNumber(rotationMatches[rotationMatches.length - 1][1]) : 0;
      const ringTransform = group.getAttribute('transform') || '';
      const groupRotation = ringTransform.match(/rotate\(\s*([-+.\de]+)/i);
      const opacity = Number(getInheritedAttribute(group, 'opacity', '1'));
      importedRings.push({
        radius: clamp(Math.round(radius), 20, 380),
        squareCount: clamp(squares.length, 1, 48),
        squareSize: clamp(Math.round(squareSize), 1, 200),
        cornerRadius: clamp(extractNumber(first.getAttribute('rx')) * scale, 0, squareSize / 2),
        color,
        ringRotation: clamp(Math.round(ringAngle + (groupRotation ? extractNumber(groupRotation[1]) : 0)), -180, 180),
        squareRotation: clamp(Math.round(squareRotation), -180, 180),
        startAngle: 0,
        opacity: Number.isFinite(opacity) ? clamp(opacity, 0.1, 1) : 1,
        visible: true
      });
    }

    if (!importedRings.length) {
      throw new Error('حلقه‌ای برای ویرایش در این SVG پیدا نشد. فایل باید خروجی همین برنامه باشد.');
    }

    const backgroundRect = Array.from(rootElement.querySelectorAll(':scope > rect'))
      .find((rect) => rect.getAttribute('width') && rect.getAttribute('height'));
    return {
      rings: importedRings.slice(0, 10),
      bgColor: parseHexColor(backgroundRect?.getAttribute('fill')) || '#0a1120'
    };
  }

  async function loadSvgFile(file) {
    if (!file || (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml')) {
      throw new Error('لطفاً یک فایل با پسوند SVG انتخاب کنید.');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('حجم فایل SVG بیشتر از ۱۰ مگابایت است.');
    }
    const text = await file.text();
    const parsed = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') {
      throw new Error('ساختار فایل SVG معتبر نیست.');
    }

    const metadata = parsed.querySelector('metadata#arnica-logo-generator-settings');
    let imported;
    if (metadata) {
      let settings;
      try {
        settings = JSON.parse(metadata.textContent);
      } catch {
        throw new Error('تنظیمات ذخیره‌شده داخل SVG خراب یا ناقص است.');
      }
      imported = validateImportedSettings(settings);
    } else {
      imported = importLegacySvg(parsed.documentElement);
      window.alert('این SVG از نسخه‌ای قدیمی‌تر است و تنظیمات دقیق داخلش ذخیره نشده بود؛ ویژگی‌های قابل‌تشخیص بارگذاری شدند و ممکن است بعضی زاویه‌ها تقریبی باشند.');
    }

    state.rings = imported.rings;
    state.ringCount = imported.rings.length;
    state.bgColor = imported.bgColor;
    state.motion = false;
    ringCountInput.value = String(state.ringCount);
    document.getElementById('bgColor').value = state.bgColor;
    document.getElementById('motionBtn').textContent = 'شروع حرکت تصادفی';
    buildRingSettings();
    render();
  }

  function randomizeDesign() {
    state.ringCount = clamp(3 + Math.floor(Math.random() * 5), 1, 10);
    ringCountInput.value = String(state.ringCount);
    state.rings = Array.from({ length: state.ringCount }, (_, index) => ({
      radius: 65 + Math.floor(Math.random() * 285),
      squareCount: 6 + Math.floor(Math.random() * 19),
      squareSize: 20 + Math.floor(Math.random() * 50),
      cornerRadius: Math.floor(Math.random() * 12),
      color: defaultColors[Math.floor(Math.random() * defaultColors.length)],
      ringRotation: Math.floor(Math.random() * 181) - 90,
      squareRotation: Math.floor(Math.random() * 31) - 15,
      startAngle: Math.floor(Math.random() * 360),
      opacity: 0.65 + Math.random() * 0.35,
      visible: true
    }));
    state.rings.forEach((ring) => {
      ring.squareSize = Math.min(ring.squareSize, ring.radius * 2);
      ring.cornerRadius = Math.min(ring.cornerRadius, ring.squareSize / 2);
    });
    buildRingSettings();
    render();
  }

  function toggleMotion() {
    state.motion = !state.motion;
    state.motionSettings = state.rings.slice(0, state.ringCount).map(() => ({
      direction: Math.random() < 0.5 ? -1 : 1,
      duration: 18 + Math.random() * 30
    }));
    document.getElementById('motionBtn').textContent = state.motion ? 'توقف حرکت' : 'شروع حرکت تصادفی';
    render();
  }

  function attachReferenceEvents() {
    referenceImage.style.opacity = referenceOpacity.value;
    referenceImage.style.objectFit = referenceFit.value;

    referenceFile.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        window.alert('لطفاً یک فایل تصویری انتخاب کنید.');
        referenceFile.value = '';
        return;
      }
      if (referenceObjectUrl) URL.revokeObjectURL(referenceObjectUrl);
      referenceObjectUrl = URL.createObjectURL(file);
      referenceImage.onload = () => {
        referenceImage.classList.add('visible');
        toggleReferenceButton.textContent = 'مخفی‌کردن تصویر';
        toggleReferenceButton.disabled = false;
        clearReferenceButton.disabled = false;
        referenceOpacity.disabled = false;
        referenceFit.disabled = false;
      };
      referenceImage.onerror = () => {
        window.alert('بارگذاری تصویر ممکن نشد. لطفاً فایل تصویری دیگری انتخاب کنید.');
        referenceImage.removeAttribute('src');
        referenceFile.value = '';
        if (referenceObjectUrl) URL.revokeObjectURL(referenceObjectUrl);
        referenceObjectUrl = null;
      };
      referenceImage.src = referenceObjectUrl;
    });

    toggleReferenceButton.addEventListener('click', () => {
      const visible = referenceImage.classList.toggle('visible');
      toggleReferenceButton.textContent = visible ? 'مخفی‌کردن تصویر' : 'نمایش تصویر مرجع';
    });

    clearReferenceButton.addEventListener('click', () => {
      if (referenceObjectUrl) URL.revokeObjectURL(referenceObjectUrl);
      referenceObjectUrl = null;
      referenceImage.removeAttribute('src');
      referenceImage.classList.remove('visible');
      referenceFile.value = '';
      toggleReferenceButton.textContent = 'نمایش تصویر مرجع';
      toggleReferenceButton.disabled = true;
      clearReferenceButton.disabled = true;
      referenceOpacity.disabled = true;
      referenceFit.disabled = true;
    });

    referenceOpacity.addEventListener('input', () => {
      referenceImage.style.opacity = referenceOpacity.value;
    });
    referenceFit.addEventListener('change', () => {
      referenceImage.style.objectFit = referenceFit.value;
    });
  }

  ringCountInput.addEventListener('input', () => {
    state.ringCount = Number(ringCountInput.value);
    buildRingSettings();
    render();
  });

  document.getElementById('bgColor').addEventListener('input', (event) => {
    state.bgColor = event.target.value;
    render();
  });

  document.getElementById('randomizeBtn').addEventListener('click', randomizeDesign);
  document.getElementById('motionBtn').addEventListener('click', toggleMotion);

  document.getElementById('downloadBtn').addEventListener('click', () => {
    const blob = new Blob([svgCode.value], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'arnica-logo.svg';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  document.getElementById('copyBtn').addEventListener('click', async (event) => {
    try {
      await navigator.clipboard.writeText(svgCode.value);
      event.currentTarget.textContent = 'کپی شد';
    } catch (error) {
      window.alert('کپی خودکار انجام نشد. کد SVG را از کادر پایین انتخاب و کپی کنید.');
    }
    setTimeout(() => {
      event.currentTarget.textContent = 'کپی کد SVG';
    }, 1200);
  });

  importSvgFile.addEventListener('change', async () => {
    const file = importSvgFile.files?.[0];
    if (!file) return;
    try {
      await loadSvgFile(file);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'بارگذاری فایل SVG انجام نشد.');
    } finally {
      importSvgFile.value = '';
    }
  });

  attachReferenceEvents();
  buildRingSettings();
  render();
})();
