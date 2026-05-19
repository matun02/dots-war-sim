<script lang="ts">
  import { VERSION } from '@war-of-dots/core';
</script>

<main>
  <h1>Hello War of Dots</h1>
  <p class="version">core v{VERSION}</p>
</main>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    background: #1a1a1a;
    color: #e6e6e6;
    font-family:
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      sans-serif;
    min-height: 100vh;
  }

  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    margin: 0 0 0.5rem;
  }

  .version {
    color: #888;
    font-size: 0.875rem;
    font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
    margin: 0;
  }
</style>
