// Dashboard application logic (calendar + CRUD + realtime)

(function () {
  const noticeEl = document.getElementById("dashNotice");
  const logoutBtn = document.getElementById("logoutBtn");
  const userPill = document.getElementById("userPill");

  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");
  const todayBtn = document.getElementById("todayBtn");
  const monthLabel = document.getElementById("monthLabel");
  const monthTotalPill = document.getElementById("monthTotal");
  const tzLabel = document.getElementById("tzLabel");
  const calGrid = document.getElementById("calGrid");

  const dayLabel = document.getElementById("dayLabel");
  const dayTotalPill = document.getElementById("dayTotal");

  const entryForm = document.getElementById("entryForm");
  const editingId = document.getElementById("editingId");
  const amountInput = document.getElementById("amount");
  const categoryInput = document.getElementById("category");
  const descriptionInput = document.getElementById("description");
  const saveBtn = document.getElementById("saveBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const formMsg = document.getElementById("formMsg");
  const entriesList = document.getElementById("entriesList");

  // Overview / analytics
  const totalThisMonthEl = document.getElementById("totalThisMonth");
  const totalTodayEl = document.getElementById("totalToday");
  const totalAllTimeEl = document.getElementById("totalAllTime");
  const streakSection = document.getElementById("streakSection");
  const streakBadge = document.getElementById("streakBadge");
  const goalAmountInput = document.getElementById("goalAmount");
  const goalSaveBtn = document.getElementById("goalSaveBtn");
  const goalProgressFill = document.getElementById("goalProgressFill");
  const goalProgressText = document.getElementById("goalProgressText");
  const csvExportBtn = document.getElementById("csvExportBtn");
  const monthlyChartCanvas = document.getElementById("monthlyChartCanvas");
  const filterCategory = document.getElementById("filterCategory");
  const searchDescription = document.getElementById("searchDescription");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const successToast = document.getElementById("successToast");
  const deleteModal = document.getElementById("deleteModal");
  const deleteModalCancel = document.getElementById("deleteModalCancel");
  const deleteModalConfirm = document.getElementById("deleteModalConfirm");
  const addMonthlyIncomeBtn = document.getElementById("addMonthlyIncomeBtn");
  const salaryModal = document.getElementById("salaryModal");
  const salaryModalCancel = document.getElementById("salaryModalCancel");
  const salaryModalSubmit = document.getElementById("salaryModalSubmit");
  const salaryMonth = document.getElementById("salaryMonth");
  const salaryAmount = document.getElementById("salaryAmount");
  const salaryModalMsg = document.getElementById("salaryModalMsg");

  const expensesThisMonthEl = document.getElementById("expensesThisMonth");
  const expensesTodayEl = document.getElementById("expensesToday");
  const netIncomeThisMonthEl = document.getElementById("netIncomeThisMonth");
  const addExpenseBtn = document.getElementById("addExpenseBtn");
  const expenseModal = document.getElementById("expenseModal");
  const expenseForm = document.getElementById("expenseForm");
  const expenseAmount = document.getElementById("expenseAmount");
  const expenseCategory = document.getElementById("expenseCategory");
  const expenseOtherWrap = document.getElementById("expenseOtherWrap");
  const expenseOtherCategory = document.getElementById("expenseOtherCategory");
  const expenseDescription = document.getElementById("expenseDescription");
  const expenseDate = document.getElementById("expenseDate");
  const expenseModalMsg = document.getElementById("expenseModalMsg");
  const expenseModalCancel = document.getElementById("expenseModalCancel");
  const expenseModalSubmit = document.getElementById("expenseModalSubmit");
  const deleteExpenseModal = document.getElementById("deleteExpenseModal");
  const deleteExpenseModalCancel = document.getElementById("deleteExpenseModalCancel");
  const deleteExpenseModalConfirm = document.getElementById("deleteExpenseModalConfirm");
  const expensesPieCanvas = document.getElementById("expensesPieCanvas");
  const expenseCategoryBreakdown = document.getElementById("expenseCategoryBreakdown");
  const expensesEmptyState = document.getElementById("expensesEmptyState");
  const expensesMonthSummary = document.getElementById("expensesMonthSummary");
  const expensesTodaySummary = document.getElementById("expensesTodaySummary");
  const consistencySection = document.getElementById("consistencySection");
  const consistencyBar = document.getElementById("consistencyBar");
  const consistencyValue = document.getElementById("consistencyValue");
  const bestDaySection = document.getElementById("bestDaySection");
  const bestDayText = document.getElementById("bestDayText");
  const avgDailySection = document.getElementById("avgDailySection");
  const avgDailyText = document.getElementById("avgDailyText");
  const insightBoxList = document.getElementById("insightBoxList");
  const spendingInsightBox = document.getElementById("spendingInsightBox");
  const spendingInsightText = document.getElementById("spendingInsightText");
  const alertContainer = document.getElementById("alertContainer");
  const toolkitToggle = document.getElementById("toolkitToggle");
  const toolkitContent = document.getElementById("toolkitContent");
  const backToTopBtn = document.getElementById("backToTopBtn");
  const netWorthValue = document.getElementById("netWorthValue");
  const streakMessage = document.getElementById("streakMessage");

  const client = window.supabaseClient;
  var deletePendingId = null;
  var deleteExpensePendingId = null;

  // State
  let session = null;
  let userId = null;
  let viewYear = null;
  let viewMonth = null; // 0-11
  let selectedDate = null; // Date (local time)
  let monthEntries = []; // fetched rows within visible month range
  let monthExpenses = []; // fetched expenses for visible month
  let allTimeTotal = 0;
  let allTimeExpensesTotal = 0;
  let currentStreak = 0; // exposed for insight box
  let realtimeChannel = null;
  let previousStreak = -1;
  let monthlyChartInstance = null;
  let monthlyExpenseChartInstance = null; // pie for expenses
  let currentGoal = null; // { goal_amount }
  let filterCategoryValue = "";
  let searchDescriptionValue = "";
  let monthlyCategorySpikeShownThisSession = false; // Section 6: once per session

  function showNotice(html, tone) {
    noticeEl.classList.remove("hidden");
    noticeEl.style.borderColor =
      tone === "error"
        ? "rgba(255,77,109,.45)"
        : tone === "ok"
          ? "rgba(53,208,127,.35)"
          : "rgba(255,255,255,.14)";
    noticeEl.innerHTML = html;
  }
  function hideNotice() {
    noticeEl.classList.add("hidden");
    noticeEl.innerHTML = "";
  }

  function showFormMsg(html, tone) {
    formMsg.classList.remove("hidden");
    formMsg.style.borderColor =
      tone === "error"
        ? "rgba(255,77,109,.45)"
        : "rgba(53,208,127,.35)";
    formMsg.innerHTML = html;
  }
  function clearFormMsg() {
    formMsg.classList.add("hidden");
    formMsg.innerHTML = "";
  }

  function setLoading(visible) {
    if (!loadingOverlay) return;
    if (visible) loadingOverlay.classList.add("visible");
    else loadingOverlay.classList.remove("visible");
  }

  function showSuccessToast(message) {
    if (!successToast) return;
    successToast.textContent = message || "Entry added!";
    successToast.classList.add("visible");
    clearTimeout(showSuccessToast._t);
    showSuccessToast._t = setTimeout(function () {
      successToast.classList.remove("visible");
    }, 2000);
  }

  function showExpenseSuccessToast() {
    if (!successToast) return;
    successToast.textContent = "Expense added.";
    successToast.classList.add("visible", "success-pulse");
    clearTimeout(showExpenseSuccessToast._t);
    showExpenseSuccessToast._t = setTimeout(function () {
      successToast.classList.remove("visible", "success-pulse");
    }, 2000);
  }

  function showAlert(message, autoHideMs) {
    if (!alertContainer) return;
    var el = document.createElement("div");
    el.className = "alert-toast";
    el.setAttribute("role", "alert");
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "alert-close";
    closeBtn.innerHTML = "×";
    closeBtn.setAttribute("aria-label", "Close");
    el.appendChild(closeBtn);
    var text = document.createElement("span");
    text.textContent = message;
    el.appendChild(text);
    closeBtn.addEventListener("click", function () {
      el.remove();
    });
    if (autoHideMs == null) autoHideMs = 5000;
    var t = setTimeout(function () {
      el.remove();
    }, autoHideMs);
    closeBtn.addEventListener("click", function () { clearTimeout(t); });
    alertContainer.appendChild(el);
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  // Local date key used for grouping: YYYY-MM-DD in local timezone
  function dateKeyLocal(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function monthKey(year, month) {
    return `${year}-${pad2(month + 1)}`;
  }

  function money(n) {
    var v = Number(n || 0);
    return v.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }

  function tzName() {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "Local"
    );
  }

  function startOfMonthLocal(year, month) {
    return new Date(year, month, 1, 0, 0, 0, 0);
  }

  function endOfMonthLocal(year, month) {
    return new Date(year, month + 1, 0, 23, 59, 59, 999);
  }

  // Convert a local date (year/month/day) to an ISO string representing that local wall time.
  // This yields correct grouping for "day totals" in the user's local timezone.
  function localDateTimeToIso(d) {
    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds()
    ).toISOString();
  }

  function parseCreatedAtToLocalDate(createdAt) {
    // createdAt is ISO (UTC); Date converts to local
    return new Date(createdAt);
  }

  function setSelectedDate(d) {
    selectedDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    renderSelectedDayPanel();
    renderCalendar();
  }

  function computeDayStats(entries) {
    const map = new Map(); // key -> { total, currencies: Map }
    for (const row of entries) {
      const ld = parseCreatedAtToLocalDate(row.created_at);
      const key = dateKeyLocal(ld);
      const current = map.get(key) || {
        total: 0,
        currencies: new Map(),
      };
      const amt = Number(row.amount || 0);
      current.total += amt;
      const curr = row.currency || "USD";
      current.currencies.set(curr, (current.currencies.get(curr) || 0) + amt);
      map.set(key, current);
    }
    return map;
  }

  /** Expense analytics: by day key and by category. Amounts are positive (spending). */
  function computeExpenseStats(expenses) {
    const byDay = new Map(); // key -> total
    const byCategory = new Map(); // category -> total
    for (const row of expenses) {
      const ld = parseCreatedAtToLocalDate(row.created_at);
      const key = dateKeyLocal(ld);
      const amt = Number(row.amount || 0);
      byDay.set(key, (byDay.get(key) || 0) + amt);
      const cat = (row.category || "Other").trim() || "Other";
      byCategory.set(cat, (byCategory.get(cat) || 0) + amt);
    }
    return { byDay, byCategory };
  }

  function isSameLocalDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function inViewMonthLocal(d) {
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  }

  function formatDayLabel(d) {
    const fmt = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return fmt.format(d);
  }

  function renderCalendar() {
    if (viewYear == null || viewMonth == null) return;

    tzLabel.textContent = `TZ: ${tzName()}`;

    const monthName = new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    }).format(new Date(viewYear, viewMonth, 1));
    monthLabel.textContent = monthName;

    var statsByDay = computeDayStats(monthEntries);
    var expenseStats = computeExpenseStats(monthExpenses);
    var monthTotal = [...statsByDay.values()].reduce(function (a, s) { return a + s.total; }, 0);
    monthTotalPill.textContent = "Month total: " + money(monthTotal);

    var maxEarningsInMonth = 0;
    statsByDay.forEach(function (s) {
      if (s.total > maxEarningsInMonth) maxEarningsInMonth = s.total;
    });

    // Monday-first calendar grid
    const first = new Date(viewYear, viewMonth, 1);
    const firstDow = (first.getDay() + 6) % 7; // convert Sun(0)→6, Mon(1)→0
    const gridStart = new Date(viewYear, viewMonth, 1 - firstDow);

    calGrid.innerHTML = "";

    for (let i = 0; i < 42; i++) {
      const d = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + i
      );

      var key = dateKeyLocal(d);
      var stat = statsByDay.get(key);
      var earnTotal = stat ? stat.total : 0;
      var expTotal = expenseStats.byDay.get(key) || 0;
      var hasEarnings = earnTotal > 0;
      var hasExpenses = expTotal > 0;
      var hasEntries = hasEarnings || hasExpenses || (stat && earnTotal === 0);

      var total = earnTotal; // display earnings total for the day

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day";
      btn.setAttribute("role", "gridcell");
      btn.dataset.date = key;
      btn.setAttribute("aria-selected", String(selectedDate && isSameLocalDay(d, selectedDate)));

      if (!inViewMonthLocal(d)) btn.classList.add("is-other-month");

      if (hasEntries || hasExpenses) {
        if (hasEarnings && hasExpenses) {
          btn.classList.add("day-mixed");
        } else if (hasEarnings) {
          btn.classList.add("day-positive");
          var ratio = maxEarningsInMonth > 0 ? earnTotal / maxEarningsInMonth : 0;
          if (ratio >= 0.66) btn.classList.add("day-heat-high");
          else if (ratio >= 0.33) btn.classList.add("day-heat-mid");
          else btn.classList.add("day-heat-low");
        } else if (hasExpenses) {
          btn.classList.add("day-expense-only");
        } else if (stat && earnTotal === 0) {
          btn.classList.add("day-zero");
        }
      }

      var blocks = [];
      if (hasEarnings && hasExpenses) {
        blocks.push('<div class="day-box day-box-net">+' + money(earnTotal) + " / −" + money(expTotal) + "</div>");
      } else {
        if (hasEarnings) blocks.push('<div class="day-box day-box-earn">' + (earnTotal > 0 ? "+" : "") + money(earnTotal) + "</div>");
        if (hasExpenses) blocks.push('<div class="day-box day-box-exp">−' + money(expTotal) + "</div>");
      }
      var blocksHtml = blocks.length ? '<div class="day-blocks">' + blocks.join("") + "</div>" : "";

      btn.innerHTML =
        '<div class="day-inner">' +
        '<div class="day-num">' + d.getDate() + "</div>" +
        blocksHtml +
        "</div>";

      btn.addEventListener("click", () => setSelectedDate(d));
      calGrid.appendChild(btn);
    }
  }

  function entriesForSelectedDayUnfiltered() {
    if (!selectedDate) return [];
    return monthEntries
      .filter(function (row) {
        var ld = parseCreatedAtToLocalDate(row.created_at);
        return isSameLocalDay(ld, selectedDate);
      })
      .sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
  }

  function entriesForSelectedDay() {
    var list = entriesForSelectedDayUnfiltered();
    if (filterCategoryValue) {
      list = list.filter(function (r) { return (r.category || "").toLowerCase() === filterCategoryValue.toLowerCase(); });
    }
    if (searchDescriptionValue) {
      var q = searchDescriptionValue.toLowerCase();
      list = list.filter(function (r) { return (r.description || "").toLowerCase().indexOf(q) !== -1; });
    }
    return list;
  }

  function resetFormToAdd() {
    editingId.value = "";
    saveBtn.textContent = "Add entry";
    cancelEditBtn.classList.add("hidden");
    clearFormMsg();
    amountInput.value = "";
    categoryInput.value = "";
    descriptionInput.value = "";
    amountInput.focus();
  }

  function startEdit(row) {
    editingId.value = row.id;
    saveBtn.textContent = "Save changes";
    cancelEditBtn.classList.remove("hidden");
    clearFormMsg();
    amountInput.value = Number(row.amount || 0);
    categoryInput.value = row.category || "";
    descriptionInput.value = row.description || "";
    amountInput.focus();
  }

  function renderSelectedDayPanel() {
    if (!selectedDate) return;

    dayLabel.textContent = formatDayLabel(selectedDate);

    var entries = entriesForSelectedDay();
    var dayTotal = entries.reduce(function (sum, r) { return sum + Number(r.amount || 0); }, 0);
    var prefix = dayTotal > 0 ? "+" : dayTotal < 0 ? "-" : "";
    dayTotalPill.textContent =
      entries.length === 0
        ? "Day total: —"
        : "Day total: " + prefix + money(Math.abs(dayTotal));

    // Entries list
    entriesList.innerHTML = "";
    if (entries.length === 0) {
      var empty = document.createElement("div");
      empty.className = "notice empty-state";
      var unfiltered = entriesForSelectedDayUnfiltered();
      empty.innerHTML = unfiltered.length > 0
        ? "No entries match your filters."
        : "No entries for this day yet.";
      entriesList.appendChild(empty);
      return;
    }

    for (const row of entries) {
      const item = document.createElement("div");
      item.className = "item";

      const t = new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(row.created_at));

      const cat = row.category ? ` • ${escapeHtml(row.category)}` : "";
      const desc = row.description ? escapeHtml(row.description) : "";
      const sign = row.amount > 0 ? "+" : row.amount < 0 ? "-" : "";

      item.innerHTML = `
        <div class="item-row">
          <div>
            <div class="item-amt">${sign}${money(Math.abs(row.amount))}</div>
            <div class="item-meta">${t}${cat}</div>
          </div>
          <div class="item-actions">
            <button class="btn" type="button" data-action="edit">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete">Delete</button>
          </div>
        </div>
        ${desc ? `<div class="muted" style="font-size:13px; white-space: pre-wrap">${desc}</div>` : ""}
      `;

      item.querySelector('[data-action="edit"]').addEventListener("click", () => {
        startEdit(row);
      });

      item.querySelector('[data-action="delete"]').addEventListener("click", function () {
        deletePendingId = row.id;
        if (deleteModal) {
          deleteModal.classList.remove("hidden");
          deleteModal.classList.add("visible");
        }
      });

      entriesList.appendChild(item);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function fetchMonthEntries() {
    const start = startOfMonthLocal(viewYear, viewMonth);
    const end = endOfMonthLocal(viewYear, viewMonth);

    // We query created_at using UTC boundaries derived from local wall times.
    // This gives accurate "month view" in the user's local timezone.
    const gte = localDateTimeToIso(start);
    const lte = localDateTimeToIso(end);

    const { data, error } = await client
      .from("earnings")
      .select("id,user_id,amount,currency,description,category,created_at")
      .eq("user_id", userId)
      .gte("created_at", gte)
      .lte("created_at", lte)
      .order("created_at", { ascending: true });

    if (error) throw error;
    monthEntries = data || [];
  }

  async function fetchMonthExpenses() {
    try {
      const start = startOfMonthLocal(viewYear, viewMonth);
      const end = endOfMonthLocal(viewYear, viewMonth);
      const gte = localDateTimeToIso(start);
      const lte = localDateTimeToIso(end);
      const { data, error } = await client
        .from("expenses")
        .select("id,user_id,amount,category,description,created_at")
        .eq("user_id", userId)
        .gte("created_at", gte)
        .lte("created_at", lte)
        .order("created_at", { ascending: true });
      if (error) throw error;
      monthExpenses = data || [];
    } catch (_) {
      monthExpenses = [];
    }
  }

  async function insertExpense({ amount, category, description, createdAtIso }) {
    const payload = {
      user_id: userId,
      amount,
      category,
      description: description || null,
      created_at: createdAtIso,
    };
    const { data, error } = await client
      .from("expenses")
      .insert(payload)
      .select("id,user_id,amount,category,description,created_at")
      .single();
    if (error) throw error;
    return data;
  }

  async function updateExpense(id, { amount, category, description }) {
    const { data, error } = await client
      .from("expenses")
      .update({
        amount,
        category,
        description: description || null,
      })
      .eq("id", id)
      .select("id,user_id,amount,category,description,created_at")
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteExpense(id) {
    const { error } = await client.from("expenses").delete().eq("id", id);
    if (error) throw error;
  }

  async function insertEntry({ amount, currency, description, category, createdAtIso }) {
    const payload = {
      user_id: userId,
      amount,
      currency,
      description: description || null,
      category: category || null,
      created_at: createdAtIso,
    };

    const { data, error } = await client
      .from("earnings")
      .insert(payload)
      .select("id,user_id,amount,currency,description,category,created_at")
      .single();

    if (error) throw error;
    return data;
  }

  async function updateEntry(id, { amount, currency, description, category }) {
    const { data, error } = await client
      .from("earnings")
      .update({
        amount,
        currency,
        description: description || null,
        category: category || null,
      })
      .eq("id", id)
      .select("id,user_id,amount,currency,description,category,created_at")
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteEntry(id) {
    const { error } = await client.from("earnings").delete().eq("id", id);
    if (error) throw error;
  }

  function upsertLocalRow(row) {
    const idx = monthEntries.findIndex((r) => r.id === row.id);
    if (idx >= 0) monthEntries[idx] = row;
    else monthEntries.push(row);
  }

  function removeLocalRow(id) {
    monthEntries = monthEntries.filter((r) => r.id !== id);
  }

  async function refreshUI() {
    await fetchMonthEntries();
    await fetchMonthExpenses();
    await fetchAllTimeExpenses();
    refreshFilterCategories();
    renderCalendar();
    renderSelectedDayPanel();
    renderTotals();
    renderExpenseTotals();
    renderNetIncome();
    renderNetWorth();
    renderExpensePie();
    renderExpenseBreakdown();
    renderExpensesList();
    renderGoal();
    renderMonthlyChart();
    await renderStreak();
    renderConsistency();
    renderBestDay();
    await renderInsightBox();
    renderAvgDailyIncome();
    renderSpendingInsight();
  }

  function renderTotals() {
    var stats = computeDayStats(monthEntries);
    var monthTotal = 0;
    var dayTotal = 0;
    var todayKey = dateKeyLocal(new Date());
    stats.forEach(function (s, key) {
      monthTotal += s.total;
      if (key === todayKey) dayTotal = s.total;
    });
    if (totalThisMonthEl) {
      totalThisMonthEl.textContent = money(monthTotal);
      totalThisMonthEl.classList.add("counter-animate");
    }
    if (totalTodayEl) {
      totalTodayEl.textContent = money(dayTotal);
      totalTodayEl.classList.add("counter-animate");
    }
    if (totalAllTimeEl) totalAllTimeEl.textContent = money(allTimeTotal);
  }

  function renderExpenseTotals() {
    var stats = computeExpenseStats(monthExpenses);
    var monthExpTotal = 0;
    var todayKey = dateKeyLocal(new Date());
    var todayExpTotal = stats.byDay.get(todayKey) || 0;
    stats.byDay.forEach(function (v) { monthExpTotal += v; });
    if (expensesThisMonthEl) {
      expensesThisMonthEl.textContent = money(monthExpTotal);
      expensesThisMonthEl.classList.add("counter-animate");
    }
    if (expensesTodayEl) {
      expensesTodayEl.textContent = money(todayExpTotal);
      expensesTodayEl.classList.add("counter-animate");
    }
    if (expensesMonthSummary) expensesMonthSummary.textContent = money(monthExpTotal);
    if (expensesTodaySummary) expensesTodaySummary.textContent = money(todayExpTotal);
    if (expensesEmptyState) {
      if (monthExpenses.length === 0) {
        expensesEmptyState.classList.remove("hidden");
      } else {
        expensesEmptyState.classList.add("hidden");
      }
    }
  }

  function renderNetIncome() {
    if (!netIncomeThisMonthEl) return;
    var earnStats = computeDayStats(monthEntries);
    var earnMonth = 0;
    earnStats.forEach(function (s) { earnMonth += s.total; });
    var expStats = computeExpenseStats(monthExpenses);
    var expMonth = 0;
    expStats.byDay.forEach(function (v) { expMonth += v; });
    var net = earnMonth - expMonth;
    netIncomeThisMonthEl.textContent = money(net);
    netIncomeThisMonthEl.classList.add("counter-animate");
    var parent = netIncomeThisMonthEl.closest(".total-card-net");
    if (parent) {
      parent.classList.remove("positive", "negative");
      if (net > 0) parent.classList.add("positive");
      else if (net < 0) parent.classList.add("negative");
    }
  }

  function renderNetWorth() {
    if (!netWorthValue) return;
    var net = allTimeTotal - allTimeExpensesTotal;
    netWorthValue.textContent = money(net);
    netWorthValue.classList.add("net-worth-animate");
    var card = document.getElementById("netWorthCard");
    if (card) {
      card.classList.remove("positive", "negative", "zero");
      if (net > 0) card.classList.add("positive");
      else if (net < 0) card.classList.add("negative");
      else card.classList.add("zero");
    }
  }

  var expenseCategoryColors = [
    "#4f46e5", "#ec4899", "#22c55e", "#f97316", "#8b5cf6", "#06b6d4", "#a3a3a3"
  ];

  function renderExpensePie() {
    if (!expensesPieCanvas || typeof window.Chart === "undefined") return;
    var stats = computeExpenseStats(monthExpenses);
    var categories = Array.from(stats.byCategory.entries()).sort(function (a, b) { return b[1] - a[1]; });
    if (monthlyExpenseChartInstance) monthlyExpenseChartInstance.destroy();
    monthlyExpenseChartInstance = null;
    if (categories.length === 0) return;
    var labels = categories.map(function (c) { return c[0]; });
    var data = categories.map(function (c) { return c[1]; });
    var colors = expenseCategoryColors.slice(0, categories.length);
    monthlyExpenseChartInstance = new window.Chart(expensesPieCanvas, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: "#fff",
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var v = ctx.raw;
                var t = data.reduce(function (a, b) { return a + b; }, 0);
                return (t ? ((v / t) * 100).toFixed(1) : 0) + "% — " + money(v);
              },
            },
          },
        },
      },
    });
  }

  function renderExpenseBreakdown() {
    if (!expenseCategoryBreakdown) return;
    var stats = computeExpenseStats(monthExpenses);
    var categories = Array.from(stats.byCategory.entries()).sort(function (a, b) { return b[1] - a[1]; });
    expenseCategoryBreakdown.innerHTML = "";
    var total = categories.reduce(function (a, c) { return a + c[1]; }, 0);
    categories.forEach(function (cat, i) {
      var row = document.createElement("div");
      row.className = "expense-breakdown-row";
      var dot = document.createElement("span");
      dot.className = "expense-breakdown-dot";
      dot.style.background = expenseCategoryColors[i % expenseCategoryColors.length];
      var label = document.createElement("span");
      label.textContent = cat[0];
      var val = document.createElement("span");
      val.textContent = money(cat[1]) + (total ? " (" + ((cat[1] / total) * 100).toFixed(0) + "%)" : "");
      row.appendChild(dot);
      row.appendChild(label);
      row.appendChild(val);
      expenseCategoryBreakdown.appendChild(row);
    });
  }

  var expensesListEl = document.getElementById("expensesList");

  function renderExpensesList() {
    if (!expensesListEl) return;
    var sorted = monthExpenses.slice().sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    expensesListEl.innerHTML = "";
    sorted.forEach(function (row) {
      var d = parseCreatedAtToLocalDate(row.created_at);
      var item = document.createElement("div");
      item.className = "item";
      item.innerHTML = "<div class=\"item-row\"><div><div class=\"item-amt\">−" + money(row.amount) + "</div><div class=\"item-meta\">" + dateKeyLocal(d) + " • " + escapeHtml(row.category || "") + "</div></div><div class=\"item-actions\"><button class=\"btn btn-danger\" type=\"button\" data-action=\"delete-expense\">Delete</button></div></div>" + (row.description ? "<div class=\"muted\" style=\"font-size:13px;\">" + escapeHtml(row.description) + "</div>" : "");
      item.querySelector("[data-action=\"delete-expense\"]").addEventListener("click", function () {
        deleteExpensePendingId = row.id;
        if (deleteExpenseModal) {
          deleteExpenseModal.classList.remove("hidden");
          deleteExpenseModal.classList.add("visible");
        }
      });
      expensesListEl.appendChild(item);
    });
  }

  async function fetchAllTimeTotal() {
    var sum = 0;
    var from = 0;
    var page = 500;
    var done = false;
    while (!done) {
      var res = await client
        .from("earnings")
        .select("amount")
        .eq("user_id", userId)
        .range(from, from + page - 1);
      if (res.error) break;
      var rows = res.data || [];
      rows.forEach(function (r) { sum += Number(r.amount || 0); });
      if (rows.length < page) done = true;
      else from += page;
    }
    allTimeTotal = sum;
    if (totalAllTimeEl) totalAllTimeEl.textContent = money(allTimeTotal);
    renderNetWorth();
  }

  async function fetchAllTimeExpenses() {
    try {
      var sum = 0;
      var from = 0;
      var page = 500;
      var done = false;
      while (!done) {
        var res = await client
          .from("expenses")
          .select("amount")
          .eq("user_id", userId)
          .range(from, from + page - 1);
        if (res.error) break;
        var rows = res.data || [];
        rows.forEach(function (r) { sum += Number(r.amount || 0); });
        if (rows.length < page) done = true;
        else from += page;
      }
      allTimeExpensesTotal = sum;
      renderNetWorth();
    } catch (_) {
      allTimeExpensesTotal = 0;
      renderNetWorth();
    }
  }

  function refreshFilterCategories() {
    if (!filterCategory) return;
    var cats = new Set();
    monthEntries.forEach(function (r) {
      if (r.category && r.category.trim()) cats.add(r.category.trim());
    });
    var current = filterCategory.value;
    filterCategory.innerHTML = '<option value="">All categories</option>';
    Array.from(cats).sort().forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      if (opt.value === current) opt.selected = true;
      filterCategory.appendChild(opt);
    });
  }

  async function fetchGoal(month) {
    var res = await client
      .from("goals")
      .select("goal_amount")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle();
    if (res.error) { currentGoal = null; return; }
    currentGoal = res.data;
  }

  async function saveGoal(month, amount) {
    var num = Number(amount);
    if (!Number.isFinite(num) || num < 0) return;
    var res = await client
      .from("goals")
      .upsert({ user_id: userId, month: month, goal_amount: num }, { onConflict: "user_id,month" })
      .select("goal_amount")
      .single();
    if (res.error) throw res.error;
    currentGoal = res.data;
    renderGoal();
  }

  function renderGoal() {
    var goalAmt = currentGoal ? Number(currentGoal.goal_amount) : 0;
    if (goalAmountInput) goalAmountInput.value = goalAmt > 0 ? goalAmt : "";
    var stats = computeDayStats(monthEntries);
    var monthTotal = 0;
    stats.forEach(function (s) { monthTotal += s.total; });
    if (goalProgressFill) {
      var pct = goalAmt > 0 ? Math.min(100, (monthTotal / goalAmt) * 100) : 0;
      goalProgressFill.style.width = pct + "%";
    }
    if (goalProgressText) {
      if (goalAmt <= 0) goalProgressText.textContent = "Set a goal to see progress.";
      else goalProgressText.textContent = money(monthTotal) + " / " + money(goalAmt) + " (" + (goalAmt > 0 ? ((monthTotal / goalAmt) * 100).toFixed(0) : 0) + "%)";
    }
  }

  function renderConsistency() {
    if (!consistencySection || !consistencyBar || !consistencyValue) return;
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var stats = computeDayStats(monthEntries);
    var positiveDays = 0;
    for (var d = 1; d <= daysInMonth; d++) {
      var key = viewYear + "-" + pad2(viewMonth + 1) + "-" + pad2(d);
      var s = stats.get(key);
      if (s && s.total > 0) positiveDays++;
    }
    var pct = daysInMonth ? Math.round((positiveDays / daysInMonth) * 100) : 0;
    consistencyBar.style.width = pct + "%";
    consistencyValue.textContent = pct + "%";
    consistencySection.classList.remove("hidden");
  }

  function renderBestDay() {
    if (!bestDaySection || !bestDayText) return;
    var stats = computeDayStats(monthEntries);
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var bestKey = null;
    var bestTotal = -Infinity;
    for (var d = 1; d <= daysInMonth; d++) {
      var key = viewYear + "-" + pad2(viewMonth + 1) + "-" + pad2(d);
      var s = stats.get(key);
      var t = s ? s.total : 0;
      if (t > bestTotal) {
        bestTotal = t;
        bestKey = key;
      }
    }
    if (bestKey && bestTotal > 0) {
      var parts = bestKey.split("-");
      bestDayText.textContent = "🏆 Best Day: " + money(bestTotal) + " on " + new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date(viewYear, viewMonth, 1)) + " " + parseInt(parts[2], 10);
      bestDaySection.classList.remove("hidden");
    } else {
      bestDaySection.classList.add("hidden");
    }
  }

  /**
   * Smart Insight Engine: 1–3 dynamic insights (earnings vs prev month, net change, expense change, goal %, streak).
   * Auto-updates when data changes. Neutral message when not enough data.
   */
  async function renderInsightBox() {
    if (!insightBoxList) return;
    var earnStats = computeDayStats(monthEntries);
    var expStats = computeExpenseStats(monthExpenses);
    var curEarn = 0;
    earnStats.forEach(function (s) { curEarn += s.total; });
    var curExp = 0;
    expStats.byDay.forEach(function (v) { curExp += v; });
    var curNet = curEarn - curExp;
    var prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    var prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    var prevStart = startOfMonthLocal(prevYear, prevMonth);
    var prevEnd = endOfMonthLocal(prevYear, prevMonth);
    var gte = localDateTimeToIso(prevStart);
    var lte = localDateTimeToIso(prevEnd);
    var prevEarn = 0;
    var prevExp = 0;
    try {
      var earnRes = await client.from("earnings").select("amount").eq("user_id", userId).gte("created_at", gte).lte("created_at", lte);
      if (!earnRes.error && earnRes.data) earnRes.data.forEach(function (r) { prevEarn += Number(r.amount || 0); });
      var expRes = await client.from("expenses").select("amount").eq("user_id", userId).gte("created_at", gte).lte("created_at", lte);
      if (!expRes.error && expRes.data) expRes.data.forEach(function (r) { prevExp += Number(r.amount || 0); });
    } catch (_) {}
    var prevNet = prevEarn - prevExp;
    var goalAmt = currentGoal ? Number(currentGoal.goal_amount) : 0;
    var insights = [];
    var add = function (text, type) {
      if (text) insights.push({ text: text, type: type || "neutral" });
    };
    if (prevEarn !== 0 || curEarn !== 0) {
      var earnPct = prevEarn ? (((curEarn - prevEarn) / prevEarn) * 100) : (curEarn ? 100 : 0);
      if (earnPct > 0) add("You are " + Math.round(earnPct) + "% ahead of last month in earnings.", "positive");
      else if (earnPct < 0) add("You are " + Math.abs(Math.round(earnPct)) + "% below last month in earnings.", "negative");
      else if (curEarn > 0) add("Earnings are even with last month.", "neutral");
    }
    if (prevNet !== 0 || curNet !== 0) {
      var netDiff = curNet - prevNet;
      if (netDiff > 0) add("Your net income improved by " + money(netDiff) + " vs last month.", "positive");
      else if (netDiff < 0) add("Your net income is " + money(Math.abs(netDiff)) + " lower than last month.", "negative");
    }
    if (prevExp !== 0 || curExp !== 0) {
      var expPct = prevExp ? (((curExp - prevExp) / prevExp) * 100) : (curExp ? 100 : 0);
      if (expPct > 0) add("Expenses increased " + Math.round(expPct) + "% compared to last month.", "negative");
      else if (expPct < 0) add("Expenses decreased " + Math.abs(Math.round(expPct)) + "% vs last month.", "positive");
    }
    if (goalAmt > 0 && curEarn >= 0) {
      var pct = Math.min(100, Math.round((curEarn / goalAmt) * 100));
      add("You are " + pct + "% toward your monthly goal.", pct >= 100 ? "positive" : "neutral");
    }
    if (currentStreak > 0) add("\uD83D\uDD25 " + currentStreak + "-day earning streak — keep going!", "positive");
    if (insights.length === 0) insights.push({ text: "Start tracking to unlock insights.", type: "neutral" });
    insights = insights.slice(0, 3);
    insightBoxList.classList.add("insight-transition");
    insightBoxList.innerHTML = insights.map(function (i) {
      return '<div class="insight-item insight-' + i.type + '">' + escapeHtml(i.text) + "</div>";
    }).join("");
    setTimeout(function () {
      if (insightBoxList) insightBoxList.classList.remove("insight-transition");
    }, 50);
  }

  function renderAvgDailyIncome() {
    if (!avgDailySection || !avgDailyText) return;
    var stats = computeDayStats(monthEntries);
    var monthTotal = 0;
    var positiveDays = 0;
    stats.forEach(function (s, key) {
      if (s.total > 0) {
        monthTotal += s.total;
        positiveDays++;
      }
    });
    if (positiveDays === 0) {
      avgDailySection.classList.add("hidden");
      return;
    }
    var avg = monthTotal / positiveDays;
    avgDailyText.textContent = "Avg per active day: " + money(avg);
    avgDailySection.classList.remove("hidden");
  }

  var lastSpendingInsightMessage = "";

  function renderSpendingInsight() {
    if (!spendingInsightText) return;
    spendingInsightText.textContent = lastSpendingInsightMessage || "Your spending is stable this month.";
  }

  /**
   * Smart alerts: run after expense add/edit/delete. Uses Supabase only.
   * Daily category: spending in category today > 30% above 30-day avg for that category.
   * Monthly spike: current month category total > 25% vs previous month; once per session.
   * Single-day spike: expense amount > 2x average daily expense (any category).
   */
  async function runExpenseAlerts(triggerRow) {
    var now = new Date();
    var from30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    var gte30 = localDateTimeToIso(from30);
    var res = await client
      .from("expenses")
      .select("amount,category,created_at")
      .eq("user_id", userId)
      .gte("created_at", gte30)
      .order("created_at", { ascending: true });
    if (res.error) return;
    var rows = res.data || [];

    var byCategory30 = new Map();
    var byDayCategory = new Map();
    var total30 = 0;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var amt = Number(r.amount || 0);
      var cat = (r.category || "Other").trim() || "Other";
      byCategory30.set(cat, (byCategory30.get(cat) || 0) + amt);
      total30 += amt;
      var key = dateKeyLocal(parseCreatedAtToLocalDate(r.created_at));
      var dayCat = key + "|" + cat;
      byDayCategory.set(dayCat, (byDayCategory.get(dayCat) || 0) + amt);
    }
    var todayKey = dateKeyLocal(now);
    var avgDailyAll = 30 ? total30 / 30 : 0;

    if (triggerRow) {
      var amt = Number(triggerRow.amount || 0);
      if (avgDailyAll > 0 && amt > 2 * avgDailyAll) {
        showAlert("High spending detected today.", 5000);
        lastSpendingInsightMessage = "High spending detected today.";
        renderSpendingInsight();
      }
    }

    var minDaysForCategoryAlert = 5;
    byCategory30.forEach(function (totalCat, cat) {
      var avgDailyCat = totalCat / 30;
      if (avgDailyCat <= 0) return;
      var todayCat = byDayCategory.get(todayKey + "|" + cat) || 0;
      if (todayCat <= avgDailyCat * 1.3) return;
      var pct = Math.round(((todayCat - avgDailyCat) / avgDailyCat) * 100);
      if (pct > 0) {
        showAlert("You are spending " + pct + "% more than usual on " + cat + " today.", 5000);
        if (!lastSpendingInsightMessage || lastSpendingInsightMessage === "Your spending is stable this month.")
          lastSpendingInsightMessage = "Spending on " + cat + " is " + pct + "% higher than usual today.";
        renderSpendingInsight();
      }
    });

    if (monthlyCategorySpikeShownThisSession) return;
    var curStart = startOfMonthLocal(now.getFullYear(), now.getMonth());
    var curEnd = endOfMonthLocal(now.getFullYear(), now.getMonth());
    var prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    var prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    var prevStart = startOfMonthLocal(prevYear, prevMonth);
    var prevEnd = endOfMonthLocal(prevYear, prevMonth);
    var curRes = await client.from("expenses").select("amount,category").eq("user_id", userId).gte("created_at", localDateTimeToIso(curStart)).lte("created_at", localDateTimeToIso(curEnd));
    var prevRes = await client.from("expenses").select("amount,category").eq("user_id", userId).gte("created_at", localDateTimeToIso(prevStart)).lte("created_at", localDateTimeToIso(prevEnd));
    if (curRes.error || prevRes.error) return;
    var curByCat = new Map();
    var prevByCat = new Map();
    (curRes.data || []).forEach(function (r) {
      var cat = (r.category || "Other").trim() || "Other";
      curByCat.set(cat, (curByCat.get(cat) || 0) + Number(r.amount || 0));
    });
    (prevRes.data || []).forEach(function (r) {
      var cat = (r.category || "Other").trim() || "Other";
      prevByCat.set(cat, (prevByCat.get(cat) || 0) + Number(r.amount || 0));
    });
    prevByCat.forEach(function (prevTotal, cat) {
      if (prevTotal <= 0) return;
      var curTotal = curByCat.get(cat) || 0;
      if (curTotal <= prevTotal * 1.25) return;
      var pct = Math.round(((curTotal - prevTotal) / prevTotal) * 100);
      monthlyCategorySpikeShownThisSession = true;
      showAlert("Spending on " + cat + " is " + pct + "% higher than last month.", 5000);
      lastSpendingInsightMessage = "Spending on " + cat + " is " + pct + "% higher than last month.";
      renderSpendingInsight();
    });
  }

  function closeExpenseModal() {
    if (expenseModal) {
      expenseModal.classList.add("hidden");
      expenseModal.classList.remove("visible");
    }
    if (expenseModalMsg) {
      expenseModalMsg.classList.add("hidden");
      expenseModalMsg.innerHTML = "";
    }
  }

  function renderMonthlyChart() {
    if (!monthlyChartCanvas || typeof window.Chart === "undefined") return;
    var earnStats = computeDayStats(monthEntries);
    var expStats = computeExpenseStats(monthExpenses);
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var labels = [];
    var earnData = [];
    var expData = [];
    var netData = [];
    for (var d = 1; d <= daysInMonth; d++) {
      var key = viewYear + "-" + pad2(viewMonth + 1) + "-" + pad2(d);
      labels.push(d);
      var earn = earnStats.get(key) ? earnStats.get(key).total : 0;
      var exp = expStats.byDay.get(key) || 0;
      earnData.push(earn);
      expData.push(exp);
      netData.push(earn - exp);
    }
    if (monthlyChartInstance) monthlyChartInstance.destroy();
    var ctx = monthlyChartCanvas.getContext("2d");
    var gradientEarn = ctx.createLinearGradient(0, 0, 0, 220);
    gradientEarn.addColorStop(0, "rgba(192,132,252,0.5)");
    gradientEarn.addColorStop(0.5, "rgba(99,102,241,0.25)");
    gradientEarn.addColorStop(1, "rgba(30,41,59,0.9)");
    var monthName = new Intl.DateTimeFormat(undefined, { month: "short" }).format(new Date(viewYear, viewMonth, 1));
    monthlyChartInstance = new window.Chart(monthlyChartCanvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Earnings",
            data: earnData,
            fill: true,
            backgroundColor: gradientEarn,
            borderColor: "rgba(216,180,254,0.95)",
            borderWidth: 2,
            tension: 0.45,
            pointStyle: "rect",
            pointBackgroundColor: "#fff",
            pointBorderColor: "rgba(30,41,59,0.4)",
            pointBorderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 5,
          },
          {
            label: "Expenses",
            data: expData,
            fill: false,
            borderColor: "rgba(248,113,113,0.95)",
            borderWidth: 2,
            tension: 0.45,
            pointStyle: "circle",
            pointBackgroundColor: "#f87171",
            pointRadius: 3,
            pointHoverRadius: 5,
          },
          {
            label: "Net",
            data: netData,
            fill: false,
            borderColor: "rgba(94,234,212,0.9)",
            borderWidth: 2,
            borderDash: [4, 2],
            tension: 0.45,
            pointStyle: "circle",
            pointBackgroundColor: "#5eead4",
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000 },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: { color: "rgba(226,232,240,0.9)", font: { size: 11 } },
          },
          tooltip: {
            backgroundColor: "rgba(30,41,59,0.95)",
            padding: 12,
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            callbacks: {
              title: function (items) {
                var day = items[0] && items[0].label;
                return day ? "Date: " + monthName + " " + day : "";
              },
              label: function (ctx) {
                var v = ctx.raw;
                return (ctx.dataset.label || "") + ": " + money(v);
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxRotation: 0, autoSkip: true, color: "rgba(226,232,240,0.9)", font: { size: 11 } },
          },
          y: {
            grid: { color: "rgba(94,234,212,0.12)" },
            ticks: { color: "rgba(226,232,240,0.7)", callback: function (v) { return money(v); } },
          },
        },
      },
    });
  }

  function prevDayKey(key) {
    var d = new Date(key + "T12:00:00");
    d.setDate(d.getDate() - 1);
    return dateKeyLocal(d);
  }

  /**
   * Streak: consecutive calendar days with total earnings > 0 USD.
   * Recalculates from today backwards; resets on 0 or negative day.
   */
  async function renderStreak() {
    if (!streakSection || !streakBadge) return;
    var now = new Date();
    var from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 365, 0, 0, 0, 0);
    var gte = localDateTimeToIso(from);
    var res = await client
      .from("earnings")
      .select("amount,created_at")
      .eq("user_id", userId)
      .gte("created_at", gte);
    if (res.error) return;
    var rows = res.data || [];
    var dayTotals = new Map();
    rows.forEach(function (r) {
      var key = dateKeyLocal(parseCreatedAtToLocalDate(r.created_at));
      var amt = Number(r.amount || 0);
      dayTotals.set(key, (dayTotals.get(key) || 0) + amt);
    });
    var todayKey = dateKeyLocal(now);
    var streak = 0;
    var expected = todayKey;
    while (true) {
      var total = dayTotals.get(expected);
      if (total == null || total <= 0) break;
      streak++;
      expected = prevDayKey(expected);
    }
    currentStreak = streak;
    if (streakMessage) {
      if (streak > 0) {
        if (streak >= 7) streakMessage.textContent = "Momentum building.";
        else if (streak >= 3) streakMessage.textContent = "Stay consistent.";
        else streakMessage.textContent = "One more day to beat your record.";
      } else streakMessage.textContent = "";
    }
    streakBadge.classList.remove("streak-reset", "streak-pop");
    if (previousStreak >= 0) {
      if (streak < previousStreak) {
        streakBadge.classList.add("streak-reset");
        streakBadge.textContent = "Streak reset";
        streakSection.classList.remove("hidden");
        setTimeout(function () {
          streakBadge.classList.remove("streak-reset");
          if (streak > 0) streakBadge.textContent = "\uD83D\uDD25 " + streak + " Day Earnings Streak";
          else streakSection.classList.add("hidden");
        }, 1200);
      } else if (streak > previousStreak && streak > 0) {
        streakBadge.classList.add("streak-pop");
        streakBadge.textContent = "\uD83D\uDD25 " + streak + " Day Earnings Streak";
        streakSection.classList.remove("hidden");
        setTimeout(function () { streakBadge.classList.remove("streak-pop"); }, 400);
      } else {
        if (streak > 0) {
          streakBadge.textContent = "\uD83D\uDD25 " + streak + " Day Earnings Streak";
          streakSection.classList.remove("hidden");
        } else streakSection.classList.add("hidden");
      }
    } else {
      if (streak > 0) {
        streakBadge.textContent = "\uD83D\uDD25 " + streak + " Day Earnings Streak";
        streakSection.classList.remove("hidden");
      } else streakSection.classList.add("hidden");
    }
    previousStreak = streak;
  }

  /**
   * Monthly salary distribution: split total amount evenly across all days of the month.
   * Creates one earning per day with category "Salary", description "Monthly Salary".
   * Does not overwrite or duplicate if salary already exists for that month.
   */
  async function distributeMonthlySalary(monthStr, totalUSD) {
    var parts = monthStr.split("-");
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) throw new Error("Invalid month.");
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var total = Number(totalUSD);
    if (!Number.isFinite(total) || total <= 0) throw new Error("Amount must be a positive number.");
    var perDay = Math.round((total / daysInMonth) * 100) / 100;

    var start = new Date(year, month, 1, 0, 0, 0, 0);
    var end = new Date(year, month, daysInMonth, 23, 59, 59, 999);
    var gte = localDateTimeToIso(start);
    var lte = localDateTimeToIso(end);
    var check = await client
      .from("earnings")
      .select("id")
      .eq("user_id", userId)
      .eq("category", "Salary")
      .gte("created_at", gte)
      .lte("created_at", lte)
      .limit(1);
    if (check.error) throw check.error;
    if (check.data && check.data.length > 0) {
      return { duplicate: true };
    }

    var rows = [];
    for (var d = 1; d <= daysInMonth; d++) {
      var at = new Date(year, month, d, 12, 0, 0, 0);
      rows.push({
        user_id: userId,
        amount: perDay,
        currency: "USD",
        description: "Monthly Salary",
        category: "Salary",
        created_at: localDateTimeToIso(at),
      });
    }
    var ins = await client.from("earnings").insert(rows).select("id");
    if (ins.error) throw ins.error;
    return { duplicate: false, days: daysInMonth, total: total };
  }

  function closeSalaryModal() {
    if (salaryModal) {
      salaryModal.classList.add("hidden");
      salaryModal.classList.remove("visible");
    }
    if (salaryModalMsg) {
      salaryModalMsg.classList.add("hidden");
      salaryModalMsg.innerHTML = "";
    }
  }

  function exportCSV() {
    var headers = ["date", "amount", "currency", "description", "category"];
    var rows = monthEntries.map(function (r) {
      var d = parseCreatedAtToLocalDate(r.created_at);
      var dateStr = dateKeyLocal(d);
      return [dateStr, Number(r.amount || 0), (r.currency || "USD"), (r.description || "").replace(/"/g, '""'), (r.category || "").replace(/"/g, '""')];
    });
    var csv = [headers.join(",")].concat(rows.map(function (row) {
      return row.map(function (cell) { return '"' + String(cell) + '"'; }).join(",");
    })).join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "earnings-" + monthKey(viewYear, viewMonth) + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function initRealtime() {
    if (realtimeChannel) {
      try {
        await client.removeChannel(realtimeChannel);
      } catch (_) {}
      realtimeChannel = null;
    }

    // Realtime on Postgres changes (requires table enabled for realtime in Supabase)
    realtimeChannel = client
      .channel(`earnings:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "earnings", filter: `user_id=eq.${userId}` },
        async (payload) => {
          // Keep it robust: on any change, refresh month view if it might affect current month.
          // We'll try a lightweight local update first, then reconcile.
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === "DELETE") {
            removeLocalRow(oldRow.id);
          } else if (eventType === "INSERT" || eventType === "UPDATE") {
            upsertLocalRow(newRow);
          }

          // Re-render quickly
          renderCalendar();
          renderSelectedDayPanel();

          // Reconcile with server to avoid edge cases crossing month boundaries
          // (e.g., entry timestamp edited in future versions, or timezone boundary effects)
          try {
            await fetchMonthEntries();
            renderCalendar();
            renderSelectedDayPanel();
          } catch (_) {}
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          hideNotice();
        }
      });
  }

  function ensureSelectedDateInView() {
    if (!selectedDate) {
      setSelectedDate(new Date());
      return;
    }
    // If selected date isn't visible in current view, bring it into view.
    if (selectedDate.getFullYear() !== viewYear || selectedDate.getMonth() !== viewMonth) {
      setSelectedDate(new Date(viewYear, viewMonth, 1));
    }
  }

  async function init() {
    if (!window.Auth) {
      showNotice("Auth failed to load.", "error");
      return;
    }

    showNotice("Checking your session…");
    session = await window.Auth.requireSessionOrRedirect();
    if (!session) return;

    userId = session.user.id;
    userPill.classList.remove("hidden");
    userPill.textContent = session.user.email
      ? `Signed in: ${session.user.email}`
      : `Signed in: ${userId.slice(0, 8)}…`;

    if (window.FeatureGuide) {
      window.FeatureGuide.setUser(userId, client);
      window.FeatureGuide.attachDashboard();
    }

    // Set initial view to today (local)
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    setLoading(true);
    try {
      showNotice("Loading your earnings…");
      await fetchGoal(monthKey(viewYear, viewMonth));
      await fetchAllTimeTotal();
      await refreshUI();
      ensureSelectedDateInView();
      showNotice("Live updates enabled.");
      await initRealtime();
    } catch (e) {
      showNotice("Something went wrong. You can still try using the app.", "error");
      if (monthEntries.length === 0) renderCalendar();
    } finally {
      setLoading(false);
    }
  }

  if (toolkitToggle && toolkitContent) {
    toolkitToggle.addEventListener("click", function () {
      var isCollapsed = toolkitContent.classList.toggle("collapsed");
      toolkitToggle.setAttribute("aria-expanded", String(!isCollapsed));
      toolkitToggle.textContent = isCollapsed ? "Show Features" : "Hide Features";
    });
  }

  if (backToTopBtn) {
    var expensesSection = document.getElementById("section-expenses");
    var calendarSection = document.getElementById("section-calendar");
    function updateBackToTopVisible() {
      var y = window.scrollY || document.documentElement.scrollTop;
      var inExpensesOrCalendar = false;
      if (expensesSection) {
        var r1 = expensesSection.getBoundingClientRect();
        if (r1.top < window.innerHeight - 80) inExpensesOrCalendar = true;
      }
      if (calendarSection) {
        var r2 = calendarSection.getBoundingClientRect();
        if (r2.top < window.innerHeight - 80) inExpensesOrCalendar = true;
      }
      backToTopBtn.classList.toggle("visible", y > 80 || inExpensesOrCalendar);
    }
    window.addEventListener("scroll", updateBackToTopVisible, { passive: true });
    window.addEventListener("resize", updateBackToTopVisible);
    updateBackToTopVisible();
    backToTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // UI events
  logoutBtn.addEventListener("click", async () => {
    try {
      logoutBtn.disabled = true;
      await window.Auth.signOut();
      window.location.replace("./login.html");
    } catch (err) {
      showNotice(err?.message || "Logout failed.", "error");
    } finally {
      logoutBtn.disabled = false;
    }
  });

  prevMonthBtn.addEventListener("click", async function () {
    viewMonth -= 1;
    if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
    showNotice("Loading…");
    await fetchGoal(monthKey(viewYear, viewMonth));
    await refreshUI();
    ensureSelectedDateInView();
  });

  nextMonthBtn.addEventListener("click", async function () {
    viewMonth += 1;
    if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
    showNotice("Loading…");
    await fetchGoal(monthKey(viewYear, viewMonth));
    await refreshUI();
    ensureSelectedDateInView();
  });

  todayBtn.addEventListener("click", async function () {
    var now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    setSelectedDate(now);
    showNotice("Loading…");
    await fetchGoal(monthKey(viewYear, viewMonth));
    await refreshUI();
  });

  cancelEditBtn.addEventListener("click", () => {
    resetFormToAdd();
  });

  entryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormMsg();

    if (!selectedDate) {
      showFormMsg("Select a date first.", "error");
      return;
    }

    const amount = Number(amountInput.value);
    if (!Number.isFinite(amount)) {
      showFormMsg("Amount must be a valid number (can be positive or negative).", "error");
      return;
    }

    const category = categoryInput.value.trim();
    const description = descriptionInput.value.trim();
    const id = editingId.value || null;

    // Timestamp: use current time, but on the selected local date.
    // This gives each entry a real timestamp while keeping it on the chosen day.
    const now = new Date();
    const createdLocal = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      0
    );

    try {
      saveBtn.disabled = true;
      cancelEditBtn.disabled = true;

      if (!id) {
        await insertEntry({
          amount,
          currency: "USD",
          category,
          description,
          createdAtIso: localDateTimeToIso(createdLocal),
        });
        resetFormToAdd();
        showSuccessToast("Entry added!");
      } else {
        await updateEntry(id, { amount, currency: "USD", category, description });
        resetFormToAdd();
      }

      await refreshUI();
      await fetchAllTimeTotal();
      await renderStreak();
    } catch (err) {
      showFormMsg(err?.message || "Save failed.", "error");
    } finally {
      saveBtn.disabled = false;
      cancelEditBtn.disabled = false;
    }
  });

  if (goalSaveBtn && goalAmountInput) {
    goalSaveBtn.addEventListener("click", async function () {
      var month = monthKey(viewYear, viewMonth);
      try {
        await saveGoal(month, goalAmountInput.value);
        showFormMsg("Goal saved.", "ok");
      } catch (err) {
        showFormMsg(err && err.message ? err.message : "Failed to save goal.", "error");
      }
    });
  }

  if (csvExportBtn) {
    csvExportBtn.addEventListener("click", function () {
      exportCSV();
    });
  }

  if (filterCategory) {
    filterCategory.addEventListener("change", function () {
      filterCategoryValue = filterCategory.value || "";
      renderSelectedDayPanel();
    });
  }
  if (searchDescription) {
    searchDescription.addEventListener("input", function () {
      searchDescriptionValue = searchDescription.value.trim();
      renderSelectedDayPanel();
    });
  }

  function closeDeleteModal() {
    deletePendingId = null;
    if (deleteModal) {
      deleteModal.classList.add("hidden");
      deleteModal.classList.remove("visible");
    }
  }

  if (deleteModalCancel) deleteModalCancel.addEventListener("click", closeDeleteModal);
  if (deleteModalConfirm) {
    deleteModalConfirm.addEventListener("click", async function () {
      if (!deletePendingId) { closeDeleteModal(); return; }
      var id = deletePendingId;
      closeDeleteModal();
      try {
        await deleteEntry(id);
        await refreshUI();
        await fetchAllTimeTotal();
        await renderStreak();
      } catch (err) {
        showFormMsg(err && err.message ? err.message : "Delete failed.", "error");
      }
    });
  }
  if (deleteModal) {
    deleteModal.addEventListener("click", function (e) {
      if (e.target === deleteModal) closeDeleteModal();
    });
  }

  if (addMonthlyIncomeBtn) {
    addMonthlyIncomeBtn.addEventListener("click", function () {
      if (salaryModal) {
        salaryModal.classList.remove("hidden");
        salaryModal.classList.add("visible");
      }
      if (salaryMonth) salaryMonth.value = viewYear + "-" + pad2(viewMonth + 1);
      if (salaryAmount) salaryAmount.value = "";
      if (salaryModalMsg) { salaryModalMsg.classList.add("hidden"); salaryModalMsg.innerHTML = ""; }
    });
  }
  if (salaryModalCancel) salaryModalCancel.addEventListener("click", closeSalaryModal);
  if (salaryModal) {
    salaryModal.addEventListener("click", function (e) {
      if (e.target === salaryModal) closeSalaryModal();
    });
  }
  if (salaryModalSubmit) {
    salaryModalSubmit.addEventListener("click", async function () {
      var monthStr = salaryMonth ? salaryMonth.value : "";
      var amountStr = salaryAmount ? salaryAmount.value : "";
      if (!monthStr || !amountStr) {
        if (salaryModalMsg) {
          salaryModalMsg.classList.remove("hidden");
          salaryModalMsg.textContent = "Please enter month and amount.";
          salaryModalMsg.style.borderColor = "rgba(239,68,68,.45)";
        }
        return;
      }
      try {
        salaryModalSubmit.disabled = true;
        var result = await distributeMonthlySalary(monthStr, amountStr);
        if (result.duplicate) {
          if (salaryModalMsg) {
            salaryModalMsg.classList.remove("hidden");
            salaryModalMsg.innerHTML = "Salary already added for this month. Do not duplicate.";
            salaryModalMsg.style.borderColor = "rgba(245,158,11,.5)";
          }
          return;
        }
        closeSalaryModal();
        await refreshUI();
        await fetchAllTimeTotal();
        await renderStreak();
        showSuccessToast(money(result.total) + " distributed across " + result.days + " days");
      } catch (err) {
        if (salaryModalMsg) {
          salaryModalMsg.classList.remove("hidden");
          salaryModalMsg.textContent = err && err.message ? err.message : "Failed to distribute.";
          salaryModalMsg.style.borderColor = "rgba(239,68,68,.45)";
        }
      } finally {
        salaryModalSubmit.disabled = false;
      }
    });
  }

  if (expenseCategory) {
    expenseCategory.addEventListener("change", function () {
      if (expenseOtherWrap) expenseOtherWrap.classList.toggle("hidden", expenseCategory.value !== "Other");
    });
  }
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener("click", function () {
      if (expenseModal) {
        expenseModal.classList.remove("hidden");
        expenseModal.classList.add("visible");
      }
      if (expenseAmount) expenseAmount.value = "";
      if (expenseCategory) expenseCategory.value = "Rent";
      if (expenseOtherWrap) expenseOtherWrap.classList.add("hidden");
      if (expenseOtherCategory) expenseOtherCategory.value = "";
      if (expenseDescription) expenseDescription.value = "";
      var today = new Date();
      if (expenseDate) expenseDate.value = dateKeyLocal(today);
      if (expenseModalMsg) { expenseModalMsg.classList.add("hidden"); expenseModalMsg.innerHTML = ""; }
    });
  }
  if (expenseModalCancel) expenseModalCancel.addEventListener("click", closeExpenseModal);
  if (expenseModal) {
    expenseModal.addEventListener("click", function (e) {
      if (e.target === expenseModal) closeExpenseModal();
    });
  }
  if (expenseForm) {
    expenseForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (expenseModalMsg) expenseModalMsg.classList.add("hidden");
      var amount = Number(expenseAmount && expenseAmount.value);
      var category = expenseCategory && expenseCategory.value;
      if (category === "Other" && expenseOtherCategory && expenseOtherCategory.value.trim()) category = expenseOtherCategory.value.trim();
      if (!category) category = "Other";
      var description = expenseDescription ? expenseDescription.value.trim() : "";
      var dateStr = expenseDate ? expenseDate.value : dateKeyLocal(new Date());
      if (!Number.isFinite(amount) || amount <= 0) {
        if (expenseModalMsg) {
          expenseModalMsg.classList.remove("hidden");
          expenseModalMsg.textContent = "Enter a valid amount.";
          expenseModalMsg.style.borderColor = "rgba(239,68,68,.45)";
        }
        return;
      }
      var d = new Date(dateStr + "T12:00:00");
      var createdAtIso = localDateTimeToIso(d);
      try {
        if (expenseModalSubmit) expenseModalSubmit.disabled = true;
        var row = await insertExpense({ amount, category, description, createdAtIso });
        monthExpenses.push(row);
        closeExpenseModal();
        await refreshUI();
        runExpenseAlerts(row);
        showExpenseSuccessToast();
      } catch (err) {
        if (expenseModalMsg) {
          expenseModalMsg.classList.remove("hidden");
          expenseModalMsg.textContent = err && err.message ? err.message : "Failed to save expense.";
          expenseModalMsg.style.borderColor = "rgba(239,68,68,.45)";
        }
      } finally {
        if (expenseModalSubmit) expenseModalSubmit.disabled = false;
      }
    });
  }

  function closeDeleteExpenseModal() {
    deleteExpensePendingId = null;
    if (deleteExpenseModal) {
      deleteExpenseModal.classList.add("hidden");
      deleteExpenseModal.classList.remove("visible");
    }
  }
  if (deleteExpenseModalCancel) deleteExpenseModalCancel.addEventListener("click", closeDeleteExpenseModal);
  if (deleteExpenseModalConfirm) {
    deleteExpenseModalConfirm.addEventListener("click", async function () {
      if (!deleteExpensePendingId) { closeDeleteExpenseModal(); return; }
      var id = deleteExpensePendingId;
      closeDeleteExpenseModal();
      try {
        await deleteExpense(id);
        await refreshUI();
      } catch (err) {
        showFormMsg(err && err.message ? err.message : "Delete failed.", "error");
      }
    });
  }
  if (deleteExpenseModal) {
    deleteExpenseModal.addEventListener("click", function (e) {
      if (e.target === deleteExpenseModal) closeDeleteExpenseModal();
    });
  }

  // If auth changes (refresh token, logout in another tab), react.
  window.Auth.onAuthStateChange((nextSession) => {
    if (!nextSession) {
      window.location.replace("./login.html");
      return;
    }
    session = nextSession;
  });

  // Start
  init().catch((err) => {
    showNotice(err?.message || "Failed to initialize dashboard.", "error");
  });
})();

