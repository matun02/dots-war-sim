<script lang="ts">
  import { MAP_CATALOG } from '@dots-war-sim/maps';

  interface Props {
    onstart: (mapId: string) => void;
  }

  const { onstart }: Props = $props();

  let selectedMap = $state('first-blood');
</script>

<div class="title-screen">
  <h1 class="title">Dots War Sim</h1>
  <p class="subtitle">Minimal RTS</p>

  <ul class="map-list" role="radiogroup" aria-label="Select map">
    {#each MAP_CATALOG as map (map.id)}
      <li>
        <button
          type="button"
          role="radio"
          aria-checked={selectedMap === map.id}
          class="map-item"
          class:selected={selectedMap === map.id}
          onclick={() => (selectedMap = map.id)}
        >
          <span class="map-name">{map.name}</span>
          <span class="map-size">{map.size}</span>
        </button>
      </li>
    {/each}
  </ul>

  <button class="start-btn" onclick={() => onstart(selectedMap)}>Start Game</button>
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

  .map-list {
    list-style: none;
    margin: 0 0 2rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 280px;
  }

  .map-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.6rem 1rem;
    font-family: inherit;
    font-size: 1rem;
    color: #ccc;
    background: #262626;
    border: 2px solid #333;
    border-radius: 6px;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s,
      color 0.15s;
  }

  .map-item:hover {
    background: #2f2f2f;
    border-color: #444;
  }

  .map-item.selected {
    border-color: #4488ff;
    background: #20304a;
    color: #fff;
  }

  .map-name {
    font-weight: 600;
  }

  .map-size {
    font-size: 0.85rem;
    color: #888;
  }

  .map-item.selected .map-size {
    color: #9cc0ff;
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
