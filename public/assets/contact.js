document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("contact-status");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Sending…";

    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/.netlify/functions/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
        status.textContent = `Error: ${error}`;
        return;
      }

      status.textContent = "Thanks! I’ll get back to you soon.";
      form.reset();
    } catch (err) {
      status.textContent = "Network error. Please try again.";
    }
  });
});
