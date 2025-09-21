<section id="contact" aria-labelledby="contact-title">
  <div class="container">
    <h2 id="contact-title">Get in Touch</h2>
    <p>If you’d like to collaborate, ask a question, or just say hello — fill out the form below or reach me via social media.</p>
    <form id="contact-form" class="contact-form" method="POST" novalidate>
      <input type="hidden" name="website" value=""> <!-- honeypot: must stay empty -->
      <div class="form-group">
        <label for="name">Name</label>
        <input id="name" name="name" type="text" required="yes" placeholder="ex: Arian Vahdat"/>
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" required="yes" />
      </div>
      <div class="form-group">
        <label for="message">Message</label>
        <textarea id="message" name="message" rows="5" required="yes"></textarea>
      </div>
      <button type="submit" class="cta">Send Message</button>
      <p id="contact-status" aria-live="polite" style="margin-top:.75rem;"></p>
    </form>
  </div>
</section>
