<script lang="ts">
  import type { GameResult, PlayerId } from '@war-of-dots/core';

  interface Props {
    result: GameResult;
    playerColors: Record<number, number>;
    onrematch: () => void;
    ontitle: () => void;
  }

  const { result, playerColors, onrematch, ontitle }: Props = $props();

  const heading = $derived.by(() => {
    if (result.type === 'draw') return 'Draw!';
    return result.winner === (0 as PlayerId) ? 'Victory!' : 'Defeat!';
  });

  const reasonText = $derived.by(() => {
    if (result.type === 'draw') return '';
    const labels: Record<string, string> = {
      domination: 'Domination',
      annihilation: 'Annihilation',
      timeout: 'Timeout',
    };
    return labels[result.reason] ?? '';
  });

  const accentColor = $derived.by(() => {
    if (result.type === 'draw') return '#888';
    const c = playerColors[result.winner] ?? 0xffffff;
    const r = (c >> 16) & 0xff;
    const g = (c >> 8) & 0xff;
    const b = c & 0xff;
    return `rgb(${r},${g},${b})`;
  });
</script>

<div class="overlay">
  <div class="dialog">
    <h1 class="heading" style="color: {accentColor}">{heading}</h1>
    {#if reasonText}
      <p class="reason">{reasonText}</p>
    {/if}
    <div class="buttons">
      <button class="btn" onclick={onrematch}>Rematch</button>
      <button class="btn btn-secondary" onclick={ontitle}>Title</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    z-index: 100;
  }

  .dialog {
    text-align: center;
    font-family: system-ui, sans-serif;
  }

  .heading {
    font-size: 3rem;
    margin: 0 0 0.5rem;
  }

  .reason {
    font-size: 1.25rem;
    color: #aaa;
    margin: 0 0 2rem;
  }

  .buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .btn {
    padding: 0.6rem 2rem;
    font-size: 1.1rem;
    border: none;
    border-radius: 6px;
    background: #4488ff;
    color: #fff;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn:hover {
    background: #5599ff;
  }

  .btn-secondary {
    background: #555;
  }

  .btn-secondary:hover {
    background: #666;
  }
</style>
