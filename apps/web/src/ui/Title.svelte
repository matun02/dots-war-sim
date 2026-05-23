<script lang="ts">
  interface Props {
    onstart: () => void;
  }

  const { onstart }: Props = $props();
</script>

<div class="title-screen">
  <h1 class="title">Dots War Sim</h1>
  <p class="subtitle">Minimal RTS</p>
  <button class="start-btn" onclick={onstart}>Start Game</button>
</div>

<style>
  .title-screen {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
    color: #fff;
    font-family: system-ui, sans-serif;
  }

  .title {
    font-size: 3rem;
    margin: 0 0 0.25rem;
    letter-spacing: 0.05em;
  }

  .subtitle {
    font-size: 1rem;
    margin: 0 0 2rem;
    color: #888;
  }

  .start-btn {
    padding: 0.75rem 2.5rem;
    font-size: 1.25rem;
    border: none;
    border-radius: 6px;
    background: #4488ff;
    color: #fff;
    cursor: pointer;
    transition: background 0.15s;
  }

  .start-btn:hover {
    background: #5599ff;
  }
</style>
