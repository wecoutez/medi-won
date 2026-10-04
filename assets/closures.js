/* 휴진일 목록 — 공휴일·대체공휴일·임시 휴진
   형식: "YYYY-MM-DD": ["한국어 사유", "English reason"]
   임시 휴진은 아래 CLINIC 부분에 같은 형식으로 추가하면 됩니다.
   수요일·일요일(정기 휴진)과 겹치는 날도 그대로 두어도 됩니다. */
var MW_CLOSED = {
  /* 2026 공휴일 */
  "2026-10-05": ["개천절 대체공휴일", "National Foundation Day (substitute holiday)"],
  "2026-10-09": ["한글날", "Hangul Day"],
  "2026-12-25": ["성탄절", "Christmas Day"],
  /* 2027 공휴일 */
  "2027-01-01": ["신정", "New Year's Day"],
  "2027-02-06": ["설날 연휴", "Lunar New Year holiday"],
  "2027-02-07": ["설날", "Lunar New Year"],
  "2027-02-08": ["설날 연휴", "Lunar New Year holiday"],
  "2027-02-09": ["설날 대체공휴일", "Lunar New Year (substitute holiday)"],
  "2027-03-01": ["삼일절", "Independence Movement Day"],
  "2027-05-05": ["어린이날", "Children's Day"],
  "2027-05-13": ["부처님오신날", "Buddha's Birthday"],
  "2027-06-06": ["현충일", "Memorial Day"],
  "2027-08-15": ["광복절", "Liberation Day"],
  "2027-08-16": ["광복절 대체공휴일", "Liberation Day (substitute holiday)"],
  "2027-09-14": ["추석 연휴", "Chuseok holiday"],
  "2027-09-15": ["추석", "Chuseok"],
  "2027-09-16": ["추석 연휴", "Chuseok holiday"],
  "2027-10-03": ["개천절", "National Foundation Day"],
  "2027-10-04": ["개천절 대체공휴일", "National Foundation Day (substitute holiday)"],
  "2027-10-09": ["한글날", "Hangul Day"],
  "2027-10-11": ["한글날 대체공휴일", "Hangul Day (substitute holiday)"],
  "2027-12-25": ["성탄절", "Christmas Day"],
  "2027-12-27": ["성탄절 대체공휴일", "Christmas Day (substitute holiday)"]

  /* CLINIC — 임시 휴진 예: , "2026-11-12": ["원장 학회 참석", "Doctor attending a conference"] */
};

/* Seoul date "YYYY-MM-DD", k days from today */
function mwKey(k) {
  return new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit"})
    .format(new Date(Date.now() + (k || 0) * 864e5));
}
function mwClosed(k) { return MW_CLOSED[mwKey(k)] || null; }

/* Notice banner for closures in the next 7 days that fall on regular clinic days */
(function () {
  var KO_DAY = ["일", "월", "화", "수", "목", "금", "토"];
  var EN_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var EN_MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function show() {
    var en = (document.documentElement.lang || "").indexOf("en") === 0, items = [], k;
    for (k = 0; k <= 7; k++) {
      var key = mwKey(k), c = MW_CLOSED[key];
      if (!c) continue;
      var p = key.split("-"), dow = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay();
      if (dow === 0 || dow === 3) continue; /* already a regular day off */
      items.push(en
        ? (k === 0 ? "Today" : k === 1 ? "Tomorrow" : EN_DAY[dow]) + ", " + EN_MON[+p[1] - 1] + " " + (+p[2]) + " — " + c[1]
        : (k === 0 ? "오늘 " : k === 1 ? "내일 " : "") + (+p[1]) + "월 " + (+p[2]) + "일(" + KO_DAY[dow] + ") " + c[0]);
    }
    if (!items.length) return;
    var st = document.createElement("style");
    st.textContent = ".closure-banner{background:#fff4e5;color:#7a4a12;border-bottom:1px solid #f3d9b1;" +
      "font-size:14.5px;line-height:1.6;padding:11px 26px;text-align:center;word-break:keep-all;position:relative;z-index:70}" +
      ".closure-banner b{font-weight:600;margin-right:8px}";
    document.head.appendChild(st);
    var b = document.createElement("div");
    b.className = "closure-banner";
    b.setAttribute("role", "status");
    b.innerHTML = "<b>" + (en ? "Closed" : "휴진 안내") + "</b>" +
      items.map(function (t) { return t.replace(/[<>&]/g, ""); }).join(" · ") + (en ? "" : " 휴진합니다.");
    document.body.insertBefore(b, document.body.firstChild);
    /* the homepage header floats over the hero; push it below the banner */
    var h = document.querySelector(".site-header.over");
    function fit() {
      if (!h) return;
      h.style.top = getComputedStyle(h).position === "absolute" ? b.offsetHeight + "px" : "";
    }
    fit();
    window.addEventListener("resize", fit);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show);
  else show();
})();
