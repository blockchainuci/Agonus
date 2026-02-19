export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  // Parallax pages often have transforms/scroll effects; this is the most reliable:
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
