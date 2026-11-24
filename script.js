"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-link, .nav-contact");

function closeMenu() {
  if (!menuToggle || !navMenu) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  navMenu.classList.remove("is-open");
}

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
    navMenu.classList.toggle("is-open", !isOpen);
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  document.addEventListener("click", (event) => {
    if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
}

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const sections = document.querySelectorAll("main section[id]");
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll(".nav-link").forEach((link) => {
      const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
      link.classList.toggle("active", isCurrent);
      if (isCurrent) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  });
}, { rootMargin: "-30% 0px -60% 0px" });
sections.forEach((section) => sectionObserver.observe(section));

const yearElement = document.querySelector("#current-year");
if (yearElement) yearElement.textContent = String(new Date().getFullYear());

const form = document.querySelector("#contact-form");
const formNotice = document.querySelector("#form-notice");
const formSubmit = form ? form.querySelector(".form-submit") : null;
const formSubmitLabel = form ? form.querySelector(".form-submit-label") : null;
const fields = {
  name: {
    input: document.querySelector("#name"),
    error: document.querySelector("#name-error"),
    validate: (value) => value.trim().length >= 2 ? "" : "Please enter at least 2 characters."
  },
  email: {
    input: document.querySelector("#email"),
    error: document.querySelector("#email-error"),
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Please enter a valid email address."
  },
  message: {
    input: document.querySelector("#message"),
    error: document.querySelector("#message-error"),
    validate: (value) => value.trim().length >= 10 ? "" : "Please enter at least 10 characters."
  }
};

function validateField(field) {
  const errorMessage = field.validate(field.input.value);
  field.error.textContent = errorMessage;
  field.input.setAttribute("aria-invalid", String(Boolean(errorMessage)));
  return !errorMessage;
}

function setFormNotice(message, state) {
  formNotice.textContent = message;
  formNotice.classList.remove("is-loading", "is-success", "is-error");
  if (state) formNotice.classList.add(`is-${state}`);
}

if (form) {
  let isSubmitting = false;

  Object.values(fields).forEach((field) => {
    field.input.addEventListener("input", () => {
      if (field.input.getAttribute("aria-invalid") === "true") validateField(field);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const isValid = Object.values(fields).map(validateField).every(Boolean);
    if (!isValid) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      setFormNotice("Please correct the highlighted fields before sending.", "error");
      return;
    }

    const formData = new FormData(form);
    ["name", "email", "subject", "message"].forEach((fieldName) => {
      const field = form.elements.namedItem(fieldName);
      if (field && "value" in field) formData.set(fieldName, field.value.trim());
    });

    isSubmitting = true;
    formSubmit.disabled = true;
    form.setAttribute("aria-busy", "true");
    formSubmitLabel.textContent = "Sending...";
    setFormNotice("Sending your message securely...", "loading");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        setFormNotice("Your message couldn't be sent. Please try again in a moment.", "error");
        return;
      }

      form.reset();
      Object.values(fields).forEach((field) => {
        field.error.textContent = "";
        field.input.removeAttribute("aria-invalid");
      });
      setFormNotice("Thanks for reaching out! Your message has been sent successfully.", "success");
    } catch (error) {
      setFormNotice("Unable to send your message right now. Check your connection and try again.", "error");
    } finally {
      isSubmitting = false;
      formSubmit.disabled = false;
      form.removeAttribute("aria-busy");
      formSubmitLabel.textContent = "Send message";
    }
  });
}
