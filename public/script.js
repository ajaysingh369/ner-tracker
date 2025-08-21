// ---- virtualization state (module-level)
let VIRT_STATE = {
    athletes: [],
    activityMap: new Map(),
    distanceTotals: new Map(),
    activeDays: new Map(),
    dateStrs: [],
    todayStr: "",
    pageSize: 25,
    filteredIndexes: [],
    nextIndex: 0,
    observer: null
};

const debounced = (fn, d=250) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), d); }; };

function setActiveLangButtons(lang) {
    document.querySelectorAll(".lang-btn").forEach(btn => {
      const isActive = btn.dataset.lang === lang;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

function initLanguageUI() {
    setActiveLangButtons(I18N.current());
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const selectedLang = btn.dataset.lang;
        await I18N.load(btn.dataset.lang);
        // Static nodes auto-update via translateDOM(); now refresh dynamic:
        setActiveLangButtons(selectedLang); 
        rerenderDynamicText();
      }, { passive: true });
    });
  }
  
  function rerenderDynamicText() {
    // Example: update any live text built via JS
    // Header with month/day labels:
    buildHeader();  // will call I18N.t / I18N.dateFormatter internally
    // Qualified stamp labels:
    //refreshQualifiedStamps();
    // Popups/tooltips that have stored text:
    //closeAndReopenVisiblePopupsIfNeeded();
    // Sync note:
    const note = document.getElementById("syncNote");
    if (note) note.textContent = I18N.t("ui.note.sync");
  }
  
  

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        id: params.get("id"),
        start: params.get("start"),
        end: params.get("end")
    };
}

function getDayName(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long' };
    return date.toLocaleDateString('en-US', options);
}

function getLowResImageUrl(originalUrl) {
    return originalUrl.replace(/=s\d+-c$/, '=s48-c');
}

function getQualKey(category) {
    // bump to v2 to include the 22-day rule
    return `qualifiedState-2025-08-${category}-v2`;
}

function loadQualifiedState(category) {
    try { return JSON.parse(localStorage.getItem(getQualKey(category))) || {}; }
    catch { return {}; }
}

function saveQualifiedState(category, state) {
    localStorage.setItem(getQualKey(category), JSON.stringify(state));
}

function formatMedalWinners(medalWinners, athletes) {
    if (!medalWinners || medalWinners.length === 0) return 'N/A';
    return medalWinners.map(id => athletes[id]?.name || `Athlete ${id}`).join('<br> ');
}

function buildHeader2(monthKey = "2025-08") {
    const [y, m] = monthKey.split("-");
    const days = new Date(+y, +m, 0).getDate();
    return `
      <tr>
        <th>Athlete</th>
        ${Array.from({length: days}, (_, i) => {
          const d = String(i+1).padStart(2,"0");
          return `<th>${+d} Aug</th>`;
        }).join("")}
      </tr>`;
}
function buildHeader(year=2025, month=8) {
    const days = new Date(year, month, 0).getDate();
    const mFmt = I18N.dateFormatter({ month: "short" }); // en: Aug, hi: अग॰
    const d = new Date(year, month-1, 1);

    const monthLabel = mFmt.format(d);
    return `
      <tr>
        <th>${I18N.t("table.header.athlete")}</th>
        ${Array.from({ length: days }, (_, i) => {
            const d = String(i+1).padStart(2,"0");
           return `<th>${d} ${monthLabel}</th>`;
        }).join("")}
      </tr>`;
  }
  
  
// Function to format date as "1st Feb", "2nd Feb", "3rd Feb"
function formatDateHeader(date) {
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" }); // "Feb"
    
    // Add suffix (st, nd, rd, th)
    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";

    return `${day}<sup>${suffix}</sup> ${month}`; // Example: "1st Feb"
}

function renderNextChunk() {
    const calendarBody = document.getElementById("calendarBody");
    const { athletes, filteredIndexes, pageSize, nextIndex } = VIRT_STATE;
    if (nextIndex >= filteredIndexes.length) return;

    const end = Math.min(nextIndex + pageSize, filteredIndexes.length);
    const frag = document.createDocumentFragment();

    for (let i = nextIndex; i < end; i++) {
        const idx = filteredIndexes[i];
        const athlete = athletes[idx];
        frag.appendChild(buildAthleteRow(athlete));
    }

    VIRT_STATE.nextIndex = end;

    // Insert before sentinel so it stays last
    const sentinel = document.getElementById("virt-sentinel");
    if (sentinel) calendarBody.insertBefore(frag, sentinel);
    else calendarBody.appendChild(frag); // first pass before sentinel exists
}

function renderCalendar(athletes, activities) {
    const calendarBody = document.getElementById("calendarBody");
    calendarBody.innerHTML = "";

    // ---- Precompute constants
    const todayStr = new Date().toISOString().split("T")[0];
    const MONTH_KEY = "2025-08";
    const DAYS_IN_MONTH = 31;
    const dateStrs = Array.from({ length: DAYS_IN_MONTH }, (_, i) =>
        `${MONTH_KEY}-${String(i + 1).padStart(2, "0")}`
    );

    // ---- Build indexes
    const activityMap = new Map();    // `${athleteId}-${yyyy-mm-dd}` -> [acts]
    const distanceTotals = new Map(); // athleteId -> total KM up to today
    //const activeDays = new Map();         // key: athleteId -> count of distinct days with ≥1 act (≤ today)
    const activeDaySets = new Map();

    for (const entry of activities) {
        const athleteId = entry.athleteId;
        const byDate = entry.activitiesByDate || {};
        for (const dateStr in byDate) {
            const acts = byDate[dateStr] || [];
            
            const key = `${athleteId}-${dateStr}`;
            const list = activityMap.get(key);
            if (list) list.push(...acts);
            else activityMap.set(key, [...acts]);

            // Only consider days up to today
            if (dateStr <= todayStr) {
                // keep your existing distance accumulation
                const dayKm = acts.reduce((sum, a) => sum + (+a.distance || 0), 0);
                distanceTotals.set(athleteId, (distanceTotals.get(athleteId) || 0) + dayKm);
        
                // active day = at least one activity >= 2 km
                const isValidActive = acts.some(a => (+a.distance || 0) >= 2);
                if (isValidActive) {
                let s = activeDaySets.get(athleteId);
                if (!s) { s = new Set(); activeDaySets.set(athleteId, s); }
                s.add(dateStr);
                }
            }
        }
    }

    // materialize counts
    const activeDays = new Map();
    for (const [athleteId, set] of activeDaySets) {
        activeDays.set(athleteId, set.size);
    }

    // ---- Sort athletes by total distance (desc)
    const sortedAthletes = [...athletes].sort((a, b) => {
        const db = distanceTotals.get(b.id) || 0;
        const da = distanceTotals.get(a.id) || 0;
        return db - da;
    });

    // Save to virtualization state
    VIRT_STATE.athletes = sortedAthletes.map(a => ({
        ...a,
        _nameLower: `${a.firstname} ${a.lastname}`.toLowerCase() // for fast search
    }));
    VIRT_STATE.activityMap = activityMap;
    VIRT_STATE.distanceTotals = distanceTotals;
    VIRT_STATE.activeDays = activeDays;
    VIRT_STATE.dateStrs = dateStrs;
    VIRT_STATE.todayStr = todayStr;
    VIRT_STATE.filteredIndexes = VIRT_STATE.athletes.map((_, i) => i);
    VIRT_STATE.nextIndex = 0;

    // Clear any previous observer
    if (VIRT_STATE.observer) {
        VIRT_STATE.observer.disconnect();
        VIRT_STATE.observer = null;
    }

    // Render first chunk
    renderNextChunk();

    // Add a sentinel row to trigger loading more
    const sentinel = document.createElement("tr");
    sentinel.id = "virt-sentinel";
    sentinel.innerHTML = `<td colspan="${1 + VIRT_STATE.dateStrs.length}" style="height:1px;padding:0;border:0"></td>`;
    calendarBody.appendChild(sentinel);

    // Observe sentinel
    VIRT_STATE.observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
        if (entry.isIntersecting) renderNextChunk();
        }
    }, { root: document.querySelector(".calendar-container"), rootMargin: "200px" });
    VIRT_STATE.observer.observe(sentinel);
}


function buildAthleteRow(athlete) {
    const { activityMap, dateStrs, todayStr, distanceTotals, activeDays } = VIRT_STATE;

    const row = document.createElement("tr");
    row.className = "row-virt";

    // Left cell
    const athleteCell = document.createElement("td");
    athleteCell.style.backgroundColor = "rgba(61, 98, 59, 0.91)";
    athleteCell.style.minWidth = "8rem";

    const lowResUrl = getLowResImageUrl(athlete.profile || "");
    const athleteName = `${athlete.firstname} ${athlete.lastname}`;
    const monthTotal = distanceTotals.get(athlete.id) || 0;
    const DISTANCE_GOAL = parseInt(athlete.category, 10) || 100;
    const progressPercent = Math.min(100, (monthTotal / DISTANCE_GOAL) * 100).toFixed(1);
    const daysActive = activeDays.get(athlete.id) || 0;

    // load per-category qualified state (first render per fetch)
    const qualifiedState = loadQualifiedState(athlete.category || "100");
    // did they qualify now? must meet both criteria
    const meetsDistance = monthTotal >= DISTANCE_GOAL;
    const meetsDays = daysActive >= 22;
    const isQualified = meetsDistance && meetsDays;
    const wasQualified = !!qualifiedState[athlete.id];
    const shouldAnimateStamp = isQualified && !wasQualified;
    const txt = I18N.t("ui.qualified.stamp");

    athleteCell.innerHTML = `
        <div class="athlete-cell ${isQualified ? 'qualified' : ''}" data-athlete-id="${athleteName}">
            <span class="qualified-stamp ${shouldAnimateStamp ? 'stamp-animate' : ''}" title="Goal achieved!">${txt}</span>
        <img loading="lazy" decoding="async" fetchpriority="low" class="profile-photo" src="${lowResUrl}" onerror="this.src='avatar.jpg'" width="48" height="48" alt="${athleteName}" />
        <div class="athlete-info">
            <div class="athlete-name">${athleteName}</div>
            <div class="athlete-distance">${monthTotal.toFixed(2)} ${I18N.t("ui.km")}</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${progressPercent}%"></div></div>
        </div>
        </div>
    `;

    // Build compact activities map for popup
    const popupActivitiesByDate = {};
    for (const dStr of dateStrs) {
        const acts = activityMap.get(`${athlete.id}-${dStr}`);
        if (acts && acts.length) {
            popupActivitiesByDate[dStr] = acts;
            athleteCell.dataset.acts = JSON.stringify(acts);
            athleteCell.dataset.athlete = athleteName;
        }
    }
    athleteCell.addEventListener("click", () =>
        showProfilePopup({ ...athlete, activities: popupActivitiesByDate })
    );

    if (shouldAnimateStamp) {
        qualifiedState[athlete.id] = true;
        saveQualifiedState(athlete.category, qualifiedState);
    }

    row.appendChild(athleteCell);

    const genderEmoji = athlete.gender === "F" ? "🏃‍♀️" : "🏃‍♂️";
    for (const dStr of dateStrs) {
        const cell = document.createElement("td");

        if (dStr > todayStr) {
        cell.textContent = "";
        cell.style.backgroundColor = "transparent";
        } else {
        const acts = activityMap.get(`${athlete.id}-${dStr}`);
        if (acts && acts.length) {
            const totalDist = acts.reduce((sum, a) => sum + (+a.distance || 0), 0);
            cell.innerHTML = `<span class="activity-points">${totalDist.toFixed(2)} ${I18N.t("ui.km")}</span>`;
            cell.classList.add("active-cell","cell__emoji");
            cell.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><text x='50%' y='50%' font-size='50' text-anchor='middle' dominant-baseline='middle'>${genderEmoji}</text></svg>")`;
            cell.addEventListener("click", () => showActivityDetails(acts, athleteName));
        } else {
            cell.classList.add("cell--rest", "cell__emoji");
            cell.innerHTML = `<span class="activity-points">${I18N.t("ui.refueling")}</span>`;
        }
        }

        if (dStr === todayStr) {
            cell.classList.add("cell--today");
        }

        row.appendChild(cell);
    }

    return row;
}


function applyCategoryFilter(category) {
    const athleteRows = document.querySelectorAll('#calendarBody tr');
    athleteRows.forEach(row => {
        const categoryAttr = row.getAttribute('data-category');
        if (categoryAttr === category) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

// Function to filter athletes by name
function filterAthletes() {
    const q = document.getElementById('searchAthlete').value.trim().toLowerCase();

    // Reset indices based on the query (don’t touch the master arrays)
    if (!q) {
        VIRT_STATE.filteredIndexes = VIRT_STATE.athletes.map((_, i) => i);
    } else {
        VIRT_STATE.filteredIndexes = VIRT_STATE.athletes
        .map((a, i) => (a._nameLower.includes(q) ? i : -1))
        .filter(i => i !== -1);
    }

    // Reset the table body but keep thead
    const calendarBody = document.getElementById("calendarBody");
    calendarBody.innerHTML = "";

    // Reset scroll state and sentinel
    VIRT_STATE.nextIndex = 0;
    if (VIRT_STATE.observer) {
        VIRT_STATE.observer.disconnect();
        VIRT_STATE.observer = null;
    }

    // Render first chunk for filtered list
    renderNextChunk();

    // Re-add sentinel
    const sentinel = document.createElement("tr");
    sentinel.id = "virt-sentinel";
    sentinel.innerHTML = `<td colspan="${1 + VIRT_STATE.dateStrs.length}" style="height:1px;padding:0;border:0"></td>`;
    calendarBody.appendChild(sentinel);

    VIRT_STATE.observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
        if (entry.isIntersecting) renderNextChunk();
        }
    }, { root: document.querySelector(".calendar-container"), rootMargin: "200px" });
    VIRT_STATE.observer.observe(sentinel);
}


// Show activity details in a popup
const showActivityDetails = (activities, athleteName = "Unknown Athlete") => {
    let html = `<p><strong>Athlete:</strong> ${athleteName}</p>`;
    activities.forEach(activity => {
        html += `
            <hr>
            <p><strong>${I18N.t("popup.details.t1")}:</strong> ${activity.name}</p>
            <p><strong>${I18N.t("popup.details.t2")}:</strong> ${new Date(activity.start_date).toLocaleDateString()}</p>
            <p><strong>${I18N.t("popup.details.t3")}:</strong> ${activity.type}</p>
            <p><strong>${I18N.t("popup.details.t4")}:</strong> ${activity.distance} km</p>
            <p><strong>${I18N.t("popup.details.t5")}:</strong> ${(activity.moving_time / 60).toFixed(2)} mins</p>
        `;
    });
    activityDetails.innerHTML = html;
    activityPopup.style.display = 'flex';
};


// Show athlete profile in a popup
const showProfilePopup = (athlete) => {
    profilePhoto.src = athlete.profile;
    profileName.textContent = athlete.name;
    const activityCounts = {};
    Object.values(athlete.activities).forEach(activity => {
        activityCounts[activity.type] = (activityCounts[activity.type] || 0) + 1;
    });

    // Generate formatted activity count text
    const activityText = Object.entries(activityCounts)
        .map(([type, count]) => `Run: <b>${count}</b>`)
        .join(', ');

    profileActivities.innerHTML = `${I18N.t("popup.details.t6")}: ${activityText || 'No Activities'}`;
    profilePopup.style.display = 'flex';
};

function closePopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

// Handle month selection

// Event listener for the "Authorize with Strava" button
// authButton.addEventListener('click', () => {
//     window.location.href = '/auth/strava';
// });




  