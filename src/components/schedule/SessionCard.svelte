<script lang="ts">
  import { formatTimeIST } from '../../lib/indico.js';
  import type { IndicoSession } from '../../lib/indico.js';
  import { bookmarksStore } from '../../lib/schedule.svelte.js';

  interface Props {
    session: IndicoSession;
  }

  const { session }: Props = $props();
  let isBookmarked = $derived(bookmarksStore.has(session.id));

  function toggleBookmark(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    bookmarksStore.toggle(session.id);
  }
</script>

<div class="p-card p-card--highlighted" style="display: block; margin-bottom: 1rem; position: relative;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
    <p class="u-no-margin--bottom">
      <small>
        {formatTimeIST(session.start)}&nbsp;&ndash;&nbsp;{formatTimeIST(session.end)}
      </small>
    </p>
    <button
      type="button"
      style="padding: 0.2rem 0.5rem; border: none; background: transparent; cursor: pointer; font-size: 1.25rem; line-height: 1; color: {isBookmarked ? '#E95420' : '#888888'};"
      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark session'}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark session'}
      onclick={toggleBookmark}
    >
      {isBookmarked ? '★' : '☆'}
    </button>
  </div>

  <h3 class="p-heading--5 u-no-margin--top" style="margin-bottom: 0.5rem;">
    <a
      href={session.indicoUrl}
      target="_blank"
      rel="noopener noreferrer"
      style="color: inherit; text-decoration: none;"
    >
      {session.title}
    </a>
  </h3>

  {#if session.speakers.length > 0}
    <p class="u-no-margin--top u-no-margin--bottom u-text--muted">
      {session.speakers.join(', ')}
    </p>
  {/if}

  {#if session.room || session.track}
    <div class="u-sv1" style="margin-top: 0.5rem;">
      {#if session.room}
        <span class="p-chip">
          <span class="p-chip__label">{session.room}</span>
        </span>
      {/if}
      {#if session.track}
        <span class="p-chip">
          <span class="p-chip__label">{session.track}</span>
        </span>
      {/if}
    </div>
  {/if}
</div>
