// ==========================
// NAVBAR LOGIC (GLOBAL)
// ==========================

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await apiService.request("/auth/me"); // your endpoint
        const user = res.user;

        // 🔴 Hide admin link if not admin
        if (user.role !== "admin") {
            document.getElementById("adminLink")?.remove();
        }

    } catch (err) {
        console.error("Navbar auth error:", err);

        // If not logged in → redirect
        window.location.href = "login.html";
    }
});