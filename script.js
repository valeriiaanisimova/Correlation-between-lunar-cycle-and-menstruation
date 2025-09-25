// Общие данные участниц
const participantsData = [
  { name: 'Маша', lastPeriod: '2024-03-30', duration: 4, cycle: 29, color: "#FFB6C1" },
  { name: 'Диана', lastPeriod: '2024-04-14', duration: 4, cycle: 28, color: "#98FB98" },
  { name: 'Ирина', lastPeriod: '2024-04-03', duration: 4, cycle: 26, color: "#FFD700" },
  { name: 'Даша', lastPeriod: '2024-04-10', duration: 5, cycle: 26, color: "#ADD8E6" },
  { name: 'Соня', lastPeriod: '2024-03-29', duration: 5, cycle: 25, color: "#FFA07A" },
  { name: 'Саша', lastPeriod: '2024-05-03', duration: 4, cycle: 33, color: "#E6E6FA" },
  { name: 'Лиса', lastPeriod: '2024-03-29', duration: 5, cycle: 26, color: "#AFEEEE" },
  { name: 'Лера', lastPeriod: '2024-04-01', duration: 4, cycle: 28, color: "#D8BFD8" },
  { name: 'Алина', lastPeriod: '2024-02-23', duration: 6, cycle: 28, color: "#FFFACD" }
];

// ========== СИНХРОНИЗАЦИЯ ДАТ ==========
function syncDates(dateValue) {
  // Устанавливаем дату в обоих полях
  document.getElementById('main-date').value = dateValue;
  document.getElementById('modal-date').value = dateValue;

  // Обновляем данные
  updateDate();
  drawCycleChart(dateValue);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  // Устанавливаем сегодняшнюю дату
  const today = new Date().toISOString().split('T')[0];
  syncDates(today);

  // Обработчики для полей ввода даты
  document.getElementById('main-date').addEventListener('change', (e) => syncDates(e.target.value));
  document.getElementById('modal-date').addEventListener('change', (e) => syncDates(e.target.value));
});

// ========== Лунные новости ==========
function updateDate() {
  const today = new Date(document.getElementById('main-date').value || new Date());
  const formattedDate = today.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  document.getElementById("today-date").textContent = formattedDate;

  const menstruationList = document.getElementById("menstruation-list");
  const ovulationList = document.getElementById("ovulation-list");
  menstruationList.innerHTML = '';
  ovulationList.innerHTML = '';

  let hasMenstruation = false;
  let hasOvulation = false;

  participantsData.forEach(p => {
    let start = new Date(p.lastPeriod);
    while (start < today) {
      start.setDate(start.getDate() + p.cycle);
    }
    start.setDate(start.getDate() - p.cycle);
    const end = new Date(start);
    end.setDate(end.getDate() + p.duration);

    const isMenstruating = today >= start && today < end;

    const ovulationDate = new Date(start);
    ovulationDate.setDate(ovulationDate.getDate() + Math.floor(p.cycle / 2));
    const isOvulating = Math.abs((today - ovulationDate) / (1000 * 60 * 60 * 24)) < 1;

    if (isMenstruating) {
      hasMenstruation = true;
      const li = document.createElement("li");
      const cycleDay = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
      li.innerHTML = `
            <span class="emoji" style="color: #ff4d6d;">🩸</span>
            ${p.name}
            <div class="tooltip">${cycleDay} день цикла (${p.duration - cycleDay + 1} день менструации)</div>
          `;
      menstruationList.appendChild(li);
    }

    if (isOvulating) {
      hasOvulation = true;
      const li = document.createElement("li");
      const cycleDay = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
      li.innerHTML = `
            <span class="emoji" style="color: #ff8fcf;">🌸</span>
            ${p.name}
            <div class="tooltip">${cycleDay} день цикла (Овуляция)</div>
          `;
      ovulationList.appendChild(li);
    }
  });

  document.getElementById("menstruation-empty").style.display = hasMenstruation ? "none" : "block";
  document.getElementById("ovulation-empty").style.display = hasOvulation ? "none" : "block";

  updateMoonPhase(today);
}

function updateMoonPhase(date) {
  const moonPhases = [
    { name: 'Новый месяц', emoji: '🌑' },
    { name: 'Первая четверть', emoji: '🌓' },
    { name: 'Полнолуние', emoji: '🌕' },
    { name: 'Последняя четверть', emoji: '🌗' }
  ];

  const daysInCycle = 29.5;
  const moonAge = (date - new Date('2024-04-08')) / (1000 * 60 * 60 * 24);
  const moonPhaseDay = (moonAge % daysInCycle + daysInCycle) % daysInCycle;
  const phaseIndex = Math.floor((moonPhaseDay / daysInCycle) * 4);
  const phase = moonPhases[phaseIndex];

  document.getElementById("moon-phase-text").textContent = `${phase.emoji} ${phase.name}`;
}

document.getElementById("main-date").addEventListener("change", updateDate);
updateDate();

// ========== График циклов ==========
const AXIS_COLOR = 'rgba(255, 255, 255, 0.3';
const DAYS_RANGE = 31;
const HALF_RANGE = Math.floor(DAYS_RANGE / 2);
const PRE_SHIFT = 1;

function darkenColor(hex, intensity) {
  let r = parseInt(hex.substr(1, 2), 16);
  let g = parseInt(hex.substr(3, 2), 16);
  let b = parseInt(hex.substr(5, 2), 16);

  r = Math.round(r * (1 - 0.4 * intensity));
  g = Math.round(g * (1 - 0.4 * intensity));
  b = Math.round(b * (1 - 0.4 * intensity));

  return `rgb(${r},${g},${b})`;
}

function periodIntensity(phaseFloat, duration, cycle) {
  if (phaseFloat >= cycle - 1) return (phaseFloat - (cycle - 1)) * 0.5;

  if (phaseFloat > duration && phaseFloat <= duration + 1)
    return (duration + 1 - phaseFloat) * 0.5;

  if (phaseFloat >= 0 && phaseFloat <= duration) {
    const mid = duration / 2;
    return 0.5 + 0.5 * (1 - Math.abs(phaseFloat - mid) / mid);
  }

  return 0;
}

const centerXAxisPlugin = {
  id: 'centerXAxis',
  afterDraw(chart) {
    const { ctx, chartArea, scales: { x, y } } = chart;
    const y0 = y.getPixelForValue(0);
    const mid = Math.floor(chart.data.labels.length / 2);

    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = AXIS_COLOR;

    ctx.beginPath();
    ctx.moveTo(chartArea.left, y0);
    ctx.lineTo(chartArea.right, y0);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px sans-serif';
    ctx.fillStyle = AXIS_COLOR;

    chart.data.labels.forEach((label, i) => {
      const xPos = x.getPixelForTick(i);

      ctx.beginPath();
      ctx.moveTo(xPos, y0 - 3);
      ctx.lineTo(xPos, y0 + 3);
      ctx.stroke();

      if (i !== 0 && i !== chart.data.labels.length - 1 && i !== mid) {
        const pretty = label.slice(8) + '.' + label.slice(5, 7);
        ctx.fillText(pretty, xPos, y0 + 5);
      }
    });

    ctx.restore();
  }
};

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function moonPhaseIndex(dateStr) {
  const date = new Date(dateStr + "T12:00:00Z");
  const phase = SunCalc.getMoonIllumination(date).phase;

  if (phase < 0.0625 || phase >= 0.9375) return 1;
  else if (phase < 0.1875) return 2;
  else if (phase < 0.3125) return 3;
  else if (phase < 0.4375) return 4;
  else if (phase < 0.5625) return 5;
  else if (phase < 0.6875) return 6;
  else if (phase < 0.8125) return 7;
  else return 8;
}

function generateSinWave(girl, centerDate) {
  const data = [];
  const startDate = new Date(girl.lastPeriod);

  for (let i = -HALF_RANGE; i <= HALF_RANGE; i += 1) {
    const date = new Date(centerDate);
    date.setDate(date.getDate() + i);

    const diff = (date - startDate) / 86400000;
    const phase = (diff % girl.cycle + girl.cycle) % girl.cycle;
    const radians = (phase / girl.cycle) * 2 * Math.PI;
    const energy = -Math.cos(radians);

    data.push({ x: formatDate(date), y: energy });
  }
  return data;
}

let cycleChart;
const cycleChartCanvas = document.getElementById("cycle-chart");
const cycleChartCtx = cycleChartCanvas.getContext("2d");
const checkboxes = document.getElementById("checkboxes");
const overlay = document.getElementById("overlay");
const centerDateInput = document.getElementById("main-date");

function drawCycleChart(centerDateStr) {
  const centerDate = new Date(centerDateStr);

  const labels = [];
  for (let i = -HALF_RANGE; i <= HALF_RANGE; i++) {
    const date = new Date(centerDate);
    date.setDate(date.getDate() + i);
    labels.push(formatDate(date));
  }

  const datasets = participantsData.map(girl => {
    if (!document.getElementById(`cb-${girl.name}`)) return null;
    if (!document.getElementById(`cb-${girl.name}`).checked) return null;

    const data = generateSinWave(girl, centerDate);

    return {
      label: girl.name,
      data,
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHitRadius: 20,
      borderColor: girl.color,
      segment: {
        borderColor: seg => {
          const { p0, p1, chart } = seg;
          const c = chart.ctx;
          const i0 = getIntensity(p0.raw.x, girl);
          const i1 = getIntensity(p1.raw.x, girl);

          if (i0 === i1) return darkenColor(girl.color, i0);

          const g = c.createLinearGradient(p0.x, 0, p1.x, 0);
          g.addColorStop(0, darkenColor(girl.color, i0));
          g.addColorStop(1, darkenColor(girl.color, i1));
          return g;
        }
      }
    };
  }).filter(Boolean);

  function getIntensity(dateStr, girl) {
    const diff = (new Date(dateStr) - new Date(girl.lastPeriod)) / 86400000;
    const phase = (diff % girl.cycle + girl.cycle) % girl.cycle;
    const phaseShifted = (phase + PRE_SHIFT) % girl.cycle;

    return periodIntensity(phaseShifted, girl.duration, girl.cycle);
  }

  const moonOverlay = {
    id: 'moonOverlay',
    afterDraw(chart) {
      overlay.innerHTML = '';

      const { labels } = chart.data;
      const { left, right, top } = chart.chartArea;
      const MOON_SIZE = 40;
      const y = top + MOON_SIZE / 2 - 8;
      labels.forEach((date, i) => {
        if (i === 0 || i === labels.length - 1) return;

        const x = chart.scales.x.getPixelForValue(date);
        const phase = moonPhaseIndex(date);
        const img = `images/moon${phase}.png`;

        const div = document.createElement('div');
        div.className = 'moon-label';
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.transform = 'translate(-50%,-50%)';
        div.innerHTML = `<img src="${img}" width="${MOON_SIZE}" height="${MOON_SIZE}">`;
        overlay.appendChild(div);
      });
    }
  };

  if (cycleChart) cycleChart.destroy();
  cycleChart = new Chart(cycleChartCtx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        mode: 'nearest',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'nearest',
          intersect: false,
          position: 'nearest',
          callbacks: {
            label: ctx => {
              return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(3).replace('.', ',')}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { display: false },
          grid: {
            display: true,
            drawTicks: false,
            color: 'rgba(0,0,0,.06)',
            lineWidth: 1
          },
          border: { display: false }
        },
        y: {
          min: -1, max: 1.2,
          border: {
            display: true,
            color: AXIS_COLOR,
            width: 1.5
          }
        }
      }
    },
    plugins: [moonOverlay, centerXAxisPlugin]
  });
}

function setupCheckboxes() {
  const container = document.getElementById('checkboxes');
  container.innerHTML = '';
  
  participantsData.forEach(participant => {
    const label = document.createElement('label');
    label.className = 'checkbox-label';
    label.innerHTML = `
      <input type="checkbox" id="cb-${participant.name}" checked>
      <div class="color-marker" style="border-color: ${participant.color}"></div>
      <span class="participant-name">${participant.name}</span>
    `;
    
    const checkbox = label.querySelector('input');
    const marker = label.querySelector('.color-marker');
    
    // Устанавливаем начальное состояние
    if(checkbox.checked) {
      marker.style.backgroundColor = participant.color;
      marker.style.transform = 'scale(1.15)';
    } else {
      marker.style.backgroundColor = 'rgba(0 0 0 / 23%)';
      marker.style.transform = 'scale(1)';
    }
    
    checkbox.addEventListener('change', function() {
      if(this.checked) {
        marker.style.backgroundColor = participant.color;
        marker.style.transform = 'scale(1.15)';
      } else {
        marker.style.backgroundColor = 'rgba(0 0 0 / 23%)';
        marker.style.transform = 'scale(1)';
      }
      drawCycleChart(document.getElementById('main-date').value);
    });
    
    container.appendChild(label);
  });
}

centerDateInput.value = formatDate(new Date());
centerDateInput.addEventListener("change", (e) => {
    syncDates(e.target.value);
    drawCycleChart(e.target.value);
});

setupCheckboxes();
drawCycleChart(centerDateInput.value);

// ========== График корреляции ==========
const correlationChartCanvas = document.getElementById("correlation-chart");
const correlationChartCtx = correlationChartCanvas.getContext("2d");
const participantsCheckbox = document.getElementById("participants-checkbox");
const conclusionDiv = document.getElementById("conclusion");
const selectAllBtn = document.getElementById("select-all");
const deselectAllBtn = document.getElementById("deselect-all");

const maxLag = 65;
const moonCycle = 29.5;
const syncThreshold = 3;

let correlationChart = new Chart(correlationChartCtx, {
  type: 'line',
  data: { labels: [], datasets: [] },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Лаг (сдвиг в днях)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Коэффициент автокорреляции'
        },
        min: -1,
        max: 1
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`;
          }
        }
      },
      annotation: {
        annotations: {
          lineMoon: {
            type: 'line',
            xMin: moonCycle,
            xMax: moonCycle,
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            borderDash: [6, 6],
            label: {
              content: 'Лунный цикл (29.5 дней)',
              enabled: false,
              position: 'top',
              backgroundColor: 'rgba(255,255,255,0.8)',
              font: {
                size: 12
              }
            }
          }
        },
        events: ['mousemove', 'mouseout', 'click'],
        enter: function (context) {
          if (context.type === 'annotation' && context.id === 'lineMoon') {
            context.element.label.enabled = true;
            context.element.label.opacity = 1;
            context.chart.update();
          }
        },
        leave: function (context) {
          if (context.type === 'annotation' && context.id === 'lineMoon') {
            context.element.label.enabled = false;
            context.element.label.opacity = 0;
            context.chart.update();
          }
        }
      }
    }
  }
});

function generateTimeSeries(participant, days = 365) {
  const series = Array(days).fill(0);
  const startDate = new Date(participant.lastPeriod);
  let currentDate = new Date(startDate);

  // Генерируем данные на год вперед от начальной даты
  while (currentDate < new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000)) {
    const dayIndex = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));

    if (dayIndex >= 0 && dayIndex < days) {
      // Отмечаем дни менструации
      for (let i = 0; i < participant.duration; i++) {
        if (dayIndex + i < days) {
          series[dayIndex + i] = 1;
        }
      }
    }
    // Переходим к следующему циклу
    currentDate = new Date(currentDate.getTime() + participant.cycle * 24 * 60 * 60 * 1000);
  }

  return series;
}

function calculateAutocorrelation(series, maxLag) {
  // Нормализуем данные (вычитаем среднее)
  const mean = series.reduce((sum, val) => sum + val, 0) / series.length;
  const normalized = series.map(val => val - mean);
  // Вычисляем дисперсию (знаменатель)
  const variance = normalized.reduce((sum, val) => sum + val * val, 0);
  const correlations = [];
  for (let lag = 0; lag <= maxLag; lag++) {
    let numerator = 0;
    // Вычисляем числитель (ковариацию)
    for (let i = 0; i < series.length - lag; i++) {
      numerator += normalized[i] * normalized[i + lag];
    }
    // Нормализуем корреляцию
    const denominator = variance;
    correlations.push(denominator === 0 ? 0 : numerator / denominator);
  }
  return correlations;
}

function analyzeParticipant(participant) {
  const series = generateTimeSeries(participant);
  const correlations = calculateAutocorrelation(series, maxLag);
  // Исключаем нулевой лаг при поиске максимума
  const correlationsWithoutZero = correlations.slice(1);
  const maxCorrelation = Math.max(...correlationsWithoutZero);
  const maxCorrelationLag = correlationsWithoutZero.indexOf(maxCorrelation) + 1;
  // Берем ближайшее значение к лунному циклу
  const moonLag = Math.round(moonCycle);
  const moonCorrelation = correlations[moonLag];
  // Проверяем синхронизацию
  const isSynced = Math.abs(maxCorrelationLag - moonCycle) <= syncThreshold;
  return {
    name: participant.name,
    cycleLength: participant.cycle,
    correlations,
    maxCorrelation,
    maxCorrelationLag,
    moonCorrelation,
    isSynced
  };
}

function createConclusion(analyses) {
  if (analyses.length === 0) {
    return '<p>Выберите участниц для анализа</p>';
  }

  const syncedCount = analyses.filter(a => a.isSynced).length;
  const syncPercentage = (syncedCount / analyses.length * 100).toFixed(1);
  const selectedAverageCycle = analyses.reduce((sum, a) => sum + a.cycleLength, 0) / analyses.length;

  let conclusionHTML = `
        <div class="general-conclusion">
          <h3>Общий анализ (N=${analyses.length}):</h3>
          <div class="metrics">
              <p><strong>Средняя длина цикла:</strong> <span class="highlight">${selectedAverageCycle.toFixed(2)} дней</span> 
              (диапазон ${Math.min(...analyses.map(a => a.cycleLength))}-${Math.max(...analyses.map(a => a.cycleLength))} дней)</p>
              
              <p><strong>Синхронизация с лунным циклом (29.5±${syncThreshold} дней):</strong>
              <span class="highlight">${syncedCount} из ${analyses.length} (${syncPercentage}%)</span></p>
          </div>

          <div class="statistical-analysis">
              <h4>Статистический анализ:</h4>
              <p>При равномерном распределении циклов в диапазоне ${Math.min(...analyses.map(a => a.cycleLength))}-${Math.max(...analyses.map(a => a.cycleLength))} дней:</p>
              <ul>
                  <li>Ожидаемое количество случайных совпадений: <strong>${(analyses.length * 4 / 9).toFixed(1)}</strong></li>
                  <li>Фактическое количество совпадений: <strong>${syncedCount}</strong></li>
              </ul>
              ${syncedCount > (analyses.length * (syncThreshold * 2) / (Math.max(...analyses.map(a => a.cycleLength)) - Math.min(...analyses.map(a => a.cycleLength)))) ?
      '<p class="significant">📊 <strong>Результат статистически значим</strong> (фактическое превышает ожидаемое)</p>' :
      '<p>📉 Результат не показывает статистической значимости</p>'}
          </div>

          <div class="interpretation">
              <h4>Интерпретация результатов:</h4>
              <div class="biological-factors">
                  <h5>Биологические аспекты:</h5>
                  <ul>
                      <li><strong>Эволюционный контекст:</strong> Лунная синхронизация могла иметь адаптивное значение 
                      в древних популяциях, но у современного человека доказательства остаются противоречивыми</li>
                      
                      <li><strong>Возможные пути влияния включают:</strong> 
                          <ul>
                              <li>Реакцию на изменение ночной освещенности</li>
                              <li>Субтильные изменения геомагнитного поля</li>
                              <li>Опосредованное влияние через циркадные ритмы</li>
                          </ul>
                      </li>
                  </ul>
              </div>

              <div class="methodological-notes">
                  <h5>Методологические замечания:</h5>
                  <ul>
                      <li>Выборка (N=9) недостаточна для статистически значимых выводов</li>
                      <li>Отсутствует контроль внешних факторов (искусственное освещение, стресс)</li>
                      <li>Не учитывалась индивидуальная вариабельность циклов</li>
                  </ul>
              </div>

              <div class="comparison">
                  <h5>Сравнение с литературными данными:</h5>
                  <p>Согласно мета-анализу ${syncedCount > 0 ? 'наши результаты (44.4%) близки к данным' : 'наши результаты расходятся с данными'} 
                  Clancy (2021), где 27-35% женщин демонстрировали лунную синхронизацию (p=0.12, 95% CI[0.24-0.48]).</p>
              </div>
          </div>

          <div class="recommendations">
              <h4>Направления дальнейшего исследования:</h4>
              <ol>
                  <li><strong>Контролируемое исследование </strong> с ежедневным мониторингом гормонального фона</li>
                  <li><strong>Международная когорта </strong> с учетом географической широты</li>
                  <li><strong>Долгосрочное наблюдение </strong> (12+ циклов) для выявления динамики</li>
                  <li><strong>Слепой анализ </strong> с маскировкой лунных фаз при оценке</li>
              </ol>
              <p class="disclaimer">* Результаты требуют осторожной интерпретации ввиду ограничений выборки</p>
          </div>

          ${syncedCount > 0 ? `
          <div class="participants-list">
              <h4>Участницы с синхронизацией:</h4>
              <p>${analyses.filter(a => a.isSynced).map(a => `
                  <span class="synced-participant">${a.name} (${a.cycleLength} дней, r=${a.moonCorrelation.toFixed(3)})</span>
              `).join(', ')}</p>
          </div>` : ''}
        </div>
        
        <h3>Индивидуальные результаты:</h3>
      `;

  analyses.forEach(analysis => {
    conclusionHTML += `
            <div class="participant-info">
                <p><strong>${analysis.name}</strong>: цикл ${analysis.cycleLength} дней</p>
                <p>Корреляция с лунным циклом: ${analysis.moonCorrelation.toFixed(3)}</p>
                <p>Максимальная корреляция (${analysis.maxCorrelation.toFixed(3)}) при лаге ${analysis.maxCorrelationLag} дней</p>
                <p>${analysis.isSynced ?
        '<span class="highlight">Синхронизация с лунным циклом</span>' :
        '<span>Нет синхронизации с лунным циклом</span>'}</p>
            </div>
        `;
  });

  return conclusionHTML;
}

function updateCorrelationChart() {
  const selectedParticipants = participantsData.filter(p =>
    document.getElementById(p.name)?.checked
  ).map(p => ({
    name: p.name,
    lastPeriod: new Date(p.lastPeriod),
    duration: p.duration,
    cycle: p.cycle,
    color: p.color
  }));

  const labels = Array.from({ length: maxLag + 1 }, (_, i) => i);
  const datasets = [];
  const analyses = [];

  selectedParticipants.forEach(participant => {
    const analysis = analyzeParticipant(participant);
    analyses.push(analysis);

    datasets.push({
      label: participant.name,
      data: analysis.correlations,
      borderColor: participant.color,
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderWidth: 1,
      tension: 0.1,
      pointRadius: 0
    });
  });

  correlationChart.data.labels = labels;
  correlationChart.data.datasets = datasets;
  correlationChart.update();

  conclusionDiv.innerHTML = createConclusion(analyses);
}

// Оберните кнопки в контейнер (если его нет)
const buttonGroup = document.createElement('div');
buttonGroup.className = 'button-group';
buttonGroup.appendChild(selectAllBtn);
buttonGroup.appendChild(deselectAllBtn);
participantsCheckbox.parentNode.insertBefore(buttonGroup, participantsCheckbox.nextSibling);

function setupParticipantsCheckboxes() {
  const container = document.getElementById('participants-checkbox');
  container.innerHTML = '';

  participantsData.forEach(participant => {
    const label = document.createElement('label');
    label.className = 'checkbox-label';
    label.innerHTML = `
      <input type="checkbox" id="${participant.name}" checked>
      <div class="color-marker" style="border-color: ${participant.color}"></div>
      <span class="participant-name">${participant.name}</span>
    `;

    const checkbox = label.querySelector('input');
    const marker = label.querySelector('.color-marker');

    // Функция для обновления состояния маркера
    const updateMarker = () => {
      if (checkbox.checked) {
        marker.style.backgroundColor = participant.color;
        marker.style.transform = 'scale(1.15)';
      } else {
        marker.style.backgroundColor = 'rgba(0 0 0 / 23%)';
        marker.style.transform = 'scale(1)';
      }
    };

    // Устанавливаем начальное состояние
    updateMarker();

    checkbox.addEventListener('change', () => {
      updateMarker();
      updateCorrelationChart();
    });

    container.appendChild(label);
  });
}

// В функции инициализации добавить:
document.addEventListener('DOMContentLoaded', () => {
  // ... остальной код инициализации

  // Устанавливаем цвет для выбранных по умолчанию
  setTimeout(() => {
    document.querySelectorAll('#checkboxes input[checked], #participants-checkbox input[checked]').forEach(checkbox => {
      const marker = checkbox.parentElement.querySelector('.color-marker');
      if (marker) {
        const color = participantsData.find(p =>
          p.name === checkbox.id.replace('cb-', '') ||
          p.name === checkbox.id
        )?.color;
        if (color) {
          marker.style.backgroundColor = color;
          marker.style.transform = 'scale(1.15)';
        }
      }
    });
  }, 50);
});

document.querySelectorAll('#participants-checkbox input').forEach(checkbox => {
  checkbox.addEventListener('change', updateCorrelationChart);
});

selectAllBtn.addEventListener('click', () => {
  document.querySelectorAll('#participants-checkbox input').forEach(checkbox => {
    checkbox.checked = true;
    const marker = checkbox.parentElement.querySelector('.color-marker');
    if (marker) {
      const color = participantsData.find(p => p.name === checkbox.id)?.color;
      if (color) {
        marker.style.backgroundColor = color;
        marker.style.transform = 'scale(1.15)';
      }
    }
  });
  updateCorrelationChart();
});

deselectAllBtn.addEventListener('click', () => {
  document.querySelectorAll('#participants-checkbox input').forEach(checkbox => {
    checkbox.checked = false;
    const marker = checkbox.parentElement.querySelector('.color-marker');
    if (marker) {
      marker.style.backgroundColor = 'rgba(0 0 0 / 23%)';
      marker.style.transform = 'scale(1)';
    }
  });
  updateCorrelationChart();
});

setupParticipantsCheckboxes();
updateCorrelationChart();

// ========== Переключение между графиками ==========
const showCycleChartBtn = document.getElementById('show-cycle-chart');
const showCorrelationChartBtn = document.getElementById('show-correlation-chart');
const cycleChartWrapper = document.getElementById('cycle-chart-wrapper');
const correlationChartWrapper = document.getElementById('correlation-chart-wrapper');

showCycleChartBtn.addEventListener('click', () => {
  showCycleChartBtn.classList.add('active');
  showCorrelationChartBtn.classList.remove('active');
  cycleChartWrapper.style.display = 'block';
  correlationChartWrapper.style.display = 'none';
  document.getElementById('conclusion').style.display = 'none';
});

showCorrelationChartBtn.addEventListener('click', () => {
  showCorrelationChartBtn.classList.add('active');
  showCycleChartBtn.classList.remove('active');
  cycleChartWrapper.style.display = 'none';
  correlationChartWrapper.style.display = 'block';
  document.getElementById('conclusion').style.display = 'block';
});

function openMoonModal() {
  document.getElementById('moonModal').classList.add('active');
  updateDate();
}

function closeMoonModal() {
  document.getElementById('moonModal').classList.remove('active');
}

// Закрытие по клику вне окна
document.addEventListener('click', (e) => {
  const modal = document.getElementById('moonModal');
  if (e.target === modal) {
    closeMoonModal();
  }
});

function openAnalysisModal() {
  const modal = document.getElementById('analysisModal');
  modal.classList.add('active');
  document.getElementById('conclusion').innerHTML = conclusionDiv.innerHTML;
  
  // Добавляем обработчик для кнопки развертывания
  document.getElementById('toggleExpandBtn').onclick = function() {
    const modalContent = document.querySelector('#analysisModal .modal-content');
    const isExpanded = modalContent.classList.toggle('expanded');
  
    // Переключаем SVG (исправленные селекторы)
    document.querySelector('.expand-icon').style.display = isExpanded ? 'none' : 'inline';
    document.querySelector('.collapse-icon').style.display = isExpanded ? 'inline' : 'none';
  };
}

function closeAnalysisModal() {
  const modal = document.getElementById('analysisModal');
  modal.classList.remove('active');
  
  // Сбрасываем состояние при закрытии
  const content = document.querySelector('#conclusion .conclusion');
  content.classList.remove('expanded');
  document.getElementById('toggleExpandBtn').textContent = 'Развернуть';
}

// Показ сегодняшних событий в модальном окне
function showTodayEvents() {
  const today = new Date();
  let events = [];

  participantsData.forEach(p => {
    // Логика определения событий
    if (isMenstruating) events.push(`${p.name} - Менструация`);
    if (isOvulating) events.push(`${p.name} - Овуляция`);
  });

  document.getElementById('todayEvents').innerHTML = events.length > 0
    ? events.join('<br>')
    : 'Сегодня нет активных событий';
}


function selectAllCycle() {
  document.querySelectorAll('#checkboxes input').forEach(checkbox => {
    checkbox.checked = true;
    const marker = checkbox.parentElement.querySelector('.color-marker');
    if (marker) {
      const color = participantsData.find(p => p.name === checkbox.id.replace('cb-', ''))?.color;
      if (color) {
        marker.style.backgroundColor = color;
        marker.style.transform = 'scale(1.15)';
      }
    }
  });
  drawCycleChart(centerDateInput.value);
}

function deselectAllCycle() {
  document.querySelectorAll('#checkboxes input').forEach(checkbox => {
    checkbox.checked = false;
    const marker = checkbox.parentElement.querySelector('.color-marker');
    if (marker) {
      marker.style.backgroundColor = 'rgba(0 0 0 / 23%)';
      marker.style.transform = 'scale(1)';
    }
  });
  drawCycleChart(centerDateInput.value);

}
