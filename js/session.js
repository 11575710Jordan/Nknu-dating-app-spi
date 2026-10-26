/* Front-end demo session helpers. Remembered sessions use localStorage;
   temporary sessions use sessionStorage. */
(function (global) {
    var TOKEN_KEY = "userToken";

    function authenticate(users, email, password) {
        var cleanEmail = String(email || "").trim().toLowerCase();
        var cleanPassword = String(password || "").trim();
        if (!cleanEmail || !cleanPassword) return { error: "請填寫完整帳號與密碼。" };
        var user = (users || []).find(function (candidate) {
            return String(candidate.email || "").toLowerCase() === cleanEmail && candidate.password === cleanPassword;
        });
        return user ? { user: user } : { error: "電子郵件或密碼不正確。" };
    }

    function start(local, tab, userId, remember, now) {
        var token = JSON.stringify({ userId: userId, remember: !!remember, startedAt: now || new Date().toISOString() });
        local.removeItem(TOKEN_KEY);
        tab.removeItem(TOKEN_KEY);
        (remember ? local : tab).setItem(TOKEN_KEY, token);
    }

    function currentUserId(local, tab, users) {
        var raw = local.getItem(TOKEN_KEY);
        if (!raw) raw = tab.getItem(TOKEN_KEY);
        if (!raw) return null;
        try {
            var token = JSON.parse(raw);
            return (users || []).some(function (user) { return user.id === token.userId; }) ? token.userId : null;
        } catch (err) {
            return null;
        }
    }

    function login(userId, remember) {
        start(global.localStorage, global.sessionStorage, userId, remember);
    }

    function currentUser(users) {
        var id = currentUserId(global.localStorage, global.sessionStorage, users);
        return (users || []).find(function (user) { return user.id === id; }) || null;
    }

    function logout() {
        global.localStorage.removeItem(TOKEN_KEY);
        global.sessionStorage.removeItem(TOKEN_KEY);
    }

    function safeNext(value) {
        var candidate = String(value || "").trim();
        return /^[a-z0-9_-]+(?:\/[a-z0-9_-]+)*\.html(?:\?[a-z0-9_=&%-]*)?(?:#[a-z0-9_-]*)?$/i.test(candidate)
            ? candidate
            : "match.html";
    }

    function requireUser(users) {
        var user = currentUser(users);
        if (!user && global.location) {
            var current = global.location.pathname.split("/").pop() || "chat.html";
            global.location.href = "login.html?next=" + encodeURIComponent(current + global.location.search);
        }
        return user;
    }

    global.Session = { TOKEN_KEY: TOKEN_KEY, authenticate: authenticate, start: start, currentUserId: currentUserId, currentUser: currentUser, login: login, logout: logout, safeNext: safeNext, requireUser: requireUser };
    if (typeof module !== "undefined") module.exports = global.Session;
})(typeof window !== "undefined" ? window : globalThis);
