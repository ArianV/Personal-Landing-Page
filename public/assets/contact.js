document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("contact-status");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Sending…";

    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        // Try to parse JSON error from response
        let errorText = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          if (body && body.error) errorText = body.error;
        } catch (e) {
          const text = await res.text().catch(() => '');
          if (text) errorText = text;
        }
        status.textContent = `Error: ${errorText}`;
        return;
      }

      status.textContent = "Thanks! I’ll get back to you soon.";
      form.reset();
    } catch (err) {
      status.textContent = "Network error. Please try again.";
    }
  });
});
