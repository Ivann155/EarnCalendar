// Feature first-use guide: popup on first interaction per feature.
// Uses Supabase when logged in, else localStorage. No heavy animations; CSS-only.

(function () {
  var STORAGE_KEY = "feature_guide_seen";

  var FEATURES = {
    earnings_streak: {
      title: "Earnings Streak",
      description: "Build momentum. Track consecutive profitable days and stay consistent.",
      sticker: "🔥",
      stickerClass: "sticker-flame",
    },
    monthly_salary: {
      title: "Monthly Salary Auto-Fill",
      description: "Automatically distribute your monthly income across the calendar.",
      sticker: "💰",
      stickerClass: "sticker-bounce",
    },
    income_consistency: {
      title: "Income Consistency Score",
      description: "Measure how consistent your earning performance is each month.",
      sticker: "📊",
      stickerClass: "sticker-meter",
    },
    smart_alerts: {
      title: "Smart Spending Alerts",
      description: "Get notified when your spending exceeds your usual patterns.",
      sticker: "🚨",
      stickerClass: "sticker-pulse",
    },
    advanced_analytics: {
      title: "Advanced Analytics",
      description: "Compare months, track trends, and visualize your financial growth.",
      sticker: "📈",
      stickerClass: "sticker-graph",
    },
    expense_tracking: {
      title: "Expense Tracking",
      description: "Track categorized expenses and understand where your money goes.",
      sticker: "🧾",
      stickerClass: "sticker-receipt",
    },
    calendar_heatmap: {
      title: "Calendar Heatmap",
      description: "See high and low performance days instantly.",
      sticker: "🗓",
      stickerClass: "sticker-glow",
    },
  };

  var seenFromStorage = null;

  function getSeenFromStorage() {
    if (seenFromStorage) return seenFromStorage;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      seenFromStorage = raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (_) {
      seenFromStorage = new Set();
    }
    return seenFromStorage;
  }

  function saveSeenToStorage(set) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch (_) {}
  }

  var userId = null;
  var client = null;

  function setUser(id, supabaseClient) {
    userId = id;
    client = supabaseClient;
  }

  function getSeenFeatures(cb) {
    var local = getSeenFromStorage();
    if (!client || !userId) {
      if (cb) cb(local);
      return local;
    }
    client
      .from("feature_guide_seen")
      .select("feature_key")
      .eq("user_id", userId)
      .then(function (res) {
        var set = new Set(local);
        if (!res.error && res.data) {
          res.data.forEach(function (r) {
            if (r.feature_key) set.add(r.feature_key);
          });
        }
        if (cb) cb(set);
      })
      .catch(function () {
        if (cb) cb(local);
      });
    return local;
  }

  function markSeen(key) {
    var set = getSeenFromStorage();
    set.add(key);
    saveSeenToStorage(set);
    if (client && userId) {
      client
        .from("feature_guide_seen")
        .upsert({ user_id: userId, feature_key: key }, { onConflict: "user_id,feature_key" })
        .then(function () {})
        .catch(function () {});
    }
  }

  var popupEl = null;
  var popupBackdrop = null;
  var popupCard = null;
  var popupSticker = null;
  var popupTitle = null;
  var popupDesc = null;
  var popupClose = null;

  function getPopup() {
    if (popupEl) return popupEl;
    popupEl = document.getElementById("featureGuidePopup");
    if (!popupEl) return null;
    popupBackdrop = popupEl.querySelector(".feature-guide-popup-backdrop");
    popupCard = popupEl.querySelector(".feature-guide-popup-card");
    popupSticker = document.getElementById("featureGuidePopupSticker");
    popupTitle = document.getElementById("featureGuidePopupTitle");
    popupDesc = document.getElementById("featureGuidePopupDesc");
    popupClose = document.getElementById("featureGuidePopupClose");
    if (popupClose) {
      popupClose.addEventListener("click", function () {
        if (currentKey) {
          markSeen(currentKey);
          if (popupClose) {
            popupClose.classList.add("got-it-done");
            setTimeout(function () {
              if (popupClose) popupClose.classList.remove("got-it-done");
            }, 400);
          }
        }
        hidePopup();
      });
    }
    if (popupBackdrop) {
      popupBackdrop.addEventListener("click", hidePopup);
    }
    return popupEl;
  }

  var currentKey = null;

  function hidePopup() {
    var el = getPopup();
    if (!el) return;
    el.classList.add("hidden");
    el.classList.remove("visible");
    currentKey = null;
  }

  function showPopup(key) {
    var meta = FEATURES[key];
    if (!meta) return;
    var el = getPopup();
    if (!el) return;
    if (popupSticker) {
      popupSticker.textContent = meta.sticker;
      popupSticker.className = "feature-guide-sticker " + (meta.stickerClass || "");
    }
    if (popupTitle) popupTitle.textContent = meta.title;
    if (popupDesc) popupDesc.textContent = meta.description;
    currentKey = key;
    el.classList.remove("hidden");
    el.classList.add("visible");
  }

  function maybeShow(element, key) {
    if (!key || !FEATURES[key]) return;
    getSeenFeatures(function (seen) {
      if (seen.has(key)) return;
      showPopup(key);
    });
  }

  function attachDashboard() {
    document.querySelectorAll("[data-feature]").forEach(function (el) {
      var key = el.getAttribute("data-feature");
      if (!key) return;
      el.addEventListener("click", function (e) {
        maybeShow(el, key);
      });
      el.addEventListener("focus", function () {
        maybeShow(el, key);
      }, true);
    });
  }

  window.FeatureGuide = {
    setUser: setUser,
    getSeenFeatures: getSeenFeatures,
    markSeen: markSeen,
    maybeShow: maybeShow,
    showPopup: showPopup,
    hidePopup: hidePopup,
    attachDashboard: attachDashboard,
  };
})();
